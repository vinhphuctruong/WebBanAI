import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, money } from "../lib/api.js";

function categoryLabel(categoryId) {
  return (categoryId || "all")
    .replace("cat-", "")
    .split("-")
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
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
    <section className="catalog-layout">
      <aside className="card catalog-sidebar">
        <p className="panel-label">DANH MỤC</p>
        <div className="filter-group">
          {categories.map((category) => (
            <button
              key={category}
              className={`filter-option ${activeCategory === category ? "active" : ""}`}
              onClick={() => setActiveCategory(category)}
            >
              {category === "all" ? "Tất cả" : categoryLabel(category)}
            </button>
          ))}
        </div>

        <p className="panel-label">TÌM KIẾM</p>
        <input
          className="search-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm prompt..."
        />

        <p className="panel-label">SẮP XẾP GIÁ</p>
        <div className="filter-group">
          <button className={`filter-option ${sortMode === "popular" ? "active" : ""}`} onClick={() => setSortMode("popular")}>Phổ biến nhất</button>
          <button className={`filter-option ${sortMode === "price-asc" ? "active" : ""}`} onClick={() => setSortMode("price-asc")}>Giá thấp đến cao</button>
          <button className={`filter-option ${sortMode === "price-desc" ? "active" : ""}`} onClick={() => setSortMode("price-desc")}>Giá cao đến thấp</button>
        </div>
      </aside>

      <div className="catalog-main stack">
        <div className="catalog-head">
          <div>
            <h1>Kho Prompt AI</h1>
            <p>Bộ sưu tập chatbot prompt và workflow thực chiến cho ecommerce và team nội dung.</p>
          </div>
          <div className="segmented">
            <button className={sortMode === "popular" ? "active" : ""} onClick={() => setSortMode("popular")}>Phổ biến nhất</button>
            <button className={sortMode === "price-asc" ? "active" : ""} onClick={() => setSortMode("price-asc")}>Giá thấp đến cao</button>
            <button className={sortMode === "price-desc" ? "active" : ""} onClick={() => setSortMode("price-desc")}>Giá cao đến thấp</button>
          </div>
        </div>

        {visibleItems.length === 0 ? (
          <article className="card empty-state">
            <h3>Không tìm thấy prompt phù hợp</h3>
            <p>Bạn thử đổi bộ lọc hoặc từ khóa tìm kiếm nhé.</p>
          </article>
        ) : (
          <div className="grid">
            {visibleItems.map((gem) => (
              <Link
                to={`/chatbotprompt/${gem.slug}`}
                className="card-link"
                aria-label={`Xem chi tiết ${gem.title}`}
                key={gem.slug}
              >
                <article className="card card-clickable product-card">
                  <div className="media-wrap">
                    <img src={gem.thumbnail} alt={gem.title} className="thumb" />
                    <span className="badge">{categoryLabel(gem.categoryId)}</span>
                  </div>
                  <h3>{gem.title}</h3>
                  <p>{gem.description}</p>
                  <div className="price-row">
                    <strong>{gem.price === 0 ? "Miễn phí" : money(gem.price)}</strong>
                    <span className="subtle-link">Nhấn để xem chi tiết</span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
