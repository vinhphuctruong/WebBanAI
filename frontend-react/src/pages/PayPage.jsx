import { useEffect, useState } from "react";
import { Navigate, useParams, Link } from "react-router-dom";
import { api, money } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

function buildDetailLink(itemType, slug) {
  if (itemType === "gem") return `/chatbotprompt/${slug}`;
  return `/ai-tool/${slug}`;
}

function validateContactForm(contactForm) {
  const name = String(contactForm.name || "").trim();
  const phone = String(contactForm.phone || "").trim();
  const email = String(contactForm.email || "").trim();

  if (!name || !phone || !email) {
    return "Vui lòng nhập đầy đủ họ tên, số điện thoại có Zalo và email.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Email chưa đúng định dạng.";
  }
  const phoneDigits = phone.replace(/\D/g, "");
  if (phoneDigits.length < 8) {
    return "Số điện thoại chưa hợp lệ.";
  }
  return "";
}

const PAYMENT_METHODS = [
  {
    id: "bank_transfer",
    label: "Chuyển khoản ngân hàng",
    icon: "🏦",
    desc: "Chuyển khoản thủ công, admin xác nhận",
  },
  {
    id: "momo",
    label: "Ví MoMo",
    icon: "📱",
    desc: "Thanh toán tự động bằng ví MoMo",
  },
];

