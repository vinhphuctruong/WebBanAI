const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080/api";

export async function api(path, options = {}) {
  const token = localStorage.getItem("mlv_token") || "";
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || `API error: ${response.status}`);
  }
  return payload;
}

export function money(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}
