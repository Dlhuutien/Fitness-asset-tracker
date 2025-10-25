import { useState, useEffect, useMemo, useRef } from "react";
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
import { ChevronDown, Loader2, Filter as FilterIcon } from "lucide-react";
import Role from "@/components/common/Role";
import Branch from "@/components/common/Branch";
import Status from "@/components/common/Status";
import UserService from "@/services/UserService";
import { useNavigate } from "react-router-dom";
import {
  HeaderFilter,
  ColumnVisibilityButton,
  getUniqueValues,
  useGlobalFilterController,
} from "@/components/common/ExcelTableTools";
import DatePicker from "react-datepicker";
import { vi } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import AuthService from "@/services/AuthService";
import AddStaffPage from "@/pages/staff/AddStaffPage";
import { PlusCircle } from "lucide-react";

const ITEMS_PER_PAGE = 8;

/* ===== Bộ lọc ngày tạo ===== */
function DateRangeHeaderFilter({
  label,
  start,
  end,
  onChangeStart,
  onChangeEnd,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className="relative inline-flex items-center gap-1 select-none"
      ref={ref}
    >
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
        {label}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((p) => !p);
        }}
        className={`w-4 h-4 flex items-center justify-center opacity-70 hover:opacity-100 ${
          open ? "text-emerald-500" : "text-gray-400 dark:text-gray-300"
        }`}
      >
        <FilterIcon size={14} />
      </button>

      {open && (
        <div
          className="fixed z-[9999] mt-2 min-w-[280px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-2xl p-3"
          style={{
            top:
              ref.current?.getBoundingClientRect().bottom + window.scrollY + 8,
            left:
              ref.current?.getBoundingClientRect().left + window.scrollX - 40,
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <style>{`.react-datepicker-popper{z-index:999999!important}`}</style>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Khoảng ngày tạo
          </div>
          <div className="flex items-center gap-2">
            <DatePicker
              selected={start ? new Date(start) : null}
              onChange={(date) =>
                onChangeStart(date ? date.toISOString().split("T")[0] : "")
              }
              dateFormat="dd/MM/yyyy"
              locale={vi}
              placeholderText="dd/mm/yyyy"
              className="h-8 text-sm border rounded-md px-2 w-full dark:bg-gray-700 dark:text-white"
            />
            <span className="text-gray-400">—</span>
            <DatePicker
              selected={end ? new Date(end) : null}
              onChange={(date) =>
                onChangeEnd(date ? date.toISOString().split("T")[0] : "")
              }
              dateFormat="dd/MM/yyyy"
              locale={vi}
              placeholderText="dd/mm/yyyy"
              className="h-8 text-sm border rounded-md px-2 w-full dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => {
                onChangeStart("");
                onChangeEnd("");
                setOpen(false);
              }}
              className="px-3 py-1 text-sm border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Xóa
            </button>
            <button
              onClick={() => setOpen(false)}
              className="px-3 py-1 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded-md"
            >
              Áp dụng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== Trang chính ===== */
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
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const controller = useGlobalFilterController();
  const [openAddStaff, setOpenAddStaff] = useState(false);

  const [filters, setFilters] = useState({
    name: [],
    email: [],
    branch: [],
    status: [],
  });

  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    email: true,
    role: true,
    branch: true,
    status: true,
    createdAt: true,
  });

  // Fetch
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await UserService.getAll();

        // 👇 Lấy thông tin người hiện hành từ localStorage
        const auth = AuthService.getAuth();
        const currentUsername = auth?.username;

        // 👇 Lọc bỏ user hiện hành & super-admin
        const filtered = data.filter(
          (u) =>
            u.username !== currentUsername && // bỏ người đang đăng nhập
            !u.roles?.includes("super-admin") // bỏ tài khoản quản trị cấp cao
        );

        setUsers(filtered);
      } catch (err) {
        console.error("❌ Lỗi load user:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const convertRoleName = (r) =>
    ({
      admin: "Người quản lý",
      operator: "Nhân viên trực phòng",
      technician: "Nhân viên kĩ thuật",
    }[r] || "Khác");

  const allRoles = [
    "Tất cả",
    ...Array.from(new Set(users.flatMap((u) => u.roles || []))).map(
      convertRoleName
    ),
  ];
  const statusFilters = ["Tất cả", "Đang làm", "Đã nghỉ"];

  const uniqueValues = useMemo(() => {
    const list = users || [];
    return {
      name: getUniqueValues(list, (u) => u.attributes?.name || u.username),
      email: getUniqueValues(list, (u) => u.attributes?.email),
      branch: getUniqueValues(list, (u) => u.attributes?.["custom:branch_id"]),
      status: getUniqueValues(list, (u) =>
        u.enabled ? "Đang làm" : "Đã nghỉ"
      ),
    };
  }, [users]);

  const filteredUsers = users.filter((u) => {
    const name = u.attributes?.name || u.username;
    const email = u.attributes?.email || "";
    const branch = u.attributes?.["custom:branch_id"] || "";
    const status = u.enabled ? "Đang làm" : "Đã nghỉ";
    const roleVN = u.roles?.map(convertRoleName) || [];
    const created = new Date(u.createdAt);

    const matchSearch =
      name.toLowerCase().includes(search.toLowerCase()) ||
      email.toLowerCase().includes(search.toLowerCase()) ||
      branch.toLowerCase().includes(search.toLowerCase());
    const matchRole =
      selectedRole === "Tất cả" || roleVN.includes(selectedRole);
    const matchStatus =
      selectedStatus === "Tất cả" || status === selectedStatus;
    const matchDate =
      (!dateStart || created >= new Date(dateStart)) &&
      (!dateEnd || created <= new Date(dateEnd));

    const matchFilter = (vals, val) => vals.length === 0 || vals.includes(val);

    return (
      matchSearch &&
      matchRole &&
      matchStatus &&
      matchDate &&
      matchFilter(filters.name, name) &&
      matchFilter(filters.email, email) &&
      matchFilter(filters.branch, branch) &&
      matchFilter(filters.status, status)
    );
  });

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const currentData = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h1 className="text-2xl font-bold">{filteredUsers.length} Nhân viên</h1>
      </div>

      <Input
        placeholder="🔍 Tìm kiếm theo tên, email hoặc chi nhánh..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {/* Filter */}
      <div className="flex flex-wrap items-center justify-between w-full gap-3">
        {/* Nhóm bộ lọc vai trò bên trái */}
        <div className="flex flex-wrap gap-2 items-center">
          {allRoles.map((role) => (
            <Button
              key={role}
              variant={selectedRole === role ? "default" : "outline"}
              onClick={() => setSelectedRole(role)}
              className={`px-4 py-2 text-sm rounded-lg ${
                selectedRole === role
                  ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white"
                  : "bg-white hover:bg-gray-100"
              }`}
            >
              {role}
            </Button>
          ))}
        </div>

        {/* Nhóm nút Thêm nhân viên + Hiển thị cột bên phải */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setOpenAddStaff((p) => !p)}
            className={`h-11 min-w-[120px] text-[13px] rounded-lg shadow flex items-center justify-center gap-1 whitespace-nowrap transition-all duration-200
    ${
      openAddStaff
        ? "bg-rose-500 hover:bg-rose-600 text-white"
        : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 text-white"
    }`}
          >
            {openAddStaff ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Hủy
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" /> Nhân viên
              </>
            )}
          </Button>

          <ColumnVisibilityButton
            visibleColumns={visibleColumns}
            setVisibleColumns={setVisibleColumns}
            labels={{
              name: "Họ và tên",
              email: "Email",
              role: "Vai trò",
              branch: "Chi nhánh",
              status: "Trạng thái",
              createdAt: "Ngày tạo",
            }}
          />
        </div>
      </div>

      <AnimatePresence>
        {openAddStaff && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4 mb-4"
          >
            <AddStaffPage />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-10 text-gray-500">
            <Loader2 className="animate-spin mr-2" /> Đang tải danh sách...
          </div>
        ) : (
          <>
            <Table className="min-w-[950px]">
              <TableHeader>
                <TableRow className="bg-gray-100 text-sm font-semibold">
                  <TableHead>#</TableHead>
                  <TableHead>
                    <HeaderFilter
                      label="Họ và tên"
                      selfKey="name"
                      values={uniqueValues.name}
                      selected={filters.name}
                      onChange={(vals) =>
                        setFilters((f) => ({ ...f, name: vals }))
                      }
                      controller={controller}
                    />
                  </TableHead>
                  <TableHead>
                    <HeaderFilter
                      label="Email"
                      selfKey="email"
                      values={uniqueValues.email}
                      selected={filters.email}
                      onChange={(vals) =>
                        setFilters((f) => ({ ...f, email: vals }))
                      }
                      controller={controller}
                    />
                  </TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>
                    <DateRangeHeaderFilter
                      label="Ngày tạo"
                      start={dateStart}
                      end={dateEnd}
                      onChangeStart={setDateStart}
                      onChangeEnd={setDateEnd}
                    />
                  </TableHead>
                  <TableHead>
                    <HeaderFilter
                      label="Chi nhánh"
                      selfKey="branch"
                      values={uniqueValues.branch}
                      selected={filters.branch}
                      onChange={(vals) =>
                        setFilters((f) => ({ ...f, branch: vals }))
                      }
                      controller={controller}
                    />
                  </TableHead>
                  <TableHead>
                    <HeaderFilter
                      label="Trạng thái"
                      selfKey="status"
                      values={uniqueValues.status}
                      selected={filters.status}
                      onChange={(vals) =>
                        setFilters((f) => ({ ...f, status: vals }))
                      }
                      controller={controller}
                    />
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {currentData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  currentData.map((u, idx) => (
                    <TableRow
                      key={u.username}
                      onClick={() => navigate(`/app/staff/${u.username}`)}
                      className="hover:bg-emerald-50 cursor-pointer"
                    >
                      <TableCell>
                        {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                      </TableCell>
                      <TableCell>{u.attributes?.name || "—"}</TableCell>
                      <TableCell>{u.attributes?.email || "—"}</TableCell>
                      <TableCell>
                        {u.roles?.map((r) => (
                          <Role key={r} role={convertRoleName(r)} />
                        ))}
                      </TableCell>
                      <TableCell>
                        {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                      </TableCell>
                      <TableCell>
                        <Branch id={u.attributes?.["custom:branch_id"]} />
                      </TableCell>
                      <TableCell>
                        <Status status={u.enabled ? "Đang làm" : "Đã nghỉ"} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex justify-between items-center border-t px-4 py-2 bg-gray-50">
              <div className="flex items-center gap-2 text-sm">
                <span>Go to:</span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={goToPage}
                  onChange={(e) => setGoToPage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      let p = parseInt(goToPage);
                      if (!isNaN(p)) {
                        if (p < 1) p = 1;
                        if (p > totalPages) p = totalPages;
                        setCurrentPage(p);
                      }
                    }
                  }}
                  className="w-16 border rounded px-2 py-1 text-sm"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    let p = parseInt(goToPage);
                    if (!isNaN(p)) {
                      if (p < 1) p = 1;
                      if (p > totalPages) p = totalPages;
                      setCurrentPage(p);
                    }
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-3 py-1"
                >
                  Go
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  «
                </Button>
                <span className="text-sm">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
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
