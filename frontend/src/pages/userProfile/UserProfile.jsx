import { useState, useEffect } from "react";
import { Button } from "@/components/ui/buttonn";
import Role from "@/components/common/Role";
import { motion } from "framer-motion";
import AuthService from "@/services/AuthService";
import UserService from "@/services/UserService";
import { toast } from "sonner";
import userGymImg from "@/assets/user_gym.png";

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [saveMessage, setSaveMessage] = useState({ text: "", type: "" });
  const [errors, setErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  // 🧭 Load user info từ localStorage
  useEffect(() => {
    const auth = AuthService.getAuth();
    if (auth?.user) {
      const u = auth.user;
      const groups = Array.isArray(u.groups) ? u.groups : [];
      const mainRole = groups.includes("super-admin")
        ? "super-admin"
        : groups[0] || "operator";

      // 👉 Cắt bỏ +84 khi hiển thị
      let rawPhone = u.userAttributes?.phone_number || "";
      if (rawPhone.startsWith("+84")) rawPhone = rawPhone.slice(3);
      if (rawPhone.startsWith("0")) rawPhone = rawPhone.slice(1);

      setUser(u);
      setFormData({
        name: u.userAttributes?.name || "",
        email: u.userAttributes?.email || "",
        phone_number: rawPhone || "",
        address: u.userAttributes?.address || "",
        gender:
          u.userAttributes?.gender === "male"
            ? "Nam"
            : u.userAttributes?.gender === "female"
            ? "Nữ"
            : "Khác",
        birthdate: u.userAttributes?.birthdate || "",
        branch_id: u.userAttributes?.["custom:branch_id"] || "",
        created_at: u.userAttributes?.["custom:created_at"] || "",
        updated_at: u.userAttributes?.["custom:updated_at"] || "",
        role: mainRole,
        username: u.username || "",
      });
    }
  }, []);

  if (!user)
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <p className="text-gray-500 dark:text-gray-400 text-lg">
          ⏳ Đang tải thông tin người dùng...
        </p>
      </div>
    );

  const handleChange = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  // ✅ Chuẩn hóa số điện thoại sang định dạng AWS (+84)
  const normalizePhone = (phone) => {
    if (!phone) return "";
    let cleaned = phone.trim();

    // Nếu nhập có dấu cách, bỏ hết
    cleaned = cleaned.replace(/\s+/g, "");

    // Nếu có +84 thì giữ nguyên
    if (cleaned.startsWith("+84")) return cleaned;

    // Nếu có số 0 đầu => bỏ 0 rồi thêm +84
    if (cleaned.startsWith("0")) return "+84" + cleaned.slice(1);

    // Nếu không có gì đặc biệt => thêm +84 vào đầu
    return "+84" + cleaned;
  };

  const validateProfile = () => {
    const e = {};

    // name
    if (!formData.name?.trim()) e.name = "Họ tên không được để trống";
    else if (formData.name.trim().length < 3)
      e.name = "Họ tên tối thiểu 3 ký tự";

    // gender
    if (!["Nam", "Nữ", "Khác"].includes(formData.gender))
      e.gender = "Giới tính không hợp lệ";

    // birthdate
    if (formData.birthdate) {
      const d = new Date(formData.birthdate);
      if (isNaN(d)) e.birthdate = "Ngày sinh không hợp lệ";
      else if (d > new Date())
        e.birthdate = "Ngày sinh không được lớn hơn hiện tại";
    }

    // phone (sau +84)
    if (!formData.phone_number) e.phone_number = "Vui lòng nhập số điện thoại";
    else if (!/^\d{9,10}$/.test(formData.phone_number))
      e.phone_number = "Số điện thoại phải 9–10 chữ số";

    // address
    if (formData.address && formData.address.trim().length < 5)
      e.address = "Địa chỉ tối thiểu 5 ký tự";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ✅ Gọi API updateSelf
  const handleSave = async () => {
    if (!validateProfile()) return;
    try {
      setSaving(true);

      const payload = {
        name: formData.name,
        address: formData.address,
        phone_number: normalizePhone(formData.phone_number),
        gender: formData.gender,
        birthdate: formData.birthdate,
      };

      const res = await UserService.updateSelf(payload);
      toast.success(res.message || "Cập nhật thông tin thành công!");

      // 🔄 Lấy lại thông tin user mới nhất từ server
      const auth = AuthService.getAuth();
      if (auth?.accessToken) {
        const freshUser = await AuthService.getMeWithToken(auth.accessToken);
        AuthService.saveAuth({
          username: auth.username,
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
          user: freshUser,
        });
        setUser(freshUser);
        toast.success("Đã đồng bộ lại thông tin người dùng!");
        setSaveMessage({
          text: "Cập nhật thông tin thành công!",
          type: "success",
        });
      }

      setUser((prev) => ({
        ...prev,
        userAttributes: { ...prev.userAttributes, ...payload },
      }));

      setEditing(false);
    } catch (err) {
      console.error("❌ Lỗi khi updateSelf:", err);
      toast.error(err.message || "Cập nhật thất bại!");
      setSaveMessage({ text: "Cập nhật thất bại!", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const validatePassword = () => {
    const e = {};

    if (!passwordData.oldPassword) e.oldPassword = "Chưa nhập mật khẩu cũ";

    if (!passwordData.newPassword) e.newPassword = "Chưa nhập mật khẩu mới";
    else if (passwordData.newPassword.length < 6)
      e.newPassword = "Mật khẩu ≥ 6 ký tự";

    if (!passwordData.confirmNewPassword)
      e.confirmNewPassword = "Chưa xác nhận mật khẩu";
    else if (passwordData.confirmNewPassword !== passwordData.newPassword)
      e.confirmNewPassword = "Mật khẩu xác nhận không khớp";

    setPasswordErrors(e);
    return Object.keys(e).length === 0;
  };

  // ✅ Đổi mật khẩu
  const handleChangePassword = async () => {
    if (!validatePassword()) return;
    const { oldPassword, newPassword, confirmNewPassword } = passwordData;

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      toast.error("Vui lòng nhập đầy đủ các trường!");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast.error("Mật khẩu mới và xác nhận không khớp!");
      return;
    }

    try {
      setSaving(true);
      const res = await AuthService.changePassword(oldPassword, newPassword);
      toast.success(res.message || "Đổi mật khẩu thành công!");
      setSaveMessage({ text: "Đổi mật khẩu thành công!", type: "success" });
      setChangingPass(false);
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    } catch (err) {
      console.error("❌ Lỗi đổi mật khẩu:", err);
      toast.error(err.message || "Đổi mật khẩu thất bại!");
      setSaveMessage({ text: "Đổi mật khẩu thất bại!", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const convertRoleName = (r) =>
    ({
      "super-admin": "Người quản trị",
      admin: "Người quản lý",
      operator: "Nhân viên trực phòng",
      technician: "Nhân viên kĩ thuật",
    }[r] || "Khác");

  // 🔹 Định dạng ngày thành dd/MM/yyyy
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d)) return "—";
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
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
          <img
            src={userGymImg}
            alt={formData.username}
            className="w-32 h-32 rounded-full object-cover shadow-lg border-4 border-emerald-500"
          />
          <div>
            {editing ? (
              <>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="px-3 py-2 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-lg font-bold dark:text-white"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </>
            ) : (
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {formData.name || formData.username}
              </h2>
            )}

            <div className="flex gap-2 mt-2 flex-wrap">
              <Role role={convertRoleName(formData.role)} />
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Username: {formData.username} • Ngày tạo:{" "}
              {formatDate(formData.created_at)}
            </p>
          </div>
        </div>

        {/* Thông tin chi tiết */}
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-5 text-base text-gray-700 dark:text-gray-300">
          {/* Giới tính */}
          <p>
            <strong>Giới tính:</strong>{" "}
            {editing ? (
              <>
                <select
                  value={formData.gender}
                  onChange={(e) => handleChange("gender", e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-white"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
                {errors.gender && (
                  <p className="text-red-500 text-xs mt-1">{errors.gender}</p>
                )}
              </>
            ) : (
              formData.gender || "—"
            )}
          </p>

          {/* Ngày sinh */}
          <p>
            <strong>Ngày sinh:</strong>{" "}
            {editing ? (
              <>
                <input
                  type="date"
                  value={formData.birthdate || ""}
                  onChange={(e) => handleChange("birthdate", e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-white"
                />
                {errors.birthdate && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.birthdate}
                  </p>
                )}
              </>
            ) : (
              formatDate(formData.birthdate)
            )}
          </p>

          {/* Số điện thoại (chỉ sửa phần sau +84) */}
          <p>
            <strong>Số điện thoại:</strong>{" "}
            {editing ? (
              <div className="flex items-center gap-1">
                <span className="text-gray-500 dark:text-gray-400 font-semibold">
                  +84
                </span>
                <input
                  type="text"
                  value={formData.phone_number || ""}
                  onChange={(e) =>
                    handleChange(
                      "phone_number",
                      e.target.value.replace(/\D/g, "")
                    )
                  }
                  className="mt-1 w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-white"
                  placeholder="Nhập số"
                />
                {errors.phone_number && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.phone_number}
                  </p>
                )}
              </div>
            ) : formData.phone_number ? (
              `+84${formData.phone_number}`
            ) : (
              "—"
            )}
          </p>

          {/* Email (readonly) */}
          <p>
            <strong>Email:</strong> {formData.email}
          </p>

          {/* Địa chỉ */}
          <p className="col-span-2">
            <strong>Địa chỉ:</strong>{" "}
            {editing ? (
              <>
                <input
                  type="text"
                  value={formData.address || ""}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-white"
                />
                {errors.address && (
                  <p className="text-red-500 text-xs mt-1">{errors.address}</p>
                )}
              </>
            ) : (
              formData.address || "—"
            )}
          </p>

          {/* Cập nhật gần nhất */}
          <p className="col-span-2">
            <strong>Cập nhật gần nhất:</strong>{" "}
            {new Date(formData.updated_at).toLocaleString("vi-VN")}
          </p>
        </div>

        {changingPass && (
          <div className="mt-6 bg-gray-50 dark:bg-gray-800 p-5 rounded-xl border border-gray-300 dark:border-gray-700 space-y-4 transition-all">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              🔐 Đổi mật khẩu
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">
                  Mật khẩu cũ
                </label>
                <input
                  type="password"
                  value={passwordData.oldPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      oldPassword: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white"
                />
                {passwordErrors.oldPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {passwordErrors.oldPassword}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white"
                />
                {passwordErrors.newPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {passwordErrors.newPassword}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-300">
                  Nhập lại mật khẩu mới
                </label>
                <input
                  type="password"
                  value={passwordData.confirmNewPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      confirmNewPassword: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white"
                />
                {passwordErrors.confirmNewPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {passwordErrors.confirmNewPassword}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button
                onClick={() => setChangingPass(false)}
                className="bg-gray-400 text-white hover:bg-gray-500"
              >
                ❌ Hủy
              </Button>
              <Button
                onClick={handleChangePassword}
                className="bg-amber-500 text-white hover:bg-amber-600"
                disabled={saving}
              >
                {saving ? "⏳ Đang đổi..." : "💾 Đổi mật khẩu"}
              </Button>
            </div>
          </div>
        )}

        {/* Nút hành động */}
        <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {!changingPass && (
            <>
              {editing ? (
                <>
                  <Button
                    onClick={() => setEditing(false)}
                    className="bg-gray-400 text-white hover:bg-gray-500"
                    disabled={saving}
                  >
                    ❌ Hủy
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                    disabled={saving}
                  >
                    {saving ? "⏳ Đang lưu..." : "💾 Lưu thay đổi"}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => setEditing(true)}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    ✏️ Chỉnh sửa
                  </Button>
                  <Button
                    onClick={() => setChangingPass(true)}
                    className="bg-amber-500 text-white hover:bg-amber-600"
                  >
                    🔒 Đổi mật khẩu
                  </Button>
                </>
              )}
            </>
          )}
        </div>
        {saveMessage.text && (
          <p
            className={`text-sm mt-2 transition ${
              saveMessage.type === "success"
                ? "text-emerald-600"
                : saveMessage.type === "error"
                ? "text-red-500"
                : "text-amber-500 animate-pulse"
            }`}
          >
            {saveMessage.text}
          </p>
        )}
      </div>
    </motion.div>
  );
}
