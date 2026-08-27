import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutGrid, Palette, Link2, Plug, Gem, Eye, Search, Copy, LogOut, ExternalLink,
  Share2, Plus, Trash2, ArrowUp, ArrowDown, ImagePlus, Lock, Check, MousePointerClick,
  Sun, Moon, ChevronRight, User, MessageSquare, AudioLines, Sparkles, Youtube, Twitch,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { api, errMsg } from "../lib/api";
import { ease } from "../components/motion";
import { Favicon } from "../components/FaviconImg";
import { DiscordCard } from "../components/DiscordCard";
import { LastfmCard } from "../components/LastfmCard";
import { prettyLabel, getDomain } from "../lib/favicon";
import { THEMES, THEME_PACK_PRICE } from "../lib/themes";
import { Switch } from "../components/ui/switch";
import { RolePills } from "../components/RolePills";

function Sparkline({ data }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map((d) => d.count), 1);
  const w = 240;
  const h = 40;
  const pts = data.map((d, i) => `${(i / (data.length - 1 || 1)) * w},${h - (d.count / max) * (h - 6) - 3}`).join(" ");
  return (
    <svg data-testid="views-sparkline" viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ThemePreview({ id, locked }) {
  return (
    <div data-theme={id} className="relative h-24 overflow-hidden rounded-xl border border-border bg-background p-2.5">
      <div className="mx-auto mb-1.5 h-4 w-4 rounded-full border border-border bg-secondary" />
      <div className="mx-auto mb-1 h-1.5 w-10 rounded-full bg-foreground/70" />
      <div className="mx-auto mb-2 h-1 w-8 rounded-full bg-muted-foreground/50" />
      <div className="mb-1 h-3 rounded-md border border-border tint-discord" />
      <div className="h-3 rounded-md border border-border bg-card" />
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
          <Lock size={15} className="text-foreground/70" />
        </div>
      )}
    </div>
  );
}

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "customize", label: "Customize", icon: Palette },
  { id: "links", label: "Links", icon: Link2 },
  { id: "connections", label: "Connections", icon: Plug },
  { id: "premium", label: "Premium", icon: Gem },
];

const field = "w-full rounded-xl border border-input bg-secondary px-4 py-3 text-sm outline-none transition-colors focus:border-[#8B5CF6]";
const label = "mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground";

