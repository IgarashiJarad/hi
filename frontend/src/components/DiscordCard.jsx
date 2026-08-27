import { motion } from "framer-motion";
import { Copy, Check, MessageSquare, RefreshCw, Play, Pause } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ease } from "./motion";

export function DiscordCard({ data, loading, error, onRetry, presence }) {
  const [copied, setCopied] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);

  const copyId = () => {
    if (!data?.id) return;
    navigator.clipboard.writeText(data.id);
    setCopied(true);
    toast.success("Discord ID copied");
    setTimeout(() => setCopied(false), 1600);
  };

  if (loading) {
    return (
      <div data-testid="discord-card-loading" className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="h-24 animate-pulse tint-discord" />
        <div className="p-5">
          <div className="h-4 w-32 animate-pulse rounded bg-secondary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="discord-card-error" className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{error}</p>
          {onRetry && (
            <button data-testid="discord-retry-btn" onClick={onRetry} className="text-muted-foreground transition-colors hover:text-foreground">
              <RefreshCw size={16} />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const name = data.global_name || data.username;
  const accent = data.accent_color ? `#${data.accent_color.toString(16).padStart(6, "0")}` : "#5865F2";
  const STATUS_COLORS = { online: "#43B581", idle: "#FAA61A", dnd: "#F04747", offline: "#747F8D" };
  const live = presence?.monitored && presence.status !== "offline";
  const dotColor = presence?.monitored ? STATUS_COLORS[presence.status] || STATUS_COLORS.offline : "#3F5E4D";

  return (
    <motion.div
      data-testid="discord-card"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease }}
      className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
    >
      <div className="relative h-24 sm:h-28">
        {data.banner_url ? (
          <img
            data-testid="discord-banner-img"
            src={data.banner_url}
            alt="Discord banner"
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            data-testid="discord-banner-fallback"
            className="h-full w-full"
            style={{ background: `linear-gradient(120deg, ${accent}22, ${accent}55)` }}
          />
        )}
      </div>
      <div className="relative px-5 pb-5">
        <div className="-mt-10 mb-3 flex items-end justify-between">
          <div className="relative">
            {data.avatar_url ? (
              <img
                data-testid="discord-avatar-img"
                src={data.avatar_url}
                alt={name}
                className="h-20 w-20 rounded-full border-4 border-card object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-card bg-[#5865F2] font-display text-2xl font-bold text-white">
                {name?.[0]?.toUpperCase()}
              </div>
            )}
            <span data-testid="discord-status-dot" className={`absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-card ${live ? "soft-pulse" : ""}`} style={{ backgroundColor: dotColor }} />
          </div>
          {live ? (
            <span data-testid="discord-online-badge" className="mb-1 inline-flex items-center gap-1.5 rounded-full tint-sage px-3 py-1 text-[11px] font-medium text-sage">
              <span className="h-1.5 w-1.5 rounded-full bg-[#43B581] soft-pulse" /> online now
            </span>
          ) : (
            <span className="mb-1 inline-flex items-center gap-1.5 rounded-full tint-discord px-3 py-1 text-[11px] font-medium text-[#5865F2]">
              <MessageSquare size={12} /> connected
            </span>
          )}
        </div>
        <p data-testid="discord-display-name" className="font-display text-lg font-bold leading-tight">{name}</p>
        <div className="mt-0.5 flex items-center gap-2">
          <p data-testid="discord-username" className="text-sm text-muted-foreground">@{data.username}</p>
          <button
            data-testid="discord-copy-id-btn"
            onClick={copyId}
            title="Copy Discord ID"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
        </div>
        {presence?.spotify?.album_art ? (
          <div data-testid="discord-spotify-vinyl" className="mt-3 flex items-center gap-3 rounded-2xl tint-sage p-2.5">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
              className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-ink/70 shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
            >
              <img src={presence.spotify.album_art} alt="album art" className="h-full w-full object-cover" />
              <span className="absolute inset-0 m-auto h-2 w-2 rounded-full bg-card" />
            </motion.div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sage">listening to spotify</p>
              <p data-testid="spotify-track-line" className="truncate text-xs font-medium">{presence.spotify.song} — {presence.spotify.artist}</p>
            </div>
            {presence.spotify.track_id && (
              <button
                data-testid="spotify-play-btn"
                onClick={() => setShowPlayer(!showPlayer)}
                title={showPlayer ? "hide preview" : "play 30s preview"}
                className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#8B5CF6]/20 text-[#A78BFA] transition-colors hover:bg-[#8B5CF6]/35"
              >
                {showPlayer ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
              </button>
            )}
          </div>
        ) : presence?.activity && (
          <p data-testid="discord-activity" className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-[#43B581]" /> {presence.activity}
          </p>
        )}
        {showPlayer && presence?.spotify?.track_id && (
          <motion.iframe
            data-testid="spotify-embed"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 80 }}
            transition={{ duration: 0.4, ease }}
            src={`https://open.spotify.com/embed/track/${presence.spotify.track_id}?utm_source=generator&theme=0`}
            className="mt-3 w-full overflow-hidden rounded-xl border-0"
            height="80"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title="Spotify preview"
          />
        )}
      </div>
    </motion.div>
  );
}
