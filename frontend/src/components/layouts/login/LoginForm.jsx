import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";


import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button"; // ✅ chữ thường

// Schema
const schema = z.object({
  username: z.string().min(1, "Tài khoản không được để trống"),
  password: z.string().min(8, "Mật khẩu phải ít nhất 8 ký tự"),
});

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const navigate = useNavigate(); // ✅ dùng navigate

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = (values) => {
    if (errors.username || errors.password) {
      setShakeKey((prev) => prev + 1);
    } else {
      console.log("Login data:", values);
      alert("Đăng nhập thành công (demo) 🎉");
      setTimeout(() => navigate("/app"), 800); // ✅ điều hướng
    }
  };

  const shake = {
    x: [0, -8, 8, -6, 6, -3, 3, 0],
    transition: { duration: 0.4 },
  };

  return (
    <Card className="p-10 rounded-3xl bg-gradient-to-br from-gray-900/70 via-gray-800/50 to-gray-900/70 border border-white/10 backdrop-blur-2xl shadow-[0_0_30px_rgba(0,255,180,0.15)]">
      <CardHeader>
        <CardTitle className="text-center text-4xl font-extrabold bg-gradient-to-r from-green-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent">
          Welcome to <span className="text-green-400">FITX</span>
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
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-green-400 transition"
            >
              <span className="text-xl">{showPassword ? "🙈" : "👁️"}</span>
            </button>
            {errors.password && (
              <p className="absolute -bottom-5 left-0 text-sm text-red-400">
                {errors.password.message}
              </p>
            )}
          </motion.div>

          <Button type="submit" className="form-btn w-full">
            Log in
          </Button>
        </CardContent>

        <CardFooter className="flex justify-between text-sm text-gray-400 mt-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="accent-green-500" /> Remember me
          </label>
          <a href="#" className="hover:text-green-300 transition-colors">
            Forget password?
          </a>
        </CardFooter>
      </form>
    </Card>
  );
}
