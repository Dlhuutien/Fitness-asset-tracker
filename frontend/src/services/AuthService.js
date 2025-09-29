import { API } from "@/config/url";
import axios from "axios";

const STORAGE_KEY = "fitx_auth"; // key lưu trong localStorage

const AuthService = {
  /**
   * Lưu thông tin đăng nhập vào localStorage
   */
  saveAuth({ username, accessToken, refreshToken, user }) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ username, accessToken, refreshToken, user })
    );
    console.log("Đã lưu thông tin đăng nhập + user vào localStorage");
  },

  /**
   * Lấy thông tin đăng nhập từ localStorage
   */
  getAuth() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  /**
   * Xóa thông tin đăng nhập (logout)
   */
  clearAuth() {
    localStorage.removeItem(STORAGE_KEY);
    console.log("Đã đăng xuất và xóa thông tin trong localStorage");
  },

  // ==========================================================
  // AUTH APIs
  // ==========================================================

  /**
   * Đăng nhập (USER_PASSWORD_AUTH)
   * POST /auth/signin
   */
  async signin(username, password) {
    try {
      console.log("Đang đăng nhập cho tài khoản:", username);
      const res = await axios.post(`${API}auth/signin`, { username, password });

      if (res.data.mode === "normal") {
        console.log("Đăng nhập thành công, đang lấy thông tin người dùng...");
        const me = await this.getMeWithToken(res.data.accessToken);

        this.saveAuth({
          username,
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
          user: me,
        });
      } else if (res.data.mode === "new_password_required") {
        console.warn("Người dùng cần đổi mật khẩu lần đầu");
      }

      return res.data;
    } catch (err) {
      console.error("Lỗi đăng nhập:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * Đổi mật khẩu lần đầu (NEW_PASSWORD_REQUIRED)
   * POST /auth/firstLogin
   */
  async firstLogin(username, newPassword, session) {
    try {
      console.log("Đang đổi mật khẩu lần đầu cho:", username);
      const res = await axios.post(`${API}auth/firstLogin`, {
        username,
        newPassword,
        session,
      });

      if (res.data.mode === "normal") {
        console.log("Đổi mật khẩu & đăng nhập thành công, lấy user info...");
        const me = await this.getMeWithToken(res.data.accessToken);

        this.saveAuth({
          username,
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
          user: me,
        });
      }

      return res.data;
    } catch (err) {
      console.error("Lỗi đổi mật khẩu lần đầu:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  /**
   * Làm mới token (REFRESH_TOKEN_AUTH)
   * POST /auth/refresh
   */
  async refreshToken(username, refreshToken) {
    try {
      console.log("Đang làm mới token cho:", username);
      const res = await axios.post(`${API}auth/refresh`, {
        username,
        refreshToken,
      });

      const me = await this.getMeWithToken(res.data.accessToken);

      this.saveAuth({
        username,
        accessToken: res.data.accessToken,
        refreshToken,
        user: me,
      });
      console.log("Làm mới token thành công");

      return res.data;
    } catch (err) {
      console.error("Lỗi làm mới token:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },

  // ==========================================================
  // USER APIs
  // ==========================================================

  /**
   * GET /user/me bằng token trong localStorage
   */
  async getMe() {
    const auth = this.getAuth();
    if (!auth?.accessToken) {
      console.error("Không có accessToken, cần đăng nhập lại");
      throw new Error("Chưa đăng nhập");
    }
    return this.getMeWithToken(auth.accessToken);
  },

  /**
   * GET /user/me bằng token truyền trực tiếp
   */
  async getMeWithToken(accessToken) {
    try {
      console.log("Đang lấy thông tin người dùng hiện tại...");
      const res = await axios.get(`${API}user/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      console.log("Lấy thông tin người dùng thành công");
      return res.data;
    } catch (err) {
      console.error("Lỗi lấy thông tin user:", err.response?.data || err.message);
      throw err.response?.data || err;
    }
  },
};

export default AuthService;
