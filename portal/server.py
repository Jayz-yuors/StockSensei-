"""QuantSensei portal: auth (file-based storage), product page, dashboard, launcher."""
import base64, hashlib, hmac, json, os, re, secrets, socket, threading, time, urllib.parse, urllib.request
from pathlib import Path
from urllib.parse import urlparse

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

BASE = Path(__file__).parent
DATA = BASE / "data"
DATA.mkdir(exist_ok=True)
USERS_FILE = DATA / "users.json"       # <- all account details live in this file
SECRET_FILE = DATA / "secret.key"


def load_env():
    f = BASE / ".env"
    if f.exists():
        for line in f.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


load_env()
PORT = int(os.getenv("PORTAL_PORT", "8080"))
BASE_URL = os.getenv("PORTAL_BASE_URL", f"http://localhost:{PORT}").rstrip("/")
GOOGLE_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
APPS = {
    "stocksensei": {"name": "StockSensei", "url": os.getenv("STOCKSENSEI_URL", "http://localhost:8501")},
    "quantcopilot": {"name": "QuantCopilot AI", "url": os.getenv("QUANTCOPILOT_URL", "http://localhost:3000")},
}
SESSION_TTL = 60 * 60 * 24 * 14

if not SECRET_FILE.exists():
    SECRET_FILE.write_text(secrets.token_hex(32))
SECRET = SECRET_FILE.read_bytes().strip()

# ---------------------------------------------------------------- file store
_lock = threading.Lock()


