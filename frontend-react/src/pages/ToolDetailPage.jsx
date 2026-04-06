import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, money } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

function getYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
  return match ? match[1] : null;
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
          // Trường hợp miễn phí: accountInfo đã có sẵn trong response của catalog API
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

          {purchasedInfo?.accountInfo ? (
            <div style={{ marginTop: "2rem", padding: "1.5rem", background: "var(--surface-soft)", borderRadius: "12px", border: "1px solid var(--brand)", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ color: "var(--brand)", margin: 0 }}>Thông tin tài khoản của bạn</h3>
                <button 
                  className="btn btn-soft" 
                  style={{ padding: "4px 12px", fontSize: "0.9rem" }}
                  onClick={() => setShowAccount(!showAccount)}
                >
                  {showAccount ? "Ẩn bớt" : "Hiện tài khoản"}
                </button>
              </div>
              
              {showAccount ? (
                <>
                  <pre style={{ whiteSpace: "pre-wrap", background: "var(--surface)", color: "var(--ink)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--line)", fontSize: "1.05rem", fontWeight: "600" }}>
                    {purchasedInfo.accountInfo}
                  </pre>
                  <button 
                    className="btn btn-primary" 
                    style={{ marginTop: "1rem", width: "100%" }}
                    onClick={() => {
                      navigator.clipboard.writeText(purchasedInfo.accountInfo);
                      alert("Đã copy thông tin tài khoản!");
                    }}
                  >
                    Copy thông tin
                  </button>
                </>
              ) : (
                <div style={{ padding: "1.5rem", textAlign: "center", background: "var(--surface)", borderRadius: "8px", border: "1px dashed var(--line)", color: "var(--ink-soft)" }}>
                  <p style={{ margin: 0 }}>Thông tin tài khoản đang bị ẩn để bảo mật.</p>
                  <button 
                    className="btn btn-soft" 
                    style={{ marginTop: "0.5rem" }}
                    onClick={() => setShowAccount(true)}
                  >
                    Bấm để hiển thị
                  </button>
                </div>
              )}
            </div>
          ) : Number(tool.accountPrice || 0) > 0 && (
            <div style={{ marginTop: "2rem", padding: "1.2rem", background: "rgba(255, 193, 7, 0.1)", color: "#b8860b", borderRadius: "12px", border: "1px dashed #b8860b", textAlign: "center" }}>
              <p>Bạn cần mua sản phẩm này để xem thông tin tài khoản đăng nhập.</p>
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
