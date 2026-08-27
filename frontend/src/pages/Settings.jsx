import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Trash2, ArrowUp, ArrowDown, Copy, LogOut, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { api, errMsg } from "../lib/api";
import { ease } from "../components/motion";
import { Favicon } from "../components/FaviconImg";
import { DiscordCard } from "../components/DiscordCard";
import { LastfmCard } from "../components/LastfmCard";
import { prettyLabel, getDomain } from "../lib/favicon";

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
      });
      setUser(r.data);
      toast.success("Saved — your page is updated");
    } catch (e) {
      toast.error(errMsg(e, "Could not save"));
    } finally {
      setSaving(false);
    }
  };

  const field = "w-full rounded-xl border border-input bg-paper px-4 py-3 text-sm outline-none transition-colors focus:border-sage";
  const label = "mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground";

  return (
    <div data-testid="settings-page" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/" className="font-serif text-xl font-semibold italic">sanctuary</Link>
          <h1 className="mt-2 font-display text-3xl font-bold">Settings</h1>
          {location.state?.welcome && (
            <p className="mt-1 text-sm text-sage">Welcome in — make it yours below.</p>
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
            <label className={label} htmlFor="display-name-input">display name</label>
            <input id="display-name-input" data-testid="display-name-input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={60} className={`${field} mb-4`} />
            <label className={label} htmlFor="bio-input">bio</label>
            <textarea id="bio-input" data-testid="bio-input" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={300} rows={3} placeholder="a line or two about you" className={`${field} resize-none`} />
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 sm:p-7">
            <h2 className="mb-1 font-display text-lg font-bold">Discord</h2>
            <p className="mb-5 text-xs text-muted-foreground">
              Discord → user settings → advanced → enable developer mode → right-click your profile → copy user ID.
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
              <button data-testid="add-link-btn" onClick={addLink} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-ink px-4 text-sm text-paper transition-colors hover:bg-ink/85">
                <Plus size={14} /> add
              </button>
            </div>
            <ul data-testid="links-editor-list" className="space-y-2">
              {links.map((link, i) => (
                <li key={`${link.url}-${i}`} data-testid={`link-editor-item-${i}`} className="flex items-center gap-2 rounded-xl border border-border bg-paper px-3 py-2.5">
                  <Favicon url={link.url} size={16} />
                  <input
                    data-testid={`link-label-input-${i}`}
                    value={link.label || ""}
                    onChange={(e) => setLinks(links.map((l, j) => (j === i ? { ...l, label: e.target.value } : l)))}
                    className="w-full min-w-0 bg-transparent text-sm outline-none"
                  />
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
            className="w-full rounded-2xl bg-sage py-4 text-sm font-semibold text-paper transition-colors hover:bg-sage/90 disabled:opacity-50"
          >
            {saving ? "saving…" : "save everything"}
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease, delay: 0.15 }}>
          <div className="lg:sticky lg:top-10">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">live preview</p>
            <div data-testid="settings-preview" className="space-y-5 rounded-3xl border border-border bg-white/50 p-5">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-sage-light font-display text-xl font-bold text-sage">
                  {discordPreview.data?.avatar_url ? (
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
