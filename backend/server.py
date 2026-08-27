from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import re
import time
import uuid
import logging
from typing import Optional, List, Annotated
from datetime import datetime, timezone, timedelta

import bcrypt
import jwt
import httpx
import stripe
import requests as http_requests
from bson import ObjectId
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, UploadFile, File, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, BeforeValidator

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]
JWT_SECRET = os.environ["JWT_SECRET"]
LASTFM_API_KEY = os.environ.get("LASTFM_API_KEY", "")

PyObjectId = Annotated[str, BeforeValidator(str)]

http = httpx.AsyncClient(timeout=8.0)

app = FastAPI()
api_router = APIRouter(prefix="/api")

logger = logging.getLogger(__name__)


# ---------- Models ----------

class BaseDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    def to_mongo(self) -> dict:
        data = self.model_dump(by_alias=True, exclude={"id"})
        return data

    @classmethod
    def from_mongo(cls, doc: dict):
        doc = dict(doc)
        if "_id" in doc:
            doc["_id"] = str(doc["_id"])
        return cls(**doc)


class LinkItem(BaseModel):
    url: str
    label: Optional[str] = None
    clicks: int = 0


FREE_THEMES = {"light", "dark"}
ALL_THEMES = {"light", "dark", "moss", "ember", "dusk"}


class User(BaseDocument):
    username: str
    email: str
    password_hash: str
    display_name: str = ""
    bio: str = ""
    discord_id: Optional[str] = None
    lastfm_username: Optional[str] = None
    links: List[LinkItem] = []
    avatar_path: Optional[str] = None
    theme: str = "light"
    theme_pack: bool = False
    created_at: str = ""


def public_user(u: dict, owner: bool = False) -> dict:
    data = {
        "id": str(u["_id"]),
        "username": u["username"],
        "display_name": u.get("display_name", ""),
        "bio": u.get("bio", ""),
        "discord_id": u.get("discord_id"),
        "lastfm_username": u.get("lastfm_username"),
        "links": u.get("links", []),
        "avatar_url": f"/api/files/{u['avatar_path']}" if u.get("avatar_path") else None,
        "theme": u.get("theme", "light"),
        "theme_auto": u.get("theme_auto", False),
    }
    if owner:
        data["email"] = u.get("email")
        data["theme_pack"] = u.get("theme_pack", False)
        data["views"] = u.get("views", 0)
        data["referrers"] = sorted(u.get("referrers", []), key=lambda r: r.get("count", 0), reverse=True)[:6]
        by_day = u.get("views_by_day", {})
        today = datetime.now(timezone.utc).date()
        data["views_daily"] = [
            {"date": (today - timedelta(days=i)).isoformat(), "count": by_day.get((today - timedelta(days=i)).isoformat(), 0)}
            for i in range(13, -1, -1)
        ]
    return data


# ---------- Auth ----------

security = HTTPBearer(auto_error=False)


def make_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


