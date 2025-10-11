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

const ITEMS_PER_PAGE = 8;

/* ========== Bộ lọc theo ngày tạo ========== */
function DateRangeHeaderFilter({ label, start, end, onChangeStart, onChangeEnd }) {
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
    <div className="relative inline-flex items-center gap-1 select-none" ref={ref}>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
        {label}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((p) => !p);
        }}
        className={`w-4 h-4 flex items-center justify-center opacity-70 hover:opacity-100 transition ${
          open ? "text-emerald-500" : "text-gray-400 dark:text-gray-300"
        }`}
        title="Lọc theo khoảng ngày"
      >
        <FilterIcon size={14} />
      </button>

      {open && (
        <div
          className="fixed z-[9999] mt-2 min-w-[280px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-2xl p-3 animate-in fade-in slide-in-from-top-2 duration-150"
          style={{
            top:
              ref.current?.getBoundingClientRect().bottom +
              window.scrollY +
              8,
            left:
              ref.current?.getBoundingClientRect().left +
              window.scrollX -
              40,
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <style>
            {`
              .react-datepicker-popper {
                z-index: 999999 !important;
              }
              .react-datepicker__header {
                padding-top: 4px !important;
                padding-bottom: 0 !important;
                background-color: #fff !important;
                border-bottom: 1px solid #e5e7eb !important;
              }
              .react-datepicker__current-month {
                font-size: 14px !important;
                font-weight: 600 !important;
                padding: 2px 0 !important;
              }
              .react-datepicker__day-name,
              .react-datepicker__day {
                width: 2rem !important;
                line-height: 2rem !important;
                margin: 0.1rem !important;
                font-size: 13px !important;
              }
            `}
          </style>

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
              popperClassName="react-datepicker-popper"
              popperPlacement="bottom-start"
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
              popperClassName="react-datepicker-popper"
              popperPlacement="bottom-end"
            />
          </div>

          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => {
                onChangeStart("");
                onChangeEnd("");
                setOpen(false);
              }}
              className="px-3 py-1 text-sm border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200"
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

/* ========== Trang chính ========== */
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
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  const controller = useGlobalFilterController();

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

  const allRoles = [
    "Tất cả",
    ...Array.from(new Set(users.flatMap((u) => u.roles || []))).map((r) =>
      convertRoleName(r)
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
    const roleVN = u.roles?.map((r) => convertRoleName(r)) || [];
    const status = u.enabled ? "Đang làm" : "Đã nghỉ";
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

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const currentData = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="p-6 space-y-6 transition-colors">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {loading ? "Đang tải..." : `${filteredUsers.length} Nhân viên`}
        </h1>
      </div>

      <Input
        placeholder="🔍 Tìm kiếm theo tên, email hoặc chi nhánh..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setCurrentPage(1);
        }}
        className="dark:bg-gray-800 dark:text-gray-200 max-w-md"
      />

      {/* Bộ lọc */}
      <div className="flex flex-wrap items-center gap-3 w-full">
        <div className="flex flex-wrap gap-2 items-center">
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

          <div className="ml-5">
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
      </div>

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
                  <TableRow className="bg-gray-100 dark:bg-gray-700 text-sm font-semibold h-[48px] align-middle">
                    <TableHead className="text-center border dark:border-gray-600 w-[40px]">
                      #
                    </TableHead>
                    {visibleColumns.name && (
                      <TableHead>
                        <HeaderFilter
                          selfKey="name"
                          label="Họ và tên"
                          values={uniqueValues.name}
                          selected={filters.name}
                          onChange={(vals) =>
                            setFilters((f) => ({ ...f, name: vals }))
                          }
                          controller={controller}
                        />
                      </TableHead>
                    )}
                    {visibleColumns.email && (
                      <TableHead>
                        <HeaderFilter
                          selfKey="email"
                          label="Email"
                          values={uniqueValues.email}
                          selected={filters.email}
                          onChange={(vals) =>
                            setFilters((f) => ({ ...f, email: vals }))
                          }
                          controller={controller}
                        />
                      </TableHead>
                    )}
                    {visibleColumns.role && <TableHead>Vai trò</TableHead>}
                    {visibleColumns.createdAt && (
                      <TableHead>
                        <DateRangeHeaderFilter
                          label="Ngày tạo"
                          start={dateStart}
                          end={dateEnd}
                          onChangeStart={setDateStart}
                          onChangeEnd={setDateEnd}
                        />
                      </TableHead>
                    )}
                    {visibleColumns.branch && (
                      <TableHead>
                        <HeaderFilter
                          selfKey="branch"
                          label="Chi nhánh"
                          values={uniqueValues.branch}
                          selected={filters.branch}
                          onChange={(vals) =>
                            setFilters((f) => ({ ...f, branch: vals }))
                          }
                          controller={controller}
                        />
                      </TableHead>
                    )}
                    {visibleColumns.status && (
                      <TableHead>
                        <HeaderFilter
                          selfKey="status"
                          label="Trạng thái"
                          values={uniqueValues.status}
                          selected={filters.status}
                          onChange={(vals) =>
                            setFilters((f) => ({ ...f, status: vals }))
                          }
                          controller={controller}
                        />
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {currentData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-6 text-gray-500 dark:text-gray-400"
                      >
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
                        {visibleColumns.name && (
                          <TableCell>{u.attributes?.name || "—"}</TableCell>
                        )}
                        {visibleColumns.email && (
                          <TableCell>{u.attributes?.email || "—"}</TableCell>
                        )}
                        {visibleColumns.role && (
                          <TableCell>
                            {u.roles?.map((r) => (
                              <Role key={r} role={convertRoleName(r)} />
                            ))}
                          </TableCell>
                        )}
                        {visibleColumns.createdAt && (
                          <TableCell>
                            {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                          </TableCell>
                        )}
                        {visibleColumns.branch && (
                          <TableCell>
                            <Branch
                              branch={u.attributes?.["custom:branch_id"] || "—"}
                            />
                          </TableCell>
                        )}
                        {visibleColumns.status && (
                          <TableCell>
                            <Status
                              status={u.enabled ? "Đang làm" : "Đã nghỉ"}
                            />
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* ✅ Phân trang + Go To */}
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        let page = parseInt(goToPage);
                        if (!isNaN(page)) {
                          if (page < 1) page = 1;
                          if (page > totalPages) page = totalPages;
                          setCurrentPage(page);
                        }
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      let page = parseInt(goToPage);
                      if (!isNaN(page)) {
                        if (page < 1) page = 1;
                        if (page > totalPages) page = totalPages;
                        setCurrentPage(page);
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
                  <span className="text-sm dark:text-gray-100">
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}
