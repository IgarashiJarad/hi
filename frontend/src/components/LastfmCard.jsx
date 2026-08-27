import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { AudioLines, RefreshCw, ExternalLink, Play, Pause } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ease } from "./motion";

function Equalizer() {
  return (
    <span data-testid="lastfm-equalizer" className="flex h-4 items-end gap-[3px]">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="eq-bar w-[3px] rounded-full bg-[#EF4444]"
          style={{ height: "100%", animationDelay: `${i * 0.18}s`, animationDuration: `${0.7 + i * 0.13}s` }}
        />
      ))}
    </span>
  );
}

function Vinyl({ image, playing }) {
  return (
    <motion.div
      animate={playing ? { rotate: 360 } : { rotate: 0 }}
      transition={playing ? { repeat: Infinity, duration: 12, ease: "linear" } : { duration: 0.6, ease }}
      className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-[3px] border-ink/80 bg-ink shadow-[0_6px_16px_rgba(0,0,0,0.18)]"
    >
      {image && <img src={image} alt="" className="h-full w-full object-cover opacity-90" />}
      <span className="absolute inset-0 m-auto h-3.5 w-3.5 rounded-full border border-stone-500 bg-paper" />
    </motion.div>
  );
}

export function LastfmCard({ data, loading, error, onRetry, pinned }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) a.pause();
    else a.play().catch(() => {});
  };

  if (loading) {
    return (
      <div data-testid="lastfm-card-loading" className="rounded-3xl border border-border bg-card p-5">
        <div className="h-16 w-full animate-pulse rounded-2xl bg-secondary" />
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="lastfm-card-error" className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{error}</p>
          {onRetry && (
            <button data-testid="lastfm-retry-btn" onClick={onRetry} className="text-muted-foreground transition-colors hover:text-foreground">
              <RefreshCw size={16} />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!data && !pinned) return null;

  const now = data?.now_playing;
  const recent = data ? data.tracks.filter((t) => !t.now_playing).slice(0, 4) : [];
  const previewSrc = now?.preview_url || pinned?.preview_url;

  return (
    <motion.div
      data-testid="lastfm-card"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease, delay: 0.08 }}
      className="rounded-3xl border border-border bg-card p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          <AudioLines size={13} /> {data ? "last.fm" : "music"}
        </span>
        {data && (
          <a
            data-testid="lastfm-profile-link"
            href={`https://www.last.fm/user/${data.user}`}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <ExternalLink size={14} />
          </a>
        )}
      </div>

      {previewSrc && (
        <audio
          ref={audioRef}
          data-testid="lastfm-preview-audio"
          src={previewSrc}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
      )}

      {now ? (
        <div data-testid="lastfm-now-playing" className="mb-4 flex items-center gap-4 rounded-2xl tint-lastfm p-3.5">
          <Vinyl image={now.image_url} playing={playing} />
          <div className="min-w-0 flex-1">
            <p className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#EF4444]">
              <Equalizer /> now playing
            </p>
            <p data-testid="lastfm-now-track" className="truncate font-mono text-sm font-medium">{now.name}</p>
            <p data-testid="lastfm-now-artist" className="truncate text-xs text-muted-foreground">{now.artist}</p>
          </div>
          {now.preview_url && (
            <button
              data-testid="lastfm-preview-btn"
              onClick={togglePlay}
              title={playing ? "pause preview" : "play 30s preview"}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#8B5CF6]/25 text-[#A78BFA] transition-colors hover:bg-[#8B5CF6]/40"
            >
              {playing ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
            </button>
          )}
        </div>
      ) : pinned ? (
        <div data-testid="pinned-track" className="mb-4 flex items-center gap-4 rounded-2xl tint-sage p-3.5">
          <Vinyl image={pinned.image_url} playing={playing} />
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A78BFA]">pinned track</p>
            <p data-testid="pinned-track-name" className="truncate font-mono text-sm font-medium">{pinned.name}</p>
            <p data-testid="pinned-track-artist" className="truncate text-xs text-muted-foreground">{pinned.artist}</p>
          </div>
          {pinned.preview_url && (
            <button
              data-testid="pinned-preview-btn"
              onClick={togglePlay}
              title={playing ? "pause preview" : "play 30s preview"}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#8B5CF6]/25 text-[#A78BFA] transition-colors hover:bg-[#8B5CF6]/40"
            >
              {playing ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
            </button>
          )}
        </div>
      ) : (
        <p className="mb-4 rounded-2xl bg-secondary p-3.5 text-xs text-muted-foreground">
          Not listening right now — here are the latest scrobbles.
        </p>
      )}

      <ul data-testid="lastfm-recent-list" className="space-y-2.5">
        {recent.map((t, i) => (
          <li key={`${t.name}-${i}`} data-testid={`lastfm-track-${i}`} className="flex items-center gap-3">
            {t.image_url ? (
              <img src={t.image_url} alt="" className="h-9 w-9 rounded-lg object-cover shadow-sm" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                <AudioLines size={14} className="text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-[13px]">{t.name}</p>
              <p className="truncate text-xs text-muted-foreground">{t.artist}</p>
            </div>
            {t.played_at && (
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {formatDistanceToNow(new Date(Number(t.played_at) * 1000), { addSuffix: true })}
              </span>
            )}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
