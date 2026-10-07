# QuantSensei — integrated platform

One login, two products:

| Folder | What it is | Port |
|---|---|---|
| `portal/` | **New.** Product page, sign in / sign up (email + Google), dashboard, launcher, profile | 8080 |
| `stocksensei/` | StockSensei — Streamlit Nifty 50 analytics (needs PostgreSQL, see its `db_config.py`) | 8501 |
| `quantcopilot/` | QuantCopilot AI — Next.js 16 luxury obsidian terminal (3000) + FastAPI backend (8000) + FinBERT NLP + PyTorch GNN + 1Y historical & options micro-ticks suite | 3000 / 8000 |

## Quick start
```bash
pip install -r portal/requirements.txt
python portal/server.py            # then open http://localhost:8080
```
Run everything at once: `.\run_all.ps1` (Windows) or `./run_all.sh` (macOS/Linux).
Install each product's own dependencies first (see `stocksensei/requirements.txt`, `quantcopilot/README.md`).

## Where user data lives (no database)
`portal/data/users.json` holds every account: name, email, scrypt-hashed password (never plain text),
sign-in providers, preferences and recently used workspaces. `portal/data/secret.key` signs session cookies.
Both files are created automatically. **Do not commit or share them.**

## Google sign-in
1. Google Cloud Console → APIs & Services → Credentials → *Create OAuth client ID* → **Web application**.
2. Authorized redirect URI: `http://localhost:8080/auth/google/callback`
3. `cp portal/.env.example portal/.env` and fill `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, then restart the portal.

## Configuration
All in `portal/.env` (see `.env.example`): ports, product URLs, Google keys. Brand name "QuantSensei" appears in
`portal/static/js/common.js` and the HTML pages — search & replace to rename.

## Notes
- The dashboard checks whether each product is running and shows start commands if not.
- Both products have a "Back to QuantSensei" link (StockSensei sidebar, QuantCopilot sidebar).
- The two products are separate servers; the portal's login protects the portal pages and launcher,
  but the product ports themselves (8501/3000) are not behind the login. For a public deployment,
  put all four behind one reverse proxy (nginx/Caddy) with auth.
