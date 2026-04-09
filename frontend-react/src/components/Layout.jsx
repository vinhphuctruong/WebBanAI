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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  function confirmLogout() {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất không?")) {
      logout();
      navigate("/auth");
    }
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
                  <NavLink to="/admin" className="mlv-header-link">Quản trị</NavLink>
                )}
              </nav>

              {user ? (
                <div 
                  style={{ position: 'relative', display: 'inline-block' }}
                  onMouseEnter={() => setDropdownOpen(true)}
                  onMouseLeave={() => setDropdownOpen(false)}
                >
                  <button className="mlv-header-link" style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0' }}>
                    👤 {user.name}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </button>
                  {dropdownOpen && (
                    <div style={{ 
                      position: 'absolute', top: '100%', right: 0, 
                      background: 'var(--surface-raised)', minWidth: '180px', 
                      borderRadius: '8px', overflow: 'hidden', 
                      boxShadow: '0 8px 16px rgba(0,0,0,0.5)', 
                      border: '1px solid var(--line)', zIndex: 100,
                      display: 'flex', flexDirection: 'column'
                    }}>
                      <Link to="/profile" className="mlv-dropdown-item" style={{ padding: '0.75rem 1rem', color: 'var(--ink)', textDecoration: 'none', fontSize: '0.9rem' }}>Thông tin tài khoản</Link>
                      <div style={{ height: '1px', background: 'var(--line)' }} />
                      <button onClick={confirmLogout} className="mlv-dropdown-item" style={{ padding: '0.75rem 1rem', color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem', width: '100%' }}>Đăng xuất</button>
                    </div>
                  )}
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
