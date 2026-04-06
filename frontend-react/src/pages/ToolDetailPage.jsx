import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, money } from "../lib/api.js";

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
          <div className="chips">
            {tool.features?.map((feature) => (
              <span key={feature} className="tag">{feature}</span>
            ))}
          </div>
        </div>
        <div className="card sticky">
          <h2>{Number(tool.accountPrice || 0) === 0 ? "Miễn phí" : money(tool.accountPrice)}</h2>
          <p>Tồn kho: {tool.availableCount}</p>
          {Number(tool.accountPrice || 0) > 0 && tool.availableCount > 0 && <Link className="btn btn-primary" to={`/pay/ai/${tool.slug}`}>Mua ngay</Link>}
        </div>
      </div>
    </section>
  );
}
