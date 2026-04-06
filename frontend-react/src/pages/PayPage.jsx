import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { api, money } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

export default function PayPage() {
  const { itemType, slug } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    if (!user) return;

    api("/payments/create", {
      method: "POST",
      body: JSON.stringify({ itemType, slug, quantity: 1 })
    })
      .then((res) => setPayment(res.payment))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user, itemType, slug]);

  if (!user) return <Navigate to="/auth" replace />;
  if (loading) return <p>Đang tạo giao dịch...</p>;
  if (error) return <p className="error">{error}</p>;

  async function confirm() {
    try {
      const result = await api(`/payments/${payment.paymentId}/confirm`, { method: "POST" });
      setPayment(result.payment);
      if (result.payment.status === "submitted") {
        setInfo("Đã gửi yêu cầu xác nhận. Vui lòng chờ admin/staff duyệt giao dịch.");
      } else if (result.payment.status === "success") {
        setInfo("Thanh toán đã được xác nhận thành công.");
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="stack">
      <h1>Thanh toán chuyển khoản</h1>
      {info && <p className="success">{info}</p>}
      {error && <p className="error">{error}</p>}

      <article className="card">
        <p><strong>Sản phẩm:</strong> {payment.title}</p>
        <p><strong>Số tiền:</strong> {money(payment.amount)}</p>
        <p><strong>Mã thanh toán:</strong> {payment.paymentCode}</p>
        <p><strong>Hướng dẫn:</strong> {payment.instruction}</p>
        {payment.paymentUrl && <img src={payment.paymentUrl} alt="Mã QR" className="qr" />}
        {payment.zaloLink && <p><a href={payment.zaloLink} target="_blank" rel="noreferrer">Liên hệ Zalo để chốt sale</a></p>}
        {payment.telegramLink && <p><a href={payment.telegramLink} target="_blank" rel="noreferrer">Liên hệ Telegram để chốt sale</a></p>}
      </article>

      <button className="btn btn-primary" onClick={confirm} disabled={["submitted", "success"].includes(payment.status)}>
        {payment.status === "success" ? "Đã thanh toán" : payment.status === "submitted" ? "Đã gửi yêu cầu, chờ duyệt" : "Tôi đã chuyển khoản xong"}
      </button>
    </section>
  );
}
