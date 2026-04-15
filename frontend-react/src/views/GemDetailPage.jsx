"use client";

import { useEffect, useState } from "react";
import { Link, useParams } from "../lib/router.jsx";
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

export default function GemDetailPage({ initialGem = null, initialError = "" }) {
  const { slug } = useParams();
  const { user } = useAuth();
  const [gem, setGem] = useState(initialGem);
  const [error, setError] = useState(initialError);
  const [purchasedContent, setPurchasedContent] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadGemDetail() {
      try {
        const payload = initialGem || await api(`/catalog/gems/${slug}`);
        setGem(payload);

        if (Number(payload.price || 0) === 0) {
          setPurchasedContent({
            promptInstruction: payload.promptInstruction,
            promptContent: payload.promptContent
          });
          return;
        }

        if (!user) {
          setPurchasedContent(null);
          return;
        }

        try {
          const content = await api(`/profile/purchases/gems/${slug}`);
          setPurchasedContent(content);
        } catch (_err) {
          setPurchasedContent(null);
        }
      } catch (err) {
        setError(err.message);
      }
    }

    loadGemDetail();
  }, [initialGem, slug, user]);

  if (error) return <p className="error">{error}</p>;
  if (!gem) return <p>Đang tải...</p>;
  const isPaidGem = Number(gem.price || 0) > 0;
  const hasDemoVideo = Boolean(getYouTubeId(gem.videoUrl));
  const hasTutorialVideo = Boolean(getYouTubeId(gem.tutorialVideo));
  const canViewTutorialVideo = !isPaidGem || Boolean(purchasedContent);

  function copyPrompt() {
    if (purchasedContent?.promptContent) {
      navigator.clipboard.writeText(purchasedContent.promptContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <section className="stack">
      <Link to="/chatbotprompt">← Quay lại</Link>
      <div className="detail-layout">
        <div className="card">
          <img src={gem.thumbnail} alt={gem.title} className="hero-thumb" />
          <h1>{gem.title}</h1>
          <p>{gem.description}</p>

          {hasDemoVideo && (
            <YouTubePlayer
              url={gem.videoUrl}
              label="📹 Video Demo Sản Phẩm"
              accentColor="#ef9b61"
            />
          )}

          {hasTutorialVideo && canViewTutorialVideo && (
            <YouTubePlayer
              url={gem.tutorialVideo}
              label="🎓 Video Hướng Dẫn Sử Dụng"
              accentColor="#133e95"
            />
          )}

          {hasTutorialVideo && !canViewTutorialVideo && (
            <div style={{ marginTop: "1rem", padding: "1rem", background: "rgba(19, 62, 149, 0.1)", border: "1px dashed var(--brand)", borderRadius: "10px" }}>
              <p><strong>Video hướng dẫn đã bị khóa.</strong></p>
              <p>Vui lòng mua sản phẩm để mở khóa video hướng dẫn sử dụng.</p>
            </div>
          )}
          
          {purchasedContent ? (
            <div className="purchased-content" style={{ marginTop: "2rem", padding: "1.5rem", background: "var(--surface-soft)", borderRadius: "8px", border: "1px solid var(--line)" }}>
              {purchasedContent.promptInstruction && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <h3>Hướng dẫn sử dụng</h3>
                  <p style={{ whiteSpace: "pre-wrap", color: "var(--ink)" }}>{purchasedContent.promptInstruction}</p>
                </div>
              )}
              {purchasedContent.promptContent && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <h3>Nội dung Prompt</h3>
                    <button type="button" className="btn btn-outline" onClick={copyPrompt}>
                      {copied ? "Đã Copy ✓" : "Copy Prompt"}
                    </button>
                  </div>
                  <pre style={{ whiteSpace: "pre-wrap", background: "var(--surface)", color: "var(--ink)", padding: "1rem", borderRadius: "4px", border: "1px solid var(--line)" }}>
                    {purchasedContent.promptContent}
                  </pre>
                </div>
              )}
            </div>
          ) : gem.price > 0 && (
            <div style={{ marginTop: "2rem", padding: "1rem", background: "rgba(255, 193, 7, 0.2)", color: "#b8860b", borderRadius: "8px" }}>
              <p>Bạn cần thanh toán thành công để xem Hướng dẫn và lấy Nội dung Prompt.</p>
            </div>
          )}
        </div>
        <div className="card sticky">
          <h2>{gem.price === 0 ? "Miễn phí" : money(gem.price)}</h2>
          {gem.price > 0 ? (
            purchasedContent ? (
              <button type="button" className="btn btn-ghost" disabled style={{ color: "var(--brand)", opacity: 1, cursor: "default" }}>
                👑 Đã mở khóa
              </button>
            ) : (
              <Link className="btn btn-primary" to={`/pay/gem/${gem.slug}`}>Mua ngay</Link>
            )
          ) : (
            <a href={gem.chatbotLink || gem.workflowLink || "#"} className="btn btn-primary" target="_blank" rel="noreferrer">Nhận miễn phí</a>
          )}
        </div>
      </div>
    </section>
  );
}

