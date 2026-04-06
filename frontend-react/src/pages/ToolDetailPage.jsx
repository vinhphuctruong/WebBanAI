import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, money } from "../lib/api.js";

function getYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
  return match ? match[1] : null;
}

export default function ToolDetailPage() {
  const { slug } = useParams();
  const [tool, setTool] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/catalog/ai-tools/${slug}`).then(setTool).catch((err) => setError(err.message));
  }, [slug]);

  if (error) return <p className="error">{error}</p>;
  if (!tool) return <p>Đang tải...</p>;

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
                <span key={feature} className="tag">{feature}</span>
              ))}
            </div>
          )}

          {getYouTubeId(tool.tutorialUrl) && (
            <div style={{ marginTop: "2rem" }}>
              <h3>Video Hướng Dẫn</h3>
              <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: "12px", border: "1px solid var(--line)", background: "#000", marginTop: "1rem" }}>
                <iframe
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                  src={`https://www.youtube.com/embed/${getYouTubeId(tool.tutorialUrl)}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="YouTube video player"
                />
              </div>
            </div>
          )}
        </div>
        <div className="card sticky">
          <h2>{Number(tool.accountPrice || 0) === 0 ? "Miễn phí" : money(tool.accountPrice)}</h2>
          <p>Tồn kho: {tool.availableCount}</p>
          {Number(tool.accountPrice || 0) > 0 && tool.availableCount > 0 ? (
            <Link className="btn btn-primary" to={`/pay/ai/${tool.slug}`}>Mua ngay</Link>
          ) : Number(tool.accountPrice || 0) === 0 ? (
            <a href={tool.websiteUrl || tool.tutorialUrl || "#"} className="btn btn-primary" target="_blank" rel="noreferrer">Nhận miễn phí</a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
