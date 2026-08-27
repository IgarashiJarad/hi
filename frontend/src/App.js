import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Lenis from "lenis";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Landing from "@/pages/LandingDark";
import { ComparePage, LeaderboardPage, PricingPage } from "@/pages/InfoPages";
import AuthPage from "@/pages/Auth";
import Settings from "@/pages/Dashboard";
import Profile from "@/pages/Profile";

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-[#8B5CF6]" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppInner() {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    let raf;
    const loop = (t) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    let prevTitle = document.title;
    const onVis = () => {
      const link = document.querySelector("link[rel='icon']");
      if (document.hidden) {
        prevTitle = document.title;
        if (link) link.href = "/favicon-wink.svg";
        document.title = "don't blink…";
      } else {
        if (link) link.href = "/favicon-eye.svg";
        document.title = prevTitle;
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return (
    <>
      <ScrollTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
        <Route path="/:username" element={<Profile />} />
      </Routes>
      <Toaster position="bottom-center" toastOptions={{ style: { borderRadius: "14px" } }} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </BrowserRouter>
  );
}
