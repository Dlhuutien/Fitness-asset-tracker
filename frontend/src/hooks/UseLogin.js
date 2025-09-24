import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "@/services/AuthService";

export default function UseLogin() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const login = async (values) => {
    setLoading(true);
    try {
      const res = await AuthService.login(values);
      localStorage.setItem("access_token", res.token);
      navigate("/dashboard"); // redirect sau khi login
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { login, loading };
}
