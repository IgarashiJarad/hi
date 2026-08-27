import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Fingerprint, AudioLines, MessageSquare, Link2, Eye, MousePointerClick, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { MaskedLine, FadeUp, ease } from "../components/motion";
import { Favicon } from "../components/FaviconImg";
import { DiscordCard } from "../components/DiscordCard";
import { RolePills } from "../components/RolePills";
import { prettyLabel, getDomain } from "../lib/favicon";
import { api, errMsg } from "../lib/api";

const PLATFORMS = ["Discord", "Last.fm", "Spotify", "GitHub", "YouTube", "Instagram", "X", "Twitch", "Substack", "SoundCloud"];

const DEMO_LINKS = ["https://github.com", "https://youtube.com", "https://open.spotify.com", "https://instagram.com"];

const PURPLE = "#8B5CF6";

export function Nav() {
  const { user } = useAuth();
  return (
    <header className="fixed inset-x-0 top-5 z-50 flex justify-center px-4">
      <motion.nav
        data-testid="main-nav"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease }}
        className="flex w-full max-w-3xl items-center justify-between rounded-full border border-white/10 bg-[#1a0f28]/80 px-5 py-2.5 shadow-[0_8px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl"
      >
        <Link to="/" data-testid="nav-brand" className="flex items-center gap-2 font-display text-lg font-bold text-white">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#8B5CF6]/20 text-[#A78BFA]">
            <Eye size={15} />
          </span>
          dontblink
        </Link>
        <div className="hidden items-center gap-1 sm:flex">
          <Link to="/compare" data-testid="nav-compare" className="rounded-full px-3.5 py-2 text-sm text-white/60 transition-colors hover:text-white">compare</Link>
          <Link to="/leaderboard" data-testid="nav-leaderboard" className="rounded-full px-3.5 py-2 text-sm text-white/60 transition-colors hover:text-white">leaderboard</Link>
          <Link to="/pricing" data-testid="nav-pricing" className="rounded-full px-3.5 py-2 text-sm text-white/60 transition-colors hover:text-white">pricing</Link>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <Link data-testid="nav-settings" to="/settings" className="rounded-full bg-[#8B5CF6] px-4 py-2 text-sm font-medium text-white shadow-[0_0_24px_rgba(139,92,246,0.45)] transition-all hover:bg-[#7C4DEF] hover:shadow-[0_0_32px_rgba(139,92,246,0.6)]">
              dashboard
            </Link>
          ) : (
            <>
              <Link data-testid="nav-login" to="/login" className="rounded-full px-4 py-2 text-sm text-white/60 transition-colors hover:text-white">log in</Link>
              <Link data-testid="nav-claim" to="/register" className="rounded-full bg-[#8B5CF6] px-4 py-2 text-sm font-medium text-white shadow-[0_0_24px_rgba(139,92,246,0.45)] transition-all hover:bg-[#7C4DEF] hover:shadow-[0_0_32px_rgba(139,92,246,0.6)]">
                claim yours
              </Link>
            </>
          )}
        </div>
      </motion.nav>
    </header>
  );
}

