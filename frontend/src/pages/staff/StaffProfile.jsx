import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import Status from "@/components/common/Status";
import Role from "@/components/common/Role";
import Branch from "@/components/common/Branch";
import { Button } from "@/components/ui/buttonn";
import UserService from "@/services/UserService";
import { toast } from "sonner";

// Mock list chi nhánh – có thể thay bằng BranchService.getAll()
const BRANCH_OPTIONS = [
  { id: "GV", name: "FitX Gym Gò Vấp" },
  { id: "G3", name: "FitX Gym G3" },
  { id: "Q3", name: "FitX Gym Quận 3" },
];

export default function StaffProfile() {
  const { id } = useParams();
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [newRole, setNewRole] = useState("");

  // 🔹 Load user by username
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const user = await UserService.getByUsername(id);
        setStaff(user);
        setFormData({
          name: user.attributes?.name || "",
          email: user.attributes?.email || "",
          gender: user.attributes?.gender || "",
          birthdate: user.attributes?.birthdate || "",
          phone_number: user.attributes?.phone_number || "",
          address: user.attributes?.address || "",
          branch_id: user.attributes?.["custom:branch_id"] || "",
        });
        setNewRole(user.roles?.[0] || "");
      } catch (err) {
        console.error("❌ Lỗi khi load profile:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const convertRoleName = (r) =>
    ({
      "super-admin": "Người quản trị",
      admin: "Người quản lý",
      operator: "Nhân viên trực phòng",
      technician: "Nhân viên kĩ thuật",
    }[r] || "Khác");

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ✅ Chuẩn hóa số điện thoại
  const normalizePhone = (phone) => {
    if (!phone) return "";
    if (phone.startsWith("0")) return "+84" + phone.slice(1);
    if (!phone.startsWith("+84")) return "+84" + phone;
    return phone;
  };

  // ✅ Lưu thay đổi (gọi API admin-update-user)
  const handleSave = async () => {
    try {
      // Chỉ chọn các field hợp lệ, không spread formData để tránh branch_id thừa
      const attributes = {
        name: formData.name,
        address: formData.address,
        gender: formData.gender,
        birthdate: formData.birthdate,
        phone_number: normalizePhone(formData.phone_number),
        "custom:branch_id": formData.branch_id, // key đúng schema Cognito
      };

      // Gọi đúng dạng backend yêu cầu
      const res = await UserService.adminUpdateUser(id, attributes);

      toast.success(res.message || "💾 Cập nhật thành công!");
      setEditing(false);
    } catch (err) {
      console.error("❌ Lỗi khi admin cập nhật thông tin user:", err);
      toast.error(err.message || "Cập nhật thất bại!");
    }
  };

  // Dừng hoặc kích hoạt user
  const handleToggleStatus = async () => {
    try {
      const enabled = !staff.enabled;
      const res = await UserService.changeStatus(id, enabled);
      toast.success(res.message || "Đã thay đổi trạng thái tài khoản");
      setStaff((prev) => ({ ...prev, enabled }));
    } catch (err) {
      toast.error(err.message || "Không thể thay đổi trạng thái!");
    }
  };

  // ✅ Đổi quyền
  const handleChangeRole = async () => {
    try {
      const res = await UserService.setRole(id, newRole);
      toast.success(res.message || "Đã cập nhật quyền");
    } catch (err) {
      toast.error(err.message || "Lỗi khi cập nhật quyền!");
    }
  };

  if (loading)
    return (
      <p className="text-center text-gray-500 dark:text-gray-400 mt-10">
        ⏳ Đang tải thông tin...
      </p>
    );

  if (!staff)
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-lg text-gray-500 dark:text-gray-400">
          ❌ Không tìm thấy nhân viên có username <strong>{id}</strong>
        </p>
      </div>
    );

  return (
    <div className="p-6">
      <div className="bg-white dark:bg-[#121212] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 space-y-8 transition-colors">
        {/* Header */}
        <div className="flex items-center gap-6 border-b border-gray-200 dark:border-gray-700 pb-6">
          <img
            src="https://via.placeholder.com/120x120.png?text=User"
            alt={staff.username}
            className="w-32 h-32 rounded-full object-cover shadow-lg border-4 border-emerald-500"
          />
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
                {staff.attributes?.name || staff.username}
              </h2>
            )}

            <div className="flex gap-2 mt-2 flex-wrap">
              <Role role={convertRoleName(staff.roles?.[0])} />
              <Branch id={formData.branch_id || "—"} />
              <Status status={staff.enabled ? "Đang làm" : "Đã nghỉ"} />
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              ID: {staff.username} • Ngày tạo:{" "}
              {new Date(staff.createdAt).toLocaleDateString("vi-VN")}
            </p>
          </div>
        </div>

        {/* Thông tin chi tiết */}
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-5 text-base text-gray-700 dark:text-gray-300">
          {/* Email */}
          <p>
            <strong>Email:</strong> {formData.email}
          </p>

          {/* Số điện thoại */}
          <p>
            <strong>Số điện thoại:</strong>{" "}
            {editing ? (
              <input
                type="text"
                value={formData.phone_number}
                onChange={(e) => handleChange("phone_number", e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-white"
              />
            ) : (
              formData.phone_number || "—"
            )}
          </p>

          {/* Giới tính */}
          <p>
            <strong>Giới tính:</strong>{" "}
            {editing ? (
              <select
                value={formData.gender}
                onChange={(e) => handleChange("gender", e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-white"
              >
                <option value="">— Chọn giới tính —</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            ) : (
              formData.gender || "—"
            )}
          </p>

          {/* Ngày sinh */}
          <p>
            <strong>Ngày sinh:</strong>{" "}
            {editing ? (
              <input
                type="date"
                value={formData.birthdate}
                onChange={(e) => handleChange("birthdate", e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-white"
              />
            ) : (
              formData.birthdate || "—"
            )}
          </p>

          {/* Chi nhánh */}
          <p>
            <strong>Chi nhánh:</strong>{" "}
            {editing ? (
              <select
                value={formData.branch_id}
                onChange={(e) => handleChange("branch_id", e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-white"
              >
                <option value="">— Chọn chi nhánh —</option>
                {BRANCH_OPTIONS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            ) : (
              <Branch id={formData.branch_id || "—"} />
            )}
          </p>

          {/* Địa chỉ */}
          <p className="col-span-2">
            <strong>Địa chỉ:</strong>{" "}
            {editing ? (
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-white"
              />
            ) : (
              formData.address || "—"
            )}
          </p>
        </div>

        {/* Đổi role */}
        <div className="flex items-center gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <label className="font-medium text-gray-700 dark:text-gray-300">
            Quyền:
          </label>
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="px-3 py-2 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-white"
          >
            <option value="operator">Nhân viên trực phòng</option>
            <option value="technician">Nhân viên kĩ thuật</option>
            <option value="admin">Người quản lý</option>
          </select>
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-white"
            onClick={handleChangeRole}
          >
            🔄 Cập nhật quyền
          </Button>
        </div>

        {/* Nút hành động */}
        <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {editing ? (
            <>
              <Button
                onClick={() => setEditing(false)}
                className="bg-gray-400 text-white hover:bg-gray-500"
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
            <>
              <Button
                onClick={() => setEditing(true)}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                ✏️ Chỉnh sửa
              </Button>
              <Button
                onClick={handleToggleStatus}
                className={`${
                  staff.enabled
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                } text-white`}
              >
                {staff.enabled ? "⛔ Dừng hoạt động" : "✅ Kích hoạt lại"}
              </Button>
              <Button
                onClick={() => window.history.back()}
                className="bg-gray-400 text-white hover:bg-gray-500"
              >
                ← Quay lại
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
