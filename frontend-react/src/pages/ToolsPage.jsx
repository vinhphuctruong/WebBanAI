import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, money } from "../lib/api.js";

function categoryLabel(value) {
  return (value || "Tất cả")
    .split(" ")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
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
          placeholder="Tìm công cụ AI..."
        />

        <p className="panel-label">TỒN KHO</p>
        <p className="panel-note">Số lượng tài khoản cao nhất: {items.length ? Math.max(...items.map((tool) => tool.availableCount || 0)) : 0}</p>

        <p className="panel-label">SẮP XẾP</p>
        <div className="filter-group">
          <button className={`filter-option ${sortMode === "popular" ? "active" : ""}`} onClick={() => setSortMode("popular")}>Phổ biến nhất</button>
          <button className={`filter-option ${sortMode === "price-asc" ? "active" : ""}`} onClick={() => setSortMode("price-asc")}>Giá thấp đến cao</button>
          <button className={`filter-option ${sortMode === "price-desc" ? "active" : ""}`} onClick={() => setSortMode("price-desc")}>Giá cao đến thấp</button>
          <button className={`filter-option ${sortMode === "stock" ? "active" : ""}`} onClick={() => setSortMode("stock")}>Tồn kho cao trước</button>
        </div>
      </aside>

      <div className="catalog-main stack">
        <div className="catalog-head">
          <div>
            <h1>Công cụ AI bán chạy</h1>
            <p>Phần mềm sẵn sàng vận hành để tự động hóa workflow video marketing và sale.</p>
          </div>
          <div className="segmented">
            <button className={sortMode === "popular" ? "active" : ""} onClick={() => setSortMode("popular")}>Phổ biến nhất</button>
            <button className={sortMode === "price-asc" ? "active" : ""} onClick={() => setSortMode("price-asc")}>Giá thấp đến cao</button>
            <button className={sortMode === "price-desc" ? "active" : ""} onClick={() => setSortMode("price-desc")}>Giá cao đến thấp</button>
            <button className={sortMode === "stock" ? "active" : ""} onClick={() => setSortMode("stock")}>Tồn kho cao trước</button>
          </div>
        </div>

        {visibleItems.length === 0 ? (
          <article className="card empty-state">
            <h3>Không tìm thấy công cụ phù hợp</h3>
            <p>Bạn thử đổi bộ lọc hoặc từ khóa tìm kiếm nhé.</p>
          </article>
        ) : (
          <div className="grid">
            {visibleItems.map((tool) => (
              <Link
                to={`/ai-tool/${tool.slug}`}
                className="card-link"
                aria-label={`Xem chi tiết ${tool.name}`}
                key={tool.slug}
              >
                <article className="card card-clickable product-card">
                  <div className="media-wrap">
                    <img src={tool.logo} alt={tool.name} className="thumb" />
                    <span className="badge">{categoryLabel(tool.category)}</span>
                  </div>
                  <h3>{tool.name}</h3>
                  <p>{tool.description}</p>
                  <div className="chips">
                    <span className="tag">Tồn kho: {tool.availableCount}</span>
                  </div>
                  <div className="price-row">
                    <strong>{Number(tool.accountPrice || 0) === 0 ? "Miễn phí" : money(tool.accountPrice)}</strong>
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
