import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, money } from "../lib/api.js";

function normalizeCategory(value, fallback = "Prompt") {
  if (!value) return fallback;
  return value
    .replace("cat-", "")
    .replace(/[_-]+/g, " ")
    .trim();
}

function discountPercent(currentPrice, originalPrice) {
  const current = Number(currentPrice || 0);
  const original = Number(originalPrice || 0);
  if (current <= 0 || original <= current) return 0;
  return Math.round(((original - current) / original) * 100);
}

function secondsToClock(value) {
  const safeValue = Math.max(0, Number(value || 0));
  const hours = String(Math.floor(safeValue / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((safeValue % 3600) / 60)).padStart(2, "0");
  const seconds = String(safeValue % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function ProductCard({ item }) {
  const discount = discountPercent(item.price, item.originalPrice);

  return (
    <Link to={item.link} className="home-clone-card-link" aria-label={`Xem chi tiết ${item.title}`}>
      <article className="home-clone-card">
        <div className="home-clone-card-head">
          <img src={item.image} alt={item.title} className="home-clone-card-logo" />
          <div className="home-clone-card-meta">
            <h3>{item.title}</h3>
            <span>{item.category}</span>
          </div>
        </div>
        <p className="home-clone-card-desc">{item.description || "Mẫu triển khai nhanh cho đội ngũ bán hàng và nội dung."}</p>
        <div className="home-clone-card-foot">
          <div className="home-clone-price-wrap">
            {item.originalPrice > item.price && item.price > 0 && <span className="home-clone-price-old">{money(item.originalPrice)}</span>}
            <strong>{item.price === 0 ? "Miễn phí" : money(item.price)}</strong>
          </div>
          <div className="home-clone-card-tags">
            {discount > 0 && <span className="home-clone-tag sale">-{discount}%</span>}
            <span className="home-clone-tag">{item.stockLabel}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ gems: [], tools: [], reviews: [] });
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [saleSeconds, setSaleSeconds] = useState(3 * 60 * 60 + 32 * 60 + 18);

  useEffect(() => {
    Promise.all([api("/catalog/gems"), api("/catalog/ai-tools"), api("/catalog/reviews")])
      .then(([gems, tools, reviews]) => setData({ gems, tools, reviews }))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSaleSeconds((prev) => {
        if (prev <= 1) return 3 * 60 * 60 + 32 * 60 + 18;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const gemItems = useMemo(() => {
    return data.gems.map((gem) => ({
      key: `gem-${gem.slug}`,
      type: "gem",
      title: gem.title,
      description: gem.description,
      image: gem.thumbnail,
      category: normalizeCategory(gem.categoryId, "Prompt"),
      price: Number(gem.price || 0),
      originalPrice: Number(gem.originalPrice || 0),
      stockLabel: "Prompt số",
      productType: gem.productType || "",
      link: `/chatbotprompt/${gem.slug}`
    }));
  }, [data.gems]);

  const toolItems = useMemo(() => {
    return data.tools.map((tool) => ({
      key: `tool-${tool.slug}`,
      type: "tool",
      title: tool.name,
      description: tool.description,
      image: tool.logo,
      category: normalizeCategory(tool.category, "AI Tool"),
      price: Number(tool.accountPrice || 0),
      originalPrice: Number(tool.originalPrice || 0),
      stockLabel: `Kho: ${Number(tool.availableCount || 0)}`,
      link: `/ai-tool/${tool.slug}`
    }));
  }, [data.tools]);

  const mixedItems = useMemo(() => [...gemItems, ...toolItems], [gemItems, toolItems]);

  const topCategories = useMemo(() => {
    return ["all", ...new Set(mixedItems.map((item) => item.category).filter(Boolean))].slice(0, 8);
  }, [mixedItems]);

  useEffect(() => {
    if (!topCategories.includes(activeCategory)) {
      setActiveCategory("all");
    }
  }, [activeCategory, topCategories]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();

    return mixedItems.filter((item) => {
      const categoryMatch = activeCategory === "all" || item.category === activeCategory;
      const queryMatch =
        !normalizedQuery ||
        `${item.title} ${item.description} ${item.category}`.toLowerCase().includes(normalizedQuery);
      return categoryMatch && queryMatch;
    });
  }, [mixedItems, activeCategory, query]);

  const flashSaleItems = useMemo(() => {
    const discounted = filteredItems.filter((item) => discountPercent(item.price, item.originalPrice) > 0);
    const base = discounted.length > 0 ? discounted : filteredItems;

    return [...base]
      .sort((a, b) => {
        const discountA = discountPercent(a.price, a.originalPrice);
        const discountB = discountPercent(b.price, b.originalPrice);
        if (discountA !== discountB) return discountB - discountA;
        return b.price - a.price;
      })
      .slice(0, 8);
  }, [filteredItems]);

  const chatbotHotItems = useMemo(() => {
    const hotKeywords = /chatbot|koc|affiliate|ugc|review|video/i;
    const matched = gemItems.filter((item) =>
      hotKeywords.test(`${item.title} ${item.description} ${item.productType}`)
    );
    return (matched.length > 0 ? matched : gemItems).slice(0, 4);
  }, [gemItems]);

  const freePromptItems = useMemo(() => {
    const freeItems = gemItems.filter((item) => item.price === 0);
    if (freeItems.length > 0) return freeItems.slice(0, 4);
    return [...gemItems].sort((a, b) => a.price - b.price).slice(0, 4);
  }, [gemItems]);

  const chatbotPromptItems = useMemo(() => gemItems.slice(0, 4), [gemItems]);
  const aiToolItems = useMemo(() => toolItems.slice(0, 8), [toolItems]);
  const reviewItems = useMemo(() => data.reviews.slice(0, 4), [data.reviews]);

  const heroItem = flashSaleItems[0] || mixedItems[0];
  const heroImage =
    heroItem?.image ||
    "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80";

  if (loading) return <p>Đang tải...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="home-clone-shell">
      <aside className="home-clone-sidebar">
        <Link to="/" className="home-clone-brand">
          <img src="/tm-software-logo.svg" alt="Logo TM software AI" />
          <span>AI Templates</span>
        </Link>

        <div className="home-clone-side-group">
          <p>Khám phá</p>
          <Link to="/" className="active">Trang chủ</Link>
          <Link to="/ai-tools">Công cụ AI</Link>
          <Link to="/chatbotprompt">Chatbot Prompt</Link>
          <Link to="/pricing">Bảng giá</Link>
        </div>

        <div className="home-clone-side-group">
          <p>Danh mục nhanh</p>
          {topCategories.slice(1, 6).map((category) => (
            <button key={category} type="button" onClick={() => setActiveCategory(category)}>
              {category}
            </button>
          ))}
        </div>

        <div className="home-clone-side-cta">
          <h3>Dùng thử ngay</h3>
          <p>Tạo tài khoản và dùng thử công cụ AI tạo video marketing chuyên nghiệp.</p>
          <Link to="/auth">Đăng ký / Đăng nhập</Link>
        </div>
      </aside>

      <div className="home-clone-main">
        <section className="home-clone-hero">
          <div className="home-clone-copy">
            <span className="home-clone-kicker">Dùng thử miễn phí</span>
            <h1>
              AI hỗ trợ làm <span>video bán hàng</span> tốt nhất
            </h1>
            <p>Tối ưu cho đội ngũ nội dung và bán hàng: chọn mẫu prompt, mua AI tool và triển khai nhanh trong cùng một nơi.</p>

            <div className="home-clone-actions">
              <Link to="/chatbotprompt" className="btn btn-primary">Dùng thử ngay</Link>
              <Link to="/ai-tools" className="btn btn-outline">Khám phá AI Tools</Link>
            </div>

            <label className="home-clone-search" aria-label="Tìm kiếm trên trang chủ">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm công cụ AI, chatbot prompt, workflow..."
              />
            </label>

            <div className="home-clone-category-row">
              {topCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={activeCategory === category ? "active" : ""}
                  onClick={() => setActiveCategory(category)}
                >
                  {category === "all" ? "Tất cả" : category}
                </button>
              ))}
            </div>

            <div className="home-clone-stats">
              <article>
                <strong>{data.gems.length}+</strong>
                <span>Chatbot Prompt</span>
              </article>
              <article>
                <strong>{data.tools.length}+</strong>
                <span>Công cụ AI</span>
              </article>
              <article>
                <strong>{data.reviews.length}+</strong>
                <span>Review chuyên sâu</span>
              </article>
            </div>
          </div>

          <div className="home-clone-media">
            <img src={heroImage} alt="Mẫu làm video AI" />
            <div className="home-clone-media-note">
              <span>Mục nổi bật</span>
              <strong>{heroItem?.title || "Kho tài nguyên AI thực chiến"}</strong>
            </div>
          </div>
        </section>

        <section className="home-clone-section">
          <header className="home-clone-section-head">
            <div className="home-clone-title-wrap">
              <span className="home-clone-icon">⚡</span>
              <h2>Flash Sale</h2>
            </div>
            <div className="home-clone-clock">
              {secondsToClock(saleSeconds).split(":").map((part) => (
                <span key={part}>{part}</span>
              ))}
            </div>
          </header>
          {flashSaleItems.length === 0 ? (
            <article className="home-clone-empty">
              <h3>Không có sản phẩm phù hợp</h3>
              <p>Bạn thử đổi từ khóa hoặc danh mục để xem kết quả khác.</p>
            </article>
          ) : (
            <div className="home-clone-grid">{flashSaleItems.map((item) => <ProductCard item={item} key={item.key} />)}</div>
          )}
        </section>

        <section className="home-clone-section">
          <header className="home-clone-section-head">
            <h2>Chatbot Hot</h2>
            <Link to="/chatbotprompt">Xem tất cả</Link>
          </header>
          <div className="home-clone-grid">{chatbotHotItems.map((item) => <ProductCard item={item} key={item.key} />)}</div>
        </section>

        <section className="home-clone-section">
          <header className="home-clone-section-head">
            <h2>Thư viện Prompt miễn phí</h2>
            <Link to="/chatbotprompt">Xem tất cả Prompt miễn phí</Link>
          </header>
          <div className="home-clone-grid">{freePromptItems.map((item) => <ProductCard item={item} key={item.key} />)}</div>
        </section>

        <section className="home-clone-section">
          <header className="home-clone-section-head">
            <h2>Chatbot Prompt</h2>
            <Link to="/chatbotprompt">Xem tất cả</Link>
          </header>
          <div className="home-clone-grid">{chatbotPromptItems.map((item) => <ProductCard item={item} key={item.key} />)}</div>
        </section>

        <section className="home-clone-section">
          <header className="home-clone-section-head">
            <h2>Khám phá AI Tools</h2>
            <Link to="/ai-tools">Xem tất cả</Link>
          </header>
          <div className="home-clone-grid">{aiToolItems.map((item) => <ProductCard item={item} key={item.key} />)}</div>
        </section>

        <section className="home-clone-section">
          <header className="home-clone-section-head">
            <h2>Đánh giá công cụ AI</h2>
          </header>
          <div className="home-clone-review-grid">
            {reviewItems.map((review) => (
              <article className="home-clone-review-card" key={review.slug}>
                <span>{review.category || "AI Review"}</span>
                <h3>{review.name}</h3>
                <p>{review.description}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
