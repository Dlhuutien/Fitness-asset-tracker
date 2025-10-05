import { useState, useEffect } from "react";
import { Button } from "@/components/ui/buttonn";
import Status from "@/components/common/Status";
import Role from "@/components/common/Role";
import { motion } from "framer-motion";
import AuthService from "@/services/AuthService";

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  // 🧭 Lấy thông tin user từ localStorage (AuthService)
  useEffect(() => {
    const auth = AuthService.getAuth();
    if (auth?.user) {
      const u = auth.user;
      setUser(u);
      setFormData({
        name: u.userAttributes?.name || "",
        email: u.userAttributes?.email || "",
        phone_number: u.userAttributes?.phone_number || "",
        address: u.userAttributes?.address || "",
        gender: u.userAttributes?.gender === "male" ? "Nam" : "Nữ",
        birthdate: u.userAttributes?.birthdate || "",
        status: u.userAttributes?.["custom:status"] || "Chưa xác định",
        created_at: u.userAttributes?.["custom:created_at"] || "",
        updated_at: u.userAttributes?.["custom:updated_at"] || "",
        role:
          Array.isArray(u.groups) && u.groups.length > 0
            ? u.groups.join(", ")
            : "Người dùng",
        username: u.username || "",
        id: u.sub || "",
      });
    }
  }, []);

  if (!user) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          ⏳ Đang tải thông tin người dùng...
        </p>
      </div>
    );
  }

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setUser({ ...user, userAttributes: formData });
    setEditing(false);
  };

  return (
    <motion.div
      className="p-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-white dark:bg-[#121212] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 space-y-8 transition-colors">
        {/* Header */}
        <div className="flex items-center gap-6 border-b border-gray-200 dark:border-gray-700 pb-6">
          <div>
            {editing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="px-3 py-2 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-lg font-bold dark:text-white"
              />
            ) : (
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {formData.name}
              </h2>
            )}
            <div className="flex gap-2 mt-2 flex-wrap">
              <Role role={formData.role} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Username: {formData.username} • Ngày tạo:{" "}
              {formData.created_at?.slice(0, 10)}
            </p>
          </div>
        </div>

        {/* Thông tin chi tiết */}
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-5 text-base text-gray-700 dark:text-gray-300">
          {[
            ["Giới tính", "gender"],
            ["Ngày sinh", "birthdate"],
            ["Số điện thoại", "phone_number"],
            ["Email", "email"],
            ["Địa chỉ", "address", true],
            ["Cập nhật gần nhất", "updated_at"],
          ].map(([label, field, wide]) => (
            <p key={field} className={wide ? "col-span-2" : ""}>
              <strong>{label}:</strong>{" "}
              {editing ? (
                <input
                  type="text"
                  value={formData[field] || ""}
                  onChange={(e) => handleChange(field, e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-white"
                />
              ) : (
                formData[field] || "-"
              )}
            </p>
          ))}
        </div>

        {/* Nút hành động */}
        <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {editing ? (
            <>
              <Button
                onClick={() => setEditing(false)}
                className="bg-gray-300 dark:bg-gray-700 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-600"
              >
                ❌ Hủy
              </Button>
              <Button
                onClick={handleSave}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                💾 Lưu thay đổi
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setEditing(true)}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              ✏️ Chỉnh sửa
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
