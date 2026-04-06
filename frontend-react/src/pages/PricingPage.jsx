import { useEffect, useState } from "react";
import { api, money } from "../lib/api.js";

export default function PricingPage() {
  const [pricing, setPricing] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/catalog/pricing").then(setPricing).catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!pricing) return <p>Đang tải...</p>;

  return (
    <section className="stack">
      <h1>Bảng giá Premium</h1>
      <div className="grid two-cols">
        <article className="card focus">
          <h2>Gói tháng</h2>
          <p className="big">{money(pricing.monthly)}</p>
          <p>Dùng cho team nhỏ muốn test nhanh.</p>
        </article>
        <article className="card focus">
          <h2>Gói năm</h2>
          <p className="big">{money(pricing.yearly)}</p>
          <p>Tiết kiệm {pricing.yearlySavingsPercent}% so với gói tháng.</p>
        </article>
      </div>
      <article className="card">
        <h3>So sánh tính năng</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Tính năng</th>
              <th>Free</th>
              <th>Premium</th>
            </tr>
          </thead>
          <tbody>
            {pricing.compareRows?.map((row) => (
              <tr key={row.feature}>
                <td>{row.feature}</td>
                <td>{row.free}</td>
                <td>{row.premium}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </section>
  );
}
