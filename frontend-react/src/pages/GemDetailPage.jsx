import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, money } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

function getYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
  return match ? match[1] : null;
}

export default function GemDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [gem, setGem] = useState(null);
  const [error, setError] = useState("");
  const [purchasedContent, setPurchasedContent] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api(`/catalog/gems/${slug}`)
      .then((res) => {
        setGem(res);
        if (res.price === 0) {
          setPurchasedContent({
            promptInstruction: res.promptInstruction,
            promptContent: res.promptContent
          });
        } else if (res.price > 0 && user) {
          api(`/profile/purchases/gems/${slug}`)
            .then((content) => setPurchasedContent(content))
            .catch(() => setPurchasedContent(null));
        }
      })
      .catch((err) => setError(err.message));
  }, [slug, user]);

  if (error) return <p className="error">{error}</p>;
  if (!gem) return <p>Đang tải...</p>;

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

          {getYouTubeId(gem.tutorialVideo) && (
            <div style={{ marginTop: "2rem" }}>
              <h3>Video Hướng Dẫn</h3>
              <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: "12px", border: "1px solid var(--line)", background: "#000", marginTop: "1rem" }}>
                <iframe
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                  src={`https://www.youtube.com/embed/${getYouTubeId(gem.tutorialVideo)}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="YouTube video player"
                />
              </div>
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
            <Link className="btn btn-primary" to={`/pay/gem/${gem.slug}`}>Mua ngay</Link>
          ) : (
            <a href={gem.chatbotLink || gem.workflowLink || "#"} className="btn btn-primary" target="_blank" rel="noreferrer">Nhận miễn phí</a>
          )}
        </div>
      </div>
    </section>
  );
}
