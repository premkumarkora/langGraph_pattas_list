import sqlite3
import yfinance as yf
import pandas as pd
import numpy as np
from datetime import date
from textblob import TextBlob

def calculate_rsi(data, window=14):
    delta = data['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=window).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=window).mean()
    
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

def calculate_macd(data, slow=26, fast=12, signal=9):
    exp1 = data['Close'].ewm(span=fast, adjust=False).mean()
    exp2 = data['Close'].ewm(span=slow, adjust=False).mean()
    macd = exp1 - exp2
    signal_line = macd.ewm(span=signal, adjust=False).mean()
    return macd, signal_line

def interpret_signal(rsi, macd, signal_line):
    # Determine MACD status
    if macd > signal_line:
        macd_status = "Bullish Crossover"
    elif macd < signal_line:
        macd_status = "Bearish Crossover"
    else:
        macd_status = "Neutral"

    # Determine Overall Status
    # Simple strategy: Buy if Bullish Crossover AND RSI < 70
    # Sell if Bearish Crossover OR RSI > 70
    if macd_status == "Bullish Crossover" and rsi < 70:
        status = "BUY"
    elif macd_status == "Bearish Crossover" or rsi > 70:
        status = "SELL"
    else:
        status = "HOLD"
        
    return macd_status, status

def get_sentiment_score(ticker_symbol):
    try:
        ticker = yf.Ticker(ticker_symbol)
        news = ticker.news
        
        # Fallback: Try NSE ticker if BSE has no news
        if not news and ticker_symbol.endswith('.BO'):
            ns_symbol = ticker_symbol.replace('.BO', '.NS')
            news = yf.Ticker(ns_symbol).news
            
        if not news:
            return None
        
        polarities = []
        for item in news:
            title = item.get('title', '')
            if not title and 'content' in item:
                title = item['content'].get('title', '')
                
            if title:
                blob = TextBlob(title)
                polarities.append(blob.sentiment.polarity)
        
        if polarities:
            avg_polarity = sum(polarities) / len(polarities)
            return round(avg_polarity, 4)
        return None
    except Exception:
        return None

def populate_daily_signals():
    conn = sqlite3.connect('pattas_list.db')
    cursor = conn.cursor()

    # Get all verified tickers from the master table
    cursor.execute("SELECT ticker_symbol FROM pattas_list")
    tickers = [row[0] for row in cursor.fetchall()]
    
    print(f"Calculating signals and sentiment for {len(tickers)} companies...")

    for ticker in tickers:
        try:
            stock = yf.Ticker(ticker)
            # Fetch 6mo history to ensure enough data for MACD/RSI
            hist = stock.history(period="6mo")
            
            if hist.empty or len(hist) < 30:
                print(f"⚠️ Insufficient data for {ticker}. Skipping.")
                continue

            # Calculate Indicators
            hist['RSI'] = calculate_rsi(hist)
            hist['MACD'], hist['Signal_Line'] = calculate_macd(hist)
            
            # Get latest valid data
            latest = hist.iloc[-1]
            rsi = latest['RSI']
            macd_val = latest['MACD']
            sig_val = latest['Signal_Line']
            price = latest['Close']
            
            if np.isnan(rsi) or np.isnan(macd_val):
                 print(f"⚠️ Calculation error for {ticker}. Skipping.")
                 continue

            macd_signal, status = interpret_signal(rsi, macd_val, sig_val)
            
            # Get Fundamental Info
            info = stock.info
            trailing_pe = info.get('trailingPE', 0)
            held_insiders = info.get('heldPercentInsiders', 0) * 100
            
            # Calculate Sentiment
            sentiment = get_sentiment_score(ticker)

            # Insert into DB
            cursor.execute("""
                INSERT OR REPLACE INTO daily_signals 
                (ticker_symbol, date, price, rsi, macd_signal, sentiment_score, status, held_pct_insiders, trailing_pe)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (ticker, date.today(), round(price, 2), round(rsi, 2), macd_signal, 
                  sentiment, status, round(held_insiders, 2), round(trailing_pe, 2)))
            
            sent_str = f"{sentiment}" if sentiment is not None else "N/A"
            print(f"✅ {ticker}: RSI={rsi:.2f} | Sent={sent_str} | {status}")
            
        except Exception as e:
            print(f"❌ Error processing {ticker}: {e}")

    conn.commit()
    conn.close()
    print("\n✨ Daily Signals Populated Successfully.")

if __name__ == "__main__":
    populate_daily_signals()
