import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Fingerprint, AudioLines, MessageSquare, Link2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { MaskedLine, FadeUp, ease } from "../components/motion";
import { Favicon } from "../components/FaviconImg";
import { DiscordCard } from "../components/DiscordCard";
import { prettyLabel, getDomain } from "../lib/favicon";
import { api, errMsg } from "../lib/api";

const DEMO_AVATAR =
  "https://images.unsplash.com/photo-1740252117013-4fb21771e7ca?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwYXZhdGFyJTIwYWVzdGhldGljJTIwcHJvZmlsZXxlbnwwfHx8fDE3ODc4MDYyNzZ8MA&ixlib=rb-4.1.0&q=85";

const PLATFORMS = ["Discord", "Last.fm", "Spotify", "GitHub", "YouTube", "Instagram", "X", "Twitch", "Substack", "SoundCloud"];

const DEMO_LINKS = ["https://github.com", "https://youtube.com", "https://open.spotify.com", "https://instagram.com"];

function Nav() {
  const { user } = useAuth();
  return (
    <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <nav data-testid="main-nav" className="flex w-full max-w-2xl items-center justify-between rounded-full border border-border/80 bg-white/80 px-5 py-2.5 shadow-sm backdrop-blur-xl">
        <Link to="/" data-testid="nav-brand" className="font-serif text-xl font-semibold italic">dontblink</Link>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link data-testid="nav-my-page" to={`/${user.username}`} className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                my page
              </Link>
              <Link data-testid="nav-settings" to="/settings" className="rounded-full bg-ink px-4 py-2 text-sm text-paper transition-colors hover:bg-ink/85">
                settings
              </Link>
            </>
          ) : (
            <>
              <Link data-testid="nav-login" to="/login" className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                log in
              </Link>
              <Link data-testid="nav-claim" to="/register" className="group inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm text-paper transition-colors hover:bg-ink/85">
                claim yours <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

function DemoProfileCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotate: 1.5 }}
      animate={{ opacity: 1, y: 0, rotate: 1.5 }}
      transition={{ duration: 0.9, ease, delay: 0.5 }}
      className="relative mx-auto w-full max-w-sm"
    >
      <div className="rounded-3xl border border-border bg-card p-5 shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
        <div className="mb-4 flex items-center gap-3">
          <img src={DEMO_AVATAR} alt="demo avatar" className="h-12 w-12 rounded-full object-cover" />
          <div>
            <p className="font-display font-bold leading-tight">wren</p>
            <p className="text-xs text-muted-foreground">dontblink.site/wren</p>
          </div>
          <span className="ml-auto rounded-full bg-secondary px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            live demo
          </span>
        </div>

        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
          className="mb-3 rounded-2xl border border-border bg-[#EEF1FF] p-3"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5865F2] text-white">
              <MessageSquare size={14} />
            </span>
            <div>
              <p className="text-xs font-semibold">wren · connected</p>
              <p className="text-[10px] text-muted-foreground">discord profile mirror</p>
            </div>
            <span className="ml-auto h-2 w-2 rounded-full bg-[#3F5E4D] soft-pulse" />
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 0.6 }}
          className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-[#FDF2F2] p-3"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
            className="relative h-10 w-10 shrink-0 rounded-full border-2 border-ink/80 bg-ink"
          >
            <span className="absolute inset-0 m-auto h-2 w-2 rounded-full bg-paper" />
          </motion.div>
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#BA2727]">now playing</p>
            <p className="truncate font-mono text-xs">Pink + White — Frank Ocean</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-2">
          {DEMO_LINKS.map((u) => (
            <div key={u} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
              <Favicon url={u} size={14} />
              <span className="truncate text-xs">{prettyLabel(u)}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function Marquee() {
  const row = [...PLATFORMS, ...PLATFORMS];
  return (
    <div data-testid="platform-marquee" className="overflow-hidden border-y border-border bg-white/50 py-5">
      <div className="marquee-track flex w-max items-center gap-10">
        {row.map((p, i) => (
          <span key={i} className="flex items-center gap-10">
            <span className="font-serif text-2xl italic text-ink/70">{p}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-terracotta/60" />
          </span>
        ))}
      </div>
    </div>
  );
}

const FEATURES = [
  {
    icon: Link2,
    span: "md:col-span-7",
    title: "Favicons, found for you",
    body: "Paste any link and its icon appears automatically — no uploading, no fiddling. Known platforms get their own hand-picked glyphs.",
    testid: "feature-favicon",
  },
  {
    icon: AudioLines,
    span: "md:col-span-5",
    title: "Your music, live",
    body: "Hook up Last.fm and your page hums with whatever you're spinning right now — vinyl and all.",
    testid: "feature-lastfm",
  },
  {
    icon: MessageSquare,
    span: "md:col-span-6",
    title: "Discord, mirrored",
    body: "Drop in your Discord user ID. Your avatar, banner and name show up on your page — always in sync.",
    testid: "feature-discord",
  },
  {
    icon: Fingerprint,
    span: "md:col-span-6",
    title: "One quiet link",
    body: "You get dontblink.site/you. Nothing loud, nothing cluttered. Just you, softly.",
    testid: "feature-link",
  },
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
    <section className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
      <FadeUp>
        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">try it, no account needed</p>
        <h2 className="mb-12 max-w-lg font-display text-4xl font-bold sm:text-5xl">Watch it work, live.</h2>
      </FadeUp>
      <div className="grid gap-6 lg:grid-cols-2">
        <FadeUp className="rounded-3xl border border-border bg-card p-6 sm:p-8">
          <p className="mb-2 font-display text-lg font-bold">Favicon engine</p>
          <p className="mb-5 text-sm text-muted-foreground">Type any site — we find its icon.</p>
          <input
            data-testid="playground-url-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="try youtube.com or your own site"
            className="mb-4 w-full rounded-xl border border-input bg-paper px-4 py-3 text-sm outline-none transition-colors focus:border-sage"
          />
          <div className="flex min-h-[52px] items-center">
            {fullUrl ? (
              <motion.div
                key={fullUrl}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease }}
                className="inline-flex items-center gap-2.5 rounded-full border border-border bg-paper px-4 py-2.5"
              >
                <Favicon url={fullUrl} size={18} />
                <span className="text-sm font-medium">{prettyLabel(fullUrl)}</span>
                <ArrowUpRight size={14} className="text-muted-foreground" />
              </motion.div>
            ) : (
              <p className="text-sm text-muted-foreground/60">your chip appears here…</p>
            )}
          </div>
        </FadeUp>

        <FadeUp delay={0.1} className="rounded-3xl border border-border bg-card p-6 sm:p-8">
          <p className="mb-2 font-display text-lg font-bold">Discord mirror</p>
          <p className="mb-5 text-sm text-muted-foreground">Paste any Discord user ID — we fetch the real profile.</p>
          <div className="mb-4 flex gap-2">
            <input
              data-testid="playground-discord-input"
              value={discordId}
              onChange={(e) => setDiscordId(e.target.value)}
              placeholder="e.g. 80351110224678912"
              className="w-full rounded-xl border border-input bg-paper px-4 py-3 font-mono text-sm outline-none transition-colors focus:border-sage"
            />
            <button
              data-testid="playground-discord-fetch-btn"
              onClick={fetchDiscord}
              disabled={dState.loading || !discordId.trim()}
              className="shrink-0 rounded-xl bg-ink px-4 py-3 text-sm text-paper transition-colors hover:bg-ink/85 disabled:opacity-40"
            >
              fetch
            </button>
          </div>
          {dState.loading || dState.error || dState.data ? (
            <DiscordCard
              data={dState.data}
              loading={dState.loading}
              error={dState.error}
              onRetry={fetchDiscord}
            />
          ) : (
            <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-border">
              <p className="text-sm text-muted-foreground/60">profile appears here…</p>
            </div>
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
    <div data-testid="landing-page" className="min-h-screen">
      <Nav />

      <section className="mx-auto grid max-w-6xl gap-14 px-6 pb-24 pt-36 sm:pt-44 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-7">
          <MaskedLine delay={0.05}>
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">link-in-bio, softly</span>
          </MaskedLine>
          <h1 className="mt-5 font-display text-4xl font-bold leading-[1.04] sm:text-5xl lg:text-6xl">
            <MaskedLine delay={0.15}>Your corner of</MaskedLine>
            <MaskedLine delay={0.28}>the internet,</MaskedLine>
            <MaskedLine delay={0.41}>
              <span className="font-serif font-medium italic text-sage">in one quiet page.</span>
            </MaskedLine>
          </h1>
          <FadeUp delay={0.55}>
            <p className="mt-6 max-w-md text-base text-muted-foreground sm:text-lg">
              Mirror your Discord, stream your Last.fm scrobbles, and stack every social link with its icon found for you.
            </p>
          </FadeUp>
          <FadeUp delay={0.68}>
            <div className="mt-8 flex max-w-md items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
              <span className="pl-3 font-mono text-sm text-muted-foreground">dontblink.site/</span>
              <input
                data-testid="claim-username-input"
                value={claim}
                onChange={(e) => setClaim(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && go()}
                placeholder="you"
                maxLength={20}
                className="w-full bg-transparent py-2.5 font-mono text-sm outline-none"
              />
              <button
                data-testid="claim-username-btn"
                onClick={go}
                className="group inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-sage px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-sage/90"
              >
                claim <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>
            </div>
            <p className="mt-3 pl-1 text-xs text-muted-foreground">free forever · takes about a minute</p>
          </FadeUp>
        </div>
        <div className="lg:col-span-5">
          <DemoProfileCard />
        </div>
      </section>

      <Marquee />

      <section className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <FadeUp>
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">what your page holds</p>
          <h2 className="mb-12 font-display text-4xl font-bold sm:text-5xl">Small page. Whole you.</h2>
        </FadeUp>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {FEATURES.map((f, i) => (
            <FadeUp key={f.title} delay={i * 0.08} className={`${f.span} rounded-3xl border border-border bg-card p-7 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-shadow duration-500 hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)] sm:p-9`}>
              <span data-testid={f.testid} className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sage-light text-sage">
                <f.icon size={20} strokeWidth={1.8} />
              </span>
              <h3 className="mb-2 font-display text-xl font-bold">{f.title}</h3>
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </FadeUp>
          ))}
        </div>
      </section>

      <Playground />

      <footer className="border-t border-border bg-white/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-serif text-6xl italic text-ink/80 sm:text-7xl">dontblink</p>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">Your data stays yours. No trackers, no noise — just a page that feels like home.</p>
          </div>
          <div className="flex gap-6 text-sm">
            <Link data-testid="footer-login" to="/login" className="text-muted-foreground transition-colors hover:text-foreground">log in</Link>
            <Link data-testid="footer-claim" to="/register" className="inline-flex items-center gap-1 text-foreground transition-colors hover:text-sage">
              claim yours <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
