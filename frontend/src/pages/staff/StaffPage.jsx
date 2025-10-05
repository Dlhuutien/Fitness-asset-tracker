import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/buttonn";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Loader2 } from "lucide-react";
import Role from "@/components/common/Role";
import Branch from "@/components/common/Branch";
import Status from "@/components/common/Status";
import UserService from "@/services/UserService";
import { useNavigate } from "react-router-dom";

const ITEMS_PER_PAGE = 8;

export default function StaffPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("Tất cả");
  const [selectedStatus, setSelectedStatus] = useState("Tất cả");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [goToPage, setGoToPage] = useState("");
  const navigate = useNavigate();

  // 🧩 Fetch API
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await UserService.getAll();
        setUsers(data);
      } catch (err) {
        console.error("❌ Lỗi load user:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ✅ Role mapping
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

  // 🧭 Filters
  const allRoles = [
    "Tất cả",
    ...Array.from(new Set(users.flatMap((u) => u.roles || []))).map((r) =>
      convertRoleName(r)
    ),
  ];
  const statusFilters = ["Tất cả", "Đang làm", "Đã nghỉ"];

  // 🔍 Filtering logic
  const filteredUsers = users.filter((u) => {
    const name = u.attributes?.name || u.username;
    const email = u.attributes?.email || "";
    const branch = u.attributes?.["custom:branch_id"] || "";
    const roleVN = u.roles?.map((r) => convertRoleName(r)) || [];
    const status = u.enabled ? "Đang làm" : "Đã nghỉ";

    const matchSearch =
      name.toLowerCase().includes(search.toLowerCase()) ||
      email.toLowerCase().includes(search.toLowerCase()) ||
      branch.toLowerCase().includes(search.toLowerCase());
    const matchRole =
      selectedRole === "Tất cả" || roleVN.includes(selectedRole);
    const matchStatus =
      selectedStatus === "Tất cả" || status === selectedStatus;

    return matchSearch && matchRole && matchStatus;
  });

  // 📄 Pagination
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const currentData = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="p-6 space-y-6 transition-colors">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {loading ? "Đang tải..." : `${filteredUsers.length} Nhân viên`}
        </h1>
      </div>

      {/* Search */}
      <Input
        placeholder="🔍 Tìm kiếm theo tên, email hoặc chi nhánh..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setCurrentPage(1);
        }}
        className="dark:bg-gray-800 dark:text-gray-200 max-w-md"
      />

      {/* Filters */}
      <div className="flex flex-wrap justify-between items-center gap-2">
        {/* Vai trò */}
        <div className="flex flex-wrap gap-2">
          {allRoles.map((role) => (
            <Button
              key={role}
              variant={selectedRole === role ? "default" : "outline"}
              onClick={() => {
                setSelectedRole(role);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 text-sm rounded-lg transition-all font-medium ${
                selectedRole === role
                  ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-md"
                  : "bg-white dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              {role}
            </Button>
          ))}
        </div>

        {/* Trạng thái dropdown */}
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
                      setCurrentPage(1);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm font-medium transition-all ${
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

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-10 text-gray-500 dark:text-gray-300">
            <Loader2 className="animate-spin mr-2" /> Đang tải danh sách người dùng...
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table className="min-w-[950px] w-full border border-gray-200 dark:border-gray-600 table-auto">
                <TableHeader>
                  <TableRow className="bg-gray-100 dark:bg-gray-700 text-sm font-semibold">
                    <TableHead className="text-center border dark:border-gray-600 w-[40px]">#</TableHead>
                    <TableHead className="border dark:border-gray-600">Họ và tên</TableHead>
                    <TableHead className="border dark:border-gray-600">Email</TableHead>
                    <TableHead className="border dark:border-gray-600">Vai trò</TableHead>
                    <TableHead className="border dark:border-gray-600">Chi nhánh</TableHead>
                    <TableHead className="border dark:border-gray-600">Trạng thái</TableHead>
                    <TableHead className="border dark:border-gray-600">Ngày tạo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6 text-gray-500 dark:text-gray-400">
                        Không có nhân viên nào phù hợp.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentData.map((u, idx) => (
                      <TableRow
                        key={u.username}
                        onClick={() => navigate(`/app/staff/${u.username}`)}
                        className="hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-sm transition cursor-pointer"
                      >
                        <TableCell className="text-center border dark:border-gray-600">
                          {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                        </TableCell>
                        <TableCell className="border dark:border-gray-600">{u.attributes?.name || "—"}</TableCell>
                        <TableCell className="border dark:border-gray-600">{u.attributes?.email || "—"}</TableCell>
                        <TableCell className="border dark:border-gray-600">
                          {u.roles?.map((r) => (
                            <Role key={r} role={convertRoleName(r)} />
                          ))}
                        </TableCell>
                        <TableCell className="border dark:border-gray-600">
                          <Branch branch={u.attributes?.["custom:branch_id"] || "—"} />
                        </TableCell>
                        <TableCell className="border dark:border-gray-600">
                          <Status status={u.enabled ? "Đang làm" : "Đã nghỉ"} />
                        </TableCell>
                        <TableCell className="border dark:border-gray-600">
                          {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center border-t dark:border-gray-600 px-4 py-2 bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center gap-2 text-sm">
                <span className="dark:text-gray-200">Go to:</span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  className="w-16 px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                  value={goToPage}
                  onChange={(e) => setGoToPage(e.target.value)}
                />
                <Button
                  size="sm"
                  onClick={() => {
                    let page = parseInt(goToPage);
                    if (isNaN(page)) return;
                    if (page < 1) page = 1;
                    if (page > totalPages) page = totalPages;
                    setCurrentPage(page);
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-3 py-1"
                >
                  Go
                </Button>
              </div>

              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="dark:border-gray-600 dark:text-gray-200"
                >
                  «
                </Button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Button
                    key={i}
                    size="sm"
                    variant={currentPage === i + 1 ? "default" : "outline"}
                    className={`transition-all ${
                      currentPage === i + 1
                        ? "bg-emerald-500 text-white font-semibold"
                        : "hover:bg-gray-200 dark:hover:bg-gray-600 dark:border-gray-600 dark:text-gray-200"
                    }`}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="dark:border-gray-600 dark:text-gray-200"
                >
                  »
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
