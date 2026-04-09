import { useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { api, money } from "../lib/api.js";

function categoryLabel(value) {
  return (value || "Tất cả")
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

const sortOptions = [
  { id: "popular", label: "Phổ biến nhất" },
  { id: "price-asc", label: "Giá thấp đến cao" },
  { id: "price-desc", label: "Giá cao đến thấp" },
  { id: "stock", label: "Tồn kho cao trước" }
];

const quickLinks = [
  { to: "/", label: "Trang chủ" },
  { to: "/ai-tools", label: "Công cụ AI" },
  { to: "/chatbotprompt", label: "Chatbot Prompt" },
  { to: "/pricing", label: "Bảng giá" }
];

function discountPercent(currentPrice, originalPrice) {
  const current = Number(currentPrice || 0);
  const original = Number(originalPrice || 0);
  if (current <= 0 || original <= current) return 0;
  return Math.round(((original - current) / original) * 100);
}

export default function ToolsPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortMode, setSortMode] = useState("popular");
  const [query, setQuery] = useState("");

  useEffect(() => {
    api("/catalog/ai-tools").then(setItems).catch((err) => setError(err.message));
  }, []);

  const categories = useMemo(() => {
    return ["all", ...new Set(items.map((tool) => tool.category).filter(Boolean))];
  }, [items]);
  const topCategories = useMemo(() => categories.slice(0, 8), [categories]);

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();

    const filtered = items.filter((tool) => {
      const isCategoryMatch = activeCategory === "all" || tool.category === activeCategory;
      const isQueryMatch = !normalizedQuery || `${tool.name} ${tool.description}`.toLowerCase().includes(normalizedQuery);
      return isCategoryMatch && isQueryMatch;
    });

    if (sortMode === "price-asc") {
      return [...filtered].sort((a, b) => Number(a.accountPrice) - Number(b.accountPrice));
    }

    if (sortMode === "price-desc") {
      return [...filtered].sort((a, b) => Number(b.accountPrice) - Number(a.accountPrice));
    }

    if (sortMode === "stock") {
      return [...filtered].sort((a, b) => Number(b.availableCount) - Number(a.availableCount));
    }

    return filtered;
  }, [items, activeCategory, query, sortMode]);

  if (error) return <p className="error">{error}</p>;

  return (
    <section className="tools-hub-shell">
      <aside className="tools-hub-sidebar">
        <div className="tools-side-brand">
          <img src="/tm-software-logo.svg" alt="Logo TM software AI" />
          <div>
            <strong>TM software AI</strong>
            <span>Kho tài nguyên AI thực chiến</span>
          </div>
        </div>

        <div className="tools-side-group">
          <p className="tools-side-label">Khám phá</p>
          <nav className="tools-side-nav">
            {quickLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={({ isActive }) => `tools-side-link ${isActive ? "active" : ""}`} end={link.to === "/"}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="tools-side-group">
          <p className="tools-side-label">Danh mục công cụ</p>
          <div className="tools-side-filter">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={`tools-side-filter-btn ${activeCategory === category ? "active" : ""}`}
                onClick={() => setActiveCategory(category)}
              >
                {category === "all" ? "Tất cả" : categoryLabel(category)}
              </button>
            ))}
          </div>
        </div>

        <div className="tools-side-group">
          <p className="tools-side-label">Sắp xếp</p>
          <div className="tools-side-filter">
            {sortOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`tools-side-filter-btn ${sortMode === option.id ? "active" : ""}`}
                onClick={() => setSortMode(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="tools-hub-main">
        <header className="tools-hub-hero">
          <p className="tools-hero-kicker">Nền tảng AI cho bán hàng và vận hành</p>
          <h1>Khám phá Công cụ AI</h1>
          <p>Tìm hiểu và mua tài khoản công cụ AI chất lượng, phù hợp cho team marketing, sale và sản xuất nội dung.</p>
        </header>

        <div className="tools-toolbar">
          <label className="tools-search-box" aria-label="Tìm kiếm công cụ AI">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm kiếm công cụ AI..."
            />
          </label>
          <div className="tools-sort-group">
            {sortOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`tools-sort-pill ${sortMode === option.id ? "active" : ""}`}
                onClick={() => setSortMode(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="tools-category-row">
          {topCategories.map((category) => (
            <button
              key={category}
              type="button"
              className={`tools-category-pill ${activeCategory === category ? "active" : ""}`}
              onClick={() => setActiveCategory(category)}
            >
              {category === "all" ? "Tất cả" : categoryLabel(category)}
            </button>
          ))}
          <span className="tools-result-count">Hiển thị {visibleItems.length}/{items.length} công cụ</span>
        </div>

        {visibleItems.length === 0 ? (
          <article className="tools-empty">
            <h3>Không tìm thấy công cụ phù hợp</h3>
            <p>Bạn thử đổi danh mục hoặc từ khóa tìm kiếm nhé.</p>
          </article>
        ) : (
          <div className="tools-grid">
            {visibleItems.map((tool) => {
              const currentPrice = Number(tool.accountPrice || 0);
              const originalPrice = Number(tool.originalPrice || 0);
              const discount = discountPercent(currentPrice, originalPrice);
              const featureList = Array.isArray(tool.features) ? tool.features.slice(0, 3) : [];

              return (
                <Link
                  to={`/ai-tool/${tool.slug}`}
                  className="tools-card-link"
                  aria-label={`Xem chi tiết ${tool.name}`}
                  key={tool.slug}
                >
                  <article className="tools-card">
                    <div className="tools-card-head">
                      <img src={tool.logo} alt={tool.name} className="tools-card-logo" />
                      <div className="tools-card-title-wrap">
                        <h3>{tool.name}</h3>
                        <span className="tools-mini-pill">{categoryLabel(tool.category)}</span>
                      </div>
                    </div>

                    <p className="tools-card-desc">{tool.description}</p>

                    <div className="tools-feature-row">
                      {featureList.map((feature) => (
                        <span key={feature} className="tools-feature-pill">{feature}</span>
                      ))}
                    </div>

                    <div className="tools-card-foot">
                      <div className="tools-price-wrap">
                        {originalPrice > currentPrice && currentPrice > 0 && (
                          <span className="tools-price-old">{money(originalPrice)}</span>
                        )}
                        <strong>{currentPrice === 0 ? "Miễn phí" : money(currentPrice)}</strong>
                      </div>

                      <div className="tools-foot-meta">
                        {discount > 0 && <span className="tools-discount-badge">-{discount}%</span>}
                        <span className="tools-stock">Kho: {Number(tool.availableCount || 0)}</span>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
