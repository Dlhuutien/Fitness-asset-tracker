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
  DisabledUserAlert,
} from "./LoginAlert";
import { toast } from "sonner";

// ✅ Schema cho đăng nhập
const loginSchema = z.object({
  username: z.string().min(1, "Tài khoản không được để trống"),
  password: z.string().min(8, "Mật khẩu phải ít nhất 8 ký tự"),
});

// ✅ Schema cho đổi mật khẩu
const newPassSchema = z
  .object({
    newPassword: z.string().min(8, "Mật khẩu mới phải ít nhất 8 ký tự"),
    confirmPassword: z
      .string()
      .min(8, "Xác nhận mật khẩu phải ít nhất 8 ký tự"),
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
  const [newUser, setNewUser] = useState(null);
  const [forgotStep, setForgotStep] = useState(1); // 1: nhập user+email, 2: nhập code+pass
  const [view, setView] = useState("login"); // "login" | "newpass" | "forgot"
  const [forgotForm, setForgotForm] = useState({
    username: "",
    email: "",
    code: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [forgotError, setForgotError] = useState("");
  const [showForgotNew, setShowForgotNew] = useState(false);
  const [showForgotConfirm, setShowForgotConfirm] = useState(false);

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
        // 👉 Lưu session và username để dùng khi gọi firstLogin
        setNewUser({ username: data.username, session: data.session });
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
      if (err.message?.includes("User is disabled")) {
        setAlert("disabled");
      } else if (
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
      const result = await AuthService.firstLogin(
        newUser.username,
        values.newPassword,
        newUser.session
      );
      console.log("✅ Đổi mật khẩu lần đầu thành công:", result);

      setAlert("success");
      setTimeout(() => {
        toast.success("Vui lòng đăng nhập lại bằng mật khẩu mới.");
        setNewUser(null);
        setView("login"); // quay lại form login
      }, 1800);
    } catch (err) {
      console.error("❌ Lỗi đổi mật khẩu:", err);
      setAlert("error");
    } finally {
      setLoading(false);
    }
  };

  // Gửi mã xác nhận
  const handleSendForgotCode = async () => {
    setForgotError(""); // clear lỗi cũ

    if (!forgotForm.username || !forgotForm.email) {
      setForgotError("Vui lòng nhập đầy đủ Username và Email");
      return;
    }

    try {
      setLoading(true);
      const res = await AuthService.forgotPassword(
        forgotForm.username,
        forgotForm.email
      );
      toast.success(res.message || "Đã gửi mã xác nhận tới email");
      console.log("✅ forgotPassword response:", res);
      setForgotStep(2);
    } catch (err) {
      console.error("❌ Lỗi gửi mã quên mật khẩu:", err);
      const message =
        err?.message ||
        err?.response?.data?.message ||
        "Không gửi được mã. Kiểm tra lại thông tin.";
      setForgotError(message); // ⚡ gán vào state để render ra màn hình
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Xác nhận mã và đổi mật khẩu
  const handleConfirmForgot = async () => {
    if (forgotForm.newPassword !== forgotForm.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }
    try {
      setLoading(true);
      const res = await AuthService.confirmForgotPassword(
        forgotForm.username,
        forgotForm.code,
        forgotForm.newPassword
      );
      toast.success(res.message || "Đặt lại mật khẩu thành công!");
      console.log("✅ confirmForgotPassword response:", res);
      setView("login");
      setForgotStep(1);
      setForgotForm({
        username: "",
        email: "",
        code: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error("❌ Lỗi xác nhận mã:", err);

      const message =
        err?.message ||
        err?.response?.data?.message ||
        "Mã xác nhận không hợp lệ, vui lòng thử lại.";

      setForgotError(message); // ⚡ Gán lỗi để hiển thị ra FE
      toast.error(message);
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
            {newUser ? (
              "Chào mừng đăng nhập lần đầu!"
            ) : (
              <>
                Welcome to <span className="text-cyan-400">FITX</span>
              </>
            )}
          </CardTitle>
        </CardHeader>

        {/* Hiệu ứng chuyển form */}
        <AnimatePresence mode="wait">
          {/* === LOGIN FORM === */}
          {view === "login" && !newUser && (
            <motion.form
              key="login-form"
              onSubmit={handleSubmit(onSubmit)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
            >
              <CardContent className="space-y-8 text-black dark:text-white">
                {/* Username */}
                <motion.div
                  key={`username-${shakeKey}`}
                  className="relative min-h-[64px]"
                  animate={errors.username ? shake : {}}
                >
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    📧
                  </div>
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
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    🔒
                  </div>
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
                <a
                  href="#"
                  onClick={() => setView("forgot")}
                  className="hover:text-cyan-400"
                >
                  Quên mật khẩu?
                </a>
              </CardFooter>
            </motion.form>
          )}

          {/* === NEW PASSWORD (lần đầu đăng nhập) === */}
          {newUser && view === "login" && (
            <motion.form
              key="newpass-form"
              onSubmit={handleSubmitNew(onSubmitNewPassword)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
            >
              <CardContent className="space-y-6 text-black dark:text-white">
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
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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

          {/* === FORGOT PASSWORD === */}
          {view === "forgot" && (
            <motion.div
              key="forgot-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="space-y-6 text-black dark:text-white"
            >
              {forgotStep === 1 ? (
                <>
                  <Input
                    placeholder="Username"
                    value={forgotForm.username}
                    onChange={(e) =>
                      setForgotForm((f) => ({ ...f, username: e.target.value }))
                    }
                  />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={forgotForm.email}
                    onChange={(e) =>
                      setForgotForm((f) => ({ ...f, email: e.target.value }))
                    }
                  />
                  <Button
                    onClick={handleSendForgotCode}
                    className="w-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500"
                  >
                    {loading ? "Đang gửi..." : "Gửi mã xác nhận"}
                  </Button>
                  {forgotError && (
                    <p className="text-red-500 text-sm text-center">
                      {forgotError}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setView("login")}
                    className="text-sm text-gray-500 hover:text-cyan-400"
                  >
                    ← Quay lại đăng nhập
                  </button>
                </>
              ) : (
                <>
                  <Input
                    placeholder="Mã xác nhận"
                    value={forgotForm.code}
                    onChange={(e) =>
                      setForgotForm((f) => ({ ...f, code: e.target.value }))
                    }
                  />
                  {/* Mật khẩu mới */}
                  <div className="relative">
                    <Input
                      placeholder="Mật khẩu mới"
                      type={showForgotNew ? "text" : "password"}
                      value={forgotForm.newPassword}
                      onChange={(e) =>
                        setForgotForm((f) => ({
                          ...f,
                          newPassword: e.target.value,
                        }))
                      }
                      className="!pr-14"
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotNew(!showForgotNew)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-400 transition"
                    >
                      {showForgotNew ? "🙈" : "👁️"}
                    </button>
                  </div>

                  {/* Xác nhận mật khẩu mới */}
                  <div className="relative">
                    <Input
                      placeholder="Xác nhận mật khẩu mới"
                      type={showForgotConfirm ? "text" : "password"}
                      value={forgotForm.confirmPassword}
                      onChange={(e) =>
                        setForgotForm((f) => ({
                          ...f,
                          confirmPassword: e.target.value,
                        }))
                      }
                      className="!pr-14"
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotConfirm(!showForgotConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-400 transition"
                    >
                      {showForgotConfirm ? "🙈" : "👁️"}
                    </button>
                  </div>
                  <Button
                    onClick={handleConfirmForgot}
                    className="w-full bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500"
                  >
                    {loading ? "Đang xác nhận..." : "Xác nhận đặt lại mật khẩu"}
                  </Button>
                  {forgotError && (
                    <p className="text-red-500 text-sm text-center mt-2">
                      {forgotError}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="text-sm text-gray-500 hover:text-cyan-400"
                  >
                    ← Nhập lại Username & Email
                  </button>
                </>
              )}
            </motion.div>
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
      <DisabledUserAlert
        open={alert === "disabled"}
        setOpen={() => setAlert(null)}
      />
    </>
  );
}