function StatsMock() {
  return (
    <div className="p-4">
      <p className="mb-3 text-[10px] uppercase tracking-[0.18em] text-white/40">your stats</p>
      <svg viewBox="0 0 240 60" className="mb-2 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0,50 C30,45 45,20 70,28 C95,36 110,10 140,18 C170,26 190,38 240,8 L240,60 L0,60 Z" fill="url(#sparkfill)" />
        <path d="M0,50 C30,45 45,20 70,28 C95,36 110,10 140,18 C170,26 190,38 240,8" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-2xl font-bold text-white">214</span>
        <span className="text-xs text-white/40">page visits</span>
      </div>
      <div className="mt-3 space-y-2">
        {["https://github.com", "https://open.spotify.com", "https://youtube.com"].map((u, i) => (
          <div key={u} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2">
            <Favicon url={u} size={13} />
            <span className="flex-1 truncate text-[11px] text-white/70">{prettyLabel(u)}</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-white/40"><MousePointerClick size={10} /> {[86, 54, 31][i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileMock() {
  return (
    <div className="p-4">
      <div className="mb-3 flex items-center gap-3">
        <div className="relative">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#5B21B6] font-display text-lg font-bold text-white">w</div>
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#160b24] bg-[#43B581] soft-pulse" />
        </div>
        <div>
          <p className="font-display text-sm font-bold text-white">wren</p>
          <p className="text-[10px] text-white/40">dontblink.site/wren</p>
        </div>
        <span className="ml-auto rounded-full bg-[#43B581]/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#43B581]">online now</span>
      </div>
      <div className="mb-2.5 flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#8B5CF6]/10 p-2.5">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
          className="relative h-9 w-9 shrink-0 rounded-full border-2 border-black/60 bg-gradient-to-br from-[#2a1a45] to-black"
        >
          <span className="absolute inset-0 m-auto h-2 w-2 rounded-full bg-white/80" />
        </motion.div>
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A78BFA]">listening to spotify</p>
          <p className="truncate text-[11px] text-white/80">Pink + White — Frank Ocean</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {DEMO_LINKS.map((u) => (
          <div key={u} className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5">
            <Favicon url={u} size={12} />
            <span className="truncate text-[10px] text-white/70">{prettyLabel(u)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Showcase() {
  return (
    <div className="relative mx-auto mt-16 max-w-5xl px-6" style={{ perspective: "1400px" }}>
      <div className="pointer-events-none absolute inset-x-0 top-10 mx-auto h-72 max-w-3xl rounded-full bg-[#8B5CF6]/25 blur-[120px]" />
      <div className="relative flex items-end justify-center gap-4 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 80, rotateY: 14, rotateZ: -4 }}
          animate={{ opacity: 1, y: 0, rotateY: 14, rotateZ: -4 }}
          transition={{ duration: 1, ease, delay: 0.7 }}
          className="hidden w-64 shrink-0 overflow-hidden rounded-2xl border border-[#8B5CF6]/30 bg-[#160b24]/90 shadow-[0_0_50px_rgba(139,92,246,0.25)] sm:block"
        >
          <StatsMock />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 0.55 }}
          className="z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-[#8B5CF6]/40 bg-[#160b24]/95 shadow-[0_0_70px_rgba(139,92,246,0.35)]"
        >
          <ProfileMock />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 80, rotateY: -14, rotateZ: 4 }}
          animate={{ opacity: 1, y: 0, rotateY: -14, rotateZ: 4 }}
          transition={{ duration: 1, ease, delay: 0.85 }}
          className="hidden w-64 shrink-0 overflow-hidden rounded-2xl border border-[#8B5CF6]/30 bg-[#160b24]/90 shadow-[0_0_50px_rgba(139,92,246,0.25)] sm:block"
        >
          <div className="p-4">
            <p className="mb-3 text-[10px] uppercase tracking-[0.18em] text-white/40">page theme</p>
            <div className="grid grid-cols-2 gap-1.5">
              {["Paper", "Charcoal", "Moss", "Ember"].map((t, i) => (
                <div
                  key={t}
                  className="rounded-lg border border-white/10 px-2.5 py-2 text-[10px] text-white/70"
                  style={{ background: ["#F8F7F4", "#121211", "#0F1611", "#1A100C"][i], color: i === 0 ? "#1C1B19" : undefined }}
                >
                  {t}
                </div>
              ))}
            </div>
            <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-[#8B5CF6]/15 px-2.5 py-2">
              <span className="text-[10px] text-[#A78BFA]">auto day / night</span>
              <span className="ml-auto h-3.5 w-6 rounded-full bg-[#8B5CF6] p-0.5"><span className="block h-2.5 w-2.5 translate-x-2.5 rounded-full bg-white" /></span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Marquee() {
  const row = [...PLATFORMS, ...PLATFORMS];
  return (
    <div data-testid="platform-marquee" className="overflow-hidden border-y border-white/10 py-6">
      <div className="marquee-track flex w-max items-center gap-10">
        {row.map((p, i) => (
          <span key={i} className="flex items-center gap-10">
            <span className="font-serif text-2xl italic text-white/50">{p}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#8B5CF6]/50" />
          </span>
        ))}
      </div>
    </div>
  );
}

const FEATURES = [
  { icon: MessageSquare, span: "md:col-span-7", title: "Discord, mirrored live", body: "Paste your user ID and your avatar, banner, name — even your live status and Spotify — show up on your page.", testid: "feature-discord" },
  { icon: AudioLines, span: "md:col-span-5", title: "Your music, spinning", body: "Hook up Last.fm and your page plays along — a spinning vinyl with whatever you're hearing right now.", testid: "feature-lastfm" },
  { icon: Link2, span: "md:col-span-5", title: "Favicons, found for you", body: "Paste any link and its icon appears automatically. No uploading, no fiddling.", testid: "feature-favicon" },
  { icon: Fingerprint, span: "md:col-span-7", title: "Stats, themes, and a wink", body: "Visit sparklines, referrer lists, five page themes with auto day/night — and a tab icon that blinks when people look away.", testid: "feature-stats" },
];

function Playground() {
  const [url, setUrl] = useState("");
  const [discordId, setDiscordId] = useState("");
  const [dState, setDState] = useState({ loading: false, data: null, error: null });

  const domain = getDomain(url);
  const fullUrl = domain ? (/^https?:\/\//i.test(url) ? url : `https://${url}`) : null;

  const fetchDiscord = async () => {
    setDState({ loading: true, data: null, error: null });
    try {
      const r = await api.get(`/discord/${discordId.trim()}`);
      setDState({ loading: false, data: r.data, error: null });
    } catch (e) {
      setDState({ loading: false, data: null, error: errMsg(e, "Lookup failed") });
    }
  };

  return (
    <section id="playground" className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
      <FadeUp>
        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[#A78BFA]">try it, no account needed</p>
        <h2 className="mb-12 max-w-lg font-display text-4xl font-bold text-white sm:text-5xl">Watch it work, live.</h2>
      </FadeUp>
      <div className="grid gap-6 lg:grid-cols-2">
        <FadeUp className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
          <p className="mb-2 font-display text-lg font-bold text-white">Favicon engine</p>
          <p className="mb-5 text-sm text-white/50">Type any site — we find its icon.</p>
          <input
            data-testid="playground-url-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="try youtube.com or your own site"
            className="mb-4 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-[#8B5CF6]"
          />
          <div className="flex min-h-[52px] items-center">
            {fullUrl ? (
              <motion.div
                key={fullUrl}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease }}
                className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-4 py-2.5"
              >
                <Favicon url={fullUrl} size={18} />
                <span className="text-sm font-medium text-white">{prettyLabel(fullUrl)}</span>
                <ArrowUpRight size={14} className="text-white/40" />
              </motion.div>
            ) : (
              <p className="text-sm text-white/30">your chip appears here…</p>
            )}
          </div>
        </FadeUp>

        <FadeUp delay={0.1} className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
          <p className="mb-2 font-display text-lg font-bold text-white">Discord mirror</p>
          <p className="mb-5 text-sm text-white/50">Paste any Discord user ID — we fetch the real profile.</p>
          <div className="mb-4 flex gap-2">
            <input
              data-testid="playground-discord-input"
              value={discordId}
              onChange={(e) => setDiscordId(e.target.value)}
              placeholder="e.g. 80351110224678912"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-[#8B5CF6]"
            />
            <button
              data-testid="playground-discord-fetch-btn"
              onClick={fetchDiscord}
              disabled={dState.loading || !discordId.trim()}
              className="shrink-0 rounded-xl bg-[#8B5CF6] px-4 py-3 text-sm font-medium text-white shadow-[0_0_20px_rgba(139,92,246,0.35)] transition-all hover:bg-[#7C4DEF] disabled:opacity-40"
            >
              fetch
            </button>
          </div>
          {dState.loading || dState.error || dState.data ? (
            <DiscordCard data={dState.data} loading={dState.loading} error={dState.error} onRetry={fetchDiscord} />
          ) : (
            <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-white/15">
              <p className="text-sm text-white/30">profile appears here…</p>
            </div>
          )}
        </FadeUp>
      </div>
    </section>
  );
}

const COMPARE_ROWS = [
  { label: "price to start", us: "free", linktree: "free", carrd: "free" },
  { label: "premium price", us: "$4.99 once, forever", linktree: "$5–24 / month", carrd: "$19 / year" },
  { label: "live Discord profile + status", us: true, linktree: false, carrd: false },
  { label: "Last.fm now-playing vinyl", us: true, linktree: false, carrd: false },
  { label: "auto-detected favicons", us: true, linktree: "paid", carrd: false },
  { label: "page stats + referrers", us: true, linktree: "paid", carrd: "paid" },
  { label: "dark theme included free", us: true, linktree: "paid", carrd: false },
  { label: "tab icon that blinks back", us: true, linktree: false, carrd: false },
];

function Cell({ v, highlight }) {
  if (v === true) return <Check size={16} className={highlight ? "text-[#A78BFA]" : "text-white/50"} />;
  if (v === false) return <X size={15} className="text-white/20" />;
  return <span className={`text-xs ${highlight ? "text-[#A78BFA]" : "text-white/40"}`}>{v}</span>;
}

export function Compare() {
  return (
    <section id="compare" className="mx-auto max-w-5xl px-6 py-24 sm:py-32">
      <FadeUp>
        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[#A78BFA]">why switch</p>
        <h2 className="mb-4 font-display text-4xl font-bold text-white sm:text-5xl">The clear edge.</h2>
        <p className="mb-12 max-w-lg text-sm text-white/50 sm:text-base">Same job as the usual suspects — but alive. Your page moves with your Discord and your music, and premium is a one-time coffee, not a monthly rent.</p>
      </FadeUp>
      <FadeUp delay={0.1}>
        <div data-testid="compare-table" className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] border-b border-white/10 bg-white/[0.03] px-5 py-4 text-xs uppercase tracking-[0.14em] text-white/40 sm:px-7">
            <span />
            <span className="font-display text-sm font-bold normal-case tracking-normal text-[#A78BFA]">dontblink</span>
            <span>linktree</span>
            <span>carrd</span>
          </div>
          {COMPARE_ROWS.map((r, i) => (
            <div key={r.label} data-testid={`compare-row-${i}`} className="grid grid-cols-[1.4fr_1fr_1fr_1fr] items-center border-b border-white/5 px-5 py-3.5 last:border-0 sm:px-7">
              <span className="pr-3 text-sm text-white/70">{r.label}</span>
              <span className="flex justify-start"><Cell v={r.us} highlight /></span>
              <span className="flex justify-start"><Cell v={r.linktree} /></span>
              <span className="flex justify-start"><Cell v={r.carrd} /></span>
            </div>
          ))}
        </div>
      </FadeUp>
    </section>
  );
}

const MEDALS = ["#F5C518", "#C0C0C0", "#CD7F32"];

export function Leaderboard() {
  const [leaders, setLeaders] = useState(null);

  useEffect(() => {
    api.get("/leaderboard").then((r) => setLeaders(r.data.leaders)).catch(() => setLeaders([]));
  }, []);

  return (
    <section id="leaderboard" className="border-y border-white/10 bg-white/[0.02] py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-6">
        <FadeUp>
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[#A78BFA]">most-watched pages</p>
          <h2 className="mb-4 font-display text-4xl font-bold text-white sm:text-5xl">The leaderboard.</h2>
          <p className="mb-12 max-w-lg text-sm text-white/50 sm:text-base">The pages catching the most eyes right now. Claim yours and start climbing.</p>
        </FadeUp>
        <FadeUp delay={0.1}>
          <div data-testid="leaderboard-list" className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
            {leaders === null ? (
              <div className="space-y-3 p-6">
                {[0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-white/5" />)}
              </div>
            ) : leaders.length === 0 ? (
              <p className="p-10 text-center text-sm text-white/40">no views yet — the crown is wide open</p>
            ) : (
              leaders.map((l, i) => (
                <Link
                  key={l.username}
                  to={`/${l.username}`}
                  data-testid={`leaderboard-entry-${i}`}
                  className="group flex items-center gap-4 border-b border-white/5 px-5 py-4 transition-colors last:border-0 hover:bg-white/5 sm:px-7"
                >
                  <span className="w-7 font-display text-lg font-bold" style={{ color: MEDALS[i] || "rgba(255,255,255,0.3)" }}>
                    {i + 1}
                  </span>
                  {l.avatar_url ? (
                    <img src={`${process.env.REACT_APP_BACKEND_URL}${l.avatar_url}`} alt="" className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#8B5CF6]/20 font-display text-sm font-bold text-[#A78BFA]">
                      {l.display_name[0]?.toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-sm font-semibold text-white">{l.display_name}</p>
                      <RolePills roles={l.roles} />
                    </div>
                    <p className="truncate text-xs text-white/40">@{l.username}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-sm text-white/60">
                    <Eye size={14} className="text-[#A78BFA]" /> {l.views.toLocaleString()}
                  </span>
                </Link>
              ))
            )}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

export function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const unlock = async () => {
    if (!user) {
      navigate("/register");
      return;
    }
    setBusy(true);
    try {
      const r = await api.post("/payments/checkout", { lookup_key: "theme_pack", origin_url: window.location.origin });
      window.location.href = r.data.checkout_url;
    } catch (e) {
      toast.error(errMsg(e, "Could not start checkout"));
      setBusy(false);
    }
  };

  const free = ["your quiet page at dontblink.site/you", "live Discord mirror + online status", "Last.fm now-playing vinyl", "12 links with auto favicons", "stats, referrers + 14-day sparkline", "Paper & Charcoal themes", "a tab icon that blinks back"];
  const premium = ["everything in free", "Moss, Ember & Dusk themes", "every future theme, automatically", "one-time payment — yours forever"];

  return (
    <section id="pricing" className="mx-auto max-w-5xl px-6 py-24 sm:py-32">
      <FadeUp>
        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[#A78BFA]">pricing</p>
        <h2 className="mb-12 font-display text-4xl font-bold text-white sm:text-5xl">Free is real. Premium is once.</h2>
      </FadeUp>
      <div className="grid gap-6 md:grid-cols-2">
        <FadeUp className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="font-display text-lg font-bold text-white">Free</p>
          <p className="mt-1 font-display text-4xl font-bold text-white">$0</p>
          <p className="mb-7 mt-1 text-xs text-white/40">forever, no card</p>
          <ul className="mb-8 space-y-3">
            {free.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-white/70">
                <Check size={15} className="mt-0.5 shrink-0 text-white/40" /> {f}
              </li>
            ))}
          </ul>
          <Link to="/register" data-testid="pricing-free-btn" className="block rounded-full border border-white/15 py-3 text-center text-sm font-medium text-white/80 transition-colors hover:border-white/30 hover:text-white">
            claim your page
          </Link>
        </FadeUp>
        <FadeUp delay={0.1} className="relative overflow-hidden rounded-3xl border border-[#8B5CF6]/50 bg-[#8B5CF6]/10 p-8 shadow-[0_0_60px_rgba(139,92,246,0.2)]">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#8B5CF6]/30 blur-[70px]" />
          <p className="font-display text-lg font-bold text-white">Premium</p>
          <p className="mt-1 font-display text-4xl font-bold text-white">$4.99</p>
          <p className="mb-7 mt-1 text-xs text-[#A78BFA]">once — never again</p>
          <ul className="mb-8 space-y-3">
            {premium.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-white/80">
                <Check size={15} className="mt-0.5 shrink-0 text-[#A78BFA]" /> {f}
              </li>
            ))}
          </ul>
          {user?.theme_pack ? (
            <p data-testid="pricing-owned" className="rounded-full bg-[#8B5CF6]/20 py-3 text-center text-sm font-medium text-[#A78BFA]">unlocked on your account</p>
          ) : (
            <button data-testid="pricing-unlock-btn" onClick={unlock} disabled={busy} className="w-full rounded-full bg-[#8B5CF6] py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all hover:bg-[#7C4DEF] disabled:opacity-50">
              {busy ? "opening checkout…" : user ? "unlock premium" : "claim + unlock"}
            </button>
          )}
        </FadeUp>
      </div>
    </section>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [claim, setClaim] = useState("");

  const go = () => {
    if (!claim.trim()) {
      toast.error("Pick a username first");
      return;
    }
    navigate(`/register?u=${encodeURIComponent(claim.trim().toLowerCase())}`);
  };

  return (
    <div data-testid="landing-page" data-theme="dusk" className="min-h-screen bg-[#0d0714] text-white">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[480px] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.18),transparent_60%)]" />
      <Nav />

      <section className="relative overflow-hidden pb-8 pt-40 sm:pt-48">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="font-display text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
            <MaskedLine delay={0.15}>Everything you are,</MaskedLine>
            <MaskedLine delay={0.3}>
              <span className="text-[#A78BFA]">right here.</span>
            </MaskedLine>
          </h1>
          <FadeUp delay={0.45}>
            <p className="mx-auto mt-6 max-w-xl text-base text-white/55 sm:text-lg">
              dontblink is your corner for modern link-in-bio pages — a live Discord mirror, Last.fm scrobbles on a spinning vinyl, and icons that find themselves.
            </p>
          </FadeUp>
          <FadeUp delay={0.58}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <button
                data-testid="hero-claim-btn"
                onClick={() => navigate("/register")}
                className="group inline-flex items-center gap-2 rounded-full bg-[#8B5CF6] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_0_36px_rgba(139,92,246,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#7C4DEF] hover:shadow-[0_0_50px_rgba(139,92,246,0.7)]"
              >
                claim yours — free <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>
              <Link
                data-testid="hero-demo-btn"
                to="/wren"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-medium text-white/80 backdrop-blur transition-all duration-300 hover:border-white/30 hover:text-white"
              >
                see a live page
              </Link>
            </div>
          </FadeUp>
          <FadeUp delay={0.7}>
            <div className="mx-auto mt-8 flex max-w-md items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1.5 backdrop-blur">
              <span className="pl-4 font-mono text-xs text-white/40">dontblink.site/</span>
              <input
                data-testid="claim-username-input"
                value={claim}
                onChange={(e) => setClaim(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && go()}
                placeholder="you"
                maxLength={20}
                className="w-full bg-transparent py-2 font-mono text-sm text-white outline-none placeholder:text-white/25"
              />
              <button
                data-testid="claim-username-btn"
                onClick={go}
                className="shrink-0 rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-white/20"
              >
                claim
              </button>
            </div>
          </FadeUp>
        </div>

        <Showcase />
      </section>

      <Marquee />

      <section id="features" className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <FadeUp>
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[#A78BFA]">what your page holds</p>
          <h2 className="mb-12 font-display text-4xl font-bold text-white sm:text-5xl">Small page. Whole you.</h2>
        </FadeUp>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {FEATURES.map((f, i) => (
            <FadeUp key={f.title} delay={i * 0.08} className={`${f.span} rounded-3xl border border-white/10 bg-white/5 p-7 transition-all duration-500 hover:border-[#8B5CF6]/40 hover:bg-white/[0.07] sm:p-9`}>
              <span data-testid={f.testid} className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#8B5CF6]/15 text-[#A78BFA]">
                <f.icon size={20} strokeWidth={1.8} />
              </span>
              <h3 className="mb-2 font-display text-xl font-bold text-white">{f.title}</h3>
              <p className="max-w-md text-sm leading-relaxed text-white/50">{f.body}</p>
            </FadeUp>
          ))}
        </div>
      </section>

      <Playground />

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-serif text-6xl italic text-white/80 sm:text-7xl">dontblink</p>
            <p className="mt-3 max-w-xs text-sm text-white/40">Your data stays yours. No trackers, no noise — just a page that feels like home.</p>
          </div>
          <div className="flex gap-6 text-sm">
            <Link data-testid="footer-login" to="/login" className="text-white/50 transition-colors hover:text-white">log in</Link>
            <Link data-testid="footer-claim" to="/register" className="inline-flex items-center gap-1 text-white transition-colors hover:text-[#A78BFA]">
              claim yours <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