export default function Dashboard() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [tab, setTab] = useState(params.get("tab") || "overview");
  const [query, setQuery] = useState("");
  const searchInput = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInput.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const [displayName, setDisplayName] = useState(user.display_name || "");
  const [bio, setBio] = useState(user.bio || "");
  const [discordId, setDiscordId] = useState(user.discord_id || "");
  const [lastfmUser, setLastfmUser] = useState(user.lastfm_username || "");
  const [links, setLinks] = useState(user.links || []);
  const [newUrl, setNewUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState(user.theme || "light");
  const [themeAuto, setThemeAuto] = useState(user.theme_auto || false);
  const [unlocking, setUnlocking] = useState(false);
  const avatarInput = useRef(null);
  const [discordPreview, setDiscordPreview] = useState({ loading: false, data: null, error: null });
  const [lastfmPreview, setLastfmPreview] = useState({ loading: false, data: null, error: null });
  const [youtubeInput, setYoutubeInput] = useState(user.youtube_input || "");
  const [twitchChannel, setTwitchChannel] = useState(user.twitch_channel || "");
  const [pinnedTrack, setPinnedTrack] = useState(user.pinned_track || "");
  const [favoriteTrack, setFavoriteTrack] = useState(user.favorite_track || "");
  const [newUsername, setNewUsername] = useState(user.username);
  const [unameStatus, setUnameStatus] = useState(null);

  useEffect(() => {
    const name = newUsername.trim().toLowerCase();
    if (!name || name === user.username) {
      setUnameStatus(null);
      return;
    }
    if (!/^[a-z0-9_]{3,20}$/.test(name)) {
      setUnameStatus("invalid");
      return;
    }
    setUnameStatus("checking");
    const t = setTimeout(async () => {
      try {
        const r = await api.get(`/username-check/${name}`);
        setUnameStatus(r.data.available ? "available" : "taken");
      } catch {
        setUnameStatus(null);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [newUsername, user.username]);

  const saveUsername = async () => {
    try {
      const r = await api.put("/auth/username", { username: newUsername });
      setUser(r.data);
      toast.success("Username changed — your page moved with you");
    } catch (e) {
      toast.error(errMsg(e, "username unavailable"));
    }
  };

  const pageUrl = `${window.location.origin}/${user.username}`;
  const lastChange = user.username_changed_at ? new Date(user.username_changed_at) : null;
  const nextChange = lastChange ? new Date(lastChange.getTime() + 30 * 24 * 3600 * 1000) : null;
  const isOwner = (user.roles || []).some((r) => r.id === "owner");
  const coolingDown = !!(nextChange && nextChange > new Date() && !isOwner);

  useEffect(() => {
    const sessionId = params.get("session_id");
    if (params.get("billing") === "cancel") {
      toast.error("Checkout cancelled — no charge");
      setParams({}, { replace: true });
      return;
    }
    if (params.get("billing") !== "success" || !sessionId) return;
    setTab("premium");
    let tries = 0;
    const poll = setInterval(async () => {
      tries += 1;
      try {
        const r = await api.get(`/payments/status/${sessionId}`);
        if (r.data.payment_status === "paid") {
          clearInterval(poll);
          const meRes = await api.get("/auth/me");
          setUser(meRes.data);
          toast.success("Premium unlocked — enjoy every theme");
          setParams({}, { replace: true });
        }
      } catch { /* keep polling */ }
      if (tries > 12) {
        clearInterval(poll);
        toast("Still confirming your payment — it will appear shortly");
        setParams({}, { replace: true });
      }
    }, 2000);
    return () => clearInterval(poll);
  }, [params, setParams, setUser]);

  const payload = (over = {}) => ({
    display_name: displayName,
    bio,
    discord_id: discordId.trim() || null,
    lastfm_username: lastfmUser.trim() || null,
    links,
    theme,
    theme_auto: themeAuto,
    youtube_input: youtubeInput.trim() || null,
    twitch_channel: twitchChannel.trim() || null,
    pinned_track: pinnedTrack.trim() || null,
    favorite_track: favoriteTrack.trim() || null,
    ...over,
  });

  const save = async (over = {}, msg = "Saved — your page is updated") => {
    setSaving(true);
    try {
      const r = await api.put("/auth/profile", payload(over));
      setUser(r.data);
      toast.success(msg);
    } catch (e) {
      toast.error(errMsg(e, "Could not save"));
    } finally {
      setSaving(false);
    }
  };

  const applyTheme = (t) => { setTheme(t); save({ theme: t }, t === "dark" ? "Switched to dark mode" : t === "light" ? "Switched to light mode" : "Theme applied"); };
  const toggleAuto = (val) => { setThemeAuto(val); save({ theme_auto: val }, val ? "Auto day/night on" : "Auto day/night off"); };

  const addLink = () => {
    const domain = getDomain(newUrl);
    if (!domain) { toast.error("That doesn't look like a valid link"); return; }
    const url = /^https?:\/\//i.test(newUrl) ? newUrl : `https://${newUrl}`;
    if (links.length >= 12) { toast.error("Maximum 12 links"); return; }
    setLinks([...links, { url, label: prettyLabel(url) }]);
    setNewUrl("");
  };

  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= links.length) return;
    const next = [...links];
    [next[i], next[j]] = [next[j], next[i]];
    setLinks(next);
  };

  const testDiscord = async () => {
    setDiscordPreview({ loading: true, data: null, error: null });
    try {
      const r = await api.get(`/discord/${discordId.trim()}`);
      setDiscordPreview({ loading: false, data: r.data, error: null });
    } catch (e) {
      setDiscordPreview({ loading: false, data: null, error: errMsg(e, "Lookup failed") });
    }
  };

  const testLastfm = async () => {
    setLastfmPreview({ loading: true, data: null, error: null });
    try {
      const r = await api.get(`/lastfm/${encodeURIComponent(lastfmUser.trim())}/recent?limit=5`);
      setLastfmPreview({ loading: false, data: r.data, error: null });
    } catch (e) {
      setLastfmPreview({ loading: false, data: null, error: errMsg(e, "Lookup failed") });
    }
  };

  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    try {
      const r = await api.post("/auth/avatar", form);
      setUser(r.data);
      toast.success("Profile photo updated");
    } catch (err) {
      toast.error(errMsg(err, "Upload failed"));
    } finally {
      e.target.value = "";
    }
  };

  const removeAvatar = async () => {
    try {
      const r = await api.delete("/auth/avatar");
      setUser(r.data);
      toast.success("Photo removed");
    } catch {
      toast.error("Could not remove photo");
    }
  };

  const songInput = useRef(null);

  const uploadSong = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    try {
      const r = await api.post("/auth/song", form);
      setUser(r.data);
      toast.success("Custom audio uploaded — the full song plays on your page");
    } catch (err) {
      toast.error(errMsg(err, "Upload failed"));
    } finally {
      e.target.value = "";
    }
  };

  const removeSong = async () => {
    try {
      const r = await api.delete("/auth/song");
      setUser(r.data);
      toast.success("Custom audio removed — back to the preview");
    } catch {
      toast.error("Could not remove audio");
    }
  };

  const unlockThemes = async () => {
    setUnlocking(true);
    try {
      const r = await api.post("/payments/checkout", { lookup_key: "theme_pack", origin_url: window.location.origin });
      window.location.href = r.data.checkout_url;
    } catch (err) {
      toast.error(errMsg(err, "Could not start checkout"));
      setUnlocking(false);
    }
  };

  const weekViews = (user.views_daily || []).slice(-7).reduce((s, d) => s + d.count, 0);
  const totalTaps = links.reduce((s, l) => s + (l.clicks || 0), 0);
  const checklist = [
    { label: "Upload a profile photo", done: !!user.avatar_url, tab: "customize", icon: User },
    { label: "Write a bio", done: !!bio.trim(), tab: "customize", icon: Sparkles },
    { label: "Link your Discord", done: !!discordId.trim(), tab: "connections", icon: MessageSquare },
    { label: "Connect Last.fm", done: !!lastfmUser.trim(), tab: "connections", icon: AudioLines },
    { label: "Add 3+ social links", done: links.length >= 3, tab: "links", icon: Link2 },
    { label: "Reach 10 page views", done: (user.views || 0) >= 10, tab: "overview", icon: Eye },
  ];
  const doneCount = checklist.filter((c) => c.done).length;
  const pct = Math.round((doneCount / checklist.length) * 100);

  const visibleTabs = TABS.filter((t) => t.label.toLowerCase().includes(query.toLowerCase()));

  const Card = ({ title, value, sub, icon: Icon, testid }) => (
    <div data-testid={testid} className="rounded-2xl border border-white/10 bg-[#1c1130]/80 p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-white/50">{title}</span>
        <Icon size={16} className="text-[#A78BFA]" />
      </div>
      <p className="font-display text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-white/40">{sub}</p>
    </div>
  );

  const SaveBtn = ({ testid = "save-settings-button" }) => (
    <button data-testid={testid} onClick={() => save()} disabled={saving} className="w-full rounded-2xl bg-[#8B5CF6] py-3.5 text-sm font-semibold text-white shadow-[0_0_28px_rgba(139,92,246,0.35)] transition-colors hover:bg-[#7C4DEF] disabled:opacity-50">
      {saving ? "saving…" : "save changes"}
    </button>
  );

  return (
    <div data-testid="settings-page" data-theme="dusk" className="flex min-h-screen bg-[#0d0714] text-white">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/10 bg-[#120a1e] p-5 md:flex">
        <Link to="/" data-testid="dash-brand" className="mb-6 flex items-center gap-2 px-2 font-display text-lg font-bold">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#8B5CF6]/20 text-[#A78BFA]"><Eye size={15} /></span>
          dontblink
        </Link>
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
          <Search size={14} className="text-white/40" />
          <input
            ref={searchInput}
            data-testid="dash-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sections…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-white/30"
          />
          <kbd className="rounded border border-white/10 px-1.5 text-[10px] text-white/30">⌘K</kbd>
        </div>
        <nav data-testid="dash-nav" className="flex-1 space-y-1">
          {visibleTabs.map((t) => (
            <button
              key={t.id}
              data-testid={`dash-tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors ${tab === t.id ? "bg-[#8B5CF6]/20 font-medium text-[#C4B5FD]" : "text-white/55 hover:bg-white/5 hover:text-white"}`}
            >
              <t.icon size={16} /> {t.label}
              {t.id === "premium" && !user.theme_pack && <span className="ml-auto rounded-full bg-[#8B5CF6]/20 px-2 py-0.5 text-[9px] font-semibold text-[#A78BFA]">{THEME_PACK_PRICE}</span>}
            </button>
          ))}
          {!visibleTabs.length && <p className="px-3 py-2 text-xs text-white/30">no sections match</p>}
        </nav>
        <div className="space-y-2 border-t border-white/10 pt-4">
          <p className="px-1 text-xs text-white/40">Check out your page</p>
          <Link data-testid="view-page-btn" to={`/${user.username}`} className="flex items-center gap-2 rounded-xl border border-[#8B5CF6]/40 bg-[#8B5CF6]/15 px-3.5 py-2.5 text-sm text-[#C4B5FD] transition-colors hover:bg-[#8B5CF6]/25">
            <ExternalLink size={14} /> my page
          </Link>
          <button
            data-testid="share-profile-btn"
            onClick={() => { navigator.clipboard.writeText(pageUrl); toast.success("Page link copied — share it anywhere"); }}
            className="flex w-full items-center gap-2 rounded-xl bg-[#8B5CF6] px-3.5 py-2.5 text-sm font-medium text-white shadow-[0_0_20px_rgba(139,92,246,0.35)] transition-colors hover:bg-[#7C4DEF]"
          >
            <Share2 size={14} /> share your profile
          </button>
          <button data-testid="logout-btn" onClick={() => { logout(); navigate("/"); }} className="flex w-full items-center gap-2 rounded-xl px-3.5 py-2 text-sm text-white/40 transition-colors hover:text-white">
            <LogOut size={14} /> log out
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col md:pl-64">
        <div className="sticky top-0 z-30 flex items-center gap-2 overflow-x-auto border-b border-white/10 bg-[#0d0714]/90 px-4 py-3 backdrop-blur md:hidden">
          <Link to="/" className="mr-2 font-display font-bold">dontblink</Link>
          {TABS.map((t) => (
            <button key={t.id} data-testid={`dash-tab-mobile-${t.id}`} onClick={() => setTab(t.id)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs ${tab === t.id ? "bg-[#8B5CF6]/25 text-[#C4B5FD]" : "text-white/50"}`}>
              {t.label}
            </button>
          ))}
        </div>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-8">
          <motion.div key={tab} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
            {tab === "overview" && (
              <div className="space-y-6">
                <h1 className="font-display text-2xl font-bold">Account overview</h1>
                {user.roles?.length > 0 && (
                  <div className="-mt-3 flex items-center gap-2">
                    <span className="text-xs text-white/40">your roles</span>
                    <RolePills roles={user.roles} />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <Card testid="card-username" title="Username" value={`@${user.username}`} sub={`UID #${(user.uid || 0).toLocaleString()} · unchangeable`} icon={User} />
                  <Card testid="card-views" title="Profile views" value={(user.views || 0).toLocaleString()} sub={`+${weekViews} in the last 7 days`} icon={Eye} />
                  <Card testid="card-taps" title="Link taps" value={totalTaps.toLocaleString()} sub="across all socials" icon={MousePointerClick} />
                  <Card testid="card-premium" title="Premium" value={user.theme_pack ? "unlocked" : "free"} sub={user.theme_pack ? "every theme, forever" : "one-time upgrade available"} icon={Gem} />
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
                  <div className="rounded-2xl border border-white/10 bg-[#1c1130]/60 p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="font-display text-lg font-bold">Profile completion</h2>
                      <span data-testid="completion-pct" className="text-xs text-white/40">{pct}% complete</span>
                    </div>
                    <div className="mb-5 h-2 overflow-hidden rounded-full bg-white/10">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, ease }} className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#C4B5FD]" />
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {checklist.map((c, i) => (
                        <button
                          key={c.label}
                          data-testid={`checklist-item-${i}`}
                          onClick={() => setTab(c.tab)}
                          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${c.done ? "border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-white/70" : "border-white/10 bg-white/5 text-white/80 hover:border-[#8B5CF6]/40"}`}
                        >
                          {c.done ? <Check size={15} className="shrink-0 text-[#A78BFA]" /> : <c.icon size={15} className="shrink-0 text-white/40" />}
                          <span className="flex-1">{c.label}</span>
                          {!c.done && <ChevronRight size={14} className="text-white/30" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-[#1c1130]/60 p-6">
                      <h2 className="mb-4 font-display text-lg font-bold">Quick actions</h2>
                      <div className="space-y-2">
                        {[
                          { label: "Change display name", tab: "customize", testid: "quick-display-name" },
                          { label: "Link Discord account", tab: "connections", testid: "quick-discord" },
                          { label: "Add socials", tab: "links", testid: "quick-socials" },
                          { label: "Change page theme", tab: "customize", testid: "quick-theme" },
                        ].map((a) => (
                          <button key={a.label} data-testid={a.testid} onClick={() => setTab(a.tab)} className="flex w-full items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-sm text-white/75 transition-colors hover:bg-white/10 hover:text-white">
                            {a.label} <ChevronRight size={14} className="text-white/30" />
                          </button>
                        ))}
                      </div>
                    </div>
                    <button data-testid="copy-page-url-btn" onClick={() => { navigator.clipboard.writeText(pageUrl); toast.success("Page link copied"); }} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm text-white/70 transition-colors hover:text-white">
                      <Copy size={14} /> {window.location.host}/{user.username}
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#1c1130]/60 p-6">
                  <div className="mb-4 flex items-baseline justify-between">
                    <h2 className="font-display text-lg font-bold">Account analytics</h2>
                    <span className="text-[10px] uppercase tracking-[0.16em] text-white/30">last 14 days</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span data-testid="stats-total-views" className="font-display text-4xl font-bold">{user.views || 0}</span>
                    <span className="text-sm text-white/40">page visits</span>
                  </div>
                  <div className="mt-4"><Sparkline data={user.views_daily} /></div>
                  <button
                    data-testid="digest-test-btn"
                    onClick={async () => {
                      try {
                        const r = await api.post("/auth/digest-test");
                        toast.success(`Weekly digest sent to ${r.data.sent_to}`);
                      } catch (e) {
                        toast.error(errMsg(e, "Could not send digest"));
                      }
                    }}
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/60 transition-colors hover:border-[#8B5CF6]/40 hover:text-white"
                  >
                    email me this week's digest now
                  </button>
                  {user.referrers?.length > 0 && (
                    <ul data-testid="stats-referrers" className="mt-5 grid gap-2 sm:grid-cols-2">
                      {user.referrers.map((r, i) => (
                        <li key={r.host} data-testid={`stats-referrer-${i}`} className="flex items-center gap-2.5 rounded-xl bg-white/5 px-3.5 py-2.5 text-sm">
                          <Favicon url={`https://${r.host}`} size={14} />
                          <span className="flex-1 truncate text-white/70">{r.host}</span>
                          <span className="text-white/40">{r.count}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {tab === "customize" && (
              <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
                <div className="space-y-6">
                  <h1 className="font-display text-2xl font-bold">Customize</h1>
                  <section className="rounded-2xl border border-white/10 bg-[#1c1130]/60 p-6">
                    <h2 className="mb-1 font-display text-lg font-bold">Username</h2>
                    <p className="mb-4 text-xs text-white/40">This moves your whole page — dontblink.site/<span className="text-[#A78BFA]">you</span></p>
                    <div className="flex gap-2">
                      <div className={`${field} flex items-center gap-2`}>
                        <span className="font-mono text-sm text-white/40">/</span>
                        <input
                          data-testid="change-username-input"
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase())}
                          maxLength={20}
                          disabled={coolingDown}
                          className="w-full bg-transparent font-mono text-sm outline-none disabled:opacity-50"
                        />
                        {unameStatus === "checking" && <span className="shrink-0 text-xs text-white/40">checking…</span>}
                        {unameStatus === "available" && <Check size={15} className="shrink-0 text-[#A78BFA]" />}
                      </div>
                      <button
                        data-testid="change-username-btn"
                        onClick={saveUsername}
                        disabled={coolingDown || unameStatus !== "available"}
                        className="shrink-0 rounded-xl bg-[#8B5CF6] px-5 text-sm font-medium text-white transition-colors hover:bg-[#7C4DEF] disabled:opacity-40"
                      >
                        change
                      </button>
                    </div>
                    {unameStatus === "taken" && <p data-testid="username-unavailable-msg" className="mt-2 text-xs text-red-400">username unavailable</p>}
                    {user.username_history?.length > 0 && (
                      <p data-testid="username-history" className="mt-3 text-xs text-white/30">
                        previously: {user.username_history.map((h) => `@${h.username}`).join(" → ")}
                      </p>
                    )}
                    {coolingDown && (
                      <p data-testid="username-cooldown-msg" className="mt-2 text-xs text-white/40">
                        usernames change once a month — next change opens {nextChange.toLocaleDateString(undefined, { month: "long", day: "numeric" })}
                      </p>
                    )}
                    {unameStatus === "invalid" && <p data-testid="username-invalid-msg" className="mt-2 text-xs text-red-400">3-20 chars: letters, numbers, underscore</p>}
                  </section>
                  <section className="rounded-2xl border border-white/10 bg-[#1c1130]/60 p-6">
                    <h2 className="mb-5 font-display text-lg font-bold">Profile</h2>
                    <div className="mb-5 flex items-center gap-4">
                      <div data-testid="settings-avatar-preview" className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#8B5CF6]/20 font-display text-xl font-bold text-[#A78BFA]">
                        {user.avatar_url ? (
                          <img src={`${process.env.REACT_APP_BACKEND_URL}${user.avatar_url}`} alt="avatar" className="h-full w-full object-cover" />
                        ) : (
                          (displayName || user.username)[0]?.toUpperCase()
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button data-testid="avatar-upload-btn" onClick={() => avatarInput.current?.click()} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-sm transition-colors hover:bg-white/10">
                          <ImagePlus size={14} /> upload photo
                        </button>
                        {user.avatar_url && (
                          <button data-testid="avatar-remove-btn" onClick={removeAvatar} className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/50 transition-colors hover:text-red-400">
                            remove
                          </button>
                        )}
                      </div>
                      <input ref={avatarInput} data-testid="avatar-file-input" type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
                    </div>
                    <label className={label} htmlFor="display-name-input">display name</label>
                    <input id="display-name-input" data-testid="display-name-input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={60} className={`${field} mb-4`} />
                    <label className={label} htmlFor="bio-input">bio</label>
                    <textarea id="bio-input" data-testid="bio-input" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={300} rows={3} placeholder="a line or two about you" className={`${field} resize-none`} />
                  </section>

                  <section className="rounded-2xl border border-white/10 bg-[#1c1130]/60 p-6">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <h2 className="font-display text-lg font-bold">Page theme</h2>
                      <div data-testid="mode-toggle" className="flex items-center gap-1 rounded-full border border-white/15 bg-white/5 p-1">
                        <button data-testid="mode-light-btn" onClick={() => applyTheme("light")} title="light mode" className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${theme === "light" ? "bg-[#8B5CF6] text-white" : "text-white/50 hover:text-white"}`}>
                          <Sun size={13} />
                        </button>
                        <button data-testid="mode-dark-btn" onClick={() => applyTheme("dark")} title="dark mode" className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${theme === "dark" ? "bg-[#8B5CF6] text-white" : "text-white/50 hover:text-white"}`}>
                          <Moon size={13} />
                        </button>
                      </div>
                    </div>
                    <p className="mb-5 text-xs text-white/40">Paper and Charcoal are free — the pack ({THEME_PACK_PRICE}) unlocks every theme, forever. Changes save instantly.</p>
                    <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">auto day / night</p>
                        <p className="text-xs text-white/40">Paper by day, Charcoal by night — on your visitors' clocks</p>
                      </div>
                      <Switch data-testid="theme-auto-switch" checked={themeAuto} onCheckedChange={toggleAuto} />
                    </div>
                    <div data-testid="theme-grid" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {THEMES.map((t) => {
                        const locked = !t.free && !user.theme_pack;
                        const active = theme === t.id;
                        return (
                          <button
                            key={t.id}
                            data-testid={`theme-option-${t.id}`}
                            onClick={() => (locked ? unlockThemes() : applyTheme(t.id))}
                            title={t.desc}
                            className={`rounded-2xl border p-2 text-left transition-all duration-300 ${active ? "border-[#8B5CF6] shadow-[0_8px_28px_rgba(139,92,246,0.3)]" : "border-white/10 hover:border-[#8B5CF6]/50"}`}
                          >
                            <ThemePreview id={t.id} locked={locked} />
                            <div className="mt-2 flex items-center justify-between px-1 pb-0.5">
                              <span className="text-xs font-medium">{t.name}</span>
                              {locked ? <Lock size={11} className="text-white/40" /> : active ? <Check size={12} className="text-[#A78BFA]" /> : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                  <SaveBtn />
                </div>

                <div>
                  <div className="lg:sticky lg:top-8">
                    <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-white/40">live preview</p>
                    <div data-testid="settings-preview" data-theme={theme} className="space-y-5 rounded-3xl border border-border bg-background p-5 text-foreground transition-colors duration-500">
                      <div className="text-center">
                        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full tint-sage font-display text-xl font-bold text-[#A78BFA]">
                          {user.avatar_url ? (
                            <img src={`${process.env.REACT_APP_BACKEND_URL}${user.avatar_url}`} alt="" className="h-full w-full object-cover" />
                          ) : (
                            (displayName || user.username)[0]?.toUpperCase()
                          )}
                        </div>
                        <p className="font-display text-lg font-bold">{displayName || user.username}</p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                        {bio && <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">{bio}</p>}
                      </div>
                      {links.length > 0 && (
                        <div className="space-y-2">
                          {links.slice(0, 4).map((l, i) => (
                            <div key={i} className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-3">
                              <Favicon url={l.url} size={16} />
                              <span className="truncate text-sm font-medium">{l.label || prettyLabel(l.url)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === "links" && (
              <div className="max-w-2xl space-y-6">
                <h1 className="font-display text-2xl font-bold">Links</h1>
                <section className="rounded-2xl border border-white/10 bg-[#1c1130]/60 p-6">
                  <h2 className="mb-1 font-display text-lg font-bold">Social links</h2>
                  <p className="mb-5 text-xs text-white/40">Paste a link — its icon is found automatically. Tap counts update live.</p>
                  <div className="mb-4 flex gap-2">
                    <input
                      data-testid="new-link-input"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLink())}
                      placeholder="https://…"
                      className={field}
                    />
                    <button data-testid="add-link-btn" onClick={addLink} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#8B5CF6] px-4 text-sm font-medium text-white transition-colors hover:bg-[#7C4DEF]">
                      <Plus size={14} /> add
                    </button>
                  </div>
                  <ul data-testid="links-editor-list" className="space-y-2">
                    {links.map((link, i) => (
                      <li key={`${link.url}-${i}`} data-testid={`link-editor-item-${i}`} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                        <Favicon url={link.url} size={16} />
                        <input
                          data-testid={`link-label-input-${i}`}
                          value={link.label || ""}
                          onChange={(e) => setLinks(links.map((l, j) => (j === i ? { ...l, label: e.target.value } : l)))}
                          className="w-full min-w-0 bg-transparent text-sm outline-none"
                        />
                        <span data-testid={`link-clicks-${i}`} title="times tapped" className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/50">
                          <MousePointerClick size={11} /> {link.clicks || 0}
                        </span>
                        <button data-testid={`link-up-btn-${i}`} onClick={() => move(i, -1)} className="p-1 text-white/40 transition-colors hover:text-white"><ArrowUp size={14} /></button>
                        <button data-testid={`link-down-btn-${i}`} onClick={() => move(i, 1)} className="p-1 text-white/40 transition-colors hover:text-white"><ArrowDown size={14} /></button>
                        <button data-testid={`link-remove-btn-${i}`} onClick={() => setLinks(links.filter((_, j) => j !== i))} className="p-1 text-white/40 transition-colors hover:text-red-400"><Trash2 size={14} /></button>
                      </li>
                    ))}
                    {!links.length && <p className="py-2 text-sm text-white/30">no links yet</p>}
                  </ul>
                </section>
                <SaveBtn />
              </div>
            )}

            {tab === "connections" && (
              <div className="max-w-2xl space-y-6">
                <h1 className="font-display text-2xl font-bold">Connections</h1>
                <section className="rounded-2xl border border-white/10 bg-[#1c1130]/60 p-6">
                  <div className="mb-1 flex items-center gap-2">
                    <MessageSquare size={16} className="text-[#A78BFA]" />
                    <h2 className="font-display text-lg font-bold">Discord</h2>
                    {user.discord_id && <span className="rounded-full bg-[#8B5CF6]/20 px-2 py-0.5 text-[10px] font-medium text-[#A78BFA]">linked</span>}
                  </div>
                  <p className="mb-5 text-xs text-white/40">
                    Discord → user settings → advanced → enable developer mode → right-click your profile → copy user ID.
                    For the live "online now" badge, join the Lanyard Discord server once (discord.gg/lanyard).
                  </p>
                  <div className="flex gap-2">
                    <input data-testid="discord-id-input" value={discordId} onChange={(e) => setDiscordId(e.target.value.replace(/\D/g, ""))} placeholder="your discord user ID" className={`${field} font-mono`} />
                    <button data-testid="discord-test-btn" onClick={testDiscord} disabled={!discordId.trim() || discordPreview.loading} className="shrink-0 rounded-xl border border-white/15 px-4 text-sm transition-colors hover:bg-white/10 disabled:opacity-40">
                      test
                    </button>
                  </div>
                  {(discordPreview.loading || discordPreview.data || discordPreview.error) && (
                    <div className="mt-4">
                      <DiscordCard data={discordPreview.data} loading={discordPreview.loading} error={discordPreview.error} onRetry={testDiscord} />
                    </div>
                  )}
                </section>

                <section className="rounded-2xl border border-white/10 bg-[#1c1130]/60 p-6">
                  <div className="mb-1 flex items-center gap-2">
                    <AudioLines size={16} className="text-[#A78BFA]" />
                    <h2 className="font-display text-lg font-bold">Last.fm</h2>
                    {user.lastfm_username && <span className="rounded-full bg-[#8B5CF6]/20 px-2 py-0.5 text-[10px] font-medium text-[#A78BFA]">linked</span>}
                  </div>
                  <p className="mb-5 text-xs text-white/40">Your username from last.fm — we'll show your now-playing and recent scrobbles.</p>
                  <div className="flex gap-2">
                    <input data-testid="lastfm-username-input" value={lastfmUser} onChange={(e) => setLastfmUser(e.target.value)} placeholder="your last.fm username" className={field} />
                    <button data-testid="lastfm-test-btn" onClick={testLastfm} disabled={!lastfmUser.trim() || lastfmPreview.loading} className="shrink-0 rounded-xl border border-white/15 px-4 text-sm transition-colors hover:bg-white/10 disabled:opacity-40">
                      test
                    </button>
                  </div>
                  <label className={`${label} mt-4`} htmlFor="pinned-track-input">pinned track</label>
                  <input
                    id="pinned-track-input"
                    data-testid="pinned-track-input"
                    value={pinnedTrack}
                    onChange={(e) => setPinnedTrack(e.target.value)}
                    placeholder="song — artist (plays on your page when you're not listening)"
                    className={field}
                  />
                  <label className={`${label} mt-4`} htmlFor="favorite-track-input">favorite song</label>
                  <input
                    id="favorite-track-input"
                    data-testid="favorite-track-input"
                    value={favoriteTrack}
                    onChange={(e) => setFavoriteTrack(e.target.value)}
                    placeholder="your anthem — plays automatically for visitors"
                    className={field}
                  />
                  <p className="mt-2 text-[11px] text-white/30">Visitors can pause it or turn the volume down — a little player floats in the corner of your page.</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button data-testid="song-upload-btn" onClick={() => songInput.current?.click()} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-xs transition-colors hover:bg-white/10">
                      <Plus size={13} /> upload audio file
                    </button>
                    {user.song_url && (
                      <>
                        <span data-testid="song-uploaded-badge" className="inline-flex items-center gap-1.5 rounded-full bg-[#8B5CF6]/15 px-3 py-1.5 text-[11px] text-[#A78BFA]">
                          <Check size={11} /> custom audio active
                        </span>
                        <button data-testid="song-remove-btn" onClick={removeSong} className="rounded-full border border-white/15 px-3 py-1.5 text-[11px] text-white/50 transition-colors hover:text-red-400">
                          remove
                        </button>
                      </>
                    )}
                    <input ref={songInput} data-testid="song-file-input" type="file" accept="audio/*" className="hidden" onChange={uploadSong} />
                  </div>
                  <p className="mt-2 text-[11px] text-white/30">No file uploaded? The 30-second preview method above is used instead.</p>
                  {(lastfmPreview.loading || lastfmPreview.data || lastfmPreview.error) && (
                    <div className="mt-4">
                      <LastfmCard data={lastfmPreview.data} loading={lastfmPreview.loading} error={lastfmPreview.error} onRetry={testLastfm} />
                    </div>
                  )}
                </section>

                <section className="relative rounded-2xl border border-white/10 bg-[#1c1130]/60 p-6">
                  <div className="mb-1 flex items-center gap-2">
                    <Youtube size={16} className="text-[#A78BFA]" />
                    <h2 className="font-display text-lg font-bold">YouTube</h2>
                    <span className="rounded-full bg-[#8B5CF6]/20 px-2 py-0.5 text-[10px] font-medium text-[#A78BFA]">premium</span>
                  </div>
                  <p className="mb-5 text-xs text-white/40">Paste a video link to feature it, or your channel (like @yourname) and we'll always embed your latest upload.</p>
                  <input
                    data-testid="youtube-input"
                    value={youtubeInput}
                    onChange={(e) => setYoutubeInput(e.target.value)}
                    placeholder="youtube.com/watch?v=… or @yourchannel"
                    disabled={!user.theme_pack}
                    className={`${field} disabled:opacity-40`}
                  />
                  {!user.theme_pack && (
                    <button data-testid="youtube-lock-btn" onClick={unlockThemes} className="absolute inset-0 flex items-center justify-center gap-2 rounded-2xl bg-[#0d0714]/70 text-sm text-white/70 backdrop-blur-[2px] transition-colors hover:text-white">
                      <Lock size={15} /> unlock with premium
                    </button>
                  )}
                </section>

                <section className="relative rounded-2xl border border-white/10 bg-[#1c1130]/60 p-6">
                  <div className="mb-1 flex items-center gap-2">
                    <Twitch size={16} className="text-[#A78BFA]" />
                    <h2 className="font-display text-lg font-bold">Twitch</h2>
                    <span className="rounded-full bg-[#8B5CF6]/20 px-2 py-0.5 text-[10px] font-medium text-[#A78BFA]">premium</span>
                  </div>
                  <p className="mb-5 text-xs text-white/40">Your channel name — when you're live your stream broadcasts on your page, otherwise we show your latest broadcast.</p>
                  <input
                    data-testid="twitch-input"
                    value={twitchChannel}
                    onChange={(e) => setTwitchChannel(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase())}
                    placeholder="your twitch channel"
                    disabled={!user.theme_pack}
                    className={`${field} disabled:opacity-40`}
                  />
                  {!user.theme_pack && (
                    <button data-testid="twitch-lock-btn" onClick={unlockThemes} className="absolute inset-0 flex items-center justify-center gap-2 rounded-2xl bg-[#0d0714]/70 text-sm text-white/70 backdrop-blur-[2px] transition-colors hover:text-white">
                      <Lock size={15} /> unlock with premium
                    </button>
                  )}
                </section>
                <SaveBtn />
              </div>
            )}

            {tab === "premium" && (
              <div className="max-w-2xl space-y-6">
                <h1 className="font-display text-2xl font-bold">Premium</h1>
                {user.theme_pack ? (
                  <div data-testid="premium-owned" className="relative overflow-hidden rounded-2xl border border-[#8B5CF6]/50 bg-[#8B5CF6]/10 p-8 text-center shadow-[0_0_60px_rgba(139,92,246,0.2)]">
                    <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#8B5CF6]/30 blur-[70px]" />
                    <Gem size={28} className="mx-auto mb-3 text-[#A78BFA]" />
                    <p className="font-display text-2xl font-bold">You're premium, forever</p>
                    <p className="mt-2 text-sm text-white/50">Every theme — Moss, Ember, Dusk, and all future ones — is yours. Thank you for keeping dontblink alive.</p>
                  </div>
                ) : (
                  <div className="relative overflow-hidden rounded-2xl border border-[#8B5CF6]/50 bg-[#8B5CF6]/10 p-8 shadow-[0_0_60px_rgba(139,92,246,0.2)]">
                    <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#8B5CF6]/30 blur-[70px]" />
                    <p className="font-display text-lg font-bold">Premium</p>
                    <p className="mt-1 font-display text-4xl font-bold">$4.99</p>
                    <p className="mb-7 mt-1 text-xs text-[#A78BFA]">once — never again</p>
                    <ul className="mb-8 space-y-3">
                      {["Moss, Ember & Dusk page themes", "every future theme, automatically", "support a tiny indie web corner"].map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-white/80">
                          <Check size={15} className="mt-0.5 shrink-0 text-[#A78BFA]" /> {f}
                        </li>
                      ))}
                    </ul>
                    <button data-testid="unlock-themes-btn" onClick={unlockThemes} disabled={unlocking} className="w-full rounded-full bg-[#8B5CF6] py-3.5 text-sm font-semibold text-white shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all hover:bg-[#7C4DEF] disabled:opacity-50">
                      {unlocking ? "opening checkout…" : "unlock premium"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
