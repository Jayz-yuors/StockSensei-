import streamlit as st
import pandas as pd
import numpy as np
from datetime import datetime, date
import plotly.graph_objects as go
import plotly.express as px

from plotting import plot_correlation
from calculations import (
    fetch_prices, fetch_current_price, fetch_company_info,
    compute_sma, compute_ema, detect_abrupt_changes,
    volatility_and_risk, correlation_analysis,
    compare_companies, get_close_price_column,
    add_technical_indicators,
)
from data_fetcher import get_company_list, run_fetching, get_latest_date

selected_companies = []

sector_map = {
    "RELIANCE.NS":   "Energy & Petrochemicals 🛢️",
    "HDFCBANK.NS":   "Banking & Finance 🏦",
    "TCS.NS":        "IT & Technology 💻",
    "BHARTIARTL.NS": "Telecom 📡",
    "ICICIBANK.NS":  "Banking & Finance 🏦",
    "SBIN.NS":       "Banking & Finance 🏦",
    "INFY.NS":       "IT & Technology 💻",
    "HINDUNILVR.NS": "Consumer Goods 🏪",
    "LICI.NS":       "Insurance 🛡️",
    "BAJFINANCE.NS": "Financial Services 💳",
    "ITC.NS":        "Diversified FMCG 🍃",
    "LT.NS":         "Infrastructure & Engineering 🏗️",
    "MARUTI.NS":     "Automobiles 🚗",
    "HCLTECH.NS":    "IT & Technology 💻",
    "SUNPHARMA.NS":  "Pharmaceuticals 💊",
    "KOTAKBANK.NS":  "Banking & Finance 🏦",
    "M&M.NS":        "Automobiles, Mobility 🚙",
    "ULTRACEMCO.NS": "Cement & Building Material 🧱",
    "AXISBANK.NS":   "Banking & Finance 🏦",
    "NTPC.NS":       "Power Generation ⚡",
    "TITAN.NS":      "Luxury & Retail ⌚💍",
    "BAJAJFINSV.NS": "Financial Services 💼",
    "HAL.NS":        "Defence & Aerospace ✈️",
    "ONGC.NS":       "Oil & Gas 🌍",
    "ADANIPORTS.NS": "Logistics & Ports ⚓",
    "BEL.NS":        "Defence Electronics 🛰️",
    "WIPRO.NS":      "IT & Technology 💻",
    "JSWSTEEL.NS":   "Metals & Steel 🏭",
    "TATAMOTORS.NS": "Automobiles 🚘",
    "ASIANPAINT.NS": "Consumer Goods 🎨",
    "COALINDIA.NS":  "Mining & Commodities ⛏️",
    "NESTLEIND.NS":  "Food & Beverages 🍫",
    "GRASIM.NS":     "Materials & Chemicals 🧪",
    "HINDALCO.NS":   "Metals & Mining ⚒️",
    "TATASTEEL.NS":  "Steel Manufacturing 🔩",
    "AMBUJACEM.NS":  "Cement & Construction 🧱",
    "RPOWER.NS":     "Power Generation ⚡",
    "DIVISLAB.NS":   "Pharmaceuticals 💊",
    "SHREECEM.NS":   "Cement & Building Material 🧱",
    "ADANIENT.NS":   "Diversified 🌐"
}

