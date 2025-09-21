import { useState } from "react";
import { login } from "service/authService";

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      const data = await login(credentials);
      // Lưu token vào localStorage
      localStorage.setItem("token", data.token);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return { handleLogin, loading, error };
}
