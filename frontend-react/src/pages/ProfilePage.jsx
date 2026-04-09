import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api, money } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [referral, setReferral] = useState(null);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    if (!user) return;

    Promise.all([api("/profile/me"), api("/referral/me")])
      .then(([profileData, referralData]) => {
        setProfile(profileData);
        setReferral(referralData);
        setPhone(profileData.phone || "");
      })
      .catch((err) => setError(err.message));
  }, [user]);

  if (!user) return <Navigate to="/auth" replace />;

  async function savePhone() {
    setError("");
    setInfo("");
    try {
      const updated = await api("/profile/phone", {
        method: "PUT",
        body: JSON.stringify({ phone })
      });
      setProfile((prev) => ({ ...prev, phone: updated.phone }));
      updateUser({ ...user, phone: updated.phone });
      setInfo("Đã cập nhật số điện thoại");
    } catch (err) {
      setError(err.message);
    }
  }

  async function regenerateCode() {
    try {
      const result = await api("/referral/code/generate", { method: "POST" });
      setReferral((prev) => ({ ...prev, code: result.code }));
      setInfo("Đã tạo mã giới thiệu mới");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="stack">
      <h1>Trang cá nhân</h1>
      {error && <p className="error">{error}</p>}
      {info && <p className="success">{info}</p>}

      <article className="card form">
        <p><strong>Email:</strong> {profile?.email || user.email}</p>
        <p><strong>Vai trò:</strong> {profile?.role || user.role}</p>
        <label>Số điện thoại</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Nhập số điện thoại" />
        <button className="btn btn-primary" onClick={savePhone}>Lưu số điện thoại</button>
      </article>

      <article className="card">
        <h2>Giới thiệu</h2>
        <p>Mã của bạn: <strong>{referral?.code || "-"}</strong></p>
        <p>Tổng thu nhập: <strong>{money(referral?.totalEarnings || 0)}</strong></p>
        <p>Số dư rút: <strong>{money(referral?.availableBalance || 0)}</strong></p>
        <button className="btn btn-soft" onClick={regenerateCode}>Tạo lại mã giới thiệu</button>
      </article>
    </section>
  );
}
