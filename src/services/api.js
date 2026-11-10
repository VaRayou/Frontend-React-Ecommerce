import axios from "axios";

// Normalize API Base URL so both "https://app.onrender.com" and "https://app.onrender.com/api" work seamlessly
const resolveApiBaseUrl = () => {
  const raw = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api").trim().replace(/\/+$/, "");
  return raw.endsWith("/api") ? raw : `${raw}/api`;
};

export const API_BASE_URL = resolveApiBaseUrl();

// Centralized Axios instance configured for Django REST Framework backend (Local & Render)
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 25000,
});

// Request interceptor: Automatically attach signed HMAC / JWT Bearer token if present
api.interceptors.request.use(
  (config) => {
    const isAdminContext =
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/admin");

    let token = isAdminContext
      ? localStorage.getItem("eshopper_admin_token") ||
        localStorage.getItem("eshopper_token")
      : localStorage.getItem("eshopper_token") ||
        localStorage.getItem("eshopper_admin_token");

    if (!token) {
      try {
        const authRaw = localStorage.getItem("atelier_auth_v2");
        if (authRaw) {
          const parsed = JSON.parse(authRaw);
          token = parsed?.state?.token || null;
        }
      } catch {
        // ignore parse error
      }
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Global error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Future Django token expiration handle
      console.warn("Session expired or unauthorized. Redirecting to login...");
    }
    return Promise.reject(error);
  }
);

export default api;

