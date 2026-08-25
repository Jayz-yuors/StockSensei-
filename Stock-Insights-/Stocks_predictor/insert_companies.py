from db_config import create_connection

# ---------- Default Nifty50 Companies ----------
DEFAULT_COMPANIES = [
    ("Reliance Industries",                 "RELIANCE.NS"),
    ("HDFC Bank",                           "HDFCBANK.NS"),
    ("Tata Consultancy Services",           "TCS.NS"),
    ("Bharti Airtel",                       "BHARTIARTL.NS"),
    ("ICICI Bank",                          "ICICIBANK.NS"),
    ("State Bank of India",                 "SBIN.NS"),
    ("Infosys",                             "INFY.NS"),
    ("Hindustan Unilever",                  "HINDUNILVR.NS"),
    ("Life Insurance Corporation of India", "LICI.NS"),
    ("Bajaj Finance",                       "BAJFINANCE.NS"),
    ("ITC",                                 "ITC.NS"),
    ("Larsen & Toubro",                     "LT.NS"),
    ("Maruti Suzuki India",                 "MARUTI.NS"),
    ("HCL Technologies",                    "HCLTECH.NS"),
    ("Sun Pharmaceutical",                  "SUNPHARMA.NS"),
    ("Kotak Mahindra Bank",                 "KOTAKBANK.NS"),
    ("Mahindra & Mahindra",                 "M&M.NS"),
    ("UltraTech Cement",                    "ULTRACEMCO.NS"),
    ("Axis Bank",                           "AXISBANK.NS"),
    ("NTPC Limited",                        "NTPC.NS"),
    ("Titan Company",                       "TITAN.NS"),
    ("Bajaj Finserv",                       "BAJAJFINSV.NS"),
    ("Hindustan Aeronautics",               "HAL.NS"),
    ("Oil & Natural Gas",                   "ONGC.NS"),
    ("Adani Ports & SEZ",                   "ADANIPORTS.NS"),
    ("Bharat Electronics",                  "BEL.NS"),
    ("Wipro",                               "WIPRO.NS"),
    ("JSW Steel",                           "JSWSTEEL.NS"),
    ("Tata Motors",                         "TATAMOTORS.NS"),
    ("Asian Paints",                        "ASIANPAINT.NS"),
    ("Coal India",                          "COALINDIA.NS"),
    ("Nestlé India",                        "NESTLEIND.NS"),
    ("Grasim Industries",                   "GRASIM.NS"),
    ("Hindalco Industries",                 "HINDALCO.NS"),
    ("Tata Steel",                          "TATASTEEL.NS"),
    ("Ambuja Cement",                       "AMBUJACEM.NS"),
    ("RIR Power Electronics",                   "RPOWER.NS"),
    ("Divi's Laboratories",                   "DIVISLAB.NS"),
    ("Shree Cement",                       "SHREECEM.NS"),
    ("Adani Enterprises",                   "ADANIENT.NS"),
    
]


def insert_companies():
    """
    Auto-insert default companies safely (idempotent).
    Mirrors the original MongoDB upsert behaviour exactly.
    """
    conn = create_connection()
    inserted_count = 0

    with conn.cursor() as cur:
        for name, ticker in DEFAULT_COMPANIES:
            cur.execute(
                """
                INSERT INTO companies (company_name, ticker_symbol)
                VALUES (%s, %s)
                ON CONFLICT (ticker_symbol)
                DO UPDATE SET company_name = EXCLUDED.company_name
                RETURNING (xmax = 0) AS is_new;
                """,
                (name, ticker),
            )
            row = cur.fetchone()
            if row and row[0]:          # xmax = 0 means it was a fresh INSERT
                inserted_count += 1

    conn.commit()
    conn.close()
    print(f"✔ Company list synced! (Newly inserted: {inserted_count})")


if __name__ == "__main__":
    insert_companies()