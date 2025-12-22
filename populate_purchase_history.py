import sqlite3
import yfinance as yf
from datetime import date

def populate_purchase_history():
    conn = sqlite3.connect('pattas_list.db')
    cursor = conn.cursor()

    # Get all verified tickers from the master table
    cursor.execute("SELECT ticker_symbol, company_name FROM pattas_list")
    companies = cursor.fetchall()
    
    print(f"Adding BUY transactions for {len(companies)} companies...")

    for ticker, name in companies:
        try:
            stock = yf.Ticker(ticker)
            # Try to get the fast 'currentPrice', fallback to history if needed
            price = stock.info.get('currentPrice')
            
            if price is None:
                # Fallback: get last closing price
                hist = stock.history(period="1d")
                if not hist.empty:
                    price = hist['Close'].iloc[-1]
                else:
                    print(f"⚠️ Could not fetch price for {ticker}. Skipping.")
                    continue

            # Check if we already bought this stock to avoid duplicates
            cursor.execute("SELECT 1 FROM purchase_history WHERE ticker_symbol = ?", (ticker,))
            if cursor.fetchone():
                print(f"🔹 {ticker} already in portfolio. Skipping.")
                continue

            # Insert Transaction
            cursor.execute("""
                INSERT INTO purchase_history 
                (ticker_symbol, transaction_type, transaction_date, no_of_stocks, price_per_stock)
                VALUES (?, ?, ?, ?, ?)
            """, (ticker, 'BUY', date.today(), 10, round(price, 2)))
            
            print(f"✅ Bought 10 {ticker} @ {price:.2f}")
            
        except Exception as e:
            print(f"❌ Failed to process {ticker}: {e}")

    conn.commit()
    conn.close()
    print("\n✨ Purchase History Populated Successfully.")

if __name__ == "__main__":
    populate_purchase_history()
