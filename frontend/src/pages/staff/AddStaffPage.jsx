import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/buttonn";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, UserPlus, Loader2 } from "lucide-react";

export default function AddStaffPage() {
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    role: "",
    branch: "",
    name: "",
    gender: "",
    phone_number: "",
    address: "",
    birthdate: "",
  });
  const [expandExtra, setExpandExtra] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.username || !form.password || !form.email || !form.role || !form.name) {
      alert("⚠️ Vui lòng nhập đầy đủ các trường bắt buộc!");
      return;
    }

    const payload = {
      username: form.username,
      password: form.password,
      email: form.email,
      role: form.role,
      extra: {
        name: form.name,
        gender: form.gender,
        phone_number: form.phone_number,
        address: form.address,
        birthdate: form.birthdate,
        branch_id: form.branch,
      },
    };

    try {
      setLoading(true);
      console.log("📤 Body gửi API:", payload);
      // await UserService.create(payload)
      alert("✅ Tạo nhân viên thành công (mock demo)");
    } catch (err) {
      console.error("❌ Lỗi khi tạo nhân viên:", err);
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { label: "Người quản trị", value: "super-admin" },
    { label: "Người quản lý", value: "admin" },
    { label: "Nhân viên kỹ thuật", value: "technician" },
    { label: "Nhân viên trực phòng", value: "operator" },
  ];

  const branchOptions = [
    "Chi nhánh Quận 1",
    "Chi nhánh Quận 3",
    "Chi nhánh Quận 7",
    "Chi nhánh Quận 10",
    "Chi nhánh Gò Vấp",
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <UserPlus className="text-emerald-500" /> Thêm nhân viên mới
      </h1>

      {/* CARD 1 - Thông tin cơ bản */}
      <div className="bg-white dark:bg-gray-900 border border-emerald-500/40 rounded-2xl shadow p-6 space-y-5">
        <h2 className="text-lg font-semibold text-emerald-600">Thông tin bắt buộc</h2>

        <div className="grid md:grid-cols-2 gap-5">
          <Input
            placeholder="Tên đăng nhập"
            value={form.username}
            onChange={(e) => handleChange("username", e.target.value)}
          />
          <Input
            type="password"
            placeholder="Mật khẩu"
            value={form.password}
            onChange={(e) => handleChange("password", e.target.value)}
          />
          <Input
            placeholder="Email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
          />
          <Input
            placeholder="Họ và tên"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
          />

          <select
            value={form.role}
            onChange={(e) => handleChange("role", e.target.value)}
            className="border rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white"
          >
            <option value="">-- Chọn vai trò --</option>
            {roleOptions.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          <select
            value={form.branch}
            onChange={(e) => handleChange("branch", e.target.value)}
            className="border rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white"
          >
            <option value="">-- Chọn chi nhánh --</option>
            {branchOptions.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* CARD 2 - Thông tin mở rộng */}
      <div className="bg-white dark:bg-gray-900 border border-cyan-500/40 rounded-2xl shadow">
        <button
          onClick={() => setExpandExtra(!expandExtra)}
          className="w-full flex justify-between items-center px-6 py-4 text-lg font-semibold text-cyan-600 hover:bg-cyan-50 dark:hover:bg-gray-800 transition"
        >
          Thông tin bổ sung
          <ChevronDown
            className={`transition-transform duration-300 ${
              expandExtra ? "rotate-180" : ""
            }`}
          />
        </button>

        <AnimatePresence>
          {expandExtra && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 pb-6 space-y-5"
            >
              <div className="grid md:grid-cols-2 gap-5">
                <Input
                  placeholder="Số điện thoại"
                  value={form.phone_number}
                  onChange={(e) => handleChange("phone_number", e.target.value)}
                />
                <Input
                  placeholder="Địa chỉ"
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                />
                <select
                  value={form.gender}
                  onChange={(e) => handleChange("gender", e.target.value)}
                  className="border rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">-- Giới tính --</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
                <Input
                  type="date"
                  value={form.birthdate}
                  onChange={(e) => handleChange("birthdate", e.target.value)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-cyan-500 hover:to-emerald-500 text-white shadow-md"
        >
          {loading ? <Loader2 className="animate-spin mr-2" /> : "➕ Tạo nhân viên"}
        </Button>
      </div>
    </div>
  );
}
