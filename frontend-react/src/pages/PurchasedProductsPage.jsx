import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

function formatPurchaseType(itemType) {
  return isPromptItem(itemType) ? "Prompt" : "AI Tool";
}

function productLink(itemType, slug) {
  return `/${isPromptItem(itemType) ? "chatbotprompt" : "ai-tool"}/${slug}`;
}

function isPromptItem(itemType) {
  return ["gem", "chatbotprompt", "chatbot_prompt", "prompt"].includes(String(itemType || "").toLowerCase());
}

function normalizePurchaseType(itemType) {
  return isPromptItem(itemType) ? "gem" : "ai_tool";
}

function purchaseKey(itemType, slug) {
  return `${normalizePurchaseType(itemType)}:${slug}`;
}

function getYouTubeId(url) {
  if (!url) return null;
  const match =
    url.match(/[?&]v=([^&]+)/) ||
    url.match(/youtu\.be\/([^?]+)/) ||
    url.match(/youtube\.com\/embed\/([^?]+)/);
  return match ? match[1] : null;
}

function extractPublicProduct(itemType, fallbackTitle, payload) {
  if (!payload) return null;

  if (itemType === "gem") {
    return {
      title: payload.title || fallbackTitle || "Prompt",
      description: payload.description || "",
      image: payload.thumbnail || "/tm-aivideo-logo.jpg",
      videoUrl: payload.tutorialVideo || ""
    };
  }

  return {
    title: payload.name || fallbackTitle || "AI Tool",
    description: payload.description || "",
    image: payload.logo || "/tm-aivideo-logo.jpg",
    videoUrl: payload.videoUrl || payload.tutorialUrl || ""
  };
}

