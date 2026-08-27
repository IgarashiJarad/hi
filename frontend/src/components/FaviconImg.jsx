import { useState } from "react";
import { motion } from "framer-motion";
import { Globe } from "lucide-react";
import { faviconUrl, ddgFavicon, brandIcon } from "../lib/favicon";

export function Favicon({ url, size = 18 }) {
  const [stage, setStage] = useState(0);
  const Brand = brandIcon(url);
  const src = stage === 0 ? faviconUrl(url) : ddgFavicon(url);

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="inline-flex shrink-0 items-center justify-center"
      style={{ width: size + 8, height: size + 8 }}
    >
      {stage < 2 && src ? (
        <img
          src={src}
          width={size}
          height={size}
          alt=""
          loading="lazy"
          className="rounded-[4px]"
          onError={() => setStage(stage + 1)}
        />
      ) : Brand ? (
        <Brand size={size} strokeWidth={1.8} />
      ) : (
        <Globe size={size} strokeWidth={1.8} />
      )}
    </motion.span>
  );
}
