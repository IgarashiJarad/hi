import { motion } from "framer-motion";
import { Copy, Check, MessageSquare, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ease } from "./motion";

export function DiscordCard({ data, loading, error, onRetry }) {
  const [copied, setCopied] = useState(false);

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
        <div className="h-24 animate-pulse bg-[#EEF1FF]" />
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
            <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-card bg-[#3F5E4D]" />
          </div>
          <span className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-[#EEF1FF] px-3 py-1 text-[11px] font-medium text-[#5865F2]">
            <MessageSquare size={12} /> connected
          </span>
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
      </div>
    </motion.div>
  );
}
