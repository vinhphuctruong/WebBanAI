import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, money } from "../lib/api.js";

export default function GemDetailPage() {
  const { slug } = useParams();
  const [gem, setGem] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/catalog/gems/${slug}`).then(setGem).catch((err) => setError(err.message));
  }, [slug]);

  if (error) return <p className="error">{error}</p>;
  if (!gem) return <p>Đang tải...</p>;

  return (
    <section className="stack">
      <Link to="/chatbotprompt">← Quay lại</Link>
      <div className="detail-layout">
        <div className="card">
          <img src={gem.thumbnail} alt={gem.title} className="hero-thumb" />
          <h1>{gem.title}</h1>
          <p>{gem.description}</p>
        </div>
        <div className="card sticky">
          <h2>{gem.price === 0 ? "Miễn phí" : money(gem.price)}</h2>
          {gem.price > 0 && <Link className="btn btn-primary" to={`/pay/gem/${gem.slug}`}>Mua ngay</Link>}
        </div>
      </div>
    </section>
  );
}
