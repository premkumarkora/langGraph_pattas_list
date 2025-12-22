import yfinance as yf
from textblob import TextBlob

ticker_symbol = "RELIANCE.BO"
print(f"Testing for {ticker_symbol}")

ticker = yf.Ticker(ticker_symbol)
news = ticker.news
print(f"News for {ticker_symbol}: {len(news)}")

if not news and ticker_symbol.endswith('.BO'):
    ns_symbol = ticker_symbol.replace('.BO', '.NS')
    print(f"Trying fallback: {ns_symbol}")
    news = yf.Ticker(ns_symbol).news
    print(f"News for {ns_symbol}: {len(news)}")

if news:
    print("First news item:", news[0])
    blob = TextBlob(news[0]['title'])
    print(f"Sentiment: {blob.sentiment.polarity}")
else:
    print("No news found.")
