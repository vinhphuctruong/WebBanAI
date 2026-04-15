"use client";

import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "../lib/router.jsx";
import { useAuth } from "../lib/auth.jsx";

const headerLinks = [
  { to: "/", label: "Trang chủ", end: true },
  { to: "/ai-tools", label: "Công cụ AI" },
  { to: "/chatbotprompt", label: "Chatbot Prompt" },
  { to: "/pricing", label: "Bảng giá" }
];

const sidebarSections = [
  {
    label: "Khám phá",
    items: [
      { type: "route", to: "/", label: "Trang chủ", icon: "🏠", end: true },
      { type: "route", to: "/ai-tools", label: "Công cụ AI", icon: "🖥️" },
      { type: "hash", to: "/#reviews", hash: "#reviews", label: "Review AI", icon: "✨" },
      { type: "route", to: "/chatbotprompt", label: "Chatbot Prompt", icon: "💬" },
      { type: "hash", to: "/#free-prompts", hash: "#free-prompts", label: "Prompt miễn phí", icon: "📄" },
      { type: "hash", to: "/#main-gems", hash: "#main-gems", label: "VEO3 Workflow", icon: "⚙️" }
    ]
  },
  {
    label: "Khác",
    items: [
      { type: "route", to: "/chatbotprompt", label: "Custom Chatbot", icon: "🪄" },
      { type: "route", to: "/pricing", label: "Bảng giá", icon: "💳" }
    ]
  }
];

const SIDEBAR_STATE_KEY = "mlv-sidebar-collapsed";

function SidebarRouteItem({ item }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) => `mlv-sidebar-link${isActive ? " active" : ""}`}
      title={item.label}
    >
      <span className="mlv-sidebar-link-icon" aria-hidden="true">{item.icon}</span>
      <span className="mlv-sidebar-text">{item.label}</span>
    </NavLink>
  );
}

function SidebarHashItem({ item, location }) {
  const isActive = location.pathname === "/" && location.hash === item.hash;

  return (
    <Link to={item.to} className={`mlv-sidebar-link${isActive ? " active" : ""}`} title={item.label}>
      <span className="mlv-sidebar-link-icon" aria-hidden="true">{item.icon}</span>
      <span className="mlv-sidebar-text">{item.label}</span>
    </Link>
  );
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const profileMenuRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(SIDEBAR_STATE_KEY) === "1";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STATE_KEY, sidebarCollapsed ? "1" : "0");
  }, [sidebarCollapsed]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!profileMenuRef.current?.contains(event.target)) {
        setDropdownOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    setDropdownOpen(false);
  }, [location.pathname, location.hash]);

  function confirmLogout() {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất không?")) {
      setDropdownOpen(false);
      logout();
      navigate("/auth");
    }
  }

  const isHomePage = location.pathname === "/";

  return (
    <div className="mlv-page">
      <header className="mlv-header">
        <div className="mlv-header-inner">
          <Link to="/" className="mlv-header-brand">
            <img src="/tm-aivideo-logo.jpg" alt="TM AIVIDEO" className="mlv-header-logo" />
            <span>TM <em>AIVIDEO</em></span>
          </Link>

          <nav className="mlv-header-nav" aria-label="Navigation chính">
            {headerLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `mlv-header-link${isActive ? " active" : ""}`}
              >
                {item.label}
              </NavLink>
            ))}
            {user?.role === "admin" && (
              <NavLink to="/admin" className={({ isActive }) => `mlv-header-link${isActive ? " active" : ""}`}>
                Quản trị
              </NavLink>
            )}
          </nav>

          {user ? (
            <div className="mlv-header-profile" ref={profileMenuRef}>
              <button
                type="button"
                className="mlv-header-auth-btn mlv-header-profile-btn"
                onClick={() => setDropdownOpen((prev) => !prev)}
                aria-expanded={dropdownOpen}
                aria-haspopup="menu"
              >
                👤 {user.name}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
              </button>
              {dropdownOpen && (
                <div className="mlv-profile-dropdown" role="menu">
                  <Link to="/profile" role="menuitem" className="mlv-dropdown-item">
                    Thông tin tài khoản
                  </Link>
                  <Link to="/purchased-products" role="menuitem" className="mlv-dropdown-item">
                    Sản phẩm đã mua
                  </Link>
                  <div className="mlv-dropdown-divider" />
                  <button type="button" onClick={confirmLogout} role="menuitem" className="mlv-dropdown-item mlv-dropdown-danger">
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link className="mlv-header-auth-btn" to="/auth">Đăng ký / Đăng nhập</Link>
          )}
        </div>
      </header>

      <div className={`mlv-shell${sidebarCollapsed ? " sidebar-collapsed" : ""}`}>
        <aside className="mlv-sidebar" aria-label="Điều hướng sidebar">
          <nav className="mlv-sidebar-nav">
            {sidebarSections.map((section) => (
              <div key={section.label}>
                <p className="mlv-sidebar-group-label">{section.label}</p>
                <div className="mlv-sidebar-group">
                  {section.items.map((item) => (
                    item.type === "route"
                      ? <SidebarRouteItem key={`${section.label}-${item.to}-${item.label}`} item={item} />
                      : <SidebarHashItem key={`${section.label}-${item.to}-${item.label}`} item={item} location={location} />
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <button
            type="button"
            className="mlv-sidebar-collapse"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            aria-label={sidebarCollapsed ? "Mở rộng sidebar" : "Thu nhỏ sidebar"}
            title={sidebarCollapsed ? "Mở rộng sidebar" : "Thu nhỏ sidebar"}
          >
            <span className="mlv-sidebar-link-icon" aria-hidden="true">{sidebarCollapsed ? "▶" : "◀"}</span>
            <span className="mlv-sidebar-text">{sidebarCollapsed ? "Mở rộng" : "Thu nhỏ"}</span>
          </button>
        </aside>

        <main className="mlv-main">
          {isHomePage ? children : <div className="mlv-main-content">{children}</div>}
        </main>
      </div>
    </div>
  );
}

