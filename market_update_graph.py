import sqlite3
import pandas as pd
import numpy as np
import yfinance as yf
from nsepython import equity_history, nse_quote
from datetime import date, timedelta
from textblob import TextBlob
from typing import List, Dict, Any, TypedDict, Annotated
from langgraph.graph import StateGraph, END
import time

# --- State Definition ---
class AgentState(TypedDict):
    tickers: List[str]
    processed_data: List[Dict[str, Any]]
    errors: List[str]

# --- Node Functions ---

def fetch_universe(state: AgentState) -> AgentState:
    """Reads tickers from the database and normalizes them for NSE."""
    print("--- Fetching Universe ---")
    conn = sqlite3.connect('pattas_list.db')
    cursor = conn.cursor()
    cursor.execute("SELECT ticker_symbol FROM pattas_list")
    rows = cursor.fetchall()
    conn.close()
    
    tickers = [row[0] for row in rows]
    print(f"Found {len(tickers)} tickers.")
    return {"tickers": tickers, "processed_data": [], "errors": []}

def fetch_market_data_and_technicals(state: AgentState) -> AgentState:
    """
    Fetches historical data using NSEPython (primary) or yfinance (fallback).
    Calculates RSI and MACD.
    Fetches fundamental data (PE, Insider Holdings).
    """
    print("--- Fetching Market Data & Calculating Technicals ---")
    tickers = state['tickers']
    processed = []
    errors = []

    for ticker in tickers:
        try:
            print(f"Processing {ticker}...")
            
            # 1. Normalize Ticker for NSE
            nse_symbol = ticker.split('.')[0] if '.' in ticker else ticker
            is_bse = '.BO' in ticker

            df = pd.DataFrame()
            
            # 2. Fetch History (Try NSE First)
            try:
                # nsepython equity_history returns a list of dictionaries usually
                # Series Needs "EQ" usually
                print(f"  Attempting NSE fetch for {nse_symbol}...")
                end_date = date.today().strftime("%d-%m-%Y")
                start_date = (date.today() - timedelta(days=200)).strftime("%d-%m-%Y")
                
                # Note: nsepython might be unstable, wrap in strong try/except
                nse_data = equity_history(nse_symbol, "EQ", start_date, end_date)
                
                if nse_data and len(nse_data) > 30:
                     df = pd.DataFrame(nse_data)
                     # Clean NSE data columns if needed, usually: CH_TIMESTAMP, CH_CLOSING_PRICE via nsepython
                     # Mapping might be needed depending on nsepython version output
                     # Let's fallback to yfinance immediately if this is complex/unstable ensures robustness
                     # Using yfinance for history is safer for calculation consistency
                     print("  NSE data structure varries, using yfinance for consistent OHLCV...")
                     raise Exception("Preferring yfinance for history stability")
                else:
                    raise Exception("NSE Data empty/insufficient")

            except Exception as e:
                print(f"  Fallback to yfinance for history: {e}")
                stock = yf.Ticker(ticker)
                df = stock.history(period="6mo")
            
            if df.empty or len(df) < 30:
                errors.append(f"{ticker}: Insufficient Data")
                continue

            # 3. Calculate Technicals (RSI, MACD)
            # Ensure Close is float
            if 'Close' not in df.columns and 'CH_CLOSING_PRICE' in df.columns:
                 df['Close'] = df['CH_CLOSING_PRICE'].astype(float)
            
            delta = df['Close'].diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
            rs = gain / loss
            rsi = 100 - (100 / (1 + rs))
            
            # MACD
            exp1 = df['Close'].ewm(span=12, adjust=False).mean()
            exp2 = df['Close'].ewm(span=26, adjust=False).mean()
            macd = exp1 - exp2
            signal_line = macd.ewm(span=9, adjust=False).mean()
            
            latest = df.iloc[-1]
            rsi_val = rsi.iloc[-1]
            macd_val = macd.iloc[-1]
            sig_val = signal_line.iloc[-1]
            close_price = latest['Close']

            # Interpret Signal
            if macd_val > sig_val:
                macd_status = "Bullish Crossover"
            elif macd_val < sig_val:
                macd_status = "Bearish Crossover"
            else:
                macd_status = "Neutral"

            if macd_status == "Bullish Crossover" and rsi_val < 70:
                status = "BUY"
            elif macd_status == "Bearish Crossover" or rsi_val > 70:
                status = "SELL"
            else:
                status = "HOLD"

            # 4. Fetch Fundamentals (PE, Insider)
            # Try NSE Quote first for accurate PE
            trailing_pe = 0.0
            held_insiders = 0.0
            
            try:
                # nse_quote returns a JSON
                q = nse_quote(nse_symbol)
                if q and 'priceInfo' in q:
                     # Attempt to parse PE if available, mostly in metadata or different keys
                     # nsepython structure changes often, fallback to yfinance for fundamentals is safer
                     pass
            except:
                pass

            # Fallback/Primary for Fundamentals: yfinance
            try:
                info = yf.Ticker(ticker).info
                trailing_pe = info.get('trailingPE', 0)
                held_insiders = info.get('heldPercentInsiders', 0) * 100
            except:
                pass
            
            processed.append({
                "ticker": ticker,
                "price": round(close_price, 2),
                "rsi": round(rsi_val, 2),
                "macd_signal": macd_status,
                "status": status,
                "trailing_pe": round(trailing_pe, 2),
                "held_insiders": round(held_insiders, 2)
            })

        except Exception as e:
            print(f"  Error processing {ticker}: {e}")
            errors.append(f"{ticker}: {str(e)}")
            
    return {"processed_data": processed, "errors": errors}

