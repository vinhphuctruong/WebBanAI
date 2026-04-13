import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api, money } from "../lib/api.js";

export default function PayResultPage() {
  const [searchParams] = useSearchParams();
  const provider = searchParams.get("provider") || "";
  const paymentId = searchParams.get("paymentId") || "";
  const status = searchParams.get("status") || "";
  const code = searchParams.get("code") || "";

  // MoMo sends params via redirect too
  const momoResultCode = searchParams.get("resultCode");
  const momoOrderId = searchParams.get("orderId") || "";
  const momoMessage = searchParams.get("message") || "";

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Determine actual provider and payment ID
  const actualProvider = provider || (momoResultCode !== null ? "momo" : "");
  const actualPaymentId =
    paymentId ||
    (momoOrderId.startsWith("TMV") ? momoOrderId.slice(3) : momoOrderId.startsWith("MLV_") ? momoOrderId.slice(4) : "");
  const isSuccess = status === "success" || momoResultCode === "0";

  useEffect(() => {
    if (!actualPaymentId) {
      setLoading(false);
      setError("Không tìm thấy thông tin thanh toán.");
      return;
    }

    api(`/payments/verify/${actualPaymentId}`)
      .then((res) => {
        setPayment(res.payment);
      })
      .catch((err) => {
        setError(err.message || "Không thể xác minh thanh toán.");
      })
      .finally(() => setLoading(false));
  }, [actualPaymentId]);

  const providerLabel = {
    vnpay: "VNPay",
    momo: "MoMo",
  }[actualProvider] || "Cổng thanh toán";

  if (loading) {
    return (
      <section className="pay-result-page">
        <div className="pay-result-card">
          <div className="pay-result-spinner" />
          <p>Đang xác minh thanh toán...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="pay-result-page">
      <div className="pay-result-card">
        {isSuccess ? (
          <>
            <div className="pay-result-icon pay-result-success">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <h2>Thanh toán thành công!</h2>
            <p className="pay-result-sub">
              Đơn hàng của bạn đã được xử lý qua <strong>{providerLabel}</strong>.
            </p>
          </>
        ) : (
          <>
            <div className="pay-result-icon pay-result-failed">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M15 9l-6 6M9 9l6 6" />
              </svg>
            </div>
            <h2>Thanh toán không thành công</h2>
            <p className="pay-result-sub">
              {momoMessage || `Giao dịch qua ${providerLabel} không hoàn tất.`}
              {code && code !== "00" && <><br /><small>Mã lỗi: {code}</small></>}
            </p>
          </>
        )}

        {payment && (
          <div className="pay-result-details">
            <div className="pay-result-row">
              <span>Sản phẩm</span>
              <strong>{payment.title}</strong>
            </div>
            <div className="pay-result-row">
              <span>Số tiền</span>
              <strong>{money(payment.amount)}</strong>
            </div>
            <div className="pay-result-row">
              <span>Phương thức</span>
              <strong>{providerLabel}</strong>
            </div>
            <div className="pay-result-row">
              <span>Trạng thái</span>
              <strong className={payment.status === "success" ? "text-success" : "text-warning"}>
                {payment.status === "success" ? "Thành công" : payment.status === "submitted" ? "Chờ duyệt" : "Đang xử lý"}
              </strong>
            </div>
          </div>
        )}

        <div className="pay-result-actions">
          {isSuccess && (
            <Link to="/purchased-products" className="btn btn-primary">
              Xem sản phẩm đã mua
            </Link>
          )}
          <Link to="/" className="btn btn-outline">
            Về trang chủ
          </Link>
        </div>

        {error && <p className="error" style={{ marginTop: "1rem" }}>{error}</p>}
      </div>
    </section>
  );
}