async def current_user(creds: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not creds:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid or expired token")
    try:
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    except Exception:
        user = None
    if not user:
        raise HTTPException(401, "User not found")
    return user


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    return bcrypt.checkpw(pw.encode(), hashed.encode())


USERNAME_RE = re.compile(r"^[a-zA-Z0-9_]{3,20}$")


class RegisterBody(BaseModel):
    username: str
    email: str
    password: str


class LoginBody(BaseModel):
    identifier: str
    password: str


class ProfileUpdate(BaseModel):
    display_name: str = ""
    bio: str = ""
    discord_id: Optional[str] = None
    lastfm_username: Optional[str] = None
    links: List[LinkItem] = []
    theme: str = "light"
    theme_auto: bool = False


@api_router.post("/auth/register")
async def register(body: RegisterBody):
    username = body.username.strip().lower()
    email = body.email.strip().lower()
    if not USERNAME_RE.match(username):
        raise HTTPException(400, "Username must be 3-20 chars: letters, numbers, underscore")
    if "@" not in email:
        raise HTTPException(400, "Invalid email")
    if len(body.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    if await db.users.find_one({"username": username}):
        raise HTTPException(409, "That username is taken")
    if await db.users.find_one({"email": email}):
        raise HTTPException(409, "That email is already registered")
    doc = {
        "username": username,
        "email": email,
        "password_hash": hash_password(body.password),
        "display_name": username,
        "bio": "",
        "discord_id": None,
        "lastfm_username": None,
        "links": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    res = await db.users.insert_one(doc)
    doc["_id"] = res.inserted_id
    return {"token": make_token(str(res.inserted_id)), "user": public_user(doc, owner=True)}


@api_router.post("/auth/login")
async def login(body: LoginBody):
    ident = body.identifier.strip().lower()
    user = await db.users.find_one({"$or": [{"email": ident}, {"username": ident}]})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(401, "Wrong credentials")
    return {"token": make_token(str(user["_id"])), "user": public_user(user, owner=True)}


@api_router.get("/auth/me")
async def me(user: dict = Depends(current_user)):
    return public_user(user, owner=True)


@api_router.put("/auth/profile")
async def update_profile(body: ProfileUpdate, user: dict = Depends(current_user)):
    if len(body.display_name) > 60:
        raise HTTPException(400, "Display name too long")
    if len(body.bio) > 300:
        raise HTTPException(400, "Bio too long (300 chars max)")
    if body.discord_id and not re.fullmatch(r"\d{15,22}", body.discord_id):
        raise HTTPException(400, "Discord ID must be a 15-22 digit number")
    if body.lastfm_username and len(body.lastfm_username) > 64:
        raise HTTPException(400, "Last.fm username too long")
    if len(body.links) > 12:
        raise HTTPException(400, "Maximum 12 links")
    if body.theme not in ALL_THEMES:
        raise HTTPException(400, "Unknown theme")
    if body.theme not in FREE_THEMES and not user.get("theme_pack"):
        raise HTTPException(403, "That theme is part of the paid theme pack")
    for link in body.links:
        if not re.match(r"^https?://", link.url):
            raise HTTPException(400, f"Link must start with http:// or https:// : {link.url}")
        if link.label and len(link.label) > 40:
            raise HTTPException(400, "Link label too long")
    existing_clicks = {l.get("url"): l.get("clicks", 0) for l in user.get("links", [])}
    update = {
        "display_name": body.display_name.strip(),
        "bio": body.bio.strip(),
        "discord_id": body.discord_id.strip() if body.discord_id else None,
        "lastfm_username": body.lastfm_username.strip() if body.lastfm_username else None,
        "links": [{**l.model_dump(), "clicks": existing_clicks.get(l.url, 0)} for l in body.links],
        "theme": body.theme,
        "theme_auto": body.theme_auto,
    }
    await db.users.update_one({"_id": user["_id"]}, {"$set": update})
    fresh = await db.users.find_one({"_id": user["_id"]})
    return public_user(fresh, owner=True)


@api_router.get("/username-check/{username}")
async def username_check(username: str):
    username = username.strip().lower()
    valid = bool(USERNAME_RE.match(username))
    taken = bool(await db.users.find_one({"username": username})) if valid else False
    return {"valid": valid, "available": valid and not taken}


@api_router.get("/profile/{username}")
async def get_profile(username: str):
    user = await db.users.find_one({"username": username.strip().lower()})
    if not user:
        raise HTTPException(404, "Profile not found")
    return public_user(user)


@api_router.get("/leaderboard")
async def leaderboard():
    cursor = db.users.find({"views": {"$gt": 0}}).sort("views", -1).limit(10)
    leaders = []
    async for u in cursor:
        leaders.append({
            "username": u["username"],
            "display_name": u.get("display_name") or u["username"],
            "views": u.get("views", 0),
            "avatar_url": f"/api/files/{u['avatar_path']}" if u.get("avatar_path") else None,
        })
    return {"leaders": leaders}


# ---------- Discord lookup (public proxy, cached) ----------

def pick(u: dict, *keys):
    for k in keys:
        if u.get(k):
            return u[k]
    return None


@api_router.get("/discord/{discord_id}")
async def discord_lookup(discord_id: str):
    if not re.fullmatch(r"\d{15,22}", discord_id):
        raise HTTPException(400, "Invalid Discord ID")
    cached = await db.discord_cache.find_one({"_id": discord_id})
    if cached and time.time() - cached.get("fetched_at", 0) < 900:
        return cached["data"]
    try:
        resp = await http.get(f"https://japi.rest/discord/v1/user/{discord_id}")
        payload = resp.json()
    except Exception:
        raise HTTPException(502, "Discord lookup is unavailable right now")
    u = payload.get("data") or {}
    username = pick(u, "username")
    if not username:
        raise HTTPException(404, "Discord user not found — check the ID")
    data = {
        "id": discord_id,
        "username": username,
        "global_name": pick(u, "global_name", "globalName"),
        "avatar_url": pick(u, "avatarURL", "avatar_url"),
        "banner_url": pick(u, "bannerURL", "banner_url"),
        "accent_color": pick(u, "accent_color", "accentColor"),
    }
    await db.discord_cache.update_one(
        {"_id": discord_id},
        {"$set": {"data": data, "fetched_at": time.time()}},
        upsert=True,
    )
    return data


# ---------- Last.fm proxy ----------

_lastfm_cache = {}
LASTFM_CACHE_TTL = 30


def lfm_image(images, preferred="extralarge"):
    if not isinstance(images, list):
        return None
    by_size = {i.get("size"): i.get("#text") for i in images if isinstance(i, dict)}
    for size in (preferred, "large", "medium", "small"):
        if by_size.get(size):
            return by_size[size]
    return None


def normalize_track(t: dict) -> dict:
    artist = t.get("artist") or {}
    album = t.get("album") or {}
    attr = t.get("@attr") or {}
    return {
        "name": t.get("name", ""),
        "artist": artist.get("#text", "") if isinstance(artist, dict) else str(artist),
        "album": album.get("#text", "") if isinstance(album, dict) else str(album),
        "url": t.get("url"),
        "image_url": lfm_image(t.get("image")),
        "now_playing": str(attr.get("nowplaying", "")).lower() == "true",
        "played_at": (t.get("date") or {}).get("uts"),
    }


@api_router.get("/lastfm/{username}/recent")
async def lastfm_recent(username: str, limit: int = 10):
    username = username.strip()
    if not username or len(username) > 64:
        raise HTTPException(400, "Invalid Last.fm username")
    limit = max(1, min(limit, 20))
    cache_key = f"{username}:{limit}"
    hit = _lastfm_cache.get(cache_key)
    if hit and time.time() - hit["at"] < LASTFM_CACHE_TTL:
        return hit["data"]
    if not LASTFM_API_KEY:
        raise HTTPException(503, "Last.fm is not configured")
    try:
        resp = await http.get(
            "https://ws.audioscrobbler.com/2.0/",
            params={
                "method": "user.getrecenttracks",
                "user": username,
                "api_key": LASTFM_API_KEY,
                "format": "json",
                "limit": limit,
            },
        )
        payload = resp.json()
    except Exception:
        raise HTTPException(502, "Last.fm is unavailable right now")
    if "error" in payload:
        status = 404 if payload.get("error") == 6 else 502
        raise HTTPException(status, "Last.fm user not found" if status == 404 else "Last.fm request failed")
    block = payload.get("recenttracks") or {}
    raw = block.get("track", [])
    if isinstance(raw, dict):
        raw = [raw]
    tracks = [normalize_track(t) for t in raw if isinstance(t, dict)]
    now_playing = next((t for t in tracks if t["now_playing"]), None)
    result = {"user": username, "now_playing": now_playing, "tracks": tracks}
    _lastfm_cache[cache_key] = {"at": time.time(), "data": result}
    return result


# ---------- Lanyard live presence ----------

_lanyard_cache = {}

@api_router.get("/lanyard/{discord_id}")
async def lanyard_lookup(discord_id: str):
    if not re.fullmatch(r"\d{15,22}", discord_id):
        raise HTTPException(400, "Invalid Discord ID")
    hit = _lanyard_cache.get(discord_id)
    if hit and time.time() - hit["at"] < 15:
        return hit["data"]
    try:
        resp = await http.get(f"https://api.lanyard.rest/v1/users/{discord_id}")
        payload = resp.json()
    except Exception:
        return {"monitored": False}
    if not payload.get("success"):
        return {"monitored": False}
    d = payload.get("data") or {}
    status = d.get("discord_status", "offline")
    activity_text = None
    spotify = None
    if d.get("listening_to_spotify") and d.get("spotify"):
        sp = d["spotify"]
        spotify = {"song": sp.get("song"), "artist": sp.get("artist"), "album_art": sp.get("album_art_url")}
        activity_text = f"Listening to {sp.get('song')} — {sp.get('artist')}"
    else:
        acts = [a for a in (d.get("activities") or []) if a.get("type") != 4]
        if acts:
            a = acts[0]
            verbs = {0: "Playing", 1: "Streaming", 2: "Listening to", 3: "Watching", 5: "Competing in"}
            activity_text = f"{verbs.get(a.get('type'), 'Using')} {a.get('name')}"
    data = {"monitored": True, "status": status, "activity": activity_text, "spotify": spotify}
    _lanyard_cache[discord_id] = {"at": time.time(), "data": data}
    return data


# ---------- Page view tracking ----------

class ViewBody(BaseModel):
    referrer: str = ""

@api_router.post("/profile/{username}/view")
async def track_view(username: str, body: ViewBody):
    username = username.strip().lower()
    if not await db.users.find_one({"username": username}):
        raise HTTPException(404, "Profile not found")
    today = datetime.now(timezone.utc).date().isoformat()
    await db.users.update_one({"username": username}, {"$inc": {"views": 1, f"views_by_day.{today}": 1}})
    host = ""
    if body.referrer:
        try:
            from urllib.parse import urlparse
            host = (urlparse(body.referrer).hostname or "").replace("www.", "")
        except Exception:
            host = ""
    if host and "emergentagent.com" not in host:
        res = await db.users.update_one(
            {"username": username, "referrers.host": host},
            {"$inc": {"referrers.$.count": 1}},
        )
        if res.matched_count == 0:
            await db.users.update_one(
                {"username": username},
                {"$push": {"referrers": {"host": host, "count": 1}}},
            )
    return {"ok": True}


# ---------- Link click tracking ----------

class ClickBody(BaseModel):
    url: str

@api_router.post("/profile/{username}/click")
async def track_click(username: str, body: ClickBody):
    res = await db.users.update_one(
        {"username": username.strip().lower(), "links.url": body.url},
        {"$inc": {"links.$.clicks": 1}},
    )
    if res.matched_count == 0:
        raise HTTPException(404, "Link not found")
    return {"ok": True}


# ---------- Avatar upload & file serving ----------

STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
_storage_key = None

def init_storage(force: bool = False):
    global _storage_key
    if _storage_key and not force:
        return _storage_key
    resp = http_requests.post(
        f"{STORAGE_URL}/init",
        json={"emergent_key": os.environ.get("EMERGENT_LLM_KEY")},
        timeout=30,
    )
    resp.raise_for_status()
    _storage_key = resp.json()["storage_key"]
    return _storage_key

ALLOWED_IMAGE = {"image/jpeg", "image/png", "image/webp", "image/gif"}

@api_router.post("/auth/avatar")
async def upload_avatar(file: UploadFile = File(...), user: dict = Depends(current_user)):
    if file.content_type not in ALLOWED_IMAGE:
        raise HTTPException(400, "Only JPG, PNG, WebP or GIF images")
    data = await file.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(400, "Image must be under 5MB")
    ext = (file.filename or "img.png").split(".")[-1].lower()
    if ext not in ("jpg", "jpeg", "png", "webp", "gif"):
        ext = "png"
    path = f"sanctuary/avatars/{user['_id']}/{uuid.uuid4()}.{ext}"
    try:
        key = init_storage()
        resp = http_requests.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key, "Content-Type": file.content_type},
            data=data,
            timeout=120,
        )
        resp.raise_for_status()
        stored_path = resp.json()["path"]
    except Exception:
        raise HTTPException(502, "Upload failed — try again")
    if user.get("avatar_path"):
        await db.files.update_one({"storage_path": user["avatar_path"]}, {"$set": {"is_deleted": True}})
    await db.files.insert_one({
        "id": str(uuid.uuid4()),
        "storage_path": stored_path,
        "original_filename": file.filename,
        "content_type": file.content_type,
        "user_id": str(user["_id"]),
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"avatar_path": stored_path}})
    fresh = await db.users.find_one({"_id": user["_id"]})
    return public_user(fresh, owner=True)

