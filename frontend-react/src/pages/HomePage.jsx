import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api, money } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

/* ─── constants ──────────────────────────────────────────── */
const SALE_DURATION_MS = ((11 * 24 + 6) * 60 * 60 + 34 * 60 + 23) * 1000;
const FALLBACK_IMAGE = "/tm-aivideo-logo.jpg";

/* ─── YouTube helper ─────────────────────────────────────── */
function getYouTubeId(url) {
  if (!url) return null;
  const match =
    url.match(/[?&]v=([^&]+)/) ||
    url.match(/youtu\.be\/([^?]+)/) ||
    url.match(/youtube\.com\/embed\/([^?]+)/);
  return match ? match[1] : null;
}

/* ─── helpers ────────────────────────────────────────────── */
function normalizeCategory(value, fallback = "AI Video", withCaps = true) {
  if (!value) return fallback;
  const normalized = value.replace("cat-", "").replace(/[_-]+/g, " ").trim();
  if (!withCaps) return normalized;
  return normalized
    .split(" ")
    .filter(Boolean)
    .map((c) => c.charAt(0).toUpperCase() + c.slice(1))
    .join(" ");
}

function discountPercent(currentPrice, originalPrice) {
  const cur = Number(currentPrice || 0);
  const orig = Number(originalPrice || 0);
  if (cur <= 0 || orig <= cur) return 0;
  return Math.round(((orig - cur) / orig) * 100);
}

