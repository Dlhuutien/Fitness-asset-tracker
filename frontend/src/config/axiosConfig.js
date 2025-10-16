import axios from "axios";
import AuthService from "@/services/AuthService";
import {jwtDecode} from "jwt-decode";
import { toast } from "sonner";
import { API } from "@/config/url";

const api = axios.create({
  baseURL: API,
});

// ============================================================
// 🛠️ Helper: kiểm tra token sắp hết hạn
// ============================================================
function isTokenExpiringSoon(token) {
  try {
    const { exp } = jwtDecode(token);
    const now = Math.floor(Date.now() / 1000);
    return exp - now < 5 * 60; // < 5 phút
  } catch {
    return true;
  }
}

// ============================================================
// 📦 Request Interceptor
// ============================================================
api.interceptors.request.use(async (config) => {
  const auth = AuthService.getAuth();
  if (auth?.accessToken) {
    // Nếu token sắp hết hạn, tự refresh
    if (isTokenExpiringSoon(auth.accessToken)) {
      console.log("⚠️ Token sắp hết hạn, đang refresh...");
      try {
        await AuthService.refreshToken(auth.username, auth.refreshToken);
        const updated = AuthService.getAuth();
        config.headers.Authorization = `Bearer ${updated.accessToken}`;
        toast.success("🔄 Token đã được refresh tự động!");
      } catch (err) {
        console.error("❌ Refresh token thất bại:", err);
        AuthService.clearAuth();
        window.location.href = "/login";
      }
    } else {
      config.headers.Authorization = `Bearer ${auth.accessToken}`;
    }
  }
  return config;
});

// ============================================================
// 🚨 Response Interceptor (retry nếu token invalid / 401)
// ============================================================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const auth = AuthService.getAuth();

    if (
      error.response?.status === 401 &&
      !original._retry &&
      auth?.refreshToken
    ) {
      original._retry = true;
      try {
        console.log("🔁 Token hết hạn, đang refresh qua interceptor...");
        await AuthService.refreshToken(auth.username, auth.refreshToken);
        const updated = AuthService.getAuth();
        original.headers.Authorization = `Bearer ${updated.accessToken}`;
        toast.success("🔄 Token được refresh sau 401!");
        return api(original); // retry request
      } catch (err) {
        console.error("❌ Refresh sau 401 thất bại:", err);
        AuthService.clearAuth();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
