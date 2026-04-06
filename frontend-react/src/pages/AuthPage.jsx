import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const modeFromQuery = searchParams.get("mode") === "register" ? "register" : "login";
  const [mode, setMode] = useState(modeFromQuery);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setMode(modeFromQuery);
  }, [modeFromQuery]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const body = {
      email: String(form.get("email") || "").trim(),
      password: String(form.get("password") || "").trim()
    };

    if (mode === "register") {
      body.name = String(form.get("name") || "").trim();
      body.phone = String(form.get("phone") || "").trim();
      body.referralCode = String(form.get("referralCode") || "").trim();
    }

    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const response = await api(endpoint, {
        method: "POST",
        body: JSON.stringify(body)
      });

      login(response.token, response.user);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="stack auth-wrap">
      <h1>{mode === "login" ? "Đăng nhập" : "Đăng ký"}</h1>
      <form className="card form" onSubmit={handleSubmit}>
        {mode === "register" && <input name="name" placeholder="Họ tên" required />}
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Mật khẩu" required />
        {mode === "register" && <input name="phone" placeholder="Số điện thoại" />}
        {mode === "register" && <input name="referralCode" placeholder="Mã giới thiệu (nếu có)" />}
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
        </button>
      </form>

      <button className="btn btn-soft" onClick={() => setMode((prev) => (prev === "login" ? "register" : "login"))}>
        {mode === "login" ? "Chưa có tài khoản? Đăng ký" : "Đã có tài khoản? Đăng nhập"}
      </button>
    </section>
  );
}
