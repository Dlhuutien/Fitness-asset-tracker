import { motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

// Loading
export function LoadingAlert({ open, setOpen }) {
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="sm:max-w-md text-center p-0 bg-transparent border-0 shadow-none">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="relative rounded-3xl overflow-hidden"
        >
          <div className="p-8 rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-white/10 shadow-[0_0_40px_rgba(6,182,212,0.5)] text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-14 h-14 mx-auto mb-4 border-4 border-cyan-400 border-t-transparent rounded-full"
            />
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl text-white">Đang đăng nhập...</AlertDialogTitle>
              <AlertDialogDescription className="mt-2 text-gray-300">
                Vui lòng chờ trong giây lát.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
        </motion.div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Success
export function SuccessAlert({ open, setOpen }) {
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="sm:max-w-md text-center p-0 bg-transparent border-0 shadow-none">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="p-8 rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-white/10 shadow-[0_0_40px_rgba(6,182,212,0.5)]"
        >
          <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500 shadow-lg">
            <span className="text-white text-3xl font-bold">✔</span>
          </div>
          <AlertDialogHeader>
            <AlertDialogTitle className="mt-4 text-2xl text-white">🎉 Đăng nhập thành công</AlertDialogTitle>
            <AlertDialogDescription className="mt-2 text-gray-300">
              Chào mừng bạn quay lại <span className="text-cyan-400 font-semibold">FitX Gym</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
        </motion.div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Error
export function ErrorAlert({ open, setOpen }) {
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="sm:max-w-md text-center p-0 bg-transparent border-0 shadow-none">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="p-8 rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-white/10 shadow-[0_0_40px_rgba(239,68,68,0.5)]"
        >
          <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 shadow-lg">
            <span className="text-white text-3xl font-bold">✖</span>
          </div>
          <AlertDialogHeader>
            <AlertDialogTitle className="mt-4 text-2xl text-white">❌ Đăng nhập thất bại</AlertDialogTitle>
            <AlertDialogDescription className="mt-2 text-gray-300">
              Sai tài khoản hoặc mật khẩu. Vui lòng thử lại!
            </AlertDialogDescription>
          </AlertDialogHeader>
        </motion.div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Server Error
export function ServerErrorAlert({ open, setOpen }) {
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="sm:max-w-md text-center p-0 bg-transparent border-0 shadow-none">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="p-8 rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-white/10 shadow-[0_0_40px_rgba(239,68,68,0.5)]"
        >
          <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-orange-500 shadow-lg">
            <span className="text-white text-3xl font-bold">⚠</span>
          </div>
          <AlertDialogHeader>
            <AlertDialogTitle className="mt-4 text-2xl text-white">
              🚫 Không thể kết nối máy chủ
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-2 text-gray-300">
              Máy chủ đang tạm ngưng hoặc mất kết nối mạng. <br />
              Vui lòng thử lại sau.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </motion.div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Disabled User
export function DisabledUserAlert({ open, setOpen }) {
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="sm:max-w-md text-center p-0 bg-transparent border-0 shadow-none">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="p-8 rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-white/10 shadow-[0_0_40px_rgba(234,179,8,0.5)]"
        >
          <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 shadow-lg">
            <span className="text-white text-3xl font-bold">🚫</span>
          </div>
          <AlertDialogHeader>
            <AlertDialogTitle className="mt-4 text-2xl text-white">
              ⚠️ Tài khoản bị vô hiệu hóa
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-2 text-gray-300">
              Tài khoản của bạn hiện đang bị ngừng hoạt động. <br />
              Vui lòng liên hệ quản trị viên để được hỗ trợ.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </motion.div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
