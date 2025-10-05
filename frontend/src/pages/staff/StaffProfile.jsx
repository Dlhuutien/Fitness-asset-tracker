import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import Status from "@/components/common/Status";
import Role from "@/components/common/Role";
import Branch from "@/components/common/Branch";
import { Button } from "@/components/ui/buttonn";
import UserService from "@/services/UserService";

export default function StaffProfile() {
  const { id } = useParams();
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

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
      } catch (err) {
        console.error("❌ Lỗi khi load profile:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const convertRoleName = (r) => {
    switch (r) {
      case "super-admin":
        return "Người quản trị";
      case "admin":
        return "Người quản lý";
      case "operator":
        return "Nhân viên trực phòng";
      case "technician":
        return "Nhân viên kĩ thuật";
      default:
        return "Khác";
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      // (Tạm thời demo — chưa có API update user nên chỉ cập nhật local)
      setStaff((prev) => ({
        ...prev,
        attributes: {
          ...prev.attributes,
          ...formData,
        },
      }));
      setEditing(false);
      alert("✅ Lưu thay đổi tạm thời thành công (local only)");
    } catch (err) {
      console.error("❌ Lỗi khi lưu:", err);
      alert("Lưu thất bại!");
    }
  };

  if (loading) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400 mt-10">
        ⏳ Đang tải thông tin...
      </p>
    );
  }

  if (!staff) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-lg text-gray-500 dark:text-gray-400">
          ❌ Không tìm thấy nhân viên có username <strong>{id}</strong>
        </p>
      </div>
    );
  }

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
              {staff.roles?.map((r) => (
                <Role key={r} role={convertRoleName(r)} />
              ))}
              <Branch branch={formData.branch_id || "—"} />
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
          {[
            ["Email", "email"],
            ["Số điện thoại", "phone_number"],
            ["Giới tính", "gender"],
            ["Ngày sinh", "birthdate"],
            ["Chi nhánh", "branch_id"],
            ["Địa chỉ", "address", true],
          ].map(([label, field, wide]) => (
            <p key={field} className={wide ? "col-span-2" : ""}>
              <strong>{label}:</strong>{" "}
              {editing ? (
                <input
                  type="text"
                  value={formData[field]}
                  onChange={(e) => handleChange(field, e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-white"
                />
              ) : (
                formData[field] || "—"
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
            <>
              <Button
                onClick={() => setEditing(true)}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                ✏️ Chỉnh sửa
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
