import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import Status from "@/components/common/Status";
import Role from "@/components/common/Role";
import Branch from "@/components/common/Branch";
import { Button } from "@/components/ui/buttonn";
import UserService from "@/services/UserService";
import { toast } from "sonner";
import userGymImg from "@/assets/user_gym.png";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import BranchService from "@/services/branchService";

// Mock list chi nhánh – có thể thay bằng BranchService.getAll()
const BRANCH_OPTIONS = [
  { id: "GV", name: "FitX Gym Gò Vấp" },
  { id: "Q3", name: "FitX Gym Quận 3" },
];

export default function StaffProfile() {
  const { id } = useParams();
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [newRole, setNewRole] = useState("");
  const [saveMessage, setSaveMessage] = useState({ text: "", type: "" });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmRoleOpen, setConfirmRoleOpen] = useState(false);
  const [branches, setBranches] = useState([]);

  // 🔹 Load user by username
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // Gọi song song 2 API
        const [user, branchList] = await Promise.all([
          UserService.getByUsername(id),
          BranchService.getAll(),
        ]);

        setStaff(user);
        setBranches(branchList || []);

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
        toast.error("Không thể tải dữ liệu nhân viên hoặc chi nhánh!");
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
      setSaveMessage({ text: "💾 Cập nhật thành công!", type: "success" });
      setTimeout(() => setSaveMessage({ text: "", type: "" }), 3000);
      setEditing(false);
    } catch (err) {
      console.error("❌ Lỗi khi admin cập nhật thông tin user:", err);
      toast.error(err.message || "Cập nhật thất bại!");
      setSaveMessage({ text: "Cập nhật thất bại!", type: "error" });
      setTimeout(() => setSaveMessage({ text: "", type: "" }), 3000);
    }
  };

  // Dừng hoặc kích hoạt user
  const handleToggleStatus = async () => {
    try {
      const enabled = !staff.enabled;
      const res = await UserService.changeStatus(id, enabled);
      toast.success(res.message || "Đã thay đổi trạng thái tài khoản");
      setSaveMessage({ text: "Đã thay đổi trạng thái!", type: "success" });
      setTimeout(() => setSaveMessage({ text: "", type: "" }), 3000);
      setStaff((prev) => ({ ...prev, enabled }));
    } catch (err) {
      toast.error(err.message || "Không thể thay đổi trạng thái!");
      setSaveMessage({ text: "Thay đổi trạng thái thất bại!", type: "error" });
      setTimeout(() => setSaveMessage({ text: "", type: "" }), 3000);
    }
  };

  // ✅ Đổi quyền
  const handleChangeRole = async () => {
    try {
      const res = await UserService.setRole(id, newRole);
      toast.success(res.message || "Đã cập nhật quyền");

      // Gọi lại getByUsername để cập nhật giao diện
      const updatedUser = await UserService.getByUsername(id);
      setStaff(updatedUser); // cập nhật state staff
      setNewRole(updatedUser.roles?.[0] || "");

      setSaveMessage({ text: "Cập nhật quyền thành công!", type: "success" });
      setTimeout(() => setSaveMessage({ text: "", type: "" }), 3000);
    } catch (err) {
      toast.error(err.message || "Lỗi khi cập nhật quyền!");
      setSaveMessage({ text: "Cập nhật quyền thất bại!", type: "error" });
      setTimeout(() => setSaveMessage({ text: "", type: "" }), 3000);
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
            src={userGymImg}
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
                  value={
                    formData.phone_number?.startsWith("+84")
                      ? formData.phone_number.slice(3)
                      : formData.phone_number?.startsWith("0")
                      ? formData.phone_number.slice(1)
                      : formData.phone_number || ""
                  }
                  onChange={(e) =>
                    handleChange(
                      "phone_number",
                      e.target.value.replace(/\D/g, "")
                    )
                  }
                  className="mt-1 w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-white"
                  placeholder="Nhập số"
                />
              </div>
            ) : formData.phone_number ? (
              formData.phone_number.startsWith("+84") ? (
                formData.phone_number
              ) : (
                "+84" + formData.phone_number.replace(/^0/, "")
              )
            ) : (
              "—"
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
                {branches.map((b) => (
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

        {/* Đổi quyền */}
        <div className="flex items-center gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <label className="font-medium text-gray-700 dark:text-gray-300">
            Quyền:
          </label>

          {/* Dropdown chọn quyền */}
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="px-3 py-2 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-white"
          >
            <option value="operator">Nhân viên trực phòng</option>
            <option value="technician">Nhân viên kĩ thuật</option>
            <option value="admin">Người quản lý</option>
          </select>

          {/* Nút xác nhận có AlertDialog */}
          <AlertDialog open={confirmRoleOpen} onOpenChange={setConfirmRoleOpen}>
            <AlertDialogTrigger asChild>
              <Button
                className="bg-amber-500 hover:bg-amber-600 text-white"
                disabled={!newRole || newRole === staff.roles?.[0]}
              >
                🔄 Cập nhật quyền
              </Button>
            </AlertDialogTrigger>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
            >
              <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận thay đổi quyền</AlertDialogTitle>
                  <AlertDialogDescription>
                    {newRole === staff.roles?.[0]
                      ? "Người dùng hiện đã có quyền này."
                      : `Bạn có chắc muốn đổi quyền của ${
                          staff.attributes?.name || staff.username
                        } thành "${convertRoleName(newRole)}"?`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      await handleChangeRole();
                      setConfirmRoleOpen(false);
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    Xác nhận
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </motion.div>
          </AlertDialog>
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
              <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    className={`${
                      staff.enabled
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-emerald-600 hover:bg-emerald-700"
                    } text-white`}
                  >
                    {staff.enabled ? "⛔ Dừng hoạt động" : "✅ Kích hoạt lại"}
                  </Button>
                </AlertDialogTrigger>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                >
                  <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {staff.enabled
                          ? "Xác nhận dừng hoạt động"
                          : "Kích hoạt lại tài khoản"}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {staff.enabled
                          ? "Bạn có chắc muốn dừng hoạt động tài khoản này? Người dùng sẽ không thể đăng nhập nữa."
                          : "Bạn có chắc muốn kích hoạt lại tài khoản này? Người dùng sẽ có thể đăng nhập trở lại."}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          await handleToggleStatus();
                          setConfirmOpen(false);
                        }}
                        className={`${
                          staff.enabled
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-emerald-600 hover:bg-emerald-700"
                        } text-white`}
                      >
                        {staff.enabled ? "Xác nhận dừng" : "Xác nhận kích hoạt"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </motion.div>
              </AlertDialog>
              <Button
                onClick={() => window.history.back()}
                className="bg-gray-400 text-white hover:bg-gray-500"
              >
                ← Quay lại
              </Button>
            </>
          )}
        </div>
        {saveMessage.text && (
          <p
            className={`text-sm mt-3 transition ${
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
    </div>
  );
}
