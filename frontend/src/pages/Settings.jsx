import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Trash2, ArrowUp, ArrowDown, Copy, LogOut, ExternalLink, ImagePlus, Lock, Check, MousePointerClick, Sun, Moon } from "lucide-react";
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

function Sparkline({ data }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map((d) => d.count), 1);
  const w = 240;
  const h = 36;
  const pts = data
    .map((d, i) => `${(i / (data.length - 1 || 1)) * w},${h - (d.count / max) * (h - 6) - 3}`)
    .join(" ");
  return (
    <svg data-testid="views-sparkline" viewBox={`0 0 ${w} ${h}`} className="mt-1 w-full" preserveAspectRatio="none">
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

export default function Settings() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    const sessionId = params.get("session_id");
    if (params.get("billing") === "cancel") {
      toast.error("Checkout cancelled — no charge");
      setParams({}, { replace: true });
      return;
    }
    if (params.get("billing") !== "success" || !sessionId) return;
    let tries = 0;
    const poll = setInterval(async () => {
      tries += 1;
      try {
        const r = await api.get(`/payments/status/${sessionId}`);
        if (r.data.payment_status === "paid") {
          clearInterval(poll);
          const meRes = await api.get("/auth/me");
          setUser(meRes.data);
          toast.success("Theme pack unlocked — enjoy the new looks");
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

  const applyTheme = async (t) => {
    setTheme(t);
    try {
      const r = await api.put("/auth/profile", {
        display_name: displayName,
        bio,
        discord_id: discordId.trim() || null,
        lastfm_username: lastfmUser.trim() || null,
        links,
        theme: t,
        theme_auto: themeAuto,
      });
      setUser(r.data);
      toast.success(t === "dark" ? "Switched to dark mode" : t === "light" ? "Switched to light mode" : "Theme applied");
    } catch (e) {
      toast.error(errMsg(e, "Could not apply theme"));
    }
  };

  const toggleAuto = async (val) => {
    setThemeAuto(val);
    try {
      const r = await api.put("/auth/profile", {
        display_name: displayName,
        bio,
        discord_id: discordId.trim() || null,
        lastfm_username: lastfmUser.trim() || null,
        links,
        theme,
        theme_auto: val,
      });
      setUser(r.data);
      toast.success(val ? "Auto day/night on — Paper by day, Charcoal by night" : "Auto day/night off");
    } catch (e) {
      setThemeAuto(!val);
      toast.error(errMsg(e, "Could not save"));
    }
  };

  const [discordPreview, setDiscordPreview] = useState({ loading: false, data: null, error: null });
  const [lastfmPreview, setLastfmPreview] = useState({ loading: false, data: null, error: null });

  const pageUrl = `${window.location.origin}/${user.username}`;

  const addLink = () => {
    const domain = getDomain(newUrl);
    if (!domain) {
      toast.error("That doesn't look like a valid link");
      return;
    }
    const url = /^https?:\/\//i.test(newUrl) ? newUrl : `https://${newUrl}`;
    if (links.length >= 12) {
      toast.error("Maximum 12 links");
      return;
    }
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

  const save = async () => {
    setSaving(true);
    try {
      const r = await api.put("/auth/profile", {
        display_name: displayName,
        bio,
        discord_id: discordId.trim() || null,
        lastfm_username: lastfmUser.trim() || null,
        links,
        theme,
        theme_auto: themeAuto,
      });
      setUser(r.data);
      toast.success("Saved — your page is updated");
    } catch (e) {
      toast.error(errMsg(e, "Could not save"));
    } finally {
      setSaving(false);
    }
  };

  const field = "w-full rounded-xl border border-input bg-secondary px-4 py-3 text-sm outline-none transition-colors focus:border-[#8B5CF6]";
  const label = "mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground";

  return (
    <div data-testid="settings-page" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/" className="font-serif text-xl font-semibold italic">dontblink</Link>
          <h1 className="mt-2 font-display text-3xl font-bold">Settings</h1>
          {location.state?.welcome && (
            <p className="mt-1 text-sm text-[#A78BFA]">Welcome in — make it yours below.</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            data-testid="copy-page-url-btn"
            onClick={() => { navigator.clipboard.writeText(pageUrl); toast.success("Page link copied"); }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm transition-colors hover:bg-secondary"
          >
            <Copy size={14} /> {user.username}
          </button>
          <Link data-testid="view-page-btn" to={`/${user.username}`} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm transition-colors hover:bg-secondary">
            view page <ExternalLink size={13} />
          </Link>
          <button
            data-testid="logout-btn"
            onClick={() => { logout(); navigate("/"); }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="space-y-8">
          <section className="rounded-3xl border border-border bg-card p-6 sm:p-7">
            <h2 className="mb-5 font-display text-lg font-bold">Profile</h2>
            <div className="mb-5 flex items-center gap-4">
              <div data-testid="settings-avatar-preview" className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full tint-sage font-display text-xl font-bold text-[#A78BFA]">
                {user.avatar_url ? (
                  <img src={`${process.env.REACT_APP_BACKEND_URL}${user.avatar_url}`} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  (displayName || user.username)[0]?.toUpperCase()
                )}
              </div>
              <div className="flex gap-2">
                <button data-testid="avatar-upload-btn" onClick={() => avatarInput.current?.click()} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-4 py-2 text-sm transition-colors hover:bg-secondary">
                  <ImagePlus size={14} /> upload photo
                </button>
                {user.avatar_url && (
                  <button data-testid="avatar-remove-btn" onClick={removeAvatar} className="rounded-full border border-border bg-secondary px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-destructive">
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

          <section className="rounded-3xl border border-border bg-card p-6 sm:p-7">
            <h2 className="mb-5 font-display text-lg font-bold">Your stats</h2>
            <Sparkline data={user.views_daily} />
            <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">last 14 days</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span data-testid="stats-total-views" className="font-display text-4xl font-bold">{user.views || 0}</span>
              <span className="text-sm text-muted-foreground">page visits</span>
            </div>
            {user.referrers?.length > 0 ? (
              <ul data-testid="stats-referrers" className="mt-4 space-y-2">
                {user.referrers.map((r, i) => (
                  <li key={r.host} data-testid={`stats-referrer-${i}`} className="flex items-center gap-2.5 text-sm">
                    <Favicon url={`https://${r.host}`} size={14} />
                    <span className="flex-1 truncate">{r.host}</span>
                    <span className="text-muted-foreground">{r.count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">Share your page — where visitors arrive from shows up here.</p>
            )}
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 sm:p-7">
            <h2 className="mb-1 font-display text-lg font-bold">Discord</h2>
            <p className="mb-5 text-xs text-muted-foreground">
              Discord → user settings → advanced → enable developer mode → right-click your profile → copy user ID.
              For the live "online now" badge, join the Lanyard Discord server once (discord.gg/lanyard) — it watches your presence.
            </p>
            <div className="flex gap-2">
              <input
                data-testid="discord-id-input"
                value={discordId}
                onChange={(e) => setDiscordId(e.target.value.replace(/\D/g, ""))}
                placeholder="your discord user ID"
                className={`${field} font-mono`}
              />
              <button data-testid="discord-test-btn" onClick={testDiscord} disabled={!discordId.trim() || discordPreview.loading} className="shrink-0 rounded-xl border border-border bg-secondary px-4 text-sm transition-colors hover:bg-border disabled:opacity-40">
                test
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 sm:p-7">
            <h2 className="mb-1 font-display text-lg font-bold">Last.fm</h2>
            <p className="mb-5 text-xs text-muted-foreground">Your username from last.fm — we'll show your now-playing and recent scrobbles.</p>
            <div className="flex gap-2">
              <input
                data-testid="lastfm-username-input"
                value={lastfmUser}
                onChange={(e) => setLastfmUser(e.target.value)}
                placeholder="your last.fm username"
                className={field}
              />
              <button data-testid="lastfm-test-btn" onClick={testLastfm} disabled={!lastfmUser.trim() || lastfmPreview.loading} className="shrink-0 rounded-xl border border-border bg-secondary px-4 text-sm transition-colors hover:bg-border disabled:opacity-40">
                test
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 sm:p-7">
            <div className="mb-1 flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold">Page theme</h2>
              <div data-testid="mode-toggle" className="flex items-center gap-1 rounded-full border border-border bg-secondary p-1">
                <button
                  data-testid="mode-light-btn"
                  onClick={() => applyTheme("light")}
                  title="light mode"
                  className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${theme === "light" ? "bg-[#8B5CF6] text-white" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Sun size={13} />
                </button>
                <button
                  data-testid="mode-dark-btn"
                  onClick={() => applyTheme("dark")}
                  title="dark mode"
                  className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${theme === "dark" ? "bg-[#8B5CF6] text-white" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Moon size={13} />
                </button>
              </div>
            </div>
            <p className="mb-5 text-xs text-muted-foreground">Paper and Charcoal are free — the pack ({THEME_PACK_PRICE}) unlocks every theme, forever. Changes save instantly.</p>
            <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary px-4 py-3">
              <div>
                <p className="text-sm font-medium">auto day / night</p>
                <p className="text-xs text-muted-foreground">Paper by day, Charcoal by night — on your visitors' clocks</p>
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
                    className={`rounded-2xl border p-2 text-left transition-all duration-300 ${active ? "border-[#8B5CF6] shadow-[0_8px_28px_rgba(139,92,246,0.3)]" : "border-border hover:border-[#8B5CF6]/50"}`}
                  >
                    <ThemePreview id={t.id} locked={locked} />
                    <div className="mt-2 flex items-center justify-between px-1 pb-0.5">
                      <span className="text-xs font-medium">{t.name}</span>
                      {locked ? <Lock size={11} className="text-muted-foreground" /> : active ? <Check size={12} className="text-[#A78BFA]" /> : null}
                    </div>
                  </button>
                );
              })}
            </div>
            {!user.theme_pack && (
              <button data-testid="unlock-themes-btn" onClick={unlockThemes} disabled={unlocking} className="mt-4 w-full rounded-xl bg-[#8B5CF6] py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(139,92,246,0.35)] transition-colors hover:bg-[#7C4DEF] disabled:opacity-50">
                {unlocking ? "opening checkout…" : `unlock all themes · ${THEME_PACK_PRICE} one-time`}
              </button>
            )}
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 sm:p-7">
            <h2 className="mb-1 font-display text-lg font-bold">Social links</h2>
            <p className="mb-5 text-xs text-muted-foreground">Paste a link — its icon is found automatically.</p>
            <div className="mb-4 flex gap-2">
              <input
                data-testid="new-link-input"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLink())}
                placeholder="https://…"
                className={field}
              />
              <button data-testid="add-link-btn" onClick={addLink} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#8B5CF6] px-4 text-sm text-white transition-colors hover:bg-[#7C4DEF]">
                <Plus size={14} /> add
              </button>
            </div>
            <ul data-testid="links-editor-list" className="space-y-2">
              {links.map((link, i) => (
                <li key={`${link.url}-${i}`} data-testid={`link-editor-item-${i}`} className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2.5">
                  <Favicon url={link.url} size={16} />
                  <input
                    data-testid={`link-label-input-${i}`}
                    value={link.label || ""}
                    onChange={(e) => setLinks(links.map((l, j) => (j === i ? { ...l, label: e.target.value } : l)))}
                    className="w-full min-w-0 bg-transparent text-sm outline-none"
                  />
                  <span data-testid={`link-clicks-${i}`} title="times tapped" className="inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                    <MousePointerClick size={11} /> {link.clicks || 0}
                  </span>
                  <button data-testid={`link-up-btn-${i}`} onClick={() => move(i, -1)} className="p-1 text-muted-foreground transition-colors hover:text-foreground"><ArrowUp size={14} /></button>
                  <button data-testid={`link-down-btn-${i}`} onClick={() => move(i, 1)} className="p-1 text-muted-foreground transition-colors hover:text-foreground"><ArrowDown size={14} /></button>
                  <button data-testid={`link-remove-btn-${i}`} onClick={() => setLinks(links.filter((_, j) => j !== i))} className="p-1 text-muted-foreground transition-colors hover:text-destructive"><Trash2 size={14} /></button>
                </li>
              ))}
              {!links.length && <p className="py-2 text-sm text-muted-foreground/60">no links yet</p>}
            </ul>
          </section>

          <button
            data-testid="save-settings-button"
            onClick={save}
            disabled={saving}
            className="w-full rounded-2xl bg-[#8B5CF6] py-4 text-sm font-semibold text-white shadow-[0_0_28px_rgba(139,92,246,0.35)] transition-colors hover:bg-[#7C4DEF] disabled:opacity-50"
          >
            {saving ? "saving…" : "save everything"}
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease, delay: 0.15 }}>
          <div className="lg:sticky lg:top-10">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">live preview</p>
            <div data-testid="settings-preview" data-theme={theme} className="space-y-5 rounded-3xl border border-border bg-background p-5 text-foreground transition-colors duration-500">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full tint-sage font-display text-xl font-bold text-[#A78BFA]">
                  {user.avatar_url ? (
                    <img src={`${process.env.REACT_APP_BACKEND_URL}${user.avatar_url}`} alt="" className="h-full w-full object-cover" />
                  ) : discordPreview.data?.avatar_url ? (
                    <img src={discordPreview.data.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (displayName || user.username)[0]?.toUpperCase()
                  )}
                </div>
                <p className="font-display text-lg font-bold">{displayName || user.username}</p>
                <p className="text-xs text-muted-foreground">@{user.username}</p>
                {bio && <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">{bio}</p>}
              </div>
              {(discordPreview.loading || discordPreview.data || discordPreview.error) && (
                <DiscordCard data={discordPreview.data} loading={discordPreview.loading} error={discordPreview.error} onRetry={testDiscord} />
              )}
              {(lastfmPreview.loading || lastfmPreview.data || lastfmPreview.error) && (
                <LastfmCard data={lastfmPreview.data} loading={lastfmPreview.loading} error={lastfmPreview.error} onRetry={testLastfm} />
              )}
              {links.length > 0 && (
                <div className="space-y-2">
                  {links.map((l, i) => (
                    <div key={i} className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-3">
                      <Favicon url={l.url} size={16} />
                      <span className="truncate text-sm font-medium">{l.label || prettyLabel(l.url)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
