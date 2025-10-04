import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import AuthService from "@/services/AuthService";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/buttonn";

import { LoadingAlert, SuccessAlert, ErrorAlert } from "./LoginAlert";

// ✅ Schema validate
const schema = z.object({
  username: z.string().min(1, "Tài khoản không được để trống"),
  password: z.string().min(8, "Mật khẩu phải ít nhất 8 ký tự"),
});

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null); // "success" | "error" | null
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values) => {
    try {
      setLoading(true);
      const data = await AuthService.signin(values.username, values.password);

      if (data.mode === "new_password_required") {
        console.log("Cần đổi mật khẩu lần đầu:", data);
      } else {
        setAlert("success");
        setTimeout(() => {
          setAlert(null);
          navigate("/app");
        }, 2000);
      }
    } catch (error) {
      console.error("Đăng nhập thất bại:", error);
      setShakeKey((prev) => prev + 1);
      setAlert("error");
      setTimeout(() => setAlert(null), 2000);
    } finally {
      setLoading(false);
    }
  };

  const shake = {
    x: [0, -8, 8, -6, 6, -3, 3, 0],
    transition: { duration: 0.4 },
  };

  return (
    <>
      {/* Login Card */}
      <Card className="p-10 rounded-3xl bg-gradient-to-br from-gray-900/70 via-gray-800/50 to-gray-900/70 border border-white/10 backdrop-blur-2xl shadow-[0_0_30px_rgba(0,255,180,0.15)]">
        <CardHeader>
          <CardTitle className="text-center text-4xl font-extrabold bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Welcome to <span className="text-cyan-400">FITX</span>
          </CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-8">
            {/* Username */}
            <motion.div
              key={`username-${shakeKey}`}
              className="relative min-h-[64px]"
              animate={errors.username ? shake : {}}
            >
              <div className="absolute left-4 top-1/2 -translate-y-1/2">📧</div>
              <Input
                placeholder="Email hoặc Username"
                className="!pl-14"
                {...register("username")}
              />
              {errors.username && (
                <p className="absolute -bottom-5 left-0 text-sm text-red-400">
                  {errors.username.message}
                </p>
              )}
            </motion.div>

            {/* Password */}
            <motion.div
              key={`password-${shakeKey}`}
              className="relative min-h-[64px]"
              animate={errors.password ? shake : {}}
            >
              <div className="absolute left-4 top-1/2 -translate-y-1/2">🔒</div>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="!pl-14 !pr-14"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-400 transition"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
              {errors.password && (
                <p className="absolute -bottom-5 left-0 text-sm text-red-400">
                  {errors.password.message}
                </p>
              )}
            </motion.div>

            <Button
              type="submit"
              className="form-btn bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500"
            >
              {loading ? "Đang xử lý..." : "Log in"}
            </Button>
          </CardContent>

          <CardFooter className="flex justify-between text-sm text-gray-400 mt-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="accent-cyan-400" /> Remember me
            </label>
            <a href="#" className="hover:text-cyan-400">Forget password?</a>
          </CardFooter>
        </form>
      </Card>

      {/* Alerts */}
      <LoadingAlert open={loading} setOpen={setLoading} />
      <SuccessAlert open={alert === "success"} setOpen={() => setAlert(null)} />
      <ErrorAlert open={alert === "error"} setOpen={() => setAlert(null)} />
    </>
  );
}
