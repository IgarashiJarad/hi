import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Favicon } from "./FaviconImg";
import { prettyLabel } from "../lib/favicon";
import { api } from "../lib/api";
import { ease } from "./motion";

export function SocialLinks({ links = [], username }) {
  if (!links.length) return null;

  const track = (url) => {
    if (!username) return;
    api.post(`/profile/${username}/click`, { url }).catch(() => {});
  };
  return (
    <motion.ul
      data-testid="social-links-list"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.08 } } }}
      className="space-y-3"
    >
      {links.map((link, i) => (
        <motion.li
          key={`${link.url}-${i}`}
          variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease } } }}
        >
          <a
            data-testid={`social-link-item-${i}`}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            onClick={() => track(link.url)}
            className="group flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-[0_10px_28px_rgba(0,0,0,0.06)]"
          >
            <Favicon url={link.url} size={18} />
            <span className="flex-1 truncate text-sm font-medium">{link.label || prettyLabel(link.url)}</span>
            <ArrowUpRight size={16} className="text-muted-foreground transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
          </a>
        </motion.li>
      ))}
    </motion.ul>
  );
}
