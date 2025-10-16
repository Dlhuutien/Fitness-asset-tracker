import { useEffect } from "react";
import AuthService from "@/services/AuthService";

export default function useAuthRefresh() {
  useEffect(() => {
    const auth = AuthService.getAuth();
    if (!auth?.refreshToken) return;

    const interval = setInterval(async () => {
      try {
        console.log("⏳ Đang auto refresh token...");
        await AuthService.refreshToken(auth.username, auth.refreshToken);
      } catch (err) {
        console.error("❌ Auto refresh token thất bại:", err);
        AuthService.clearAuth();
        window.location.href = "/login"; // chuyển về login nếu fail
      }
    // }, 59 * 60 * 1000); // 59 phút
    }, 45 * 60 * 1000);


    return () => clearInterval(interval);
  }, []);
}
