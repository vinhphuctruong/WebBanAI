import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";

const links = [
  { to: "/ai-tools", label: "Công cụ AI" },
  { to: "/chatbotprompt", label: "Prompt Chatbot" },
  { to: "/pricing", label: "Bảng giá" }
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("mlv_theme");
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("mlv_theme", theme);
  }, [theme]);

  function handleLogout() {
    logout();
    navigate("/auth");
  }

  return (
    <div className="site-bg">
      <div className="app-shell">
        <header className="topbar">
          <div className="container topbar-inner">
            <Link to="/" className="brand">
              <img src="/tm-software-logo.svg" alt="Logo TM software AI" className="brand-logo" />
              <span>TM Software AI</span>
            </Link>

            <nav className="menu">
              <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>Trang chủ</NavLink>
              {links.map((item) => (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? "active" : "")}>{item.label}</NavLink>
              ))}
              {user?.role === "admin" && <NavLink to="/admin">Quản trị</NavLink>}
            </nav>

            <div className="actions">
              <button className="btn btn-ghost theme-toggle" onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}>
                {theme === "dark" ? "Chế độ sáng" : "Chế độ tối"}
              </button>
              {user ? (
                <>
                  <Link className="btn btn-soft" to="/profile">{user.name}</Link>
                  <button className="btn btn-outline" onClick={handleLogout}>Đăng xuất</button>
                </>
              ) : (
                <Link className="btn btn-primary" to="/auth">Đăng ký / Đăng nhập</Link>
              )}
            </div>
          </div>
        </header>
        <main className="container content">{children}</main>
      </div>
    </div>
  );
}