def read_db():
    if not USERS_FILE.exists():
        return {"users": []}
    try:
        return json.loads(USERS_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {"users": []}


def write_db(db):
    tmp = USERS_FILE.with_suffix(".tmp")
    tmp.write_text(json.dumps(db, indent=2), encoding="utf-8")
    os.replace(tmp, USERS_FILE)  # atomic


def find_user(db, email=None, uid=None):
    for u in db["users"]:
        if (email and u["email"] == email.lower()) or (uid and u["id"] == uid):
            return u


def public(u):
    return {"id": u["id"], "name": u["name"], "email": u["email"], "avatar": u.get("avatar"),
            "providers": u.get("providers", []), "prefs": u.get("prefs", {}), "recent": u.get("recent", [])[:6],
            "created_at": u["created_at"], "last_login": u.get("last_login")}


# ---------------------------------------------------------------- crypto
def hash_pw(pw):
    salt = secrets.token_bytes(16)
    h = hashlib.scrypt(pw.encode(), salt=salt, n=2 ** 14, r=8, p=1)
    return f"scrypt${salt.hex()}${h.hex()}"


def check_pw(pw, stored):
    try:
        _, salt, h = stored.split("$")
        c = hashlib.scrypt(pw.encode(), salt=bytes.fromhex(salt), n=2 ** 14, r=8, p=1)
        return hmac.compare_digest(c.hex(), h)
    except Exception:
        return False


def sign(payload: dict) -> str:
    body = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode()
    sig = hmac.new(SECRET, body.encode(), hashlib.sha256).hexdigest()
    return f"{body}.{sig}"


def unsign(token):
    try:
        body, sig = token.rsplit(".", 1)
        if not hmac.compare_digest(sig, hmac.new(SECRET, body.encode(), hashlib.sha256).hexdigest()):
            return None
        p = json.loads(base64.urlsafe_b64decode(body))
        return p if p.get("exp", 0) > time.time() else None
    except Exception:
        return None


def current_user(request: Request):
    p = unsign(request.cookies.get("qs_session", ""))
    if not p:
        return None
    return find_user(read_db(), uid=p.get("uid"))


def start_session(resp, uid):
    resp.set_cookie("qs_session", sign({"uid": uid, "exp": time.time() + SESSION_TTL}),
                    max_age=SESSION_TTL, httponly=True, samesite="lax")
    return resp


def safe_next(n):
    return n if n and n.startswith("/") and not n.startswith("//") else "/dashboard"


# simple brute-force guard
_fails = {}


def throttled(key):
    n, t = _fails.get(key, (0, 0))
    return n >= 6 and time.time() - t < 300


def err(msg, code=400):
    return JSONResponse({"ok": False, "error": msg}, status_code=code)


EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
app = FastAPI(title="QuantSensei Portal", docs_url=None, redoc_url=None)


# ---------------------------------------------------------------- auth API
@app.post("/api/auth/signup")
async def signup(request: Request):
    d = await request.json()
    name, email, pw = (d.get("name") or "").strip(), (d.get("email") or "").strip().lower(), d.get("password") or ""
    if len(name) < 2: return err("Please enter your name.")
    if not EMAIL_RE.match(email): return err("Enter a valid email address.")
    if len(pw) < 8 or not re.search(r"\d", pw) or not re.search(r"[A-Za-z]", pw):
        return err("Password needs 8+ characters with letters and numbers.")
    with _lock:
        db = read_db()
        if find_user(db, email=email):
            return err("An account with this email already exists. Try signing in.", 409)
        u = {"id": secrets.token_hex(8), "name": name, "email": email, "password_hash": hash_pw(pw),
             "providers": ["password"], "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
             "last_login": time.strftime("%Y-%m-%d %H:%M:%S"), "prefs": {}, "recent": []}
        db["users"].append(u)
        write_db(db)
    return start_session(JSONResponse({"ok": True, "user": public(u)}), u["id"])


@app.post("/api/auth/login")
async def login(request: Request):
    d = await request.json()
    email, pw = (d.get("email") or "").strip().lower(), d.get("password") or ""
    key = f"{request.client.host}:{email}"
    if throttled(key): return err("Too many attempts. Please wait a few minutes.", 429)
    with _lock:
        db = read_db()
        u = find_user(db, email=email)
        if not u or not u.get("password_hash") or not check_pw(pw, u["password_hash"]):
            n, _ = _fails.get(key, (0, 0)); _fails[key] = (n + 1, time.time())
            if u and not u.get("password_hash"):
                return err("This account uses Google sign-in. Click 'Continue with Google'.", 401)
            return err("Incorrect email or password.", 401)
        _fails.pop(key, None)
        u["last_login"] = time.strftime("%Y-%m-%d %H:%M:%S")
        write_db(db)
    return start_session(JSONResponse({"ok": True, "user": public(u)}), u["id"])


@app.post("/api/auth/logout")
async def logout():
    r = JSONResponse({"ok": True}); r.delete_cookie("qs_session"); return r


@app.get("/api/me")
async def me(request: Request):
    u = current_user(request)
    return public(u) if u else JSONResponse({"error": "unauthenticated"}, status_code=401)


@app.get("/api/config")
async def config():
    return {"google_enabled": bool(GOOGLE_ID and GOOGLE_SECRET),
            "apps": {k: v["url"] for k, v in APPS.items()}, "redirect_uri": f"{BASE_URL}/auth/google/callback"}


# ---------------------------------------------------------------- Google OAuth
@app.get("/auth/google")
async def google_start(next: str = "/dashboard"):
    if not (GOOGLE_ID and GOOGLE_SECRET):
        return RedirectResponse("/login?error=google_not_configured")
    state = sign({"n": secrets.token_hex(8), "next": safe_next(next), "exp": time.time() + 600})
    q = urllib.parse.urlencode({"client_id": GOOGLE_ID, "redirect_uri": f"{BASE_URL}/auth/google/callback",
                                "response_type": "code", "scope": "openid email profile", "state": state,
                                "prompt": "select_account"})
    return RedirectResponse(f"https://accounts.google.com/o/oauth2/v2/auth?{q}")


@app.get("/auth/google/callback")
async def google_cb(code: str = "", state: str = "", error: str = ""):
    st = unsign(state)
    if error or not code or not st:
        return RedirectResponse("/login?error=google_failed")
    try:
        data = urllib.parse.urlencode({"code": code, "client_id": GOOGLE_ID, "client_secret": GOOGLE_SECRET,
                                       "redirect_uri": f"{BASE_URL}/auth/google/callback",
                                       "grant_type": "authorization_code"}).encode()
        tok = json.load(urllib.request.urlopen(urllib.request.Request("https://oauth2.googleapis.com/token", data), timeout=15))
        req = urllib.request.Request("https://openidconnect.googleapis.com/v1/userinfo",
                                     headers={"Authorization": f"Bearer {tok['access_token']}"})
        info = json.load(urllib.request.urlopen(req, timeout=15))
    except Exception:
        return RedirectResponse("/login?error=google_failed")
    email = (info.get("email") or "").lower()
    if not email or not info.get("email_verified", True):
        return RedirectResponse("/login?error=google_failed")
    with _lock:
        db = read_db()
        u = find_user(db, email=email)
        now = time.strftime("%Y-%m-%d %H:%M:%S")
        if not u:
            u = {"id": secrets.token_hex(8), "name": info.get("name") or email.split("@")[0], "email": email,
                 "password_hash": None, "providers": ["google"], "avatar": info.get("picture"),
                 "created_at": now, "prefs": {}, "recent": []}
            db["users"].append(u)
        elif "google" not in u.get("providers", []):
            u.setdefault("providers", []).append("google")
            u["avatar"] = u.get("avatar") or info.get("picture")
        u["last_login"] = now
        write_db(db)
    return start_session(RedirectResponse(st["next"]), u["id"])


# ---------------------------------------------------------------- profile + launcher
@app.post("/api/profile")
async def profile(request: Request):
    u0 = current_user(request)
    if not u0: return err("Not signed in.", 401)
    d = await request.json()
    with _lock:
        db = read_db(); u = find_user(db, uid=u0["id"])
        if d.get("name"):
            if len(d["name"].strip()) < 2: return err("Name is too short.")
            u["name"] = d["name"].strip()
        if "prefs" in d and isinstance(d["prefs"], dict):
            u["prefs"] = {**u.get("prefs", {}), **{k: v for k, v in d["prefs"].items() if k in ("default_app", "theme")}}
        if d.get("new_password"):
            if u.get("password_hash") and not check_pw(d.get("current_password") or "", u["password_hash"]):
                return err("Current password is incorrect.", 401)
            npw = d["new_password"]
            if len(npw) < 8 or not re.search(r"\d", npw) or not re.search(r"[A-Za-z]", npw):
                return err("Password needs 8+ characters with letters and numbers.")
            u["password_hash"] = hash_pw(npw)
            if "password" not in u["providers"]: u["providers"].append("password")
        write_db(db)
    return {"ok": True, "user": public(u)}


@app.post("/api/account/delete")
async def delete_account(request: Request):
    u0 = current_user(request)
    if not u0: return err("Not signed in.", 401)
    with _lock:
        db = read_db(); db["users"] = [u for u in db["users"] if u["id"] != u0["id"]]; write_db(db)
    r = JSONResponse({"ok": True}); r.delete_cookie("qs_session"); return r


@app.post("/api/launch/{key}")
async def launched(key: str, request: Request):
    u0 = current_user(request)
    if not u0 or key not in APPS: return err("Not allowed.", 401)
    with _lock:
        db = read_db(); u = find_user(db, uid=u0["id"])
        rec = [r for r in u.get("recent", []) if r["app"] != key]
        u["recent"] = [{"app": key, "at": time.strftime("%Y-%m-%d %H:%M:%S")}] + rec
        write_db(db)
    return {"ok": True}


def port_open(url):
    p = urlparse(url)
    try:
        with socket.create_connection((p.hostname, p.port or 80), timeout=0.6):
            return True
    except OSError:
        return False


@app.get("/api/status")
async def status(request: Request):
    if not current_user(request): return err("Not signed in.", 401)
    return {k: port_open(v["url"]) for k, v in APPS.items()} | {
        "quantcopilot_api": port_open(os.getenv("QUANTCOPILOT_API_URL", "http://localhost:8000"))}


# ---------------------------------------------------------------- pages
S = BASE / "static"


def page(name):
    return FileResponse(S / name, headers={"Cache-Control": "no-store"})


@app.get("/")
async def home(): return page("index.html")


@app.get("/login")
async def login_page(request: Request, next: str = "/dashboard"):
    return RedirectResponse(safe_next(next)) if current_user(request) else page("login.html")


def protected(name):
    async def h(request: Request):
        if not current_user(request):
            return RedirectResponse(f"/login?next={urllib.parse.quote(request.url.path)}")
        return page(name)
    return h


app.get("/dashboard")(protected("dashboard.html"))
app.get("/profile")(protected("profile.html"))


@app.get("/workspace/{key}")
async def workspace(key: str, request: Request):
    if key not in APPS: return RedirectResponse("/dashboard")
    if not current_user(request): return RedirectResponse(f"/login?next=/workspace/{key}")
    return page("workspace.html")


app.mount("/static", StaticFiles(directory=S), name="static")

if __name__ == "__main__":
    import uvicorn
    print(f"\n  QuantSensei portal -> {BASE_URL}\n  Accounts file      -> {USERS_FILE}\n")
    uvicorn.run(app, host="0.0.0.0", port=PORT)
