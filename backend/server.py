from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import re
import time
import logging
from typing import Optional, List, Annotated
from datetime import datetime, timezone, timedelta

import bcrypt
import jwt
import httpx
from bson import ObjectId
from fastapi import FastAPI, APIRouter, HTTPException, Depends
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


class User(BaseDocument):
    username: str
    email: str
    password_hash: str
    display_name: str = ""
    bio: str = ""
    discord_id: Optional[str] = None
    lastfm_username: Optional[str] = None
    links: List[LinkItem] = []
    created_at: str = ""


def public_user(u: dict) -> dict:
    return {
        "id": str(u["_id"]),
        "username": u["username"],
        "display_name": u.get("display_name", ""),
        "bio": u.get("bio", ""),
        "discord_id": u.get("discord_id"),
        "lastfm_username": u.get("lastfm_username"),
        "links": u.get("links", []),
    }


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
    return {"token": make_token(str(res.inserted_id)), "user": public_user(doc)}


@api_router.post("/auth/login")
async def login(body: LoginBody):
    ident = body.identifier.strip().lower()
    user = await db.users.find_one({"$or": [{"email": ident}, {"username": ident}]})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(401, "Wrong credentials")
    return {"token": make_token(str(user["_id"])), "user": public_user(user)}


@api_router.get("/auth/me")
async def me(user: dict = Depends(current_user)):
    return public_user(user)


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
    for link in body.links:
        if not re.match(r"^https?://", link.url):
            raise HTTPException(400, f"Link must start with http:// or https:// : {link.url}")
        if link.label and len(link.label) > 40:
            raise HTTPException(400, "Link label too long")
    update = {
        "display_name": body.display_name.strip(),
        "bio": body.bio.strip(),
        "discord_id": body.discord_id.strip() if body.discord_id else None,
        "lastfm_username": body.lastfm_username.strip() if body.lastfm_username else None,
        "links": [l.model_dump() for l in body.links],
    }
    await db.users.update_one({"_id": user["_id"]}, {"$set": update})
    fresh = await db.users.find_one({"_id": user["_id"]})
    return public_user(fresh)


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


@app.on_event("shutdown")
async def shutdown():
    await http.aclose()
    client.close()