@api_router.delete("/auth/avatar")
async def delete_avatar(user: dict = Depends(current_user)):
    if user.get("avatar_path"):
        await db.files.update_one({"storage_path": user["avatar_path"]}, {"$set": {"is_deleted": True}})
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"avatar_path": None}})
    fresh = await db.users.find_one({"_id": user["_id"]})
    return public_user(fresh, owner=True)

@api_router.get("/files/{path:path}")
async def serve_file(path: str):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        raise HTTPException(404, "File not found")
    try:
        key = init_storage()
        resp = http_requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
        resp.raise_for_status()
    except Exception:
        raise HTTPException(404, "File not found")
    return Response(content=resp.content, media_type=record.get("content_type", "application/octet-stream"))


# ---------- Payments (Stripe) ----------

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY") or "sk_test_emergent"
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")

class CheckoutBody(BaseModel):
    lookup_key: str
    origin_url: str

@api_router.post("/payments/checkout")
async def create_checkout(body: CheckoutBody, user: dict = Depends(current_user)):
    if body.lookup_key != "theme_pack":
        raise HTTPException(400, "Unknown product")
    if user.get("theme_pack"):
        raise HTTPException(409, "Theme pack already unlocked")
    prices = stripe.Price.list(lookup_keys=[body.lookup_key], active=True, limit=1).data
    if not prices:
        raise HTTPException(500, "Price not found")
    price = prices[0]
    kwargs = dict(
        line_items=[{"price": price.id, "quantity": 1}],
        mode="payment",
        success_url=f"{body.origin_url}/settings?billing=success&session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{body.origin_url}/settings?billing=cancel",
        metadata={"user_id": str(user["_id"]), "lookup_key": body.lookup_key},
    )
    try:
        session = stripe.checkout.Session.create(**kwargs, managed_payments={"enabled": True})
    except stripe.error.InvalidRequestError as e:
        msg = (e.user_message or "").lower()
        if "managed payments" in msg or "ineligible" in msg:
            session = stripe.checkout.Session.create(
                **kwargs, automatic_tax={"enabled": True}, billing_address_collection="required"
            )
        else:
            raise
    await db.payment_transactions.insert_one({
        "session_id": session.id,
        "user_id": str(user["_id"]),
        "lookup_key": body.lookup_key,
        "amount": (price.unit_amount or 0) / 100.0,
        "currency": price.currency,
        "status": "initiated",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"checkout_url": session.url, "session_id": session.id}

async def grant_purchase(session_id: str):
    tx = await db.payment_transactions.find_one({"session_id": session_id})
    if tx and tx.get("lookup_key") == "theme_pack" and tx.get("user_id"):
        await db.users.update_one({"_id": ObjectId(tx["user_id"])}, {"$set": {"theme_pack": True}})

@api_router.get("/payments/status/{session_id}")
async def payment_status(session_id: str):
    record = await db.payment_transactions.find_one({"session_id": session_id})
    if not record:
        raise HTTPException(404, "Transaction not found")
    if record.get("payment_status") != "paid":
        try:
            s = stripe.checkout.Session.retrieve(session_id)
            if s.payment_status == "paid" or s.status == "complete":
                res = await db.payment_transactions.update_one(
                    {"session_id": session_id, "payment_status": {"$ne": "paid"}},
                    {"$set": {"status": "completed", "payment_status": "paid",
                              "updated_at": datetime.now(timezone.utc).isoformat()}},
                )
                if res.modified_count:
                    await grant_purchase(session_id)
                record = await db.payment_transactions.find_one({"session_id": session_id})
        except stripe.error.StripeError:
            pass
    return {"session_id": record["session_id"], "status": record["status"], "payment_status": record["payment_status"]}

@api_router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
    except stripe.error.SignatureVerificationError:
        raise HTTPException(400, "Invalid signature")
    obj, t = event["data"]["object"], event["type"]
    if t in ("checkout.session.completed", "checkout.session.async_payment_succeeded"):
        res = await db.payment_transactions.update_one(
            {"session_id": obj["id"], "payment_status": {"$ne": "paid"}},
            {"$set": {"status": "completed", "payment_status": "paid",
                      "updated_at": datetime.now(timezone.utc).isoformat()}},
        )
        if res.modified_count:
            await grant_purchase(obj["id"])
    elif t == "checkout.session.async_payment_failed":
        await db.payment_transactions.update_one(
            {"session_id": obj["id"]},
            {"$set": {"status": "failed", "payment_status": "failed",
                      "updated_at": datetime.now(timezone.utc).isoformat()}},
        )
    elif t == "checkout.session.expired":
        await db.payment_transactions.update_one(
            {"session_id": obj["id"]},
            {"$set": {"status": "expired", "payment_status": "expired",
                      "updated_at": datetime.now(timezone.utc).isoformat()}},
        )
    return {"status": "ok"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await db.users.create_index("username", unique=True)
    await db.users.create_index("email", unique=True)
    try:
        init_storage()
        logger.info("Object storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")


@app.on_event("shutdown")
async def shutdown():
    await http.aclose()
    client.close()
