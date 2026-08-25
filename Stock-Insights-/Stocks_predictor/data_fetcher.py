from db_config import create_connection
from insert_companies import insert_companies
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta, date
import logging
import time

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)

START_DATE          = date(2015, 1, 1)
REQUEST_PAUSE_SEC   = 0.3
SAFETY_LOOKBACK_DAYS = 7   # Helps recover missing gaps from Yahoo


# --------------------------
# Safe numeric conversion
# --------------------------
def safe_float(v):
    try:
        return float(v)
    except Exception:
        return None


def safe_int(v):
    try:
        return int(float(v))
    except Exception:
        return 0


# --------------------------
# Company List Loader
# --------------------------
def get_company_list():
    """
    Return all ticker symbols from PostgreSQL companies table.
    If the table is empty, auto-insert the default list first
    (mirrors original MongoDB behaviour exactly).
    """
    conn = create_connection()
    with conn.cursor() as cur:
        cur.execute("SELECT ticker_symbol FROM companies ORDER BY company_name;")
        rows = cur.fetchall()
    conn.close()

    if not rows:
        logging.warning("⚠ No companies in DB — inserting default list")
        insert_companies()
        conn = create_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT ticker_symbol FROM companies ORDER BY company_name;")
            rows = cur.fetchall()
        conn.close()
        logging.info("✔ Default companies inserted!")

    return [r[0] for r in rows]


# --------------------------
# Get latest stored date
# --------------------------
def get_latest_date(ticker):
    """
    Return the most recent trade_date already stored for this ticker,
    or None if no data exists yet.
    Mirrors: db["stock_prices"].find_one({"ticker": ticker}, sort=[("date", -1)])
    """
    conn = create_connection()
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT MAX(sp.trade_date)
            FROM stock_prices sp
            JOIN companies c ON sp.company_id = c.company_id
            WHERE c.ticker_symbol = %s;
            """,
            (ticker,),
        )
        result = cur.fetchone()
    conn.close()
    return result[0] if result and result[0] else None


# --------------------------
# Fetch new data from Yahoo
# --------------------------
def fetch_yfinance(ticker, start_date):
    today = datetime.now().date()

    if start_date >= today:
        logging.info(f"{ticker}: Already updated — no fetch needed")
        return None

    logging.info(f"{ticker}: Fetching from {start_date} to {today} …")

    df = yf.download(
        ticker,
        start=start_date.strftime("%Y-%m-%d"),
        end=today.strftime("%Y-%m-%d"),
        interval="1d",
        auto_adjust=True,
        progress=False,
        threads=True,
    )

    if df.empty:
        logging.warning(f"{ticker}: 🚫 No new data received")
        return None

    df.index = pd.to_datetime(df.index, utc=False)
    logging.info(f"{ticker}: ✔ Downloaded {len(df)} rows")
    return df


# --------------------------
# Insert New Data into PostgreSQL
# --------------------------
def insert_prices(df, ticker):
    """
    Upsert OHLCV rows into stock_prices.
    Mirrors the original MongoDB update_one(..., upsert=True) exactly.
    """
    conn = create_connection()

    # Resolve company_id
    with conn.cursor() as cur:
        cur.execute(
            "SELECT company_id FROM companies WHERE ticker_symbol = %s;",
            (ticker,),
        )
        row = cur.fetchone()

    if not row:
        logging.warning(f"{ticker}: Not found in companies table — skipping")
        conn.close()
        return

    company_id = row[0]
    inserted   = 0

    with conn.cursor() as cur:
        for ts, row_data in df.iterrows():
            trade_date = ts.date()

            # Flatten MultiIndex columns produced by recent yfinance versions
            def _get(col_name):
                # Try plain name first, then (name, ticker) MultiIndex key
                if col_name in df.columns:
                    return row_data[col_name]
                for key in df.columns:
                    if isinstance(key, tuple) and key[0] == col_name:
                        return row_data[key]
                return None

            cur.execute(
                """
                INSERT INTO stock_prices
                    (company_id, trade_date, open_price, high_price,
                     low_price, close_price, volume)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (company_id, trade_date) DO UPDATE SET
                    open_price  = EXCLUDED.open_price,
                    high_price  = EXCLUDED.high_price,
                    low_price   = EXCLUDED.low_price,
                    close_price = EXCLUDED.close_price,
                    volume      = EXCLUDED.volume;
                """,
                (
                    company_id,
                    trade_date,
                    safe_float(_get("Open")),
                    safe_float(_get("High")),
                    safe_float(_get("Low")),
                    safe_float(_get("Close")),
                    safe_int(_get("Volume")),
                ),
            )
            inserted += 1

    conn.commit()
    conn.close()
    logging.info(f"{ticker}: 🔄 {inserted} rows inserted/updated")


# --------------------------
# MAIN DAILY UPDATER
# --------------------------
def run_fetching():
    tickers = get_company_list()
    logging.info(f"🚀 Running DB Sync for {len(tickers)} tickers")

    for ticker in tickers:
        last_dt = get_latest_date(ticker)

        # If DB has history, fetch with a small overlap to fill any gaps
        if last_dt:
            start_date = last_dt - timedelta(days=SAFETY_LOOKBACK_DAYS)
        else:
            start_date = START_DATE

        df = fetch_yfinance(ticker, start_date)

        if df is not None:
            insert_prices(df, ticker)

        time.sleep(REQUEST_PAUSE_SEC)

    logging.info("✨ DB Sync Finished Successfully!")


if __name__ == "__main__":
    run_fetching()