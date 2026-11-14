// Zero-dependency native fetch client with identical Axios signature for maximum performance
// Normalize API Base URL so both "https://app.onrender.com" and "https://app.onrender.com/api" work seamlessly
const resolveApiBaseUrl = () => {
  const raw = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api").trim().replace(/\/+$/, "");
  return raw.endsWith("/api") ? raw : `${raw}/api`;
};

export const API_BASE_URL = resolveApiBaseUrl();

const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  const isAdminContext = window.location.pathname.startsWith("/admin");
  let token = isAdminContext
    ? localStorage.getItem("eshopper_admin_token") || localStorage.getItem("eshopper_token")
    : localStorage.getItem("eshopper_token") || localStorage.getItem("eshopper_admin_token");

  if (!token) {
    try {
      const authRaw = localStorage.getItem("atelier_auth_v2");
      if (authRaw) {
        const parsed = JSON.parse(authRaw);
        token = parsed?.state?.token || null;
      }
    } catch {
      // ignore
    }
  }
  return token;
};

const request = async (method, path, data = null, config = {}) => {
  const cleanPath = String(path).startsWith("http") ? path : `${API_BASE_URL}/${String(path).replace(/^\/+/, "")}`;
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(config.headers || {}),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout || 25000);

  try {
    const fetchOptions = {
      method,
      headers,
      signal: config.signal || controller.signal,
    };

    if (data !== null && data !== undefined && method !== "GET" && method !== "HEAD") {
      if (data instanceof FormData) {
        delete headers["Content-Type"];
        fetchOptions.body = data;
      } else if (typeof data === "string") {
        fetchOptions.body = data;
      } else {
        fetchOptions.body = JSON.stringify(data);
      }
    }

    const response = await fetch(cleanPath, fetchOptions);
    clearTimeout(timeoutId);

    let responseData = null;
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      const error = new Error(`Request failed with status code ${response.status}`);
      error.response = {
        data: responseData,
        status: response.status,
        headers: response.headers,
      };
      if (response.status === 401) {
        console.warn("Session expired or unauthorized. Redirecting to login...");
      }
      throw error;
    }

    return {
      data: responseData,
      status: response.status,
      headers: response.headers,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
};

const api = {
  get: (url, config) => request("GET", url, null, config),
  post: (url, data, config) => request("POST", url, data, config),
  put: (url, data, config) => request("PUT", url, data, config),
  patch: (url, data, config) => request("PATCH", url, data, config),
  delete: (url, config) => request("DELETE", url, null, config),
  interceptors: {
    request: { use: () => {} },
    response: { use: () => {} },
  },
};

export default api;

