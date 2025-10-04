import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/buttonn";
import Status from "@/components/common/Status";
import Role from "@/components/common/Role";
import Branch from "@/components/common/Branch";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

const roleFilters = [
  "Tất cả",
  "Người quản trị",
  "Người quản lý",
  "Nhân viên kĩ thuật",
  "Nhân viên trực phòng",
];

const statusFilters = ["Tất cả", "Đang làm", "Đã nghỉ"];

const hcmBranches = [
  "Chi nhánh Quận 1",
  "Chi nhánh Quận 3",
  "Chi nhánh Quận 7",
  "Chi nhánh Quận 10",
  "Chi nhánh Quận Gò Vấp",
];

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
  branch: hcmBranches[i % hcmBranches.length],
  department: i % 2 === 0 ? "Thiết bị" : "Marketing",
  email: `staff${i + 1}@fitx.com`,
  phone_number: `090${Math.floor(100000 + Math.random() * 899999)}`,
  created_at: `2025-0${(i % 9) + 1}-12`,
  avatar: `https://i.pravatar.cc/150?img=${i + 10}`,
}));

export default function StaffPage() {
  const [staff] = useState(initialStaff);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("Tất cả");
  const [selectedStatus, setSelectedStatus] = useState("Tất cả");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const navigate = useNavigate();

  const filteredStaff = staff.filter((s) => {
    const matchSearch = s.full_name.toLowerCase().includes(search.toLowerCase());
    const matchRole = selectedRole === "Tất cả" || s.role === selectedRole;
    const matchStatus = selectedStatus === "Tất cả" || s.status === selectedStatus;
    return matchSearch && matchRole && matchStatus;
  });

  return (
    <div className="p-6 space-y-6 transition-colors">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {filteredStaff.length} Nhân viên
        </h1>
        <Button className="bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg">
          + Thêm nhân viên
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="🔍 Tìm kiếm nhân viên..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="dark:bg-gray-800 dark:text-gray-200 max-w-md"
      />

      {/* Role filter + Status dropdown */}
      <div className="flex flex-wrap justify-between items-center gap-2">
        {/* Role buttons */}
        <div className="flex flex-wrap gap-2">
          {roleFilters.map((role) => (
            <Button
              key={role}
              variant={selectedRole === role ? "default" : "outline"}
              onClick={() => setSelectedRole(role)}
              className={`px-4 py-2 text-sm rounded-lg transition-all font-medium
                ${
                  selectedRole === role
                    ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md"
                    : "bg-white dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
            >
              {role}
            </Button>
          ))}
        </div>

        {/* Status dropdown — gradient style */}
        <div className="relative">
          <Button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-emerald-500 hover:to-cyan-500 transition-all duration-300 shadow-md"
          >
            <span>{selectedStatus}</span>
            <ChevronDown
              size={18}
              className={`transition-transform duration-200 ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
          </Button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.25 }}
                className="absolute right-0 mt-2 w-44 overflow-hidden rounded-lg shadow-lg border border-emerald-400/40 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 dark:border-emerald-500/30 z-50"
              >
                {statusFilters.map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setSelectedStatus(status);
                      setDropdownOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm font-medium transition-all
                      ${
                        selectedStatus === status
                          ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-white"
                          : "hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-800 dark:text-gray-100"
                      }`}
                  >
                    {status}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Staff cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {filteredStaff.map((s) => (
          <div
            key={s.id}
            onClick={() => {
              setSelectedId(s.id);
              navigate(`/app/staff/${s.id}`);
            }}
            className={`bg-white dark:bg-gray-900 rounded-xl shadow border transition cursor-pointer p-5 
              hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
              ${
                selectedId === s.id
                  ? "ring-2 ring-emerald-500"
                  : "border-gray-100 dark:border-gray-700"
              }`}
          >
            <div className="flex items-center gap-4">
              <img
                src={s.avatar}
                alt={s.full_name}
                className="w-16 h-16 rounded-full object-cover border"
              />
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                  {s.full_name}
                </p>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <Role role={s.role} />
                  <Branch branch={s.branch} />
                  <Status status={s.status} />
                </div>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <p>📌 Phòng: {s.department}</p>
              <p>📧 {s.email}</p>
              <p>📞 {s.phone_number}</p>
              <p>🗓 Ngày tạo: {s.created_at}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
