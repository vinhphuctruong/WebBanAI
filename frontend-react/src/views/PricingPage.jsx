"use client";

import { useEffect, useState } from "react";
import { Link } from "../lib/router.jsx";
import { api, money } from "../lib/api.js";

export default function PricingPage({ initialPricing = null, initialError = "" }) {
  const [pricing, setPricing] = useState(initialPricing);
  const [error, setError] = useState(initialError);

  useEffect(() => {
    if (initialPricing) return;
    api("/catalog/pricing").then(setPricing).catch((err) => setError(err.message));
  }, [initialPricing]);

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
          <Link to="/pay/premium/monthly" className="btn btn-primary" style={{ marginTop: "1rem" }}>Mua ngay</Link>
        </article>
        <article className="card focus">
          <h2>Gói năm</h2>
          <p className="big">{money(pricing.yearly)}</p>
          <p>Tiết kiệm {pricing.yearlySavingsPercent}% so với gói tháng.</p>
          <Link to="/pay/premium/yearly" className="btn btn-primary" style={{ marginTop: "1rem" }}>Mua ngay</Link>
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

