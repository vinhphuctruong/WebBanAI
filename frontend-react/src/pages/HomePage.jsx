import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, money } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

function normalizeCategory(value, fallback = "AI Video") {
  if (!value) return fallback;
  return value
    .replace("cat-", "")
    .replace(/[_-]+/g, " ")
    .trim();
}

function ToolCard({ item }) {
  const hasDiscount = Number(item.originalPrice || 0) > Number(item.price || 0);

  return (
    <Link to={item.link} className="home-hub-tool-link" aria-label={`Xem chi tiết ${item.title}`}>
      <article className="home-hub-tool-card">
        <div className="home-hub-tool-logo-wrap">
          <img src={item.image} alt={item.title} className="home-hub-tool-logo" />
        </div>
        <h3>{item.title}</h3>
        <p className="home-hub-tool-stars">★★★★★</p>
        <span className="home-hub-tool-badge">{item.category}</span>
        <div className="home-hub-tool-price">
          <strong>{item.price === 0 ? "Miễn phí" : money(item.price)}</strong>
          {hasDiscount && <small>{money(item.originalPrice)}</small>}
        </div>
      </article>
    </Link>
  );
}

function ReviewCard({ review }) {
  return (
    <article className="home-hub-review-card">
      <div className="home-hub-review-icon">✦</div>
      <h3>{review.name}</h3>
      <span>{review.category || "AI Tool"}</span>
      <p>{review.description}</p>
      <Link to="/ai-tools">Xem review →</Link>
    </article>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ gems: [], tools: [], reviews: [] });
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    Promise.all([api("/catalog/gems"), api("/catalog/ai-tools"), api("/catalog/reviews")])
      .then(([gems, tools, reviews]) => setData({ gems, tools, reviews }))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const toolItems = useMemo(() => {
    return data.tools.map((tool) => ({
      key: `tool-${tool.slug}`,
      title: tool.name,
      image: tool.logo,
      category: normalizeCategory(tool.category, "AI Video"),
      price: Number(tool.accountPrice || 0),
      originalPrice: Number(tool.originalPrice || 0),
      link: `/ai-tool/${tool.slug}`
    }));
  }, [data.tools]);

  const visibleTools = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    const sorted = [...toolItems].sort((a, b) => b.price - a.price);

    if (!normalizedQuery) return sorted.slice(0, 10);

    return sorted
      .filter((item) => `${item.title} ${item.category}`.toLowerCase().includes(normalizedQuery))
      .slice(0, 10);
  }, [toolItems, query]);

  const reviewItems = useMemo(() => data.reviews.slice(0, 4), [data.reviews]);

  if (loading) return <p>Đang tải...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="home-hub-page">
      <header className="home-hub-topbar">
        <div className="home-hub-topbrand">AI Templates</div>

        <Link to="/" className="home-hub-master-brand">
          <img src="/tm-software-logo.svg" alt="Mẫu Làm Video" />
          <strong>Mẫu Làm<span>Video</span></strong>
        </Link>

        <nav className="home-hub-menu">
          <Link to="/">Trang chủ</Link>
          <Link to="/ai-tools">Công cụ AI</Link>
          <a href="#reviews">Review AI</a>
          <Link to="/chatbotprompt">Chatbot Prompt</Link>
          <Link to="/pricing">Bảng giá</Link>
          <a href="#affiliate">Cộng tác viên</a>
        </nav>

        <Link to={user ? "/profile" : "/auth"} className="home-hub-auth-btn">
          {user ? user.name : "Đăng ký / Đăng nhập"}
        </Link>
      </header>

      <div className="home-hub-body">
        <aside className="home-hub-sidebar">
          <div className="home-hub-side-group">
            <p>Khám phá</p>
            <Link to="/" className="active">Trang chủ</Link>
            <Link to="/ai-tools">Công cụ AI</Link>
            <a href="#reviews">Review AI</a>
            <Link to="/chatbotprompt">Chatbot Prompt</Link>
            <Link to="/chatbotprompt">Prompt miễn phí</Link>
            <Link to="/chatbotprompt">VEO3 Workflow</Link>
          </div>

          <div className="home-hub-side-group">
            <p>Khác</p>
            <Link to="/chatbotprompt">Custom Chatbot</Link>
            <Link to="/pricing">Bảng giá</Link>
            <a href="#about">Giới thiệu</a>
          </div>

          <button type="button" className="home-hub-minimize">Thu nhỏ</button>
        </aside>

        <main className="home-hub-main">
          <section className="home-hub-section">
            <header className="home-hub-section-head">
              <h2>Flash Sale</h2>
              <label className="home-hub-search">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tìm nhanh AI tool..."
                />
              </label>
            </header>

            {visibleTools.length === 0 ? (
              <article className="home-hub-empty">
                <h3>Không tìm thấy công cụ phù hợp</h3>
                <p>Bạn thử đổi từ khóa khác nhé.</p>
              </article>
            ) : (
              <div className="home-hub-tools-grid">
                {visibleTools.map((item) => (
                  <ToolCard key={item.key} item={item} />
                ))}
              </div>
            )}
          </section>

          <section className="home-hub-section" id="reviews">
            <header className="home-hub-section-head">
              <h2>Đánh giá công cụ AI</h2>
              <Link to="/ai-tools">Xem tất cả →</Link>
            </header>

            <div className="home-hub-review-grid">
              {reviewItems.map((review) => (
                <ReviewCard key={review.slug} review={review} />
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
