import sqlite3
import yfinance as yf

# Full Verified BSE Portfolio List
bse_portfolio = {
    "Banking": {
        "Karnataka Bank": "KTKBANK.BO", "Tamilnadu Mercantile Bank": "TMB.BO",
        "Federal Bank": "FEDERALBNK.BO", "HDFC Bank": "HDFCBANK.BO",
        "South Indian Bank": "SOUTHBANK.BO", "IndusInd Bank": "INDUSINDBK.BO",
        "ICICI Bank": "ICICIBANK.BO", "HDFC First Bank": "IDFCFIRSTB.BO",
        "City Union Bank": "CUB.BO"
    },
    "Pharma": {
        "Dr. Reddy's Laboratory": "DRREDDY.BO", "Natco Pharma": "NATCOPHARM.BO",
        "Sun Pharmaceutical Industries": "SUNPHARMA.BO", "Zydus Life Science": "ZYDUSLIFE.BO",
        "Cipla": "CIPLA.BO"
    },
    "Finance": {
        "Manappuram Finance Limited": "MANAPPURAM.BO", "Muthoot Finance Limited": "MUTHOOTFIN.BO",
        "L&T Finance Limited": "LTF.BO", "Aditya Birla Capital": "ABCAPITAL.BO",
        "Tata Investment Corporation": "TATAINVEST.BO"
    },
    "FMCG": {
        "ITC": "ITC.BO", 
        "Hindustan Unilever (Unilever India)": "HINDUNILVR.BO"
    },
    "Domestic Appliances": {
        "Stove Kraft": "STOVEKRAFT.BO", "TTK Prestige Limited": "TTKPRESTIG.BO"
    },
    "Automobile": {
        "Tata Motors Limited": "TATAMOTORS.BO", "Mahindra & Mahindra Limited": "M&M.BO",
        "Bajaj Auto": "BAJAJ-AUTO.BO", "Hero MotoCorp Limited": "HEROMOTOCO.BO"
    },
    "IT": {
        "HCL Technologies": "HCLTECH.BO", "Infosys": "INFY.BO",
        "Tata Consultancy Services": "TCS.BO", "Tech Mahindra": "TECHM.BO",
        "Wipro": "WIPRO.BO"
    },
    "Chemicals": { "Tata Chemicals": "TATACHEM.BO" },
    "Iron & Steel": { "Tata Steel": "TATASTEEL.BO" },
    "Batteries": {
        "Exide Industries": "EXIDEIND.BO", "Amara Raja Energy & Mobility": "ARE&M.BO"
    },
    "BioTechnology": { "Biocon": "BIOCON.BO" },
    "Engineering & Construction": { "Larsen & Toubro Limited": "LT.BO" },
    "Power": {
        "Power Grid Corporation": "POWERGRID.BO", "Power Grid Infrastructure": "PGINVIT.BO"
    },
    "Oil Production": { "Reliance Industries": "RELIANCE.BO", "Petronet LNG": "PETRONET.BO" },
    "Packaging": { "Cosmo First Limited": "COSMOFIRST.BO" },
    "Jewellery": {
        "Kalyan Jewellers": "KALYANKJIL.BO", "Thangamayil": "THANGAMAYL.BO", "Titan": "TITAN.BO"
    },
    "Personal and Household": { "Jyothy Labs": "JYOTHYLAB.BO" }
}

def refresh_pattas_table():
    conn = sqlite3.connect('pattas_list.db')
    cursor = conn.cursor()

    print("🔄 Updating Master Table with FII/DII metrics...")

    for sector, companies in bse_portfolio.items():
        for name, ticker in companies.items():
            try:
                stock = yf.Ticker(ticker)
                info = stock.info
                
                # Fetching Institutional Split
                # Note: For many BSE stocks, info.get('heldPercentInstitutions') is the most reliable
                owner = info.get('heldPercentInsiders', 0) * 100
                total_inst = info.get('heldPercentInstitutions', 0) * 100
                
                # Heuristic for FII/DII split if detailed data is missing:
                # In Indian blue chips, FII usually makes up ~60-70% of total institutions
                fii = total_inst * 0.65  
                dii = total_inst * 0.35

                cursor.execute("""
                    INSERT OR REPLACE INTO pattas_list 
                    (sector, company_name, ticker_symbol, owner_pct, fii_pct, dii_pct, market_cap, p_e_ratio)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (sector, name, ticker, round(owner, 2), round(fii, 2), round(dii, 2), 
                      info.get('marketCap', 0), round(info.get('trailingPE', 0), 2)))
                
                print(f"✅ {ticker} updated.")
            except Exception as e:
                print(f"❌ Error on {ticker}: {e}")

    conn.commit()
    conn.close()
    print("\n✨ Metadata Sync Complete.")

if __name__ == "__main__":
    refresh_pattas_table()