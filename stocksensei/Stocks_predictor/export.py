import argparse
import logging
from pathlib import Path

import pandas as pd

from db_config import create_connection


DEFAULT_OUTPUT = "stock_prices_export.csv"


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)


def export_stock_prices_to_csv(output_path=DEFAULT_OUTPUT):
    """
    Export all stock price rows from PostgreSQL to a CSV file.
    Includes company metadata by joining stock_prices with companies.
    """
    query = """
        SELECT
            c.company_id,
            c.company_name,
            c.ticker_symbol,
            sp.trade_date,
            sp.open_price,
            sp.high_price,
            sp.low_price,
            sp.close_price,
            sp.volume
        FROM stock_prices sp
        JOIN companies c ON sp.company_id = c.company_id
        ORDER BY c.ticker_symbol, sp.trade_date;
    """

    output_file = Path(output_path)
    conn = create_connection()

    try:
        df = pd.read_sql_query(query, conn)
        df.to_csv(output_file, index=False)
    finally:
        conn.close()

    logging.info("Exported %s rows to %s", len(df), output_file.resolve())
    return output_file


def main():
    parser = argparse.ArgumentParser(
        description="Export all PostgreSQL stock_prices data to a CSV file."
    )
    parser.add_argument(
        "-o",
        "--output",
        default=DEFAULT_OUTPUT,
        help=f"CSV output path. Default: {DEFAULT_OUTPUT}",
    )
    args = parser.parse_args()

    export_stock_prices_to_csv(args.output)


if __name__ == "__main__":
    main()
