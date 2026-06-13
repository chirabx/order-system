import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, setToken } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("order_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    async function restoreSession() {
      const token = getToken();
      if (!token) {
        setInitialized(true);
        return;
      }
      try {
        const data = await api("/api/auth/profile");
        setUser(data.user);
      } catch {
        setToken(null);
        localStorage.removeItem("order_user");
        setUser(null);
      } finally {
        setInitialized(true);
      }
    }
    restoreSession();
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem("order_user", JSON.stringify(user));
    else localStorage.removeItem("order_user");
  }, [user]);

  async function login(values) {
    setLoading(true);
    try {
      const data = await api("/api/auth/login", { method: "POST", body: values });
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  }

  async function register(values) {
    setLoading(true);
    try {
      const data = await api("/api/auth/register", { method: "POST", body: values });
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setToken(null);
    localStorage.removeItem("order_user");
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, setUser, loading, initialized, login, register, logout }),
    [user, loading, initialized]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
