"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedToken = window.localStorage.getItem("mlv_token") || "";
    const rawUser = window.localStorage.getItem("mlv_user");
    let parsedUser = null;

    if (rawUser) {
      try {
        parsedUser = JSON.parse(rawUser);
      } catch (_err) {
        parsedUser = null;
      }
    }

    setToken(storedToken);
    setUser(parsedUser);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      login(nextToken, nextUser) {
        window.localStorage.setItem("mlv_token", nextToken);
        window.localStorage.setItem("mlv_user", JSON.stringify(nextUser));
        setToken(nextToken);
        setUser(nextUser);
      },
      logout() {
        window.localStorage.removeItem("mlv_token");
        window.localStorage.removeItem("mlv_user");
        setToken("");
        setUser(null);
      },
      updateUser(nextUser) {
        window.localStorage.setItem("mlv_user", JSON.stringify(nextUser));
        setUser(nextUser);
      }
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
