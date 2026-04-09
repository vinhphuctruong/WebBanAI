import { useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { api, money } from "../lib/api.js";

function categoryLabel(categoryId) {
  return (categoryId || "all")
    .replace("cat-", "")
    .split("-")
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

const sortOptions = [
  { id: "popular", label: "Phổ biến nhất" },
  { id: "price-asc", label: "Giá thấp đến cao" },
  { id: "price-desc", label: "Giá cao đến thấp" }
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

export default function GemsPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortMode, setSortMode] = useState("popular");
  const [query, setQuery] = useState("");

  useEffect(() => {
    api("/catalog/gems").then(setItems).catch((err) => setError(err.message));
  }, []);

  const categories = useMemo(() => {
    return ["all", ...new Set(items.map((item) => item.categoryId).filter(Boolean))];
  }, [items]);
  const topCategories = useMemo(() => categories.slice(0, 8), [categories]);

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    const filtered = items.filter((gem) => {
      const isCategoryMatch = activeCategory === "all" || gem.categoryId === activeCategory;
      const isQueryMatch = !normalizedQuery || `${gem.title} ${gem.description}`.toLowerCase().includes(normalizedQuery);
      return isCategoryMatch && isQueryMatch;
    });

    if (sortMode === "price-asc") {
      return [...filtered].sort((a, b) => Number(a.price) - Number(b.price));
    }

    if (sortMode === "price-desc") {
      return [...filtered].sort((a, b) => Number(b.price) - Number(a.price));
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
            <strong>TM Software AI</strong>
            <span>Kho Prompt triển khai nhanh</span>
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
          <p className="tools-side-label">Danh mục Prompt</p>
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
          <p className="tools-hero-kicker">Kho kịch bản và prompt bán hàng</p>
          <h1>Chatbot Prompt Thực Chiến</h1>
          <p>Chọn mẫu prompt tối ưu cho livestream, UGC, review sản phẩm và chăm sóc khách hàng bằng AI.</p>
        </header>

        <div className="tools-toolbar">
          <label className="tools-search-box" aria-label="Tìm kiếm prompt chatbot">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm kiếm prompt..."
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
          <span className="tools-result-count">Hiển thị {visibleItems.length}/{items.length} prompt</span>
        </div>

        {visibleItems.length === 0 ? (
          <article className="tools-empty">
            <h3>Không tìm thấy prompt phù hợp</h3>
            <p>Bạn thử đổi danh mục hoặc từ khóa tìm kiếm nhé.</p>
          </article>
        ) : (
          <div className="tools-grid">
            {visibleItems.map((gem) => {
              const currentPrice = Number(gem.price || 0);
              const originalPrice = Number(gem.originalPrice || 0);
              const discount = discountPercent(currentPrice, originalPrice);
              const features = [];
              if (gem.productType) features.push(gem.productType.replace(/_/g, " "));
              if (gem.tutorialVideo) features.push("Có video hướng dẫn");
              if (gem.chatbotLink || gem.workflowLink) features.push("Có link triển khai");

              return (
                <Link
                  to={`/chatbotprompt/${gem.slug}`}
                  className="tools-card-link"
                  aria-label={`Xem chi tiết ${gem.title}`}
                  key={gem.slug}
                >
                  <article className="tools-card">
                    <div className="tools-card-head">
                      <img src={gem.thumbnail} alt={gem.title} className="tools-card-logo" />
                      <div className="tools-card-title-wrap">
                        <h3>{gem.title}</h3>
                        <span className="tools-mini-pill">{categoryLabel(gem.categoryId)}</span>
                      </div>
                    </div>

                    <p className="tools-card-desc">{gem.description}</p>

                    <div className="tools-feature-row">
                      {features.slice(0, 3).map((feature) => (
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
                        <span className="tools-stock">Prompt số</span>
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
