import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("mlv_token") || "");
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("mlv_user");
    return raw ? JSON.parse(raw) : null;
  });

  const value = useMemo(
    () => ({
      token,
      user,
      login(nextToken, nextUser) {
        localStorage.setItem("mlv_token", nextToken);
        localStorage.setItem("mlv_user", JSON.stringify(nextUser));
        setToken(nextToken);
        setUser(nextUser);
      },
      logout() {
        localStorage.removeItem("mlv_token");
        localStorage.removeItem("mlv_user");
        setToken("");
        setUser(null);
      },
      updateUser(nextUser) {
        localStorage.setItem("mlv_user", JSON.stringify(nextUser));
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