export default function PayPage() {
  const { itemType, slug } = useParams();
  const { user } = useAuth();
  
  const [step, setStep] = useState("checking");
  const [existingPayment, setExistingPayment] = useState(null);
  
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");

  const [contactForm, setContactForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || ""
  });
  const detailLink = buildDetailLink(itemType, slug);

  useEffect(() => {
    if (!user) return;
    setContactForm((prev) => ({
      name: prev.name || user?.name || "",
      phone: prev.phone || user?.phone || "",
      email: prev.email || user?.email || ""
    }));
  }, [user]);

  useEffect(() => {
    if (!user) return;

    api("/payments/check-existing", {
      method: "POST",
      body: JSON.stringify({ itemType, slug })
    })
      .then((res) => {
        if (res.exists) {
          setExistingPayment(res);
          setStep("prompt");
        } else {
          setStep("contact");
        }
      })
      .catch((err) => {
        setError(err.message);
        setStep("error");
      });
  }, [user, itemType, slug]);

  function goToMethodSelection() {
    const validationError = validateContactForm(contactForm);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setStep("method");
  }

  function startPayment(method) {
    setError("");
    setSelectedMethod(method);
    setStep("creating");

    api("/payments/create", {
      method: "POST",
      body: JSON.stringify({ 
        itemType, 
        slug, 
        quantity: 1,
        customerName: contactForm.name,
        customerPhone: contactForm.phone,
        customerEmail: contactForm.email,
        provider: method,
      })
    })
      .then((res) => {
        // VNPay/MoMo: redirect to payment gateway
        if (res.redirect && res.paymentUrl) {
          window.location.href = res.paymentUrl;
          return;
        }
        // Bank transfer: show payment details
        if (res.payment) {
          setPayment(res.payment);
          setStep("payment");
        } else {
          setError("Không nhận được thông tin thanh toán.");
          setStep("method");
        }
      })
      .catch((err) => {
        setError(err.message);
        setStep("method");
      });
  }

  function loadExistingPayment() {
    setStep("creating");
    api(`/payments/${existingPayment.paymentId}`)
      .then((res) => {
        setPayment(res.payment);
        setStep("payment");
      })
      .catch((err) => {
        setError(err.message);
        setStep("error");
      });
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (step === "checking") return <p>Đang kiểm tra thông tin...</p>;
  if (step === "creating") {
    return (
      <section className="pay-result-page">
        <div className="pay-result-card">
          <div className="pay-result-spinner" />
          <p>{selectedMethod === "bank_transfer" ? "Đang thiết lập giao dịch..." : `Đang chuyển sang ${selectedMethod === "vnpay" ? "VNPay" : "MoMo"}...`}</p>
        </div>
      </section>
    );
  }

  if (step === "prompt") {
    function translateStatus(s) {
      if (s === "success") return "Đã thanh toán (Thành công)";
      if (s === "submitted") return "Chờ duyệt (Đã chuyển khoản)";
      return "Chưa xác nhận";
    }

    return (
      <section className="stack">
        <div className="card" style={{ maxWidth: 500, margin: "2rem auto", padding: "2rem", textAlign: "center" }}>
          <h2 style={{ marginBottom: "1rem" }}>Bạn đã từng Mua sản phẩm này!</h2>
          <p style={{ marginBottom: "2rem" }}>
            Hệ thống ghi nhận bạn đã có một lệnh thanh toán với trạng thái: <br/>
            <strong style={{ color: "var(--brand)", fontSize: "1.2rem", display: "block", marginTop: "0.5rem" }}>
              {translateStatus(existingPayment.status)}
            </strong>
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            <button className="btn btn-primary" onClick={loadExistingPayment}>
              Xem lại hoá đơn cũ đó
            </button>
            <button className="btn btn-outline" onClick={() => { setError(""); setStep("contact"); }}>
              Mua thêm
            </button>
            <Link to="/" className="btn btn-ghost">
              Trở về trang chủ
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (step === "contact") {
    return (
      <section className="stack">
        <div className="card" style={{ maxWidth: 500, margin: "2rem auto", padding: "2rem" }}>
          <h2 style={{ marginBottom: "1rem", textAlign: "center" }}>Thông tin liên hệ người mua</h2>
          <p style={{ marginBottom: "1.5rem", fontSize: "0.95rem", color: "var(--ink-soft)", textAlign: "center" }}>
            Vui lòng nhập đúng thông tin để admin liên hệ xác nhận đơn và hỗ trợ bàn giao nhanh hơn.
          </p>
          
          {error && <p className="error">{error}</p>}

          <div className="form stack" style={{ gap: "1rem" }}>
            <label>
              Tên của bạn
              <input 
                type="text" 
                value={contactForm.name} 
                onChange={e => setContactForm({...contactForm, name: e.target.value})} 
                placeholder="Nguyễn Văn A" 
              />
            </label>
            <label>
              Số điện thoại (Zalo)
              <input 
                type="text" 
                value={contactForm.phone} 
                onChange={e => setContactForm({...contactForm, phone: e.target.value})} 
                placeholder="09xxx" 
              />
            </label>
            <label>
              Email liên hệ
              <input 
                type="email" 
                value={contactForm.email} 
                onChange={e => setContactForm({...contactForm, email: e.target.value})} 
                placeholder="example@gmail.com" 
              />
            </label>
            
            <button className="btn btn-primary" onClick={goToMethodSelection} style={{ marginTop: "1rem" }}>
              Chọn phương thức thanh toán
            </button>
            <Link to={detailLink} className="btn btn-ghost" style={{ textAlign: "center" }}>
              Hủy bỏ
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // ── Step: Choose payment method ──
  if (step === "method") {
    return (
      <section className="stack">
        <div className="card" style={{ maxWidth: 540, margin: "2rem auto", padding: "2rem" }}>
          <h2 style={{ marginBottom: "0.5rem", textAlign: "center" }}>Chọn phương thức thanh toán</h2>
          <p style={{ marginBottom: "1.5rem", fontSize: "0.95rem", color: "var(--ink-soft)", textAlign: "center" }}>
            Chọn cách bạn muốn thanh toán cho đơn hàng này.
          </p>

          {error && <p className="error">{error}</p>}

          <div className="payment-methods">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.id}
                className="payment-method-card"
                onClick={() => startPayment(m.id)}
              >
                <span className="payment-method-icon">{m.icon}</span>
                <div className="payment-method-info">
                  <strong>{m.label}</strong>
                  <small>{m.desc}</small>
                </div>
                <span className="payment-method-arrow">→</span>
              </button>
            ))}
          </div>

          <button 
            className="btn btn-ghost" 
            onClick={() => { setError(""); setStep("contact"); }} 
            style={{ marginTop: "1rem", width: "100%", textAlign: "center" }}
          >
            ← Quay lại sửa thông tin
          </button>
        </div>
      </section>
    );
  }

  if (error && !payment) return <p className="error">{error}</p>;
  if (!payment) return null;

  // ── Step: Bank transfer details (existing flow) ──
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
