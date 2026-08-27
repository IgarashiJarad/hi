import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Nav, Compare, Leaderboard, Pricing } from "./LandingDark";

function Shell({ children }) {
  return (
    <div data-theme="dusk" className="min-h-screen bg-[#0d0714] text-white">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[480px] bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.18),transparent_60%)]" />
      <Nav />
      <main className="pt-20">{children}</main>
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-10">
          <Link to="/" data-testid="info-footer-brand" className="font-serif text-xl italic text-white/70">dontblink</Link>
          <Link to="/register" data-testid="info-footer-claim" className="inline-flex items-center gap-1 text-sm text-white/70 transition-colors hover:text-[#A78BFA]">
            claim yours <ArrowUpRight size={14} />
          </Link>
        </div>
      </footer>
    </div>
  );
}

export function ComparePage() {
  return <Shell><Compare /></Shell>;
}

export function LeaderboardPage() {
  return <Shell><Leaderboard /></Shell>;
}

export function PricingPage() {
  return <Shell><Pricing /></Shell>;
}
