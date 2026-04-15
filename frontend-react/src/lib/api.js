export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api";

function readToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("mlv_token") || "";
}

export async function api(path, options = {}) {
  const token = readToken();
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

export async function apiUpload(path, formData) {
  const token = readToken();
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: formData
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || `Upload error: ${response.status}`);
  }
  return payload;
}

export function money(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}
