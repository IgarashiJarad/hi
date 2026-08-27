import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Volume2 } from "lucide-react";
import { api } from "../lib/api";
import { ease } from "./motion";

export function AutoPlayMusic({ query, songUrl }) {
  const [track, setTrack] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef(null);

  useEffect(() => {
    if (songUrl) {
      setTrack({ preview_url: songUrl, name: query || "favorite song", artist: "uploaded by the page owner", image_url: null });
      return;
    }
    if (!query) return;
    api.get("/track/preview", { params: { q: query } }).then((r) => setTrack(r.data)).catch(() => {});
  }, [query, songUrl]);

  useEffect(() => {
    const a = audioRef.current;
    if (!track?.preview_url || !a) return;
    a.volume = volume;
    a.play().then(() => setPlaying(true)).catch(() => setBlocked(true));
  }, [track]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
    } else {
      a.play().then(() => setBlocked(false)).catch(() => {});
    }
  };

  if (!track) return null;

  return (
    <>
      <audio
        ref={audioRef}
        data-testid="favorite-audio"
        src={track.preview_url}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
      <motion.div
        data-testid="music-player"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease, delay: 0.4 }}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-2xl border border-border bg-card/90 px-3.5 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl"
      >
        {track.image_url && <img src={track.image_url} alt="" className="h-9 w-9 rounded-lg object-cover" />}
        <div className="max-w-[130px] min-w-0">
          <p data-testid="music-player-name" className="truncate text-xs font-medium">{track.name}</p>
          <p className="truncate text-[10px] text-muted-foreground">{track.artist}</p>
        </div>
        <button
          data-testid="music-toggle-btn"
          onClick={toggle}
          title={playing ? "pause" : "play"}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${blocked && !playing ? "bg-[#8B5CF6] text-white soft-pulse" : "bg-secondary text-foreground hover:bg-border"}`}
        >
          {playing ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
        </button>
        <div className="flex items-center gap-1.5">
          <Volume2 size={13} className="shrink-0 text-muted-foreground" />
          <input
            data-testid="music-volume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            title="volume"
            className="w-16 accent-[#8B5CF6]"
          />
        </div>
      </motion.div>
      {blocked && !playing && (
        <motion.p
          data-testid="music-tap-hint"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed bottom-[76px] right-5 z-50 rounded-full bg-card/90 px-3 py-1.5 text-[11px] text-muted-foreground shadow backdrop-blur-xl"
        >
          tap to hear their favorite song
        </motion.p>
      )}
    </>
  );
}
