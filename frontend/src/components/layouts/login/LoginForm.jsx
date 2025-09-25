import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog"

// Schema validate
const schema = z.object({
  username: z.string().min(1, "Tài khoản không được để trống"),
  password: z.string().min(8, "Mật khẩu phải ít nhất 8 ký tự"),
})

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [shakeKey, setShakeKey] = useState(0)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = (values) => {
    if (errors.username || errors.password) {
      setShakeKey((prev) => prev + 1)
    } else {
      setOpen(true)
      // Sau 2 giây tự động chuyển
      setTimeout(() => {
        setOpen(false)
        navigate("/app")
      }, 2000)
    }
  }

  const shake = {
    x: [0, -8, 8, -6, 6, -3, 3, 0],
    transition: { duration: 0.4 },
  }

  return (
    <>
      {/* Form login */}
      <Card className="p-10 rounded-3xl bg-gradient-to-br from-gray-900/70 via-gray-800/50 to-gray-900/70 border border-white/10 backdrop-blur-2xl shadow-[0_0_30px_rgba(0,255,180,0.15)] font-sans">
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
                <span className="text-xl">
                  {showPassword ? "🙈" : "👁️"}
                </span>
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

      {/* AlertDialog thông báo với border xoay + slide up */}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="sm:max-w-md text-center p-0 bg-transparent border-0 shadow-none">
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="relative p-[2px] rounded-2xl overflow-hidden"
          >
            {/* Border gradient xoay */}
            <div className="absolute inset-0 bg-[conic-gradient(at_top_left,_#34d399,_#3b82f6,_#a855f7,_#f59e0b)] animate-spin-slow"></div>

            {/* Nội dung alert */}
            <div className="relative z-10 p-8 rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-white/20 shadow-2xl backdrop-blur-xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-2xl font-extrabold bg-gradient-to-r from-green-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent">
                  🎉 Đăng nhập thành công!
                </AlertDialogTitle>
                <AlertDialogDescription className="mt-3 text-gray-300 text-base font-light">
                  Chào mừng bạn đến hệ thống quản trị của{" "}
                  <span className="font-semibold text-green-400">FitX Gym</span>
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
          </motion.div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
