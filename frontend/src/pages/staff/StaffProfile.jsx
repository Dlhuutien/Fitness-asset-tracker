import { useParams } from "react-router-dom";
import Status from "@/components/common/Status";
import Role from "@/components/common/Role";
import Branch from "@/components/common/Branch";
import { Button } from "@/components/ui/buttonn";
import { useState } from "react";

// Fake data
const initialStaff = Array.from({ length: 12 }).map((_, i) => ({
  id: `S${100 + i}`,
  full_name: `Nhân viên ${i + 1}`,
  role:
    i % 4 === 0
      ? "Người quản trị"
      : i % 4 === 1
      ? "Người quản lý"
      : i % 4 === 2
      ? "Nhân viên kĩ thuật"
      : "Nhân viên trực phòng",
  status: i % 3 === 0 ? "Đã nghỉ" : "Đang làm",
  branch:
    i % 3 === 0
      ? "Chi nhánh Quận 3"
      : i % 3 === 1
      ? "Chi nhánh Quận Gò Vấp"
      : "Chi nhánh Quận 7",
  gender: i % 2 === 0 ? "Nam" : "Nữ",
  date_of_birth: `199${i}-05-2${i}`,
  phone_number: `090${Math.floor(100000 + Math.random() * 899999)}`,
  email: `staff${i + 1}@fitx.com`,
  address: `${i + 10} Nguyễn Huệ, Quận ${i + 1}, TP.HCM`,
  created_at: `2025-0${(i % 9) + 1}-12`,
  updated_at: `2025-0${(i % 9) + 1}-20`,
  avatar: `https://i.pravatar.cc/150?img=${i + 10}`,
  department: i % 2 === 0 ? "Thiết bị" : "Marketing",
  position: i % 2 === 0 ? "Trưởng nhóm" : "Nhân viên",
  salary: `${10 + i} triệu`,
  assigned_by: "Admin FITX",
}));

export default function StaffProfile() {
  const { id } = useParams();
  const staffData = initialStaff.find((s) => s.id === id);

  const [staff, setStaff] = useState(staffData);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(staffData || {});

  if (!staff) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-lg text-gray-500 dark:text-gray-400">
          ❌ Không tìm thấy nhân viên với ID {id}
        </p>
      </div>
    );
  }

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setStaff(formData);
    setEditing(false);
  };

  return (
    <div className="p-6">
      <div className="bg-white dark:bg-[#121212] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 space-y-8 transition-colors">
        {/* Header */}
        <div className="flex items-center gap-6 border-b border-gray-200 dark:border-gray-700 pb-6">
          <img
            src={staff.avatar}
            alt={staff.full_name}
            className="w-32 h-32 rounded-full object-cover shadow-lg border-4 border-emerald-500"
          />
          <div>
            {editing ? (
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => handleChange("full_name", e.target.value)}
                className="px-3 py-2 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-lg font-bold dark:text-white"
              />
            ) : (
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {staff.full_name}
              </h2>
            )}
            <div className="flex gap-2 mt-2 flex-wrap">
              <Role role={staff.role} />
              <Branch branch={staff.branch} />
              <Status status={staff.status} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              ID: {staff.id} • Ngày tạo: {staff.created_at}
            </p>
          </div>
        </div>

        {/* Thông tin chi tiết */}
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-5 text-base text-gray-700 dark:text-gray-300">
          {[
            ["Giới tính", "gender"],
            ["Ngày sinh", "date_of_birth"],
            ["Số điện thoại", "phone_number"],
            ["Email", "email"],
            ["Phòng ban", "department"],
            ["Chức vụ", "position"],
            ["Lương", "salary"],
            ["Cập nhật gần nhất", "updated_at"],
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
                staff[field]
              )}
            </p>
          ))}
          <p>
            <strong>Người tạo:</strong> {staff.assigned_by}
          </p>
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
              <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
                💬 Gửi tin nhắn
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
