from db_config import create_connection


def check_companies():
    """
    Mirrors: print(list(db["companies"].find({}, {"_id": 0})))
    Prints all companies as a list of dicts.
    """
    conn = create_connection()
    with conn.cursor() as cur:
        cur.execute("SELECT company_name, ticker_symbol FROM companies ORDER BY company_name;")
        rows = cur.fetchall()
    conn.close()

    result = [{"company_name": r[0], "ticker_symbol": r[1]} for r in rows]
    print(result)


def check_price_counts():
    """
    Mirrors:
        for ticker in db["companies"].distinct("ticker"):
            count = db["stock_prices"].count_documents({"ticker": ticker})
            print(f"{ticker}: {count}")
    """
    conn = create_connection()
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT c.ticker_symbol, COUNT(sp.price_id) AS cnt
            FROM companies c
            LEFT JOIN stock_prices sp ON sp.company_id = c.company_id
            GROUP BY c.ticker_symbol
            ORDER BY c.ticker_symbol;
            """
        )
        rows = cur.fetchall()
    conn.close()

    for ticker, count in rows:
        print(f"{ticker}: {count}")


if __name__ == "__main__":
    check_companies()
    check_price_counts()