import { useEffect, useState } from "react";
import { Navigate, useParams, Link } from "react-router-dom";
import { api, money } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

export default function PayPage() {
  const { itemType, slug } = useParams();
  const { user } = useAuth();
  
  const [step, setStep] = useState("checking");
  const [existingPayment, setExistingPayment] = useState(null);
  
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [contactForm, setContactForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || ""
  });

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
        } else if (itemType === "ai") {
          setStep("contact");
        } else {
          startNewPayment();
        }
      })
      .catch((err) => {
        setError(err.message);
        setStep("error");
      });
  }, [user, itemType, slug]);

  function startNewPayment() {
    if (itemType === "ai" && (!contactForm.name || !contactForm.phone || !contactForm.email)) {
      setError("Vui lòng điền đầy đủ thông tin để Admin liên hệ giao tài khoản.");
      return;
    }

    setStep("creating");
    api("/payments/create", {
      method: "POST",
      body: JSON.stringify({ 
        itemType, 
        slug, 
        quantity: 1,
        customerName: contactForm.name,
        customerPhone: contactForm.phone,
        customerEmail: contactForm.email
      })
    })
      .then((res) => {
        setPayment(res.payment);
        setStep("payment");
      })
      .catch((err) => {
        setError(err.message);
        setStep("error");
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
  if (step === "creating") return <p>Đang thiết lập giao dịch...</p>;

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
            <button className="btn btn-outline" onClick={startNewPayment}>
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
          <h2 style={{ marginBottom: "1rem", textAlign: "center" }}>Thông tin nhận tài khoản</h2>
          <p style={{ marginBottom: "1.5rem", fontSize: "0.95rem", color: "var(--ink-soft)", textAlign: "center" }}>
            Admin sẽ liên hệ với bạn qua các thông tin này để bàn giao tài khoản AI sau khi bạn thanh toán thành công.
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
              Gmail nhận tài khoản
              <input 
                type="email" 
                value={contactForm.email} 
                onChange={e => setContactForm({...contactForm, email: e.target.value})} 
                placeholder="example@gmail.com" 
              />
            </label>
            
            <button className="btn btn-primary" onClick={startNewPayment} style={{ marginTop: "1rem" }}>
              Tiếp tục thanh toán
            </button>
            <Link to={`/ai-tool/${slug}`} className="btn btn-ghost" style={{ textAlign: "center" }}>
              Hủy bỏ
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (error) return <p className="error">{error}</p>;
  if (!payment) return null;

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
