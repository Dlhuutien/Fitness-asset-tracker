import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card, CardHeader, CardTitle, CardContent, CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Schema
const schema = z.object({
  username: z.string().min(1, "Tài khoản không được để trống"),
  password: z.string().min(8, "Mật khẩu phải ít nhất 8 ký tự"),
});

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = (values) => {
    console.log("Login data:", values);
    alert("Đăng nhập thành công (demo) 🎉");
  };

  return (
    <Card className="p-10 rounded-3xl bg-gradient-to-br from-gray-900/70 via-gray-800/50 to-gray-900/70 border border-white/10 backdrop-blur-2xl shadow-[0_0_30px_rgba(0,255,180,0.15)]">
      <CardHeader>
        <CardTitle className="text-center text-4xl font-extrabold bg-gradient-to-r from-green-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent">
          Welcome to <span className="text-green-400">FITX</span>
        </CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {/* Username */}
          <div className="relative group">
            {/* prefix emoji có khung cố định */}
            <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
              <span className="w-6 text-center text-xl leading-none">📧</span>
            </div>
            {/* dùng !pl-14 để chắc chắn override mọi padding khác */}
            <Input
              placeholder="Email hoặc Username"
              className="!pl-14"
              {...register("username")}
            />
            {errors.username && (
              <p className="text-sm text-red-400 mt-1">{errors.username.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="relative group">
            <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
              <span className="w-6 text-center text-xl leading-none">🔒</span>
            </div>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="!pl-14 !pr-14"
              {...register("password")}
            />
            {/* Eye toggle */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-4 flex items-center text-gray-500 hover:text-green-400 transition"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
            {errors.password && (
              <p className="text-sm text-red-400 mt-1">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="form-btn w-full">Log in</Button>
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
