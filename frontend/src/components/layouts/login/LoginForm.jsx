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

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

// ✅ Schema validate
const schema = z.object({
  username: z.string().min(1, "Tài khoản không được để trống"),
  password: z.string().min(8, "Mật khẩu phải ít nhất 8 ký tự"),
});

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false); 
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  // const onSubmit = () => {
  //   if (errors.username || errors.password) {
  //     setShakeKey((prev) => prev + 1);
  //   } else {
  //     setOpen(true);
  //     setTimeout(() => {
  //       setOpen(false);
  //       navigate("/app");
  //     }, 2000);
  //   }
  // };

  const onSubmit = async (values) => {
    try {
      setLoading(true);
      const data = await AuthService.signin(values.username, values.password);

      if (data.mode === "new_password_required") {
        console.log("Cần đổi mật khẩu lần đầu:", data);
      } else {
        console.log("Đăng nhập thành công");
        setOpen(true);
        //username, accessToken, refreshToken đã được lưu trong localStorage
        navigate("/app");
        setTimeout(() => {
          setOpen(false);
          navigate("/app");
        }, 2000);
      }
    } catch (error) {
      console.error("Đăng nhập thất bại:", error);
      setShakeKey((prev) => prev + 1);
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
          <CardTitle
            className="font-sans text-center text-4xl font-extrabold 
             bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500
             bg-clip-text text-transparent tracking-wide"
          >
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
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center">
                <span className="text-xl">📧</span>
              </div>
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
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center">
                <span className="text-xl">🔒</span>
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
                <span className="text-xl">{showPassword ? "🙈" : "👁️"}</span>
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
              Log in
            </Button>
          </CardContent>

          <CardFooter className="flex justify-between text-sm text-gray-400 mt-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="accent-cyan-400" /> Remember me
            </label>
            <a href="#" className="hover:text-cyan-400 transition-colors">
              Forget password?
            </a>
          </CardFooter>
        </form>
      </Card>

      {/* ============================ */}
      {/* Đăng nhập thành công */}
      {/* ============================ */}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="sm:max-w-md text-center p-0 bg-transparent border-0 shadow-none">
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative rounded-3xl overflow-hidden"
          >
            <div
              className="relative z-10 p-8 rounded-3xl 
        bg-gradient-to-br from-gray-900 via-gray-800 to-black 
        border border-white/10 shadow-[0_0_40px_rgba(6,182,212,0.5)] 
        backdrop-blur-xl text-center"
            >
              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.2,
                }}
                className="w-16 h-16 mx-auto flex items-center justify-center 
            rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500 shadow-lg"
              >
                <span className="text-white text-3xl font-bold">✔</span>
              </motion.div>

              {/* Nội dung */}
              <AlertDialogHeader>
                {/* Tiêu đề */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <AlertDialogTitle
                    className="mt-6 text-2xl font-jakarta tracking-wide justify-center
              text-white drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]"
                  >
                    🎉 Đăng nhập thành công
                  </AlertDialogTitle>
                </motion.div>

                {/* Mô tả */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45, duration: 0.5 }}
                >
                  <AlertDialogDescription className="mt-3 text-gray-300 text-lg leading-relaxed justify-center">
                    Chào mừng bạn trở lại{" "}
                    <span className="font-semiboldbg text-cyan-400">
                      FitX Gym
                    </span>
                  </AlertDialogDescription>
                </motion.div>
              </AlertDialogHeader>
            </div>
          </motion.div>
        </AlertDialogContent>
      </AlertDialog>

      {/* ============================ */}
      {/* Loading Đăng nhập */}
      {/* ============================ */}
      <AlertDialog open={loading} onOpenChange={setLoading}>
        <AlertDialogContent className="sm:max-w-md text-center p-0 bg-transparent border-0 shadow-none">
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative rounded-3xl overflow-hidden"
          >
            <div
              className="relative z-10 p-8 rounded-3xl 
          bg-gradient-to-br from-gray-900 via-gray-800 to-black 
          border border-white/10 shadow-[0_0_40px_rgba(6,182,212,0.5)] 
          backdrop-blur-xl text-center"
            >
              {/* Vòng tròn loading */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-14 h-14 mx-auto mb-4 border-4 border-cyan-400 border-t-transparent rounded-full"
              />
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl text-white">
                  Đang đăng nhập...
                </AlertDialogTitle>
                <AlertDialogDescription className="mt-2 text-gray-300">
                  Vui lòng chờ trong giây lát.
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
          </motion.div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
