import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api, errMsg } from "../lib/api";
import { ease } from "../components/motion";
import { DiscordCard } from "../components/DiscordCard";
import { LastfmCard } from "../components/LastfmCard";
import { SocialLinks } from "../components/SocialLinks";
import { RolePills } from "../components/RolePills";
import { YouTubeCard, TwitchCard } from "../components/MediaCards";
import { AutoPlayMusic } from "../components/AutoPlayMusic";

export default function Profile() {
  const { username } = useParams();
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [welcomeBack, setWelcomeBack] = useState(false);
  const [discord, setDiscord] = useState({ loading: false, data: null, error: null });
  const [lastfm, setLastfm] = useState({ loading: false, data: null, error: null });
  const [presence, setPresence] = useState(null);
  const [pinned, setPinned] = useState(null);

  const loadDiscord = useCallback(async (id) => {
    setDiscord({ loading: true, data: null, error: null });
    try {
      const r = await api.get(`/discord/${id}`);
      setDiscord({ loading: false, data: r.data, error: null });
    } catch (e) {
      setDiscord({ loading: false, data: null, error: errMsg(e, "Discord profile unavailable") });
    }
  }, []);

  const loadLastfm = useCallback(async (name, showLoading) => {
    if (showLoading) setLastfm({ loading: true, data: null, error: null });
    try {
      const r = await api.get(`/lastfm/${encodeURIComponent(name)}/recent?limit=6`);
      setLastfm({ loading: false, data: r.data, error: null });
    } catch (e) {
      setLastfm({ loading: false, data: null, error: errMsg(e, "Last.fm unavailable") });
    }
  }, []);

  useEffect(() => {
    const key = `db_visited_${username}`;
    if (localStorage.getItem(key)) setWelcomeBack(true);
    localStorage.setItem(key, Date.now().toString());
  }, [username]);

  useEffect(() => {
    setProfile(null);
    setNotFound(false);
    api
      .get(`/profile/${username}`)
      .then((r) => setProfile(r.data))
      .catch(() => setNotFound(true));
    api.post(`/profile/${username}/view`, { referrer: document.referrer }).catch(() => {});
  }, [username]);

  useEffect(() => {
    if (!profile) return;
    document.title = `${profile.display_name || profile.username} — dontblink`;
    if (profile.pinned_track) {
      api.get("/track/preview", { params: { q: profile.pinned_track } }).then((r) => setPinned(r.data)).catch(() => setPinned(null));
    }
    if (profile.discord_id) {
      loadDiscord(profile.discord_id);
      const loadPresence = () =>
        api.get(`/lanyard/${profile.discord_id}`).then((r) => setPresence(r.data)).catch(() => {});
      loadPresence();
      const pt = setInterval(loadPresence, 30000);
      var clearPresence = () => clearInterval(pt);
    }
    if (profile.lastfm_username) {
      loadLastfm(profile.lastfm_username, true);
      const t = setInterval(() => loadLastfm(profile.lastfm_username, false), 45000);
      return () => { clearInterval(t); clearPresence && clearPresence(); };
    }
    return () => clearPresence && clearPresence();
  }, [profile, loadDiscord, loadLastfm]);

  if (notFound) {
    return (
      <div data-testid="profile-not-found" className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="font-serif text-5xl italic text-foreground/70">quiet here…</p>
        <p className="text-sm text-muted-foreground">@{username} hasn't been claimed yet.</p>
        <Link data-testid="claim-this-btn" to={`/register?u=${username}`} className="rounded-full bg-[#8B5CF6] px-5 py-2.5 text-sm text-white shadow-[0_0_24px_rgba(139,92,246,0.4)] transition-colors hover:bg-[#7C4DEF]">
          claim it
        </Link>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-[#8B5CF6]" />
      </div>
    );
  }

  const name = profile.display_name || profile.username;
  const hour = new Date().getHours();
  const resolvedTheme = profile.theme_auto ? (hour >= 6 && hour < 18 ? "light" : "dark") : profile.theme || "light";
  const avatar = profile.avatar_url
    ? `${process.env.REACT_APP_BACKEND_URL}${profile.avatar_url}`
    : discord.data?.avatar_url;
  const isOwn = user?.username === profile.username;

  return (
    <div data-testid="profile-page" data-theme={resolvedTheme} className="min-h-screen bg-background text-foreground transition-colors duration-500">
      <motion.main
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease }}
        className="mx-auto max-w-3xl px-4 py-14 sm:py-20"
      >
        <header className="mb-10 text-center">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease }}
            className="mx-auto mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-border bg-sage-light font-display text-3xl font-bold text-sage shadow-[0_8px_28px_rgba(0,0,0,0.06)]"
          >
            {avatar ? (
              <img data-testid="profile-avatar" src={avatar} alt={name} className="h-full w-full object-cover" />
            ) : (
              <span data-testid="profile-avatar-fallback">{name[0]?.toUpperCase()}</span>
            )}
          </motion.div>
          <h1 data-testid="profile-display-name" className="font-display text-2xl font-bold">{name}</h1>
          <p data-testid="profile-username" className="mt-0.5 text-sm text-muted-foreground">@{profile.username}</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
            {profile.uid && (
              <span data-testid="uid-badge" title="member number" className="inline-flex items-center rounded-full border border-border bg-secondary px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
                #{profile.uid}
              </span>
            )}
            {profile.crowned && (
              <span data-testid="crown-badge" title="most viewed page right now" className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium" style={{ borderColor: "#F5C51844", backgroundColor: "#F5C51814", color: "#F5C518" }}>
                <Crown size={11} /> most viewed
              </span>
            )}
            <RolePills roles={profile.roles || []} />
          </div>
          {welcomeBack && (
            <motion.p
              data-testid="welcome-back-note"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease }}
              className="mt-3 inline-block rounded-full bg-secondary px-3.5 py-1.5 text-xs text-muted-foreground"
            >
              welcome back — you've been here before
            </motion.p>
          )}
          {profile.bio && <p data-testid="profile-bio" className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>}
          {isOwn && (
            <Link data-testid="edit-profile-btn" to="/settings" className="mt-4 inline-block rounded-full border border-border bg-card px-4 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              edit page
            </Link>
          )}
        </header>

        {(() => {
          const showMusic = !!(profile.lastfm_username || pinned);
          const hasLinks = profile.links.length > 0;
          const hasYt = !!profile.youtube_input;
          const hasTw = !!profile.twitch_channel;
          return (
            <div className="grid gap-5 lg:grid-cols-2">
              {profile.discord_id && (
                <div className="lg:col-span-2">
                  <DiscordCard data={discord.data} loading={discord.loading} error={discord.error} onRetry={() => loadDiscord(profile.discord_id)} presence={presence} />
                </div>
              )}
              {showMusic && (
                <div className={hasLinks ? "" : "lg:col-span-2"}>
                  <LastfmCard data={lastfm.data} loading={profile.lastfm_username ? lastfm.loading : false} error={lastfm.error} onRetry={() => profile.lastfm_username && loadLastfm(profile.lastfm_username, true)} pinned={pinned} />
                </div>
              )}
              {hasLinks && (
                <div className={showMusic ? "" : "lg:col-span-2"}>
                  <SocialLinks links={profile.links} username={profile.username} />
                </div>
              )}
              {hasYt && (
                <div className={hasTw ? "" : "lg:col-span-2"}>
                  <YouTubeCard input={profile.youtube_input} />
                </div>
              )}
              {hasTw && (
                <div className={hasYt ? "" : "lg:col-span-2"}>
                  <TwitchCard channel={profile.twitch_channel} />
                </div>
              )}
              {!profile.discord_id && !showMusic && !hasLinks && !hasYt && !hasTw && (
                <p className="rounded-3xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground lg:col-span-2">
                  a blank canvas — for now
                </p>
              )}
            </div>
          );
        })()}

        {(profile.favorite_track || profile.song_url) && (
          <AutoPlayMusic
            query={profile.favorite_track}
            songUrl={profile.song_url ? `${process.env.REACT_APP_BACKEND_URL}${profile.song_url}` : null}
          />
        )}

        <footer className="mt-14 text-center">          <Link data-testid="made-with-badge" to="/" className="text-xs text-muted-foreground/70 transition-colors hover:text-foreground">
            made with <span className="font-serif italic">dontblink</span>
          </Link>
        </footer>
      </motion.main>
    </div>
  );
}
