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
    <div className="vt-page">
      <div className="vt-header">
        <div className="vt-header-title-flex">
          <div className="vt-icon-sparkles">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path><path d="M20 3v4"></path><path d="M22 5h-4"></path><path d="M4 17v2"></path><path d="M5 18H3"></path></svg>
          </div>
          <h1 className="vt-title">Khám phá Công cụ AI</h1>
        </div>
        <p className="vt-subtitle">Tìm hiểu và mua tài khoản các công cụ AI hàng đầu thế giới</p>
      </div>

      <div className="vt-controls flex flex-col lg:flex-row gap-4 mb-8">
        <div className="vt-search-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="vt-search-icon"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
          <input
            type="search"
            className="vt-search-input"
            placeholder="Tìm kiếm công cụ AI..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="vt-filters">
          <button
            type="button"
            className={`vt-filter-btn ${activeCategory === "all" ? "active" : ""}`}
            onClick={() => setActiveCategory("all")}
          >
            Tất cả
          </button>
          {categories.filter(c => c !== "all").map((category) => (
            <button
              key={category}
              type="button"
              className={`vt-filter-btn ${activeCategory === category ? "active" : ""}`}
              onClick={() => setActiveCategory(category)}
            >
              {categoryLabel(category)}
            </button>
          ))}
        </div>
      </div>

      {visibleItems.length === 0 ? (
        <article className="tools-empty">
          <h3>Không tìm thấy công cụ phù hợp</h3>
          <p>Bạn thử đổi danh mục hoặc từ khóa tìm kiếm nhé.</p>
        </article>
      ) : (
        <div className="vt-grid">
          {visibleItems.map((tool) => {
            const currentPrice = Number(tool.accountPrice || 0);
            const originalPrice = Number(tool.originalPrice || 0);
            const discount = discountPercent(currentPrice, originalPrice);
            const featureList = Array.isArray(tool.features) ? tool.features : [];

            return (
              <Link to={`/ai-tool/${tool.slug}`} className="vt-card-link" key={tool.slug}>
                <article className="vt-card">
                  <div className="vt-card-top">
                    <img src={tool.logo} alt={tool.name} className="vt-card-img" />
                    <div className="vt-card-info">
                      <div className="vt-card-title-row">
                        <h3 className="vt-card-title">{tool.name}</h3>
                        {/* We use a placeholder logic for Hot item */}
                        {tool.availableCount > 0 && tool.availableCount < 10 && (
                          <div className="vt-card-hot">Hot</div>
                        )}
                      </div>
                      <div className="vt-card-category">{categoryLabel(tool.category)}</div>
                    </div>
                  </div>

                  <p className="vt-card-desc">{tool.description}</p>

                  <div className="vt-card-features">
                    {featureList.slice(0, 3).map((feature) => (
                      <span key={feature} className="vt-card-feature">{feature}</span>
                    ))}
                    {featureList.length > 3 && (
                      <span className="vt-card-feature">+{featureList.length - 3}</span>
                    )}
                  </div>

                  <div className="vt-card-bottom">
                    <div className="vt-card-price-info">
                      <div className="vt-card-price-col">
                        {originalPrice > currentPrice && currentPrice > 0 && (
                          <span className="vt-card-price-old">{money(originalPrice)}</span>
                        )}
                        <span className="vt-card-price-new">
                          {currentPrice === 0 ? "Miễn phí" : money(currentPrice)}
                        </span>
                      </div>
                      {discount > 0 && <span className="vt-card-discount">-{discount}%</span>}
                    </div>

                    <div className="vt-card-actions">
                      <div className="vt-card-ext-link">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>
                      </div>
                      <div className="vt-card-cart-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="8" cy="21" r="1"></circle><circle cx="19" cy="21" r="1"></circle><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path></svg>
                        {Number(tool.availableCount || 0)}
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