# ============== BASIC PAGE CONFIG ==============
st.set_page_config(
    page_title="Stock Insights – Smart Nifty50 Analytics",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ============== THEME TOGGLE ==============
if "theme" not in st.session_state:
    st.session_state["theme"] = "Dark"

theme = st.sidebar.radio(
    "Theme",
    ["Dark", "Light"],
    index=0 if st.session_state["theme"] == "Dark" else 1,
)
st.session_state["theme"] = theme

if theme == "Dark":
    bg_color      = "#060814"
    card_color    = "#101623"
    text_color    = "#fafafa"
    subtext_color = "rgba(122, 234, 255, 0.85)"
    accent        = "#00e1ff"
else:
    bg_color      = "#f3f8ff"
    card_color    = "#ffffff"
    text_color    = "#111827"
    subtext_color = "#444"
    accent        = "#0077ff"

# ============== SEO META TAGS ==============
st.markdown("""
    <meta name="description" content="AI-powered stock learning platform — Master Nifty50 analysis with SMA, RSI, volatility, correlation, and smart insights.">
    <meta name="keywords" content="Stock Market, Nifty50, Finance Learning, Technical Indicators, SMA, RSI, MACD, Risk & Volatility, AI Stock Analysis">
    <meta property="og:title" content="Stock Insights — Master the Market Step-by-Step">
    <meta property="og:description" content="Smart Insights for Smarter Investing — Nifty50 analytics powered by AI.">
    <meta property="og:type" content="website">
""", unsafe_allow_html=True)

# ============== BRAND HEADER ==============
st.markdown(f"""
    <style>
        .brand-title {{
            font-size: 42px;
            font-weight: 900;
            background: linear-gradient(90deg, #12c2e9, #0ee6b7, #00ff95);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-transform: uppercase;
            letter-spacing: 4px;
            margin-bottom: 4px;
        }}
        .brand-tagline {{
            font-size: 24px;
            font-weight: 700;
            color: {text_color};
            margin-top: 0px;
            margin-bottom: 6px;
        }}
        .brand-sub {{
            font-size: 15px;
            font-weight: 500;
            color: {subtext_color};
            margin-top: 0px;
        }}
    </style>

    <div style="text-align:center; margin-top:10px; margin-bottom:30px;">
        <div class="brand-title">Stock Insights</div>
        <div class="brand-tagline">Master the Market Step-by-Step</div>
        <div class="brand-sub">Nifty50 Analytics — Smart Insights for Smarter Investing</div>
    </div>
""", unsafe_allow_html=True)

# ============== AUTO UPDATE ==============
@st.cache_resource(ttl=24 * 60 * 60)
def silent_update():
    run_fetching()

with st.spinner("Syncing latest stock data…"):
    silent_update()

# ============== SIDEBAR FILTERS ==============
company_list = get_company_list()
if not company_list:
    st.error("⚠ No tickers found in DB — run insert_companies first!")
    st.stop()

selected_companies = st.sidebar.multiselect(
    "Select Company Tickers",
    options=company_list,
    default=company_list[:2],
)

if not selected_companies:
    st.warning("Select at least one company.")
    st.stop()

MIN_DATE    = date(2015, 1, 1)
UI_MAX_DATE = date(date.today().year, 12, 31)

start_date = st.sidebar.date_input(
    "Start Date",
    value=MIN_DATE,
    min_value=MIN_DATE,
    max_value=UI_MAX_DATE,
)

end_date = st.sidebar.date_input(
    "End Date",
    value=date.today(),
    min_value=MIN_DATE,
    max_value=UI_MAX_DATE,
)

if start_date >= end_date:
    st.sidebar.error("Start date must be earlier than End Date.")
    st.stop()

TODAY = date.today()
if end_date > TODAY:
    end_date = TODAY

date_valid = True

# ---- Staleness check ----
last_updated_dates = []
for ticker in selected_companies:
    d = get_latest_date(ticker)
    if d:
        last_updated_dates.append(d)

last_updated = (
    max(last_updated_dates).strftime("%d %b %Y")
    if last_updated_dates
    else "Unknown"
)

stale_msgs = []
today = datetime.now().date()
for t in selected_companies:
    d = get_latest_date(t)
    if d:
        delay = (today - d).days
        if delay >= 2:
            icon = "🚨" if delay > 5 else "⚠️"
            stale_msgs.append(f"{icon} <strong>{t}</strong> — {delay} days ago")

if stale_msgs:
    msg_html = "<br>".join(stale_msgs)
    st.sidebar.markdown(f"""
    <div style="
        background:rgba(255,180,0,0.12);
        border-left:4px solid #ffae00;
        padding:12px 14px;
        border-radius:8px;
        margin-top:20px;
        color:#ffe7c4;">
        <strong>⚠ Update Delay Detected</strong><br>
        <span style='font-size:13px;'>{msg_html}</span>
    </div>
    """, unsafe_allow_html=True)
else:
    st.sidebar.markdown(f"""
    <div style="
        background:rgba(0,255,140,0.10);
        border-left:4px solid #00ff9d;
        padding:12px 14px;
        border-radius:8px;
        margin-top:20px;
        color:#baffdd;">
        ✨ All selected stocks are updated till the latest available date!
    </div>
    """, unsafe_allow_html=True)

# ============== FOOTER ==============

# ============== FOOTER (Updated daily, no developer name) ==============
st.markdown(
    f"""
    <div style="
        text-align:center;
        padding:10px;
        margin-top:30px;
        font-size:14px;
        font-weight:500;
        color:#a6fff5;
        border-top:1px solid rgba(255,255,255,0.15);
    ">
        <span style='font-size:13px; color:#9cdcff;'>
            🔄 Updated daily at <strong>10:00 AM</strong> & <strong>11:00 PM IST</strong><br>
            📅 Data available till: <strong style='color:#7afcff;'>{last_updated}</strong>
        </span>
    </div>
    """,
    unsafe_allow_html=True,
)


if selected_companies:
    st.sidebar.markdown("""
    <div style="
        background:rgba(0,255,200,0.06);
        border-left:4px solid #00ffc8;
        padding:10px 14px;
        border-radius:6px;
        margin-top:14px;
        color:#b9fff4;
    ">
    <strong>🏷️ Selected Stocks:</strong>
    </div>
    """, unsafe_allow_html=True)

    for t in selected_companies:
        sector = sector_map.get(t, "Sector Not Available ℹ️")
        st.sidebar.markdown(
            f"<span style='color:#d9f7ff;'>• <strong>{t}</strong> — {sector}</span>",
            unsafe_allow_html=True,
        )

st.sidebar.markdown("""
<div style="
    background:rgba(0,255,200,0.06);
    border-left:4px solid #00ffc8;
    padding:10px 14px;
    border-radius:6px;
    margin-top:14px;
    color:#b9fff4;
">
<strong>📅 Date Range:</strong><br>
""", unsafe_allow_html=True)

st.sidebar.markdown(
    f"<span style='color:#d9f7ff;'>• From: <strong>{start_date}</strong></span><br>"
    f"<span style='color:#d9f7ff;'>• To:   <strong>{end_date}</strong></span>",
    unsafe_allow_html=True,
)
st.sidebar.markdown("</div>", unsafe_allow_html=True)


# ============== Helper Functions ==============
def build_budget_options():
    small  = list(range(0, 100001, 10000))
    large  = list(range(200000, 1000001, 100000))
    values = small + large
    labels = [f"₹{v:,.0f}" for v in values]
    return values, labels


def analyze_trend_confidence(df, col_close, horizon):
    if len(df) < 15:
        return 50, "Hold", 0, 0

    lookback = 60 if horizon == "Short Term" else 180
    recent   = df.tail(min(len(df), lookback))

    x          = np.arange(len(recent))
    y          = recent[col_close].values
    slope, _   = np.polyfit(x, y, 1)
    pct_change = (y[-1] - y[0]) / y[0] * 100
    vol        = recent[col_close].pct_change().std() * 100

    conf = 50 + pct_change / 2 - vol / 4
    conf = float(max(5, min(95, conf)))

    if pct_change > 5 and slope > 0:
        label = "Strong Buy"
    elif pct_change > 1 and slope > 0:
        label = "Buy"
    elif pct_change < -5 and slope < 0:
        label = "Risky / Avoid"
    else:
        label = "Hold"

    return conf, label, pct_change, vol


def project_future(df, col_close, horizon):
    lookback = 60 if horizon == "Short Term" else 180
    if len(df) < lookback:
        lookback = len(df)

    recent = df.tail(lookback)
    if len(recent) < 10:
        return pd.DataFrame(), pd.DataFrame()

    x                = np.arange(len(recent))
    y                = recent[col_close].values
    slope, intercept = np.polyfit(x, y, 1)

    future_days   = 15 if horizon == "Short Term" else 60
    last_date     = df["trade_date"].iloc[-1]
    future_dates  = pd.bdate_range(last_date + pd.Timedelta(days=1), periods=future_days)
    x_future      = np.arange(len(recent), len(recent) + len(future_dates))
    future_prices = intercept + slope * x_future

    future_df          = pd.DataFrame({"trade_date": future_dates, col_close: future_prices})
    future_df["SMA"]   = future_df[col_close].rolling(20, min_periods=1).mean()

    buy  = future_df[future_df[col_close] < future_df["SMA"]]
    sell = future_df[future_df[col_close] > future_df["SMA"]]
    return buy, sell


def download_csv(df: pd.DataFrame, name: str):
    """Reusable download helper for tabular data."""
    st.download_button(
        label="📥 Download this data as CSV",
        data=df.to_csv(index=False),
        file_name=f"{name}.csv",
        mime="text/csv",
    )


# ============== TABS ==============
tab1, tab2, tab3, tab4, tab5 = st.tabs([
    "📈 Price Trends",
    "⚡ Abrupt Changes",
    "📉 Risk & Volatility",
    "🔗 Compare & Correlate",
    "🧠 Smart Insights",
])


# ============== TAB 1 — Price Trends + Indicators ==============
with tab1:
    st.subheader("📈 Price Trend + Technical Indicators")

    st.markdown("### 📘 Learn & Analyze with Price Trends")

    col1, col2 = st.columns(2)
    with col1:
        st.markdown("""
        <div style="
            background:rgba(0,180,216,0.08);
            border-left:4px solid #00b4d8;
            padding:12px 16px;
            border-radius:8px;
            color:#c9e8ff;
            margin-bottom:12px;
        ">
        <strong>📌 What will you analyze here?</strong><br>
        • Stock price behaviour & market cycles<br>
        • Spot big uptrends & downtrends<br>
        • Understand momentum using SMA/EMA<br>
        • Validate trend direction confidently
        </div>
        """, unsafe_allow_html=True)

    with col2:
        st.markdown("""
        <div style="
            background:rgba(0,180,216,0.08);
            border-left:4px solid #00b4d8;
            padding:12px 16px;
            border-radius:8px;
            color:#c9e8ff;
            margin-bottom:12px;
        ">
        <strong>🔍 RSI — Momentum Pressure</strong><br>
        • RSI > 70 = Overbought → Possible correction<br>
        • RSI < 30 = Oversold → Possible bounce<br>
        • Helps time better entry & exit points
        </div>
        """, unsafe_allow_html=True)

    col3, col4 = st.columns(2)
    with col3:
        st.markdown("""
        <div style="
            background:rgba(0,180,216,0.08);
            border-left:4px solid #00b4d8;
            padding:12px 16px;
            border-radius:8px;
            color:#c9e8ff;
            margin-bottom:12px;
        ">
        <strong>📈 SMA / EMA — Trend Direction</strong><br>
        • Price above MA → Bullish momentum<br>
        • Price below MA → Bearish weakness<br>
        • Short SMAs react faster to volatility
        </div>
        """, unsafe_allow_html=True)

    with col4:
        st.markdown("""
        <div style="
            background:rgba(0,180,216,0.08);
            border-left:4px solid #00b4d8;
            padding:12px 16px;
            border-radius:8px;
            color:#c9e8ff;
            margin-bottom:12px;
        ">
        <strong>🚀 MACD — Trend Confidence</strong><br>
        • Upward crossover → Strong buying zone<br>
        • Downward crossover → Weakening trend<br>
        • Great for breakout confirmation
        </div>
        """, unsafe_allow_html=True)

    st.markdown("""
    <div style="
        background:rgba(0,180,216,0.05);
        border-left:4px solid #00b4d8;
        padding:14px 18px;
        border-radius:8px;
        margin-top:6px;
        color:#aee6ff;
    ">
    <strong>🎯 Why this matters?</strong><br>
    You learn trend-following strategies and understand <strong>market psychology</strong> —
    helping you decide <strong>when to enter</strong> and <strong>when to exit</strong> smartly.
    </div>
    """, unsafe_allow_html=True)

    view_mode = st.radio(
        "Indicator Display Mode",
        ["Overlay on Chart", "Separate Panels"],
        horizontal=True,
    )

    ma_options = {
        "20 SMA":  "SMA_20",
        "50 SMA":  "SMA_50",
        "200 SMA": "SMA_200",
        "20 EMA":  "EMA_20",
        "50 EMA":  "EMA_50",
    }

    overlay_selected = st.multiselect(
        "Select Moving Averages",
        list(ma_options.keys()),
        default=["20 SMA", "50 SMA"],
    )

    osc_options  = ["RSI (14)", "MACD"]
    osc_selected = st.multiselect(
        "Oscillators (separate charts)",
        osc_options,
        default=["RSI (14)"],
    )

    for ticker in selected_companies:
        df = fetch_prices(ticker, start_date, end_date)
        if df is None or df.empty:
            continue

        df        = add_technical_indicators(df)
        col_close = get_close_price_column(df)
        last_valid_close = df[col_close].dropna().iloc[-1] if df[col_close].notna().any() else None

        st.markdown(f"### 📌 {ticker}")
        st.metric(
            "Latest Close Price",
            f"₹ {last_valid_close:.2f}" if last_valid_close is not None else "Unavailable",
        )

        if view_mode == "Overlay on Chart":
            fig = go.Figure()
            fig.add_trace(go.Scatter(x=df.trade_date, y=df[col_close],
                                     name="Close Price", mode="lines"))
            for label in overlay_selected:
                col = ma_options[label]
                if col in df.columns:
                    fig.add_trace(go.Scatter(x=df.trade_date, y=df[col],
                                             name=label, mode="lines"))
            fig.update_layout(
                title=f"{ticker} — Price + Indicators",
                height=500,
                margin=dict(t=80, b=10),
                legend=dict(orientation="h", yanchor="bottom", y=1.10,
                            xanchor="center", x=0.5),
                xaxis_title="Date",
                yaxis_title="Price (₹)",
            )
            st.plotly_chart(fig, use_container_width=True)
            download_csv(df, f"{ticker}_overlay_data")

        else:
            st.markdown("#### 📌 Close Price")
            st.line_chart(df.set_index("trade_date")[col_close], height=350)
            for label in overlay_selected:
                col = ma_options[label]
                if col in df.columns:
                    st.markdown(f"#### 📊 {label}")
                    st.line_chart(df.set_index("trade_date")[[col_close, col]], height=300)

        if "RSI (14)" in osc_selected:
            st.markdown("#### 🔄 RSI (14)")
            st.line_chart(df.set_index("trade_date")["RSI_14"], height=250)

        if "MACD" in osc_selected:
            st.markdown("#### 📉 MACD Indicator")
            st.line_chart(df.set_index("trade_date")["MACD"], height=250)

        with st.expander("📄 View & Download Data"):
            st.dataframe(df, use_container_width=True)
            download_csv(df, f"{ticker}_indicators")


# ============== TAB 2 — Abrupt Changes ==============
with tab2:
    st.subheader("Sudden Price Jumps & Falls ✨")
    st.markdown(f"""
    <div style="
        background:rgba(255,136,0,0.08);
        border:1px solid rgba(255,180,50,0.4);
        border-radius:10px;
        padding:12px 18px;
        text-align:right;
        font-size:14.5px;
        line-height:1.45;
        color:{text_color};
        margin:0px 0px 14px 0px;
    ">
        ⚡ Sudden price swings occur due to <strong>breaking news</strong>,
        <strong>big-money trades</strong>, or <strong>volume spikes</strong>.<br>
        🚀 Upward jumps with strength → potential <strong>early breakout</strong>.<br>
        📉 Sharp drops → fear selling & <strong>trend reversal</strong> risk.
    </div>

    <div style="
        background:rgba(255,136,0,0.07);
        border-left:4px solid #ff8800;
        border-radius:8px;
        padding:10px 16px;
        text-align:left;
        font-size:14.5px;
        line-height:1.45;
        color:{text_color};
    ">
        <strong>🎯 Why this matters?</strong><br>
        Spot <strong>breakout chances</strong> early or protect yourself before
        <strong>fast crashes</strong> cause damage 🚀📉.
    </div>
    """, unsafe_allow_html=True)

    threshold_pct = st.slider("Threshold (%)", 3, 20, 7) / 100

    for ticker in selected_companies:
        df = fetch_prices(ticker, start_date, end_date)
        if df is None or df.empty:
            continue
        col_close = get_close_price_column(df)
        abrupt    = detect_abrupt_changes(df, threshold_pct)

        st.markdown(f"### {ticker} — Abrupt Moves")
        if abrupt.empty:
            st.info("No major movements detected.")
            continue

        fig = px.bar(
            abrupt,
            x="trade_date",
            y="pct_change",
            color="pct_change",
            color_continuous_scale="RdYlGn",
            title=f"Abrupt % Movements — {ticker}",
        )
        fig.update_layout(xaxis_title="Date", yaxis_title="Daily % Change",
                          coloraxis_colorbar_title="% Change")
        st.plotly_chart(fig, use_container_width=True)
        st.dataframe(abrupt, use_container_width=True)


# ============== TAB 3 — Risk View ==============
with tab3:
    st.subheader("Volatility & Risk Index")
    st.markdown("""
    <div style="
        background:linear-gradient(135deg, rgba(255,40,40,0.10), rgba(180,0,0,0.08));
        padding:16px 18px;
        border-radius:10px;
        border-left:4px solid #ff4d4d;
        margin-bottom:10px;
        color:#ffdddd;
    ">
    <strong>⚡ Volatility means uncertainty:</strong><br>
    • Big price swings → confusion / hype 😵‍💫<br>
    • High risk during panic buying/selling 🔥<br>
    • Sudden drops → instability warning 🚨<br>
    </div>

    <div style="
        background:rgba(255,255,255,0.04);
        padding:14px 18px;
        border-radius:10px;
        border-left:4px solid #ff9f43;
        margin-bottom:10px;
        color:#ffe9c7;
    ">
    <strong>📊 How we measure Risk:</strong><br>
    • Volatility Index (fear indicator) 😬<br>
    • Price variance → instability levels 📈<br>
    • Shorter time periods → more sensitivity ⚠️<br>
    </div>

    <div style="
        background:rgba(255,255,255,0.03);
        padding:14px 18px;
        border-radius:10px;
        border-left:4px solid #ffd166;
        color:#fff7d6;
    ">
    <strong>🎯 Why this matters?</strong><br>
    Volatility helps you judge <strong>when to reduce position size</strong> and
    <strong>protect capital</strong> when the market heats up 🔥💼.
    </div>
    """, unsafe_allow_html=True)

    window = st.slider("Volatility Window", 5, 55, 20)
    for ticker in selected_companies:
        df = fetch_prices(ticker)
        if df is None or df.empty:
            continue
        vr = volatility_and_risk(df, window)
        st.markdown(f"### {ticker} — Volatility vs Risk")
        st.line_chart(vr.set_index("trade_date")[["volatility", "risk"]],
                      use_container_width=True)


# ============== TAB 4 — Comparison View ==============
with tab4:
    st.subheader("Compare Price Trends & Correlation")
    st.markdown("""
    <div style="margin-top:10px;">
    <div style="
        background:linear-gradient(145deg, #005bea33, #00c6fb22);
        padding:16px 20px;
        border-radius:10px;
        color:#e8f8ff;
        margin-bottom:12px;
        border-left:4px solid #00c6fb;
    ">
    <strong>📈 Compare Price Strength</strong><br>
    • Normalize price → fair comp. 📊<br>
    • Spot consistent outperformers 🚀<br>
    • Check who beats the market over time 🏆📈<br>
    </div>

    <div style="
        background:linear-gradient(145deg, #b721ff33, #21d4fd22);
        padding:16px 20px;
        border-radius:10px;
        color:#f1e6ff;
        margin-bottom:14px;
        border-left:4px solid #9b59ff;
    ">
    <strong>🔗 Correlation Outlook</strong><br>
    • Same direction = paired performance 🤝<br>
    • Opposite direction = hedge opportunities 🔄<br>
    • Build diversified portfolios with confidence 🧠💼<br>
    </div>

    <div style="
        background:rgba(0,200,255,0.06);
        padding:12px 16px;
        border-radius:10px;
        border-left:4px solid #00c6fb;
        color:#c7f4ff;
    ">
    <strong>🎯 Why this matters?</strong><br>
    Avoid <strong>putting all eggs in one basket</strong> → diversify smartly to reduce risk 📉🛡️.
    </div>
    </div>
    """, unsafe_allow_html=True)

    if len(selected_companies) >= 2:
        merged = compare_companies(selected_companies, start_date, end_date)
        st.markdown("### 📈 Normalized Price Comparison")

        fig = go.Figure()
        for ticker in selected_companies:
            if ticker in merged.columns:
                fig.add_trace(go.Scatter(x=merged.index, y=merged[ticker],
                                         mode="lines", name=ticker))
        fig.update_layout(
            xaxis_title="Date",
            yaxis_title="Normalized Price",
            title="Price Comparison Across Selected Stocks",
            height=550,
            margin=dict(l=0, r=0, t=40, b=80),
            legend=dict(orientation="h", yanchor="top", y=-0.15,
                        xanchor="center", x=0.5, title=None),
        )
        st.plotly_chart(fig, use_container_width=True)
        download_csv(merged.reset_index(), "normalized_price_comparison")

        st.markdown("### 🔢 Correlation Matrix")
        corr = correlation_analysis(selected_companies)
        st.dataframe(corr.style.background_gradient(cmap="coolwarm"))
        plot_correlation(corr)


# ============== TAB 5 — Smart Insights ==============
with tab5:
    st.subheader("🧠 Smart Insights, Opportunities & Forecast")
    st.markdown("### 📘 Understand AI-Driven Market Signals")

    col1, col2 = st.columns(2)
    with col1:
        st.markdown("""
        <div style="
            background:rgba(0,255,200,0.08);
            border-left:4px solid #00ffc8;
            padding:12px 16px;
            border-radius:8px;
            color:#b9fff4;
            margin-bottom:12px;
        ">
            <strong>🤖 AI Trend Confidence</strong><br>
            • Tags a stock as Buy / Hold / Risky 🔎<br>
            • Reduces emotional trading mistakes
        </div>
        """, unsafe_allow_html=True)

    with col2:
        st.markdown("""
        <div style="
            background:rgba(0,255,200,0.08);
            border-left:4px solid #00ffc8;
            padding:12px 16px;
            border-radius:8px;
            color:#b9fff4;
            margin-bottom:12px;
        ">
            <strong>📈 Future Price Tendency</strong><br>
            • Shows short-term directional pressure<br>
            • Improves timing for smarter entries
        </div>
        """, unsafe_allow_html=True)

    col3, col4 = st.columns(2)
    with col3:
        st.markdown("""
        <div style="
            background:rgba(0,255,200,0.08);
            border-left:4px solid #00ffc8;
            padding:12px 16px;
            border-radius:8px;
            color:#b9fff4;
            margin-bottom:12px;
        ">
            <strong>🎯 Buy & Sell Zones</strong><br>
            • Shows where reversals are likely<br>
            • Avoid buying tops and selling bottoms
        </div>
        """, unsafe_allow_html=True)

    with col4:
        st.markdown("""
        <div style="
            background:rgba(0,255,200,0.08);
            border-left:4px solid #00ffc8;
            padding:12px 16px;
            border-radius:8px;
            color:#b9fff4;
            margin-bottom:12px;
        ">
            <strong>💰 Share Affordability</strong><br>
            • Teaches sizing and discipline<br>
            • Plan smarter investments
        </div>
        """, unsafe_allow_html=True)

    st.markdown("""
    <div style="
        background:rgba(0,255,200,0.05);
        border-left:4px solid #00ffc8;
        padding:14px 18px;
        border-radius:8px;
        margin-top:6px;
        color:#a6fff5;
    ">
        <strong>🎯 Why this matters?</strong><br>
        Builds <strong>high-confidence decisions</strong> and prevents
        <strong>FOMO or panic selling</strong> — clarity on
        <strong>when to enter</strong> & <strong>exit</strong> the market like a smart investor.
    </div>
    """, unsafe_allow_html=True)
    st.caption("Educational purpose only — Not for financial decisions 📘")

    budget_vals, budget_labels = build_budget_options()
    budget       = budget_vals[4]
    budget_label = budget_labels[4]
    horizon      = "Short Term"

    colA, colB, colC = st.columns(3)
    with colA:
        budget_label     = st.selectbox("Budget", budget_labels, index=4)
        budget           = budget_vals[budget_labels.index(budget_label)]
    with colB:
        horizon          = st.radio("Type", ["Short Term", "Long Term"], horizontal=True)
    with colC:
        forecast_window  = 15 if horizon == "Short Term" else 60
        st.metric("Forecast Window", f"{forecast_window} days")

    st.caption("Based on trends — Not financial advice. Educational use only.")

    for ticker in selected_companies:
        df = fetch_prices(ticker)
        if df is None or df.empty:
            continue

        df        = compute_sma(df)
        col_close = get_close_price_column(df)

        conf, label, pct, vol = analyze_trend_confidence(df, col_close, horizon)
        valid_prices = (
            pd.to_numeric(df[col_close], errors="coerce")
            .replace([np.inf, -np.inf], np.nan)
            .dropna()
        )
        if valid_prices.empty or valid_prices.iloc[-1] <= 0:
            st.warning(f"{ticker}: no valid latest closing price is available.")
            continue

        latest = float(valid_prices.iloc[-1])
        shares = max(1, int(budget / latest))

        st.markdown(f"---\n### {ticker}")
        col1, col2, col3, col4 = st.columns(4)
        col1.metric("Signal",     label)
        col2.metric("Confidence", f"{conf:.1f}%")
        col3.metric("Trend %",    f"{pct:+.2f}%")
        col4.metric("Volatility", f"{vol:.2f}%")

        st.caption(f"With {budget_label}, Approx shares possible: **{shares}**")

        buy_future, sell_future = project_future(df, col_close, horizon)

        fig = go.Figure()
        fig.add_trace(go.Scatter(x=df["trade_date"], y=df[col_close],
                                  mode="lines", name="Close Price"))
        fig.add_trace(go.Scatter(x=df["trade_date"], y=df["SMA"],
                                  mode="lines", name="SMA"))

        if buy_future is not None and not buy_future.empty:
            fig.add_trace(go.Scatter(x=buy_future["trade_date"],
                                      y=buy_future[col_close],
                                      mode="markers", name="Future Buy",
                                      marker_color="green"))
        if sell_future is not None and not sell_future.empty:
            fig.add_trace(go.Scatter(x=sell_future["trade_date"],
                                      y=sell_future[col_close],
                                      mode="markers", name="Future Sell",
                                      marker_color="red"))

        fig.update_layout(title=f"{ticker} — Forecasted Buy/Sell Zones")
        st.plotly_chart(fig, use_container_width=True)

        with st.expander("🔮 Forecasted Opportunities"):
            buy_col, sell_col = st.columns(2)

            buy_col.markdown("#### 🟢 Future Buy Opportunities")
            if buy_future is None or buy_future.empty:
                buy_col.info("No buy signals ahead 🚫")
            else:
                buy_col.dataframe(buy_future[["trade_date", col_close]],
                                   use_container_width=True)

            sell_col.markdown("#### 🔴 Future Sell Opportunities")
            if sell_future is None or sell_future.empty:
                sell_col.info("No sell signals detected 🚫")
            else:
                sell_col.dataframe(sell_future[["trade_date", col_close]],
                                    use_container_width=True)
