import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, money } from "../lib/api.js";

function normalizeCategory(value, fallback = "Prompt") {
  if (!value) return fallback;
  return value.replace("cat-", "").replace(/-/g, " ").trim();
}

function GemCard({ gem }) {
  return (
    <Link to={`/chatbotprompt/${gem.slug}`} className="card-link" aria-label={`Xem chi tiết ${gem.title}`}>
      <article className="card card-clickable product-card">
        <div className="media-wrap">
          <img src={gem.thumbnail} alt={gem.title} className="thumb" />
          <span className="badge">{normalizeCategory(gem.categoryId, "Prompt")}</span>
        </div>
        <h3>{gem.title}</h3>
        <p>{gem.description}</p>
        <div className="price-row">
          <strong>{gem.price === 0 ? "Miễn phí" : money(gem.price)}</strong>
          <span className="subtle-link">Nhấn để xem chi tiết</span>
        </div>
      </article>
    </Link>
  );
}

function ToolCard({ tool }) {
  return (
    <Link to={`/ai-tool/${tool.slug}`} className="card-link" aria-label={`Xem chi tiết ${tool.name}`}>
      <article className="card card-clickable product-card">
        <div className="media-wrap">
          <img src={tool.logo} alt={tool.name} className="thumb" />
          <span className="badge">{normalizeCategory(tool.category, "Công cụ AI")}</span>
        </div>
        <h3>{tool.name}</h3>
        <p>{tool.description}</p>
        <div className="price-row">
          <strong>{Number(tool.accountPrice || 0) === 0 ? "Miễn phí" : money(tool.accountPrice)}</strong>
          <span className="subtle-link">Nhấn để xem chi tiết</span>
        </div>
      </article>
    </Link>
  );
}

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ gems: [], tools: [], reviews: [] });
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api("/catalog/gems"), api("/catalog/ai-tools"), api("/catalog/reviews")])
      .then(([gems, tools, reviews]) => setData({ gems, tools, reviews }))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const heroImage = useMemo(() => {
    return data.gems[0]?.thumbnail || data.tools[0]?.logo || "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80";
  }, [data.gems, data.tools]);

  if (loading) return <p>Đang tải...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="stack page-home">
      <section className="hero-panel">
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">GIẢI PHÁP AI CHO DOANH NGHIỆP</span>
            <h1>
              Tăng tốc doanh số
              <br />
              cùng <span>Giải pháp AI</span>
            </h1>
            <p>
              Nền tảng tổng hợp prompt, công cụ AI và quy trình chốt sale. Bạn có thể tìm nhanh sản phẩm,
              xem chi tiết và mua ngay bằng chuyển khoản.
            </p>
            <div className="hero-actions">
              <Link to="/ai-tools" className="btn btn-primary">Khám phá công cụ</Link>
              <Link to="/chatbotprompt" className="btn btn-outline">Xem Prompt Chatbot</Link>
            </div>
            <div className="stat-row">
              <article className="stat-item">
                <strong>{data.tools.length}+</strong>
                <span>Công cụ AI</span>
              </article>
              <article className="stat-item">
                <strong>{data.gems.length}+</strong>
                <span>Gói Prompt</span>
              </article>
              <article className="stat-item">
                <strong>{data.reviews.length}+</strong>
                <span>Bài đánh giá</span>
              </article>
            </div>
          </div>

          <article className="hero-media">
            <img src={heroImage} alt="Ảnh minh họa AI" className="hero-shot" />
            <div className="hero-overlay">
              <div className="price-row">
                <span>Hiệu suất vận hành</span>
                <strong>+142%</strong>
              </div>
              <div className="meter">
                <span style={{ width: "82%" }} />
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="section-shell">
        <div className="row-head">
          <h2>Prompt bán chạy</h2>
          <Link to="/chatbotprompt">Xem tất cả prompt</Link>
        </div>
        <div className="grid">{data.gems.slice(0, 3).map((gem) => <GemCard key={gem.slug} gem={gem} />)}</div>
      </section>

      <section className="section-shell">
        <div className="row-head">
          <h2>Công cụ AI nổi bật</h2>
          <Link to="/ai-tools">Xem tất cả công cụ</Link>
        </div>
        <div className="grid">{data.tools.slice(0, 3).map((tool) => <ToolCard key={tool.slug} tool={tool} />)}</div>
      </section>

      <section className="section-shell">
        <div className="row-head">
          <h2>Đánh giá thị trường</h2>
        </div>
        <div className="grid">
          {data.reviews.map((review) => (
            <article className="card review-card" key={review.slug}>
              <span className="tag">{review.category}</span>
              <h3>{review.name}</h3>
              <p>{review.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
