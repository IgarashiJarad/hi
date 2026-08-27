import {
  Github, Twitter, Youtube, Instagram, Linkedin, Twitch, Music2,
  AudioLines, MessageSquare, Cloud, Globe,
} from "lucide-react";

const BRAND_ICONS = {
  "github.com": Github,
  "twitter.com": Twitter,
  "x.com": Twitter,
  "youtube.com": Youtube,
  "youtu.be": Youtube,
  "instagram.com": Instagram,
  "linkedin.com": Linkedin,
  "twitch.tv": Twitch,
  "open.spotify.com": Music2,
  "spotify.com": Music2,
  "last.fm": AudioLines,
  "soundcloud.com": Cloud,
  "discord.com": MessageSquare,
  "discord.gg": MessageSquare,
};

export function getDomain(url) {
  try {
    const u = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export function brandIcon(url) {
  const d = getDomain(url);
  return d ? BRAND_ICONS[d] || null : null;
}

export function faviconUrl(url, sz = 128) {
  const d = getDomain(url);
  return d ? `https://www.google.com/s2/favicons?domain=${d}&sz=${sz}` : null;
}

export function ddgFavicon(url) {
  const d = getDomain(url);
  return d ? `https://icons.duckduckgo.com/ip3/${d}.ico` : null;
}

export function prettyLabel(url) {
  const d = getDomain(url);
  if (!d) return "Link";
  const core = d.split(".")[0];
  return core.charAt(0).toUpperCase() + core.slice(1);
}

export { Globe };
