import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api, money } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

function getYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
  return match ? match[1] : null;
}

function paymentStatusLabel(status) {
  if (status === "success") return "Đã thanh toán";
  if (status === "submitted") return "Chờ duyệt";
  return "Chưa xác nhận";
}

function toSlug(rawValue) {
  return String(rawValue || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

const initialProductForm = {
  name: "",
  slug: "",
  category: "",
  price: "",
  originalPrice: "",
  description: "",
  imageUrl: "",
  tutorialUrl: "",
  tutorialVideo: "",
  stock: "",
  features: "",
  productType: "chatbot_prompt",
  promptInstruction: "",
  promptContent: ""
};

function gemToForm(gem) {
  return {
    name: gem.title || "",
    slug: gem.slug || "",
    category: gem.categoryId || "",
    price: String(gem.price ?? ""),
    originalPrice: String(gem.originalPrice ?? ""),
    description: gem.description || "",
    imageUrl: gem.thumbnail || "",
    tutorialVideo: gem.tutorialVideo || "",
    stock: "",
    features: "",
    productType: gem.productType || "chatbot_prompt",
    promptInstruction: gem.promptInstruction || "",
    promptContent: gem.promptContent || ""
  };
}

function toolToForm(tool) {
  return {
    name: tool.name || "",
    slug: tool.slug || "",
    category: tool.category || "",
    price: String(tool.accountPrice ?? ""),
    originalPrice: String(tool.originalPrice ?? ""),
    description: tool.description || "",
    imageUrl: tool.logo || "",
    tutorialUrl: tool.tutorialUrl || "",
    stock: String(tool.availableCount ?? ""),
    features: Array.isArray(tool.features) ? tool.features.join(", ") : "",
    productType: "chatbot_prompt"
  };
}

export default function AdminPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [gems, setGems] = useState([]);
  const [tools, setTools] = useState([]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [approvingPaymentId, setApprovingPaymentId] = useState("");
  const [savingProduct, setSavingProduct] = useState(false);
  const [productType, setProductType] = useState("gem");
  const [productForm, setProductForm] = useState(initialProductForm);
  const [editingItem, setEditingItem] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  const isGem = productType === "gem";

  async function loadAdminData() {
    const [dash, userRows, orderRows, paymentRows, gemRows, toolRows] = await Promise.all([
      api("/admin/dashboard"),
      api("/admin/users"),
      api("/admin/orders"),
      api("/admin/payments"),
      api("/admin/catalog/gems"),
      api("/admin/catalog/ai-tools")
    ]);
    setDashboard(dash);
    setUsers(userRows);
    setOrders(orderRows);
    setPayments(paymentRows);
    setGems(gemRows);
    setTools(toolRows);
  }

  useEffect(() => {
    if (!user || user.role !== "admin") return;

    loadAdminData().catch((err) => setError(err.message));
  }, [user]);

  if (!user) return <Navigate to="/auth" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;

  async function approvePayment(paymentId) {
    setError("");
    setInfo("");
    setApprovingPaymentId(paymentId);

    try {
      await api(`/payments/${paymentId}/confirm`, { method: "POST" });
      setInfo("Đã duyệt thanh toán thành công.");
      await loadAdminData();
    } catch (err) {
      setError(err.message);
    } finally {
      setApprovingPaymentId("");
    }
  }

  function updateProductField(field, value) {
    setProductForm((prev) => ({ ...prev, [field]: value }));
  }

  function resetProductForm() {
    setProductForm(initialProductForm);
  }

  function handleSelectProductType(nextType) {
    setProductType(nextType);
    setEditingItem(null);
    resetProductForm();
  }

  function fillSlugFromName() {
    updateProductField("slug", toSlug(productForm.name));
  }

  function startEditGem(gem) {
    setProductType("gem");
    setEditingItem({ type: "gem", slug: gem.slug });
    setProductForm(gemToForm(gem));
    setActiveTab("add_product");
  }

  function startEditTool(tool) {
    setProductType("tool");
    setEditingItem({ type: "tool", slug: tool.slug });
    setProductForm(toolToForm(tool));
    setActiveTab("add_product");
  }

  function cancelEditing() {
    setEditingItem(null);
    resetProductForm();
  }

  async function saveProduct(event) {
    event.preventDefault();
    setError("");
    setInfo("");
    setSavingProduct(true);

    try {
      const name = String(productForm.name || "").trim();
      const slug = toSlug(productForm.slug || name);
      const price = Number(productForm.price || 0);
      const originalPrice = Number(productForm.originalPrice || 0);
      const isEditing = Boolean(editingItem);

      if (!name || !slug) {
        throw new Error("Vui lòng nhập tên sản phẩm và slug hợp lệ.");
      }
      if (!Number.isFinite(price) || price < 0) {
        throw new Error("Giá bán không được âm.");
      }

      if (isGem) {
        const payload = {
          title: name,
          slug,
          categoryId: String(productForm.category || "cat-general"),
          price,
          originalPrice,
          description: String(productForm.description || ""),
          thumbnail: String(productForm.imageUrl || ""),
          gallery: productForm.imageUrl ? [String(productForm.imageUrl)] : [],
          productType: String(productForm.productType || "chatbot_prompt"),
          tutorialVideo: String(productForm.tutorialVideo || ""),
          promptInstruction: String(productForm.promptInstruction || ""),
          promptContent: String(productForm.promptContent || "")
        };

        await api(isEditing ? `/admin/catalog/gems/${editingItem.slug}` : "/admin/catalog/gems", {
          method: isEditing ? "PUT" : "POST",
          body: JSON.stringify(payload)
        });
      } else {
        const features = String(productForm.features || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

        const payload = {
          name,
          slug,
          category: String(productForm.category || "General"),
          accountPrice: price,
          originalPrice,
          availableCount: Number(productForm.stock || 0),
          description: String(productForm.description || ""),
          logo: String(productForm.imageUrl || ""),
          tutorialUrl: String(productForm.tutorialUrl || ""),
          features
        };

        await api(isEditing ? `/admin/catalog/ai-tools/${editingItem.slug}` : "/admin/catalog/ai-tools", {
          method: isEditing ? "PUT" : "POST",
          body: JSON.stringify(payload)
        });
      }

      setInfo(isEditing ? "Đã cập nhật sản phẩm thành công." : `Đã thêm ${isGem ? "prompt" : "AI tool"} mới thành công.`);
      setEditingItem(null);
      resetProductForm();
      await loadAdminData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingProduct(false);
    }
  }

  return (
    <div className="catalog-layout">
      <aside className="catalog-sidebar">
        <div className="filter-group">
          <div className="panel-label">Dashboard</div>
          <button type="button" className={`filter-option ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Tổng quan</button>
          <button type="button" className={`filter-option ${activeTab === 'add_product' ? 'active' : ''}`} onClick={() => setActiveTab('add_product')}>Cập nhật Sản phẩm</button>
          <div className="panel-label">Sản phẩm</div>
          <button type="button" className={`filter-option ${activeTab === 'gems' ? 'active' : ''}`} onClick={() => setActiveTab('gems')}>Danh sách Prompt</button>
          <button type="button" className={`filter-option ${activeTab === 'tools' ? 'active' : ''}`} onClick={() => setActiveTab('tools')}>Danh sách AI Tool</button>
          <div className="panel-label">Kinh doanh</div>
          <button type="button" className={`filter-option ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Người dùng</button>
          <button type="button" className={`filter-option ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>Đơn hàng</button>
          <button type="button" className={`filter-option ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}>Giao dịch</button>
        </div>
      </aside>

      <div className="catalog-main">
        <section className="stack">
          <div className="row-head" style={{ marginBottom: 0 }}>
            <h1>Bảng điều khiển quản trị</h1>
          </div>
          {error && <p className="error">{error}</p>}
          {info && <p className="success">{info}</p>}

      {activeTab === 'add_product' && (
      <article className="card">
        <div className="row-head admin-add-head">
          <h2>{editingItem ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm để bán"}</h2>
          {editingItem && <span>Đang sửa: {editingItem.slug}</span>}
        </div>

        <div className="admin-product-type">
          <button type="button" className={`btn ${isGem ? "btn-primary" : "btn-outline"}`} onClick={() => handleSelectProductType("gem")}>Prompt</button>
          <button type="button" className={`btn ${!isGem ? "btn-primary" : "btn-outline"}`} onClick={() => handleSelectProductType("tool")}>AI Tool</button>
        </div>

        <form className="form admin-form-grid" onSubmit={saveProduct}>
          <label>
            {isGem ? "Tên prompt" : "Tên AI tool"}
            <input
              value={productForm.name}
              onChange={(event) => updateProductField("name", event.target.value)}
              placeholder={isGem ? "Ví dụ: Prompt chốt đơn mỹ phẩm" : "Ví dụ: Tool dựng video Pro"}
              required
            />
          </label>

          <label>
            Slug
            <div className="admin-inline-row">
              <input
                value={productForm.slug}
                onChange={(event) => updateProductField("slug", event.target.value)}
                placeholder="tu-tao-hoac-bam-tao-slug"
                required
              />
              <button type="button" className="btn btn-soft" onClick={fillSlugFromName}>Tạo slug</button>
            </div>
          </label>

          <label>
            {isGem ? "Danh mục (categoryId)" : "Danh mục"}
            <input
              value={productForm.category}
              onChange={(event) => updateProductField("category", event.target.value)}
              placeholder={isGem ? "cat-general" : "Text to Video"}
            />
          </label>

          <label>
            Giá bán
            <input
              type="number"
              min="0"
              value={productForm.price}
              onChange={(event) => updateProductField("price", event.target.value)}
              placeholder="350000"
              required
            />
          </label>

          <label>
            Giá gốc
            <input
              type="number"
              min="0"
              value={productForm.originalPrice}
              onChange={(event) => updateProductField("originalPrice", event.target.value)}
              placeholder="500000"
            />
          </label>

          {!isGem && (
            <label>
              Tồn kho
              <input
                type="number"
                min="0"
                value={productForm.stock}
                onChange={(event) => updateProductField("stock", event.target.value)}
                placeholder="10"
              />
            </label>
          )}

          {isGem && (
            <label>
              Loại sản phẩm
              <input
                value={productForm.productType}
                onChange={(event) => updateProductField("productType", event.target.value)}
                placeholder="chatbot_prompt"
              />
            </label>
          )}

          {isGem && (
            <label className="admin-span-all">
              Link Video Hướng Dẫn (YouTube)
              <input
                value={productForm.tutorialVideo}
                onChange={(event) => updateProductField("tutorialVideo", event.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </label>
          )}

          {!isGem && (
            <label className="admin-span-all">
              Link Video Hướng Dẫn (YouTube)
              <input
                value={productForm.tutorialUrl}
                onChange={(event) => updateProductField("tutorialUrl", event.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </label>
          )}

          {!isGem && (
            <label className="admin-span-all">
              Features (cách nhau bởi dấu phẩy)
              <input
                value={productForm.features}
                onChange={(event) => updateProductField("features", event.target.value)}
                placeholder="Auto Caption, Batch Render, Team Workspace"
              />
            </label>
          )}

          <label className="admin-span-all">
            Mô tả
            <textarea
              rows="3"
              value={productForm.description}
              onChange={(event) => updateProductField("description", event.target.value)}
              placeholder="Mô tả ngắn cho sản phẩm"
            />
          </label>

          {isGem && (
            <>
              <label className="admin-span-all">
                Nội dung Hướng dẫn (tuỳ chọn)
                <textarea
                  rows="3"
                  value={productForm.promptInstruction}
                  onChange={(event) => updateProductField("promptInstruction", event.target.value)}
                  placeholder="Cách sử dụng, các tham số cần thay thế..."
                />
              </label>

              <label className="admin-span-all">
                Nội dung Prompt (sẽ hiển thị khi khách đã mua / hàng miễn phí)
                <textarea
                  rows="5"
                  value={productForm.promptContent}
                  onChange={(event) => updateProductField("promptContent", event.target.value)}
                  placeholder="Viết một kịch bản UGC..."
                />
              </label>
            </>
          )}

          <label className="admin-span-all">
            Ảnh đại diện URL
            <input
              value={productForm.imageUrl}
              onChange={(event) => updateProductField("imageUrl", event.target.value)}
              placeholder="https://..."
            />
          </label>

          <div className="admin-span-all admin-inline-row">
            <button type="submit" className="btn btn-primary" disabled={savingProduct}>
              {savingProduct ? "Đang lưu..." : editingItem ? "Lưu chỉnh sửa" : "Thêm sản phẩm"}
            </button>
            <button type="button" className="btn btn-soft" onClick={editingItem ? cancelEditing : resetProductForm}>
              {editingItem ? "Hủy chỉnh sửa" : "Nhập lại"}
            </button>
          </div>
        </form>
      </article>
      )}

      {activeTab === 'gems' && (
      <article className="card">
        <h2>Danh sách Prompt</h2>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Tên</th><th>Slug</th><th>Giá</th><th>Giá gốc</th><th>Danh mục</th><th>Thao tác</th></tr></thead>
            <tbody>
              {gems.map((gem) => (
                <tr key={gem.id || gem.slug}>
                  <td>{gem.title}</td>
                  <td>{gem.slug}</td>
                  <td>{money(gem.price)}</td>
                  <td>{money(gem.originalPrice)}</td>
                  <td>{gem.categoryId || "-"}</td>
                  <td>
                    <button type="button" className="btn btn-outline" onClick={() => startEditGem(gem)}>
                      Chỉnh sửa
                    </button>
                  </td>
                </tr>
              ))}
              {gems.length === 0 && (
                <tr><td colSpan="6">Chưa có prompt nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
      )}

      {activeTab === 'tools' && (
      <article className="card">
        <h2>Danh sách AI Tool</h2>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Tên</th><th>Slug</th><th>Giá</th><th>Tồn kho</th><th>Danh mục</th><th>Thao tác</th></tr></thead>
            <tbody>
              {tools.map((tool) => (
                <tr key={tool.id || tool.slug}>
                  <td>{tool.name}</td>
                  <td>{tool.slug}</td>
                  <td>{money(tool.accountPrice)}</td>
                  <td>{tool.availableCount}</td>
                  <td>{tool.category || "-"}</td>
                  <td>
                    <button type="button" className="btn btn-outline" onClick={() => startEditTool(tool)}>
                      Chỉnh sửa
                    </button>
                  </td>
                </tr>
              ))}
              {tools.length === 0 && (
                <tr><td colSpan="6">Chưa có AI tool nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
      )}

      {activeTab === 'dashboard' && dashboard && (
        <div className="grid four-cols">
          <article className="card"><h3>Người dùng</h3><p className="big">{dashboard.totalUsers}</p></article>
          <article className="card"><h3>Đơn hàng</h3><p className="big">{dashboard.totalOrders}</p></article>
          <article className="card"><h3>Thanh toán</h3><p className="big">{dashboard.totalPayments}</p></article>
          <article className="card"><h3>Doanh thu</h3><p className="big">{money(dashboard.revenue)}</p></article>
        </div>
      )}

      {activeTab === 'users' && (
      <article className="card">
        <h2>Người dùng</h2>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Email</th><th>Tên</th><th>Vai trò</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}><td>{u.email}</td><td>{u.name}</td><td>{u.role}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
      )}

      {activeTab === 'orders' && (
      <article className="card">
        <h2>Đơn hàng</h2>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Sản phẩm</th><th>Email</th><th>Số tiền</th><th>Trạng thái</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}><td>{o.title}</td><td>{o.email}</td><td>{money(o.amount)}</td><td>{o.status}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
      )}

      {activeTab === 'payments' && (
      <article className="card">
        <h2>Giao dịch thanh toán</h2>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Mã</th><th>Email</th><th>Số tiền</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>{p.payment_code}</td>
                  <td>{p.email}</td>
                  <td>{money(p.amount)}</td>
                  <td>{paymentStatusLabel(p.status)}</td>
                  <td>
                    {p.status === "success" ? (
                      <span>Đã duyệt</span>
                    ) : (
                      <button
                        className="btn btn-outline"
                        onClick={() => approvePayment(p.id)}
                        disabled={approvingPaymentId === p.id}
                      >
                        {approvingPaymentId === p.id ? "Đang duyệt..." : "Duyệt thanh toán"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
      )}
        </section>
      </div>
    </div>
  );
}
