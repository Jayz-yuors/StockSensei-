
/* SELECT sp.trade_date, sp.open_price, sp.high_price, sp.low_price, sp.close_price, sp.volume FROM stock_prices sp 
JOIN companies c ON sp.company_id = c.company_id 
WHERE c.ticker_symbol = 'RELIANCE.NS' AND sp.trade_date >= '2024-01-01' ORDER BY sp.trade_date ASC
-- ====SCENARIO -> SELECTED RELIANCE.NS FROM THE UI AND DATE ASD 2024-01-01=======[DATA FILTERING FOR SELECTED COMPANY]
*/
/*SELECT sp.trade_date, sp.open_price, sp.high_price, sp.low_price, sp.close_price, sp.volume FROM stock_prices sp 
JOIN companies c ON sp.company_id = c.company_id 
WHERE c.ticker_symbol = 'RELIANCE.NS' ORDER BY sp.trade_date 	DESC LIMIT 1 */
---- ====SCENARIO -> SELECTED RELIANCE.NS FROM THE UI AND OPTERD TO SEE THE MOST RECENT PRICE =======
/*SELECT sp.trade_date, sp.open_price, sp.high_price, sp.low_price,
       sp.close_price, sp.volume
FROM stock_prices sp
JOIN companies c ON sp.company_id = c.company_id
WHERE c.ticker_symbol = 'RELIANCE.NS'
  AND sp.trade_date BETWEEN '2023-01-01' AND '2023-12-31'
ORDER BY sp.trade_date ASC */
----- ====SCENARIO -> SUPPOSING THAT MORE THAN 2 COMPANIES ARE SELECTED ON THE UI AND I NEED TO COMPARE THEM , SQL QUERY IS SELECTED INVIDUALLY , COMAPRISION IS DONE BY PANDAS OF PYTHON 
--SELECT MAX(trade_date) FROM stock_prices WHERE company_id = 1 -> LATEST DATA AVAILABLE FOR THE COMPANY 


