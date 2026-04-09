import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";

const links = [
  { to: "/ai-tools", label: "Công cụ AI" },
  { to: "/chatbotprompt", label: "Prompt Chatbot" },
  { to: "/pricing", label: "Bảng giá" }
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme] = useState("dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  function handleLogout() {
    logout();
    navigate("/auth");
  }

  const isHomeDashboard = location.pathname === "/";

  return (
    <div className="site-bg">
      <div className="app-shell">
        {!isHomeDashboard && (
          <header className="mlv-header">
            <div className="mlv-header-inner">
              <Link to="/" className="mlv-header-brand">
                <img src="/tm-software-logo.svg" alt="Mẫu Làm Video" className="mlv-header-logo" />
                <span>Mẫu Làm<em>Video</em></span>
              </Link>

              <nav className="mlv-header-nav">
                {links.map((item) => (
                  <NavLink key={item.to} to={item.to} className="mlv-header-link">
                    {item.label}
                  </NavLink>
                ))}
                {user?.role === "admin" && (
                  <NavLink to="/admin" className="mlv-header-auth-btn" style={{ marginLeft: '0.5rem' }}>Admin MLV</NavLink>
                )}
              </nav>

              {user ? (
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <Link className="mlv-header-link" to="/profile">👤 {user.name}</Link>
                  <button className="mlv-header-link" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }} onClick={handleLogout}>Đăng xuất</button>
                </div>
              ) : (
                <Link className="mlv-header-auth-btn" to="/auth">Đăng ký / Đăng nhập</Link>
              )}
            </div>
          </header>
        )}
        <main className={isHomeDashboard ? "content-home" : "container content"}>{children}</main>
      </div>
    </div>
  );
}
