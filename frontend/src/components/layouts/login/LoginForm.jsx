import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
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
import {
  LoadingAlert,
  SuccessAlert,
  ErrorAlert,
  ServerErrorAlert,
} from "./LoginAlert";

// ✅ Schema cho đăng nhập
const loginSchema = z.object({
  username: z.string().min(1, "Tài khoản không được để trống"),
  password: z.string().min(8, "Mật khẩu phải ít nhất 8 ký tự"),
});

// ✅ Schema cho đổi mật khẩu
const newPassSchema = z
  .object({
    newPassword: z.string().min(8, "Mật khẩu mới phải ít nhất 8 ký tự"),
    confirmPassword: z.string().min(8, "Xác nhận mật khẩu phải ít nhất 8 ký tự"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [newUser, setNewUser] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const {
    register: registerNew,
    handleSubmit: handleSubmitNew,
    formState: { errors: newErrors },
  } = useForm({ resolver: zodResolver(newPassSchema) });

  const onSubmit = async (values) => {
    try {
      setLoading(true);
      const data = await AuthService.signin(values.username, values.password);
      if (data.mode === "new_password_required") {
        console.log("⚠️ Cần đổi mật khẩu lần đầu");
        setNewUser(true);
        reset();
      } else {
        setAlert("success");
        setTimeout(() => {
          setAlert(null);
          navigate("/app");
        }, 1500);
      }
    } catch (err) {
      console.error("Đăng nhập thất bại:", err);
      if (
        err.message?.includes("NetworkError") ||
        err.code === "ERR_NETWORK" ||
        err.message?.includes("ECONNREFUSED")
      ) {
        setAlert("server_error");
      } else {
        setShakeKey((k) => k + 1);
        setAlert("error");
      }
      setTimeout(() => setAlert(null), 2500);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitNewPassword = async (values) => {
    try {
      setLoading(true);
      const result = await AuthService.confirmNewPassword(
        "username",
        values.newPassword
      );
      console.log("✅ Đổi mật khẩu thành công:", result);
      setAlert("success");
      setTimeout(() => {
        setNewUser(false);
        navigate("/app");
      }, 1500);
    } catch (err) {
      console.error("❌ Lỗi đổi mật khẩu:", err);
      setAlert("error");
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
      <Card className="p-10 rounded-3xl bg-gradient-to-br from-gray-900/70 via-gray-800/50 to-gray-900/70 border border-white/10 backdrop-blur-2xl shadow-[0_0_30px_rgba(0,255,180,0.15)] w-[420px] mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-3xl font-extrabold bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
            {newUser ? "Chào mừng đăng nhập lần đầu!" : <>Welcome to <span className="text-cyan-400">FITX</span></>}
          </CardTitle>
        </CardHeader>

        {/* Hiệu ứng chuyển form */}
        <AnimatePresence mode="wait">
          {!newUser ? (
            <motion.form
              key="login-form"
              onSubmit={handleSubmit(onSubmit)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
            >
              <CardContent className="space-y-8">
                {/* Username */}
                <motion.div
                  key={`username-${shakeKey}`}
                  className="relative min-h-[64px]"
                  animate={errors.username ? shake : {}}
                >
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">📧</div>
                  <Input
                    placeholder="Username"
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
                  {loading ? "Đang xử lý..." : "ĐĂNG NHẬP"}
                </Button>
              </CardContent>

              <CardFooter className="flex justify-between text-sm text-gray-400 mt-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="accent-cyan-400" /> Lưu đăng nhập
                </label>
                <a href="#" className="hover:text-cyan-400">
                  Quên mật khẩu?
                </a>
              </CardFooter>
            </motion.form>
          ) : (
            <motion.form
              key="newpass-form"
              onSubmit={handleSubmitNew(onSubmitNewPassword)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
            >
              <CardContent className="space-y-6">
                {/* Mật khẩu mới */}
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu mới"
                    {...registerNew("newPassword")}
                    className="!pr-14"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-400 transition"
                  >
                    {showNewPassword ? "🙈" : "👁️"}
                  </button>
                  {newErrors.newPassword && (
                    <p className="text-sm text-red-400 mt-1">
                      {newErrors.newPassword.message}
                    </p>
                  )}
                </div>

                {/* Xác nhận mật khẩu mới */}
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Xác nhận mật khẩu mới"
                    {...registerNew("confirmPassword")}
                    className="!pr-14"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-400 transition"
                  >
                    {showConfirmPassword ? "🙈" : "👁️"}
                  </button>
                  {newErrors.confirmPassword && (
                    <p className="text-sm text-red-400 mt-1">
                      {newErrors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500"
                >
                  {loading ? "Đang đổi mật khẩu..." : "Xác nhận đổi mật khẩu"}
                </Button>
              </CardContent>
            </motion.form>
          )}
        </AnimatePresence>
      </Card>

      {/* Alerts */}
      <LoadingAlert open={loading} setOpen={setLoading} />
      <SuccessAlert open={alert === "success"} setOpen={() => setAlert(null)} />
      <ErrorAlert open={alert === "error"} setOpen={() => setAlert(null)} />
      <ServerErrorAlert
        open={alert === "server_error"}
        setOpen={() => setAlert(null)}
      />
    </>
  );
}
