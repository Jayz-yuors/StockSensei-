-- Drop stock_prices frist because it references companies
DROP TABLE IF EXISTS stock_prices CASCADE;
-- DROP COMPANIES
DROP TABLE IF EXISTS companies CASCADE;
CREATE TABLE companies (
 company_id SERIAL PRIMARY KEY,
 company_name VARCHAR(100) NOT NULL ,
 ticker_symbol VARCHAR(200) UNIQUE NOT NULL 
);
CREATE TABLE stock_prices (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    trade_date DATE NOT NULL,
    open_price NUMERIC(12, 4),
    high_price NUMERIC(12, 4),
    low_price NUMERIC(12, 4),
    close_price NUMERIC(12, 4),
    volume BIGINT,
    UNIQUE(company_id, trade_date)
);
CREATE INDEX idx_stockprices_company_date ON stock_prices(company_id, trade_date);
