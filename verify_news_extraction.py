import yfinance as yf
import json

def verify_extraction(ticker):
    print(f"--- Verifying {ticker} ---")
    t = yf.Ticker(ticker)
    news = t.news
    
    if not news:
        print("No news found.")
        return

    first_item = news[0]
    news_link = None
    
    # Exact logic from market_update_graph.py
    if 'link' in first_item:
        news_link = first_item['link']
    elif 'clickThroughUrl' in first_item and first_item['clickThroughUrl']:
        news_link = first_item['clickThroughUrl'].get('url')
    elif 'canonicalUrl' in first_item and first_item['canonicalUrl']:
        news_link = first_item['canonicalUrl'].get('url')

    print(f"Extracted Link: {news_link}")

verify_extraction("BAJAJ-AUTO.NS") # Use .NS as .BO usually misses news
