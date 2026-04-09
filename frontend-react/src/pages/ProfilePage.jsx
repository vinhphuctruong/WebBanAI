import { Fragment, useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { api, money } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [referral, setReferral] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [purchaseDetails, setPurchaseDetails] = useState({});
  const [expandedPromptRows, setExpandedPromptRows] = useState({});
  const [loadingPromptRows, setLoadingPromptRows] = useState({});
  const [promptRowErrors, setPromptRowErrors] = useState({});

  useEffect(() => {
    if (!user) return;

    Promise.all([api("/profile/me"), api("/referral/me"), api("/profile/purchases")])
      .then(([profileData, referralData, purchasesData]) => {
        setProfile(profileData);
        setReferral(referralData);
        setPurchases(purchasesData || []);
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

  async function togglePromptView(purchase) {
    const rowKey = purchase.id;
    const nextExpanded = !expandedPromptRows[rowKey];
    setExpandedPromptRows((prev) => ({ ...prev, [rowKey]: nextExpanded }));
    if (!nextExpanded || purchaseDetails[rowKey] || loadingPromptRows[rowKey]) return;

    setLoadingPromptRows((prev) => ({ ...prev, [rowKey]: true }));
    setPromptRowErrors((prev) => ({ ...prev, [rowKey]: "" }));
    try {
      const detail = await api(`/profile/purchases/gems/${purchase.item_slug}`);
      setPurchaseDetails((prev) => ({ ...prev, [rowKey]: detail }));
    } catch (err) {
      setPromptRowErrors((prev) => ({ ...prev, [rowKey]: err.message || "Khong tai duoc noi dung prompt" }));
    } finally {
      setLoadingPromptRows((prev) => ({ ...prev, [rowKey]: false }));
    }
  }

  async function copyPrompt(rowKey) {
    const content = purchaseDetails[rowKey]?.promptContent;
    if (!content) return;

    try {
      await navigator.clipboard.writeText(content);
      setInfo("Đã copy toàn bộ prompt thành công");
    } catch (_err) {
      setError("Không thể copy prompt. Vui lòng thử lại.");
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
        <h2>Sản phẩm đã mua</h2>
        {purchases.length === 0 ? (
          <p>Bạn chưa mua sản phẩm nào.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Ngày mua</th>
                  <th>Sản phẩm</th>
                  <th>Phân loại</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => {
                  const rowKey = p.id;
                  const isGem = p.item_type === "gem";
                  const isExpanded = Boolean(expandedPromptRows[rowKey]);
                  const isLoading = Boolean(loadingPromptRows[rowKey]);
                  const rowError = promptRowErrors[rowKey];
                  const rowDetail = purchaseDetails[rowKey];

                  return (
                    <Fragment key={p.id}>
                      <tr>
                        <td>{new Date(p.created_at).toLocaleDateString("vi-VN")}</td>
                        <td>{p.title}</td>
                        <td>{isGem ? "Prompt" : "AI Tool"}</td>
                        <td style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                          <Link
                            to={`/${isGem ? "chatbotprompt" : "ai-tool"}/${p.item_slug}`}
                            className="btn btn-outline"
                          >
                            Xem sản phẩm
                          </Link>
                          {isGem && (
                            <button
                              type="button"
                              className="btn btn-soft"
                              onClick={() => togglePromptView(p)}
                              disabled={isLoading}
                            >
                              {isLoading ? "Đang tải..." : isExpanded ? "Ẩn Prompt" : "Hiện Prompt"}
                            </button>
                          )}
                        </td>
                      </tr>

                      {isGem && isExpanded && (
                        <tr>
                          <td colSpan={4}>
                            <div
                              style={{
                                border: "1px solid var(--line)",
                                borderRadius: "10px",
                                background: "var(--surface-soft)",
                                padding: "0.9rem",
                                display: "grid",
                                gap: "0.75rem"
                              }}
                            >
                              {rowError && <p className="error">{rowError}</p>}
                              {!rowError && isLoading && <p>Đang tải nội dung prompt...</p>}

                              {!rowError && !isLoading && rowDetail?.promptInstruction && (
                                <div>
                                  <p><strong>Hướng dẫn sử dụng:</strong></p>
                                  <p style={{ whiteSpace: "pre-wrap", color: "var(--ink)" }}>{rowDetail.promptInstruction}</p>
                                </div>
                              )}

                              {!rowError && !isLoading && rowDetail?.promptContent && (
                                <div style={{ display: "grid", gap: "0.5rem" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
                                    <p><strong>Nội dung Prompt:</strong></p>
                                    <button
                                      type="button"
                                      className="btn btn-primary"
                                      onClick={() => copyPrompt(rowKey)}
                                    >
                                      Copy toàn bộ Prompt
                                    </button>
                                  </div>
                                  <pre
                                    style={{
                                      margin: 0,
                                      whiteSpace: "pre-wrap",
                                      background: "var(--surface-raised)",
                                      color: "var(--ink)",
                                      border: "1px solid var(--line)",
                                      borderRadius: "8px",
                                      padding: "0.85rem"
                                    }}
                                  >
                                    {rowDetail.promptContent}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