function toCountdown(deadline) {
  const total = Math.max(0, deadline - Date.now());
  const days = Math.floor(total / (24 * 60 * 60 * 1000));
  const hours = Math.floor((total % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((total % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((total % (60 * 1000)) / 1000);
  const p = (n) => String(n).padStart(2, "0");
  return { days: p(days), hours: p(hours), minutes: p(minutes), seconds: p(seconds) };
}

/* ─── GemCard – vertical portrait card like maulamvideo ─── */
function GemCard({ item, isNew = false, typeBadge = "Chatbot AI", isFlash = false }) {
  const discount = discountPercent(item.price, item.originalPrice);
  const isPremium = Number(item.price || 0) > 150000;
  const isFree = Number(item.price || 0) === 0;
  const youtubeId = getYouTubeId(item.videoUrl);
  const [videoOpen, setVideoOpen] = useState(false);

  return (
    <div className="mlv-card-wrap">
      <article className="mlv-card">
        {/* Image / Video area */}
        <div className="mlv-card-img-wrap">
          {videoOpen && youtubeId ? (
            /* ── Inline YouTube player ── */
            <div className="mlv-card-video-wrap">
              <iframe
                className="mlv-card-iframe"
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
                title={item.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <button
                className="mlv-card-video-close"
                onClick={() => setVideoOpen(false)}
                aria-label="Đóng video"
                title="Đóng"
              >
                ✕
              </button>
            </div>
          ) : (
            <>
              <img
                src={item.image || FALLBACK_IMAGE}
                alt={item.title}
                className="mlv-card-img"
                loading="lazy"
              />

              {/* YouTube play button overlay */}
              {youtubeId && (
                <button
                  className="mlv-card-play-btn"
                  onClick={() => setVideoOpen(true)}
                  aria-label="Xem video"
                  title="Xem video demo"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="mlv-play-icon">
                    <circle cx="12" cy="12" r="12" fill="rgba(0,0,0,0.45)" />
                    <path d="M9.5 7.5v9l7-4.5-7-4.5z" fill="white" />
                  </svg>
                </button>
              )}
            </>
          )}

          {/* Top-left badges – hide when video playing */}
          {!videoOpen && (
            <div className="mlv-card-badges-tl">
              {isFlash && discount > 0 && (
                <span className="mlv-badge mlv-badge-flash">⚡ -{discount}%</span>
              )}
              {isPremium && (
                <span className="mlv-badge mlv-badge-premium">👑 Premium</span>
              )}
              {isNew && (
                <span className="mlv-badge mlv-badge-new">✨ Mới</span>
              )}
              {isFree && (
                <span className="mlv-badge mlv-badge-free">🎁 Miễn phí</span>
              )}
            </div>
          )}

          {/* Top-right type badge – hide when video playing */}
          {!videoOpen && (
            <div className="mlv-card-badge-tr">
              <span className="mlv-type-badge">💬 {typeBadge}</span>
            </div>
          )}

          {/* Bookmark button */}
          {!videoOpen && (
            <button className="mlv-bookmark-btn" title="Lưu" aria-label="Lưu">🔖</button>
          )}
        </div>

        {/* Card body */}
        <Link to={item.link} className="mlv-card-body">
          <div className="mlv-card-title-row">
            <h3 className="mlv-card-title">{item.title}</h3>
            <span className="mlv-version-badge">v1.0</span>
          </div>
          <p className="mlv-card-desc">{item.description}</p>
          <div className="mlv-card-foot">
            {item.soldCount > 0 && (
              <span className="mlv-sold">{item.soldCount} đã bán</span>
            )}
            <div className="mlv-price-group">
              {discount > 0 && (
                <span className="mlv-discount-pill">-{discount}%</span>
              )}
              {Number(item.originalPrice || 0) > Number(item.price || 0) && (
                <span className="mlv-price-old">{money(item.originalPrice)}</span>
              )}
              <span className={`mlv-price-now ${isFree ? "mlv-price-free" : ""}`}>
                {isFree ? "Miễn phí" : money(item.price)}
              </span>
            </div>
          </div>
        </Link>
      </article>
    </div>
  );
}

/* ─── FreePromptCard ─────────────────────────────────────── */
function FreePromptCard({ item }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(item.description || item.title).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <article className="mlv-prompt-card">
      <Link to={item.link} className="mlv-prompt-img-wrap">
        <img src={item.image || FALLBACK_IMAGE} alt={item.title} className="mlv-prompt-img" loading="lazy" />
      </Link>
      <div className="mlv-prompt-body">
        <div className="mlv-prompt-title-row">
          <Link to={item.link} className="mlv-prompt-title">{item.title}</Link>
          <div className="mlv-prompt-actions">
            <button className="mlv-prompt-icon-btn" title="Lưu">🔖</button>
            <button className="mlv-prompt-icon-btn mlv-copy-btn" title="Sao chép" onClick={handleCopy}>
              {copied ? "✅" : "📋"}
            </button>
          </div>
        </div>
        <span className="mlv-prompt-cat-badge">🎨 Thiết kế</span>
        <div className="mlv-prompt-code-wrap">
          <pre className="mlv-prompt-code">{item.description}</pre>
        </div>
        <p className="mlv-prompt-copy-count">📋 {item.copyCount || 0} lần sao chép</p>
      </div>
    </article>
  );
}

/* ─── Main Page ──────────────────────────────────────────── */
export default function HomePage() {
  const { user } = useAuth();
  const saleDeadlineRef = useRef(Date.now() + SALE_DURATION_MS);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ gems: [], tools: [], reviews: [] });
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [activeGemCategory, setActiveGemCategory] = useState("all");
  const [countdown, setCountdown] = useState(() => toCountdown(saleDeadlineRef.current));

  useEffect(() => {
    Promise.all([api("/catalog/gems"), api("/catalog/ai-tools"), api("/catalog/reviews")])
      .then(([gems, tools, reviews]) => setData({ gems, tools, reviews }))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setCountdown(toCountdown(saleDeadlineRef.current)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const gemCategories = useMemo(
    () => ["all", ...new Set(data.gems.map((g) => g.categoryId).filter(Boolean))],
    [data.gems]
  );

  const gemItems = useMemo(() =>
    data.gems.map((gem) => ({
      key: `gem-${gem.slug}`,
      title: gem.title,
      description: gem.description || "Mẫu chatbot và workflow AI giúp bạn tạo nội dung nhanh hơn.",
      image: gem.thumbnail || FALLBACK_IMAGE,
      category: normalizeCategory(gem.categoryId, "Chatbot Prompt"),
      price: Number(gem.price || 0),
      originalPrice: Number(gem.originalPrice || 0),
      soldCount: Number(gem.soldCount || 0),
      link: `/chatbotprompt/${gem.slug}`,
      isNew: gem.isNew || false,
      videoUrl: gem.tutorialVideo || "",
    })),
    [data.gems]
  );

  const flashSaleItems = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    const source = [...gemItems]
      .filter((item) => Number(item.originalPrice || 0) > Number(item.price || 0))
      .sort((a, b) => discountPercent(b.price, b.originalPrice) - discountPercent(a.price, a.originalPrice));
    const fallback = source.length > 0 ? source : [...gemItems].sort((a, b) => b.price - a.price);
    return fallback
      .filter((item) => {
        const catMatch = activeGemCategory === "all" || item.category === normalizeCategory(activeGemCategory, "", false);
        const qMatch = !normalizedQuery || `${item.title} ${item.description} ${item.category}`.toLowerCase().includes(normalizedQuery);
        return catMatch && qMatch;
      })
      .slice(0, 4);
  }, [gemItems, query, activeGemCategory]);

  const hotGems = useMemo(() =>
    [...gemItems]
      .sort((a, b) => {
        const diff = discountPercent(b.price, b.originalPrice) - discountPercent(a.price, a.originalPrice);
        return diff !== 0 ? diff : b.price - a.price;
      })
      .slice(0, 4),
    [gemItems]
  );

  const freePromptItems = useMemo(() => {
    const free = gemItems.filter((item) => Number(item.price || 0) === 0);
    return (free.length > 0 ? free : [...gemItems].sort((a, b) => a.price - b.price)).slice(0, 4);
  }, [gemItems]);

  const mainGemItems = useMemo(() =>
    [...gemItems]
      .sort((a, b) => b.price - a.price)
      .slice(0, 8),
    [gemItems]
  );

  if (loading) {
    return (
      <div className="mlv-loading">
        <div className="mlv-loading-spinner" />
        <p>Đang tải...</p>
      </div>
    );
  }

  if (error) {
    return (
      <p className="mlv-error">{error}</p>
    );
  }

  return (
    <>
      <section className="mlv-hero">
        <div className="mlv-hero-inner">
          <div className="mlv-hero-glow mlv-hero-glow-1" />
          <div className="mlv-hero-glow mlv-hero-glow-2" />
          <div className="mlv-hero-content">
            <div className="mlv-hero-icon-wrap">
              <span className="mlv-hero-icon">🎬</span>
            </div>
            <div className="mlv-hero-text">
              <span className="mlv-hero-kicker">✨ Dùng thử miễn phí</span>
              <h1>AI hỗ trợ làm <span className="mlv-accent">video bán hàng</span> tốt nhất</h1>
              <p>Tạo tài khoản và dùng thử ngay công cụ AI tạo video marketing chuyên nghiệp, nhanh chóng.</p>
              <a
                href="https://khoahocbigman.com/go/freetest"
                target="_blank"
                rel="noopener noreferrer"
                className="mlv-hero-cta"
              >
                Dùng thử ngay →
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mlv-section mlv-section-flash" id="flash-sale">
        <div className="mlv-section-glow-red" />
        <header className="mlv-section-head">
          <div className="mlv-section-title-wrap">
            <div className="mlv-section-icon mlv-icon-red">⚡</div>
            <div>
              <div className="mlv-section-title-row">
                <h2>Flash <em>Sale</em></h2>
                <span className="mlv-flash-badge">Giảm sốc</span>
              </div>
              <div className="mlv-section-subtitle-row">
                <span className="mlv-muted-text">Ưu đãi có thời hạn</span>
                <div className="mlv-countdown">
                  🕐 <span className="mlv-countdown-digits">
                    {countdown.days}d{" "}
                    {countdown.hours}:{countdown.minutes}:{countdown.seconds}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <Link to="/chatbotprompt" className="mlv-see-all mlv-see-all-red">Xem tất cả →</Link>
        </header>

        {flashSaleItems.length === 0 ? (
          <div className="mlv-empty">
            <h3>Không tìm thấy sản phẩm</h3>
            <p>Thử đổi danh mục hoặc từ khoá nhé.</p>
          </div>
        ) : (
          <div className="mlv-grid">
            {flashSaleItems.map((item) => (
              <GemCard key={item.key} item={item} isNew isFlash typeBadge="Chatbot AI" />
            ))}
          </div>
        )}
      </section>

      <section className="mlv-section" id="hot-chatbots">
        <header className="mlv-section-head">
          <div className="mlv-section-title-wrap">
            <div className="mlv-section-icon mlv-icon-orange">🔥</div>
            <div>
              <h2>Chatbot <em>Hot</em></h2>
              <p className="mlv-muted-text">Những chatbot được yêu thích nhất</p>
            </div>
          </div>
          <Link to="/chatbotprompt" className="mlv-see-all">Xem tất cả →</Link>
        </header>
        <div className="mlv-grid">
          {hotGems.map((item) => (
            <GemCard key={item.key} item={item} isNew={item.isNew} typeBadge="Chatbot AI" />
          ))}
        </div>
      </section>

      <section className="mlv-section" id="free-prompts">
        <header className="mlv-section-head">
          <div className="mlv-section-title-wrap">
            <div className="mlv-section-icon mlv-icon-primary">✨</div>
            <div>
              <div className="mlv-section-kicker-wrap">
                <span className="mlv-kicker-pill">✨ Miễn phí</span>
              </div>
              <h2>Thư viện <em>Prompt</em> miễn phí</h2>
              <p className="mlv-muted-text">Sao chép và sử dụng ngay với ChatGPT, Claude, Gemini và các công cụ AI khác</p>
            </div>
          </div>
          <Link to="/chatbotprompt" className="mlv-see-all">Xem kho prompt →</Link>
        </header>
        <div className="mlv-prompt-grid">
          {freePromptItems.map((item) => (
            <FreePromptCard key={`free-${item.key}`} item={item} />
          ))}
        </div>
        <div className="mlv-center-btn-row">
          <Link to="/chatbotprompt" className="mlv-outline-btn">
            Xem tất cả Prompt miễn phí →
          </Link>
        </div>
      </section>

      <section className="mlv-section" id="main-gems">
        <header className="mlv-section-head">
          <div className="mlv-section-title-wrap">
            <div className="mlv-section-icon mlv-icon-primary">💬</div>
            <div>
              <h2>Chatbot <em>Prompt</em></h2>
              <p className="mlv-muted-text">Công cụ AI giúp bạn viết prompt chuyên nghiệp</p>
            </div>
          </div>
          <Link to="/chatbotprompt" className="mlv-see-all">Xem tất cả →</Link>
        </header>

        <div className="mlv-filter-bar">
          <label className="mlv-search-label" aria-label="Tìm chatbot">
            🔍
            <input
              className="mlv-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm chatbot hoặc prompt..."
            />
          </label>
          <div className="mlv-category-pills">
            {gemCategories.slice(0, 6).map((cat) => (
              <button
                key={cat}
                type="button"
                className={`mlv-cat-pill ${activeGemCategory === cat ? "active" : ""}`}
                onClick={() => setActiveGemCategory(cat)}
              >
                {cat === "all" ? "Tất cả" : normalizeCategory(cat)}
              </button>
            ))}
          </div>
        </div>

        <div className="mlv-grid mlv-grid-3">
          {mainGemItems.map((item) => (
            <GemCard key={item.key} item={item} isNew={item.isNew} typeBadge="Chatbot AI" />
          ))}
        </div>
      </section>

      <section className="mlv-section mlv-cta-section" id="about">
        <div className="mlv-cta-inner">
          <div className="mlv-cta-glow" />
          <h2>Tham gia cộng đồng <span className="mlv-accent">AI Creator</span></h2>
          <p>Hơn {data.gems.length}+ chatbot template, {data.tools.length}+ AI tools đang chờ bạn khám phá.</p>
          <div className="mlv-cta-stats">
            <div className="mlv-stat">
              <strong>{data.gems.length}+</strong>
              <span>Chatbot templates</span>
            </div>
            <div className="mlv-stat">
              <strong>{data.tools.length}+</strong>
              <span>AI Tools</span>
            </div>
            <div className="mlv-stat">
              <strong>{data.reviews.length}+</strong>
              <span>Bài review</span>
            </div>
          </div>
          <Link to={user ? "/profile" : "/auth"} className="mlv-hero-cta">
            {user ? "Vào trang cá nhân" : "Đăng ký miễn phí"}
          </Link>
        </div>
      </section>
    </>
  );
}