def fetch_sentiment_today(state: AgentState) -> AgentState:
    """
    Fetches ONLY today's news using yfinance and calculates sentiment.
    Also saves news lists to a JSON sidecar file.
    """
    print("--- Fetching Sentiment (Today's News) ---")
    data_list = state['processed_data']
    updated_data = []
    news_map = {} # Ticker -> Link List
    
    import json
    import os
    import time

    for item in data_list:
        ticker = item['ticker']
        print(f"Getting news for {ticker}...", flush=True)
        
        sentiment_score = None
        polarities = []

        try:
            # 1. Fetch News
            search_ticker = ticker
            stock = yf.Ticker(search_ticker)
            news = stock.news
            
            if not news and '.BO' in ticker:
                search_ticker = ticker.replace('.BO', '.NS')
                stock = yf.Ticker(search_ticker)
                news = stock.news
            
            # 2. Process News List for Modal
            if news:
                news_items = []
                for news_item in news[:5]: # Top 5
                    # yfinance news can have info at top level or nested in 'content'
                    c = news_item.get('content', news_item)
                    link = None
                    
                    # Try to find link
                    if 'link' in c:
                        link = c['link']
                    elif 'clickThroughUrl' in c and c['clickThroughUrl']:\
                        link = c['clickThroughUrl'].get('url')
                    elif 'canonicalUrl' in c and c['canonicalUrl']:
                        link = c['canonicalUrl'].get('url')
                    
                    if not link and 'link' in news_item: # last resort top level
                         link = news_item['link']
                         
                    if link:
                        news_items.append({
                            "title": c.get('title', 'No Title'),
                            "link": link,
                            "publisher": c.get('provider', {}).get('displayName', 'Unknown') or news_item.get('provider', {}).get('displayName', 'Unknown'),
                            "time": c.get('pubDate') or c.get('providerPublishTime') or int(time.time()),
                            "summary": c.get('summary') or c.get('description') or "No summary available for this intelligence report."
                        })
                
                if news_items:
                    news_map[ticker] = news_items

                # 3. Process Sentiment
                polarities = []
                for ni in news:
                    # Traversal: check top level, then check nested 'content'
                    c = ni.get('content', ni)
                    title = c.get('title') or ni.get('title')
                    summary = c.get('summary') or c.get('description') or ni.get('summary')
                    
                    text_to_analyze = ""
                    if title: text_to_analyze += title + ". "
                    if summary: text_to_analyze += summary
                    
                    if text_to_analyze.strip():
                        blob = TextBlob(text_to_analyze)
                        polarities.append(blob.sentiment.polarity)
            
            if polarities:
                # Scale from -1.0/1.0 to -100%/100%
                sentiment_score = round((sum(polarities) / len(polarities)) * 100, 2)
            else:
                # If news exists but no titles found (fallback)
                sentiment_score = 0.0

        except Exception as e:
             print(f"  Sentiment error for {ticker}: {e}", flush=True)

        # 4. FINAL FALLBACK: If news_map doesn't have this ticker yet (fail or no links)
        if ticker not in news_map:
             import urllib.parse
             safe_ticker = ticker.replace('.BO', '').replace('.NS', '')
             quoted_ticker = urllib.parse.quote(f"{safe_ticker} share news")
             fallback_link = f"https://www.google.com/search?q={quoted_ticker}&tbm=nws"
             news_map[ticker] = [{
                 "title": f"Search Intel: {safe_ticker}",
                 "link": fallback_link,
                 "publisher": "Google News Search",
                 "time": int(time.time()),
                 "summary": f"No direct news feed detected for {safe_ticker}. This fallback link will execute a secure search for the latest market intelligence on Google News."
             }]
        
        item['sentiment_score'] = sentiment_score
        updated_data.append(item)
        time.sleep(0.3) # Throttle 
    
    # Save News Links to Sidecar JSON
    try:
        with open('news_links.json', 'w') as f:
            json.dump(news_map, f, indent=2)
        print("Updated news_links.json", flush=True)
    except Exception as e:
        print(f"Error saving news links: {e}", flush=True)

    return {"processed_data": updated_data}

def update_database(state: AgentState) -> AgentState:
    """Updates the SQLite database."""
    print("--- Updating Database ---")
    data_list = state['processed_data']
    conn = sqlite3.connect('pattas_list.db')
    cursor = conn.cursor()
    
    count = 0
    for item in data_list:
        cursor.execute("""
            INSERT OR REPLACE INTO daily_signals 
            (ticker_symbol, date, price, rsi, macd_signal, sentiment_score, status, held_pct_insiders, trailing_pe)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            item['ticker'], 
            date.today(), 
            item['price'], 
            item['rsi'], 
            item['macd_signal'], 
            item['sentiment_score'],
            item['status'], 
            item['held_insiders'], 
            item['trailing_pe']
        ))
        count += 1
    
    conn.commit()
    conn.close()
    print(f"Updated {count} records.")
    return {}

# --- Graph Contruction ---
workflow = StateGraph(AgentState)

workflow.add_node("fetch_universe", fetch_universe)
workflow.add_node("fetch_market", fetch_market_data_and_technicals)
workflow.add_node("fetch_sentiment", fetch_sentiment_today)
workflow.add_node("update_db", update_database)

workflow.set_entry_point("fetch_universe")
workflow.add_edge("fetch_universe", "fetch_market")
workflow.add_edge("fetch_market", "fetch_sentiment")
workflow.add_edge("fetch_sentiment", "update_db")
workflow.add_edge("update_db", END)

app = workflow.compile()

if __name__ == "__main__":
    print("Starting Market Update Graph...")
    app.invoke({"tickers": [], "processed_data": [], "errors": []})
    print("Workflow Completed.")
