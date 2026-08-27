import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("sanctuary_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((r) => setUser(r.data))
      .catch(() => localStorage.removeItem("sanctuary_token"))
      .finally(() => setLoading(false));
  }, []);

  const login = async (identifier, password) => {
    const r = await api.post("/auth/login", { identifier, password });
    localStorage.setItem("sanctuary_token", r.data.token);
    setUser(r.data.user);
    return r.data.user;
  };

  const register = async (username, email, password, website = "") => {
    const r = await api.post("/auth/register", { username, email, password, website });
    localStorage.setItem("sanctuary_token", r.data.token);
    setUser(r.data.user);
    return r.data.user;
  };

  const logout = () => {
    localStorage.removeItem("sanctuary_token");
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
