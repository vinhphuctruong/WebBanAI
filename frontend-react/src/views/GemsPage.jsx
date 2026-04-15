"use client";

import { useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "../lib/router.jsx";
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

export default function GemsPage({ initialItems = null, initialError = "" }) {
  const [items, setItems] = useState(initialItems || []);
  const [error, setError] = useState(initialError);
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortMode, setSortMode] = useState("popular");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (initialItems) return;
    api("/catalog/gems").then(setItems).catch((err) => setError(err.message));
  }, [initialItems]);

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
    <div className="gm-page">
      <div className="gm-header">
        <div className="gm-header-title-flex">
          <div className="gm-icon-box">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><path d="M13 8H7"></path><path d="M17 12H7"></path></svg>
          </div>
          <h1 className="gm-title">Chatbot Prompt</h1>
        </div>
        <p className="gm-subtitle">Công cụ AI giúp bạn viết prompt chuyên nghiệp</p>
      </div>

      <div className="gm-cat-scroll">
        <button
          type="button"
          className={`gm-cat-pill ${activeCategory === "all" ? "active" : ""}`}
          onClick={() => setActiveCategory("all")}
        >
          Tất cả
        </button>
        {categories.filter(c => c !== "all").map((category) => (
          <button
            key={category}
            type="button"
            className={`gm-cat-pill ${activeCategory === category ? "active" : ""}`}
            onClick={() => setActiveCategory(category)}
          >
            {categoryLabel(category)}
          </button>
        ))}
      </div>

      <div className="gm-filters-row">
        <div className="gm-search">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
          <input
            type="search"
            placeholder="Tìm kiếm prompt..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="gm-sort-cols">
          <div className="gm-select-wrap">
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
            >
              <option value="all">Danh mục</option>
              {categories.filter(c => c !== "all").map(cat => (
                <option key={cat} value={cat}>{categoryLabel(cat)}</option>
              ))}
            </select>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
          </div>
          <div className="gm-select-wrap">
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value)}
            >
              {sortOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
          </div>
        </div>
      </div>

      <div className="gm-count">{items.length} Prompt</div>

      {visibleItems.length === 0 ? (
        <article className="tools-empty">
          <h3>Không tìm thấy prompt phù hợp</h3>
          <p>Bạn thử đổi danh mục hoặc từ khóa tìm kiếm nhé.</p>
        </article>
      ) : (
        <div className="gm-grid">
          {visibleItems.map((gem) => {
            const currentPrice = Number(gem.price || 0);
            const originalPrice = Number(gem.originalPrice || 0);
            const discount = discountPercent(currentPrice, originalPrice);
            // Simulate sales count based on something to show UI (e.g. random or just generic if backend missing)
            const salesCount = Math.floor(Math.random() * 50) + 1; 

            return (
              <div className="gm-card-wrapper" key={gem.slug}>
                <Link to={`/chatbotprompt/${gem.slug}`} className="gm-card-link-wrapper">
                  <article className="gm-card">
                    <div className="gm-card-media">
                      <img src={gem.thumbnail} alt={gem.title} loading="lazy" />
                      
                      <div className="gm-card-badge-top-left">
                        {gem.productType === "premium" ? (
                          <div className="gm-badge gm-badge-premium">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"></path><path d="M5 21h14"></path></svg>
                            Premium
                          </div>
                        ) : null}
                        
                        {discount > 0 ? (
                           <div className="gm-badge gm-badge-discount">-{discount}%</div>
                        ) : (
                          <div className="gm-badge gm-badge-new">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path><path d="M20 3v4"></path><path d="M22 5h-4"></path><path d="M4 17v2"></path><path d="M5 18H3"></path></svg>
                            Mới
                          </div>
                        )}
                      </div>

                      <div className="gm-card-badge-top-right">
                         <div className="gm-badge-ai">
                           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 mr-1"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><path d="M13 8H7"></path><path d="M17 12H7"></path></svg>
                           <span>Chatbot AI</span>
                         </div>
                      </div>

                      <button className="gm-bookmark-btn" aria-label="Lưu">
                         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg>
                      </button>
                    </div>

                    <div className="gm-card-body">
                      <div className="gm-card-title-row">
                        <h3 className="gm-card-title">{gem.title}</h3>
                        <div className="gm-card-version">
                           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5 mr-0.5"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"></path><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"></circle></svg>
                           v1.0
                        </div>
                      </div>

                      <p className="gm-card-desc">{gem.description}</p>

                      <div className="gm-card-footer">
                        <span className="gm-card-sales">{salesCount} đã bán</span>
                        
                        <div className="gm-card-price-group">
                           {originalPrice > currentPrice && currentPrice > 0 && (
                             <span className="gm-price-old">{money(originalPrice)}</span>
                           )}
                           <span className="gm-price-new">
                             {currentPrice === 0 ? "Miễn phí" : money(currentPrice)}
                           </span>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