async function copyText(text) {
  if (!text) return false;

  if (window.isSecureContext && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch (_err) {
    copied = false;
  } finally {
    document.body.removeChild(textarea);
  }

  if (!copied) {
    // Last-resort fallback for browsers/environments that block clipboard APIs on HTTP.
    const manual = window.prompt("Trình duyệt chặn copy tự động. Nhấn Ctrl+C rồi Enter để copy:", text);
    return manual !== null;
  }

  return copied;
}

export default function PurchasedProductsPage() {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPublic, setLoadingPublic] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [promptDetails, setPromptDetails] = useState({});
  const [promptOpenRows, setPromptOpenRows] = useState({});
  const [promptLoadingRows, setPromptLoadingRows] = useState({});
  const [promptErrors, setPromptErrors] = useState({});
  const [publicProducts, setPublicProducts] = useState({});
  const [videoOpenRows, setVideoOpenRows] = useState({});

  useEffect(() => {
    if (!user) return;

    api("/profile/purchases")
      .then((rows) => setPurchases(rows || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user || purchases.length === 0) return;

    const uniquePurchases = Array.from(
      new Map(
        purchases.map((purchase) => [purchaseKey(purchase.item_type, purchase.item_slug), purchase])
      ).values()
    );

    let cancelled = false;
    setLoadingPublic(true);

    Promise.all(
      uniquePurchases.map(async (purchase) => {
        const normalizedType = normalizePurchaseType(purchase.item_type);
        const key = purchaseKey(purchase.item_type, purchase.item_slug);
        const path = normalizedType === "gem"
          ? `/catalog/gems/${purchase.item_slug}`
          : `/catalog/ai-tools/${purchase.item_slug}`;

        try {
          const payload = await api(path);
          return [key, extractPublicProduct(normalizedType, purchase.title, payload)];
        } catch (_err) {
          return [key, null];
        }
      })
    )
      .then((entries) => {
        if (cancelled) return;
        const next = {};
        entries.forEach(([key, detail]) => {
          if (detail) next[key] = detail;
        });
        setPublicProducts((prev) => ({ ...prev, ...next }));
      })
      .finally(() => {
        if (!cancelled) setLoadingPublic(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, purchases]);

  if (!user) return <Navigate to="/auth" replace />;

  async function togglePrompt(purchase) {
    const key = purchase.id;
    const nextOpen = !promptOpenRows[key];
    setPromptOpenRows((prev) => ({ ...prev, [key]: nextOpen }));

    if (!nextOpen || promptDetails[key] || promptLoadingRows[key]) return;

    setPromptLoadingRows((prev) => ({ ...prev, [key]: true }));
    setPromptErrors((prev) => ({ ...prev, [key]: "" }));
    try {
      const detail = await api(`/profile/purchases/gems/${purchase.item_slug}`);
      setPromptDetails((prev) => ({ ...prev, [key]: detail }));
    } catch (err) {
      setPromptErrors((prev) => ({ ...prev, [key]: err.message || "Không tải được prompt" }));
    } finally {
      setPromptLoadingRows((prev) => ({ ...prev, [key]: false }));
    }
  }

  async function copyPrompt(purchaseId) {
    const content = promptDetails[purchaseId]?.promptContent;
    if (!content) return;
    try {
      const copied = await copyText(content);
      if (!copied) {
        throw new Error("copy_failed");
      }
      setInfo("Đã copy toàn bộ prompt");
      setError("");
    } catch (_err) {
      setError("Không thể copy prompt tự động. Hãy bôi đen nội dung prompt và copy thủ công.");
    }
  }

  return (
    <section className="stack">
      <h1>Sản phẩm đã mua</h1>
      {error && <p className="error">{error}</p>}
      {info && <p className="success">{info}</p>}
      {loadingPublic && <p>Đang tải thông tin công khai của sản phẩm...</p>}

      {loading ? (
        <p>Đang tải sản phẩm đã mua...</p>
      ) : purchases.length === 0 ? (
        <article className="card">
          <h3>Bạn chưa mua sản phẩm nào</h3>
          <p>Hãy khám phá thư viện Prompt và AI Tool để bắt đầu.</p>
        </article>
      ) : (
        <div className="grid two-cols">
          {purchases.map((purchase) => {
            const normalizedType = normalizePurchaseType(purchase.item_type);
            const isGem = normalizedType === "gem";
            const rowId = purchase.id;
            const isPromptOpen = Boolean(promptOpenRows[rowId]);
            const isPromptLoading = Boolean(promptLoadingRows[rowId]);
            const promptError = promptErrors[rowId];
            const promptDetail = promptDetails[rowId];
            const publicDetail = publicProducts[purchaseKey(purchase.item_type, purchase.item_slug)];
            const imageUrl = publicDetail?.image || "/tm-aivideo-logo.jpg";
            const title = publicDetail?.title || purchase.title;
            const description = publicDetail?.description;
            const videoUrl = publicDetail?.videoUrl || "";
            const youtubeId = getYouTubeId(videoUrl);
            const isVideoOpen = Boolean(videoOpenRows[rowId]);

            return (
              <article key={purchase.id} className="card">
                <img
                  src={imageUrl}
                  alt={title}
                  style={{
                    width: "100%",
                    aspectRatio: "16 / 9",
                    objectFit: "cover",
                    borderRadius: "12px",
                    border: "1px solid var(--line)"
                  }}
                />

                <div className="row-head" style={{ marginBottom: 0 }}>
                  <h3>{title}</h3>
                  <span className="tag">{formatPurchaseType(purchase.item_type)}</span>
                </div>

                {description && <p>{description}</p>}
                <p><strong>Ngày mua:</strong> {new Date(purchase.created_at).toLocaleDateString("vi-VN")}</p>

                {youtubeId && (
                  <div style={{ display: "grid", gap: "0.5rem" }}>
                    <button
                      type="button"
                      className="btn btn-soft"
                      onClick={() => setVideoOpenRows((prev) => ({ ...prev, [rowId]: !prev[rowId] }))}
                    >
                      {isVideoOpen ? "Ẩn video" : "Hiện video"}
                    </button>
                    {isVideoOpen && (
                      <iframe
                        src={`https://www.youtube.com/embed/${youtubeId}?rel=0`}
                        title={`Video ${title}`}
                        style={{
                          width: "100%",
                          aspectRatio: "16 / 9",
                          border: "1px solid var(--line)",
                          borderRadius: "10px",
                          background: "#000"
                        }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    )}
                  </div>
                )}

                <div style={{ display: "flex", gap: "0.55rem", flexWrap: "wrap" }}>
                  <Link to={productLink(purchase.item_type, purchase.item_slug)} className="btn btn-outline">
                    Xem sản phẩm
                  </Link>
                  {isGem && (
                    <button type="button" className="btn btn-soft" disabled={isPromptLoading} onClick={() => togglePrompt(purchase)}>
                      {isPromptLoading ? "Đang tải..." : isPromptOpen ? "Ẩn Prompt" : "Hiện Prompt"}
                    </button>
                  )}
                </div>

                {isGem && isPromptOpen && (
                  <div style={{ marginTop: "0.45rem", display: "grid", gap: "0.65rem" }}>
                    {promptError && <p className="error">{promptError}</p>}
                    {!promptError && isPromptLoading && <p>Đang tải nội dung prompt...</p>}

                    {!promptError && !isPromptLoading && promptDetail?.promptInstruction && (
                      <div>
                        <p><strong>Hướng dẫn sử dụng:</strong></p>
                        <p style={{ whiteSpace: "pre-wrap", color: "var(--ink)" }}>{promptDetail.promptInstruction}</p>
                      </div>
                    )}

                    {!promptError && !isPromptLoading && promptDetail?.promptContent && (
                      <div style={{ display: "grid", gap: "0.5rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
                          <p><strong>Nội dung Prompt:</strong></p>
                          <button type="button" className="btn btn-primary" onClick={() => copyPrompt(rowId)}>
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
                          {promptDetail.promptContent}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
