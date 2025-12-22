import yfinance as yf
import json

def check_news(ticker):
    print(f"--- Checking {ticker} ---")
    t = yf.Ticker(ticker)
    news = t.news
    if news:
        print(f"Found {len(news)} articles.")
        print(json.dumps(news[0], indent=2))
    else:
        print("No news found.")

check_news("BAJAJ-AUTO.BO")
check_news("BAJAJ-AUTO.NS")
