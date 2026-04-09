import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, money } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

function getYouTubeId(url) {
  if (!url) return null;
  const match =
    url.match(/[?&]v=([^&]+)/) ||
    url.match(/youtu\.be\/([^?]+)/) ||
    url.match(/youtube\.com\/embed\/([^?]+)/);
  return match ? match[1] : null;
}

/* ── YouTube Player with thumbnail preview ── */
function YouTubePlayer({ url, label, accentColor }) {
  const videoId = getYouTubeId(url);
  const [playing, setPlaying] = useState(false);
  const [thumbSrc, setThumbSrc] = useState(
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
  );

  if (!videoId) return null;

  return (
    <div className="yt-player-wrap">
      {label && (
        <div
          className="yt-player-label"
          style={{ borderLeftColor: accentColor || "var(--brand)" }}
        >
          {label}
        </div>
      )}
      <div className="yt-player-frame">
        {playing ? (
          <iframe
            className="yt-player-iframe"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
            title={label || "YouTube Video"}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            className="yt-player-thumb-btn"
            onClick={() => setPlaying(true)}
            aria-label={`Phát video: ${label}`}
          >
            <img
              src={thumbSrc}
              alt={label || "Video thumbnail"}
              className="yt-player-thumbnail"
              onError={() =>
                setThumbSrc(
                  `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                )
              }
            />
            <div className="yt-player-overlay" />
            <div className="yt-player-play-wrap">
              <div
                className="yt-player-play-btn"
                style={{ background: accentColor || "var(--brand)" }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <span className="yt-player-play-hint">Nhấn để xem video</span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

export default function ToolDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [tool, setTool] = useState(null);
  const [purchasedInfo, setPurchasedInfo] = useState(null);
  const [showAccount, setShowAccount] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/catalog/ai-tools/${slug}`)
      .then((res) => {
        setTool(res);
        if (Number(res.accountPrice || 0) === 0) {
          setPurchasedInfo({ accountInfo: res.accountInfo });
        } else if (user) {
          api(`/profile/purchases/ai-tools/${slug}`)
            .then((info) => setPurchasedInfo(info))
            .catch(() => setPurchasedInfo(null));
        }
      })
      .catch((err) => setError(err.message));
  }, [slug, user]);

  if (error) return <p className="error">{error}</p>;
  if (!tool) return <p>Đang tải...</p>;

  const hasVideoUrl = Boolean(getYouTubeId(tool.videoUrl));
  const hasTutorial = Boolean(getYouTubeId(tool.tutorialUrl));

  return (
    <section className="stack">
      <Link to="/ai-tools">← Quay lại</Link>
      <div className="detail-layout">
        <div className="card">
          <img src={tool.logo} alt={tool.name} className="hero-thumb" />
          <h1>{tool.name}</h1>
          <p>{tool.description}</p>

          {tool.features?.length > 0 && (
            <div className="chips">
              {tool.features.map((feature) => (
                <span key={feature} className="tag">
                  {feature}
                </span>
              ))}
            </div>
          )}

          {/* Video Demo sản phẩm */}
          {hasVideoUrl && (
            <YouTubePlayer
              url={tool.videoUrl}
              label="📹 Video Demo Sản Phẩm"
              accentColor="#ef9b61"
            />
          )}

          {/* Video Hướng dẫn */}
          {hasTutorial && (
            <YouTubePlayer
              url={tool.tutorialUrl}
              label="🎓 Video Hướng Dẫn Sử Dụng"
              accentColor="#133e95"
            />
          )}

          {Number(tool.accountPrice || 0) > 0 && (
            <div
              style={{
                marginTop: "2rem",
                padding: "1.2rem",
                background: "rgba(33, 150, 243, 0.1)",
                color: "var(--brand)",
                borderRadius: "12px",
                border: "1px dashed var(--brand)",
                textAlign: "center",
              }}
            >
              <p>
                Sau khi thanh toán xong, Admin sẽ chủ động liên hệ qua
                Zalo/Email bạn đã cung cấp để bàn giao tài khoản.
              </p>
            </div>
          )}
        </div>

        <div className="card sticky">
          <h2>
            {Number(tool.accountPrice || 0) === 0
              ? "Miễn phí"
              : money(tool.accountPrice)}
          </h2>
          <p>Tồn kho: {tool.availableCount}</p>
          {Number(tool.accountPrice || 0) > 0 && tool.availableCount > 0 ? (
            <Link className="btn btn-primary" to={`/pay/ai/${tool.slug}`}>
              Mua ngay
            </Link>
          ) : Number(tool.accountPrice || 0) === 0 ? (
            <a
              href={tool.websiteUrl || tool.tutorialUrl || "#"}
              className="btn btn-primary"
              target="_blank"
              rel="noreferrer"
            >
              Nhận miễn phí
            </a>
          ) : null}

          {/* Hiển thị link nhanh video trong sidebar */}
          {(hasVideoUrl || hasTutorial) && (
            <div className="yt-sidebar-videos">
              <p className="yt-sidebar-title">🎬 Video</p>
              {hasVideoUrl && (
                <a
                  href={tool.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="yt-sidebar-link"
                >
                  📹 Xem demo trên YouTube
                </a>
              )}
              {hasTutorial && (
                <a
                  href={tool.tutorialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="yt-sidebar-link"
                >
                  🎓 Xem hướng dẫn trên YouTube
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
