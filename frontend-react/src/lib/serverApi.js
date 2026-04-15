function normalizeBase(baseUrl) {
  if (!baseUrl) return "http://localhost:8080/api";
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

function resolveServerApiBase() {
  if (process.env.API_BASE_INTERNAL) {
    return normalizeBase(process.env.API_BASE_INTERNAL);
  }

  const publicBase = process.env.NEXT_PUBLIC_API_BASE;
  if (publicBase && publicBase.startsWith("http")) {
    return normalizeBase(publicBase);
  }

  return "http://localhost:8080/api";
}

export async function fetchPublicJson(path, options = {}) {
  const response = await fetch(`${resolveServerApiBase()}${path}`, {
    next: { revalidate: options.revalidate ?? 60 }
  });

  if (!response.ok) {
    const error = new Error(`Failed to fetch ${path}: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}
