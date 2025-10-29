// src/pages/equipment/EquipmentTypePage.jsx
import { useEffect, useMemo, useState } from "react";
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
import {
  Download,
  Search,
  Plus,
  XCircle,
  Loader2,
  Pencil,
  ArrowDownUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { exportToExcel } from "@/services/Files";

import CategoryMainService from "@/services/categoryMainService";
import CategoryTypeService from "@/services/categoryTypeService";
import useAuthRole from "@/hooks/useAuthRole";

import {
  HeaderFilter,
  ColumnVisibilityButton,
  useGlobalFilterController,
  getUniqueValues,
} from "@/components/common/ExcelTableTools";

const ITEMS_PER_PAGE = 8;

export default function EquipmentTypePage() {
  // ===== State chính =====
  const [types, setTypes] = useState([]);
  const [groups, setGroups] = useState([]);
  const [sortNewestFirst, setSortNewestFirst] = useState(true);

  // 🧩 State cho form & lỗi
  const [typeForm, setTypeForm] = useState({ name: "", desc: "", group: "" });
  const [editTypeId, setEditTypeId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(""); // 🔥 lỗi hiển thị trong form
  const [showForm, setShowForm] = useState(false);

  // Tìm kiếm / lọc / phân trang
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [goToPage, setGoToPage] = useState("");

  const { isTechnician } = useAuthRole();

  // Hiệu ứng NEW
  const [highlightedId, setHighlightedId] = useState(null);

  // ===== Load dữ liệu =====
  useEffect(() => {
    (async () => {
      try {
        const [typesData, groupsData] = await Promise.all([
          CategoryTypeService.getAllWithDisplayName(),
          CategoryMainService.getAll(),
        ]);
        setTypes(Array.isArray(typesData) ? typesData : []);
        setGroups(Array.isArray(groupsData) ? groupsData : []);
      } catch (err) {
        console.error("Lỗi load loại thiết bị:", err);
        toast.error("Không thể tải dữ liệu loại thiết bị.");
      }
    })();
  }, []);

  // ===== Z-index cho Select (Radix) để nổi lên trên =====
  // (đặt thẳng trong file như bạn yêu cầu)
  const popupFixCss = `
    [data-radix-popper-content-wrapper] { z-index: 9999 !important; }
  `;

  // ===== Hiển thị cột & Filters =====
  const controller = useGlobalFilterController();
  const [visibleColumns, setVisibleColumns] = useState({
    code: true,
    group: true,
    name: true,
    desc: true,
    created: true,
    updated: true,
  });
  const [filters, setFilters] = useState({
    code: [],
    group: [],
    name: [],
    desc: [],
    created: [],
    updated: [],
  });

  // Unique values cho HeaderFilter
  const uniqueValues = useMemo(
    () => ({
      code: getUniqueValues(types, (t) => t.id),
      group: getUniqueValues(types, (t) => t.main_name),
      name: getUniqueValues(types, (t) => t.name),
      desc: getUniqueValues(types, (t) => t.description),
      created: getUniqueValues(types, (t) =>
        new Date(t.created_at).toLocaleDateString("vi-VN")
      ),
      updated: getUniqueValues(types, (t) =>
        new Date(t.updated_at).toLocaleDateString("vi-VN")
      ),
    }),
    [types]
  );

  // ===== Lọc & Sắp xếp =====
  const filteredTypes = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    const filtered = (types || []).filter((t) => {
      const id = (t.id || "").toLowerCase();
      const name = (t.name || "").toLowerCase();
      const desc = (t.description || "").toLowerCase();
      const groupName = (t.main_name || "").toLowerCase();
      const createdStr = new Date(t.created_at).toLocaleDateString("vi-VN");
      const updatedStr = new Date(t.updated_at).toLocaleDateString("vi-VN");

      const matchSearch =
        !q ||
        id.includes(q) ||
        name.includes(q) ||
        desc.includes(q) ||
        groupName.includes(q);

      const matchCode =
        filters.code.length === 0 || filters.code.includes(t.id);
      const matchGroup =
        filters.group.length === 0 || filters.group.includes(t.main_name);
      const matchName =
        filters.name.length === 0 || filters.name.includes(t.name);
      const matchDesc =
        filters.desc.length === 0 || filters.desc.includes(t.description);
      const matchCreated =
        filters.created.length === 0 || filters.created.includes(createdStr);
      const matchUpdated =
        filters.updated.length === 0 || filters.updated.includes(updatedStr);

      return (
        matchSearch &&
        matchCode &&
        matchGroup &&
        matchName &&
        matchDesc &&
        matchCreated &&
        matchUpdated
      );
    });

    // sort theo created_at
    return filtered.sort((a, b) =>
      sortNewestFirst
        ? new Date(b.created_at) - new Date(a.created_at)
        : new Date(a.created_at) - new Date(b.created_at)
    );
  }, [types, filters, searchTerm, sortNewestFirst]);

  // Phân trang
  const totalPages = Math.max(
    1,
    Math.ceil(filteredTypes.length / ITEMS_PER_PAGE)
  );
  const currentData = filteredTypes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // ===== Validate =====

  // ✅ Kiểm tra form hợp lệ
  const isFormValid =
    typeForm.name.trim() && typeForm.group.trim() && typeForm.desc.trim();

  const handleSaveType = async () => {
    setFormError(""); // reset lỗi cũ

    if (!isFormValid) {
      setFormError("⚠️ Vui lòng nhập đầy đủ thông tin loại thiết bị!");
      return;
    }

    // 🚨 Kiểm tra trùng tên trong cùng nhóm
    const duplicate = types.find(
      (t) =>
        t.name.trim().toLowerCase() === typeForm.name.trim().toLowerCase() &&
        t.category_main_id === typeForm.group &&
        (!editTypeId || t.id !== editTypeId)
    );

    if (duplicate) {
      setFormError("🚫 Đã trùng! Vui lòng đổi Tên loại khác.");
      return;
    }

    setLoading(true);

    try {
      let newId = null;

      if (editTypeId) {
        // ✏️ Cập nhật loại
        await CategoryTypeService.update(editTypeId, {
          name: typeForm.name.trim(),
          description: typeForm.desc.trim(),
          category_main_id: typeForm.group,
        });
        newId = editTypeId;
        toast.success("✅ Cập nhật loại thành công!");
      } else {
        // ➕ Tạo loại mới
        const newItem = await CategoryTypeService.create({
          name: typeForm.name.trim(),
          description: typeForm.desc.trim(),
          category_main_id: typeForm.group,
        });
        newId = newItem.id;
        toast.success("✅ Tạo loại mới thành công!");
      }

      // 🔄 Làm mới danh sách & sắp xếp mới nhất lên đầu
      const updated = await CategoryTypeService.getAllWithDisplayName();
      const sorted = updated.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setTypes(sorted);

      setHighlightedId(newId);
      setTimeout(() => setHighlightedId(null), 30000);

      // 🧹 Reset form
      setTypeForm({ name: "", desc: "", group: "" });
      setEditTypeId(null);
      setShowForm(false);
    } catch (err) {
      console.error("❌ Lỗi khi lưu loại:", err);
      setFormError("❌ Đã xảy ra lỗi khi lưu loại thiết bị.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4 font-jakarta">
      <style>{popupFixCss}</style>
      <style>{`
        @keyframes rowPulse {
          0% { background-color: rgba(16,185,129,0.12); }
          50% { background-color: rgba(16,185,129,0.22); }
          100% { background-color: rgba(16,185,129,0.12); }
        }
        .animate-rowPulse { animation: rowPulse 1.2s ease-in-out infinite; }
      `}</style>

      {/* ===== Toolbar (giống trang Nhóm) ===== */}
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
        {/* === Nhóm trái: Tên + Tìm kiếm + Sắp xếp + Export === */}
        <div className="flex items-center gap-2">
          <h2 className="text-base md:text-lg font-semibold text-emerald-600 mr-2">
            Danh sách loại thiết bị
          </h2>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 h-9 w-64 border-gray-300 dark:border-gray-700 text-sm"
            />
          </div>

          {/* Nút Sắp xếp */}
          <Button
            onClick={() => setSortNewestFirst((p) => !p)}
            className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-3"
          >
            <ArrowDownUp size={16} />
            {sortNewestFirst ? "Mới → Cũ" : "Cũ → Mới"}
          </Button>

          {/* ✅ Nút Export Excel chuyển qua trái */}
          <Button
            onClick={() => {
              if (!filteredTypes || filteredTypes.length === 0) {
                toast.warning("⚠️ Không có dữ liệu để xuất!");
                return;
              }
              const data = filteredTypes.map((t) => ({
                "Mã loại": t.id,
                "Tên loại": t.name,
                Nhóm: t.main_name,
                "Mô tả": t.description,
                "Ngày nhập": new Date(t.created_at).toLocaleDateString("vi-VN"),
                "Ngày sửa": new Date(t.updated_at).toLocaleDateString("vi-VN"),
              }));
              exportToExcel(data, "Danh_sach_loai_thiet_bi");
              toast.success(`✅ Đã xuất ${data.length} bản ghi ra Excel!`);
            }}
            className="flex items-center gap-2 h-9 rounded-lg border border-gray-200 bg-white text-gray-700 font-medium shadow-sm hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-200"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </Button>
        </div>

        {/* === Nhóm phải: Thêm loại + Hiển thị cột === */}
        <div className="flex items-center gap-2">
          {!isTechnician && (
            <Button
              onClick={() => {
                setShowForm((v) => !v);
                setTypeForm({ name: "", desc: "", group: "" });
                setEditTypeId(null);
              }}
              className={`flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium rounded-lg transition-all ${
                showForm
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-emerald-500 hover:bg-emerald-600 text-white"
              }`}
            >
              {showForm ? (
                <>
                  <XCircle size={18} /> Hủy
                </>
              ) : (
                <>
                  <Plus size={18} /> Thêm loại
                </>
              )}
            </Button>
          )}
          <div className="h-9 flex items-center">
            <ColumnVisibilityButton
              visibleColumns={visibleColumns}
              setVisibleColumns={setVisibleColumns}
              labels={{
                code: "Mã loại",
                name: "Tên loại",
                group: "Nhóm",
                desc: "Mô tả",
                created: "Ngày nhập",
                updated: "Ngày sửa",
              }}
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            key="type-form"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mt-2 space-y-6 border border-emerald-200 dark:border-emerald-700"
          >
            <div className="grid grid-cols-2 gap-6">
              {/* Nhóm thiết bị */}
              <div className="flex flex-col space-y-1">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Nhóm thiết bị
                </label>
                <select
                  className="h-12 w-full border rounded-lg px-3 text-sm 
             bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200
             border-gray-300 dark:border-gray-700"
                  value={typeForm.group}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, group: e.target.value })
                  }
                >
                  <option value="">-- Chọn nhóm --</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tên loại */}
              <div className="flex flex-col space-y-1">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Tên loại
                </label>
                <Input
                  className="h-12"
                  placeholder="VD: Treadmill"
                  value={typeForm.name}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, name: e.target.value })
                  }
                />
              </div>

              {/* Mô tả */}
              <div className="flex flex-col space-y-1 col-span-2">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Mô tả loại
                </label>
                <Input
                  className="h-12"
                  placeholder="Nhập mô tả loại thiết bị..."
                  value={typeForm.desc}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, desc: e.target.value })
                  }
                />
              </div>

              {/* Nút lưu */}
              <div className="col-span-2 flex flex-col items-center">
                <Button
                  onClick={handleSaveType}
                  disabled={!isFormValid || loading}
                  className={`h-12 w-full md:w-1/2 text-base font-semibold rounded-lg flex items-center justify-center gap-2 transition-all duration-300 ${
                    isFormValid && !loading
                      ? "bg-gradient-to-r from-emerald-500 to-purple-500 text-white hover:opacity-90 shadow-lg"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : editTypeId ? (
                    "💾 Cập nhật"
                  ) : (
                    "+ Lưu loại"
                  )}
                </Button>

                {/* 🧨 Hiển thị lỗi ngay trong form */}
                {formError && (
                  <p className="text-red-500 text-sm font-medium text-center mt-3">
                    {formError}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Bảng dữ liệu ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[1000px] border border-gray-200 dark:border-gray-700">
            <TableHeader>
              <TableRow className="bg-gray-100 dark:bg-gray-700 text-sm font-semibold">
                <TableHead className="text-center border dark:border-gray-600">
                  #
                </TableHead>

                {visibleColumns.code && (
                  <TableHead className="border dark:border-gray-600">
                    <HeaderFilter
                      selfKey="code"
                      label="Mã loại"
                      values={uniqueValues.code}
                      selected={filters.code}
                      onChange={(v) => setFilters((p) => ({ ...p, code: v }))}
                      controller={controller}
                    />
                  </TableHead>
                )}

                {visibleColumns.name && (
                  <TableHead className="border dark:border-gray-600">
                    <HeaderFilter
                      selfKey="name"
                      label="Tên loại"
                      values={uniqueValues.name}
                      selected={filters.name}
                      onChange={(v) => setFilters((p) => ({ ...p, name: v }))}
                      controller={controller}
                    />
                  </TableHead>
                )}

                {visibleColumns.group && (
                  <TableHead className="border dark:border-gray-600">
                    <HeaderFilter
                      selfKey="group"
                      label="Nhóm"
                      values={uniqueValues.group}
                      selected={filters.group}
                      onChange={(v) => setFilters((p) => ({ ...p, group: v }))}
                      controller={controller}
                    />
                  </TableHead>
                )}

                {visibleColumns.desc && (
                  <TableHead className="border dark:border-gray-600">
                    <HeaderFilter
                      selfKey="desc"
                      label="Mô tả"
                      values={uniqueValues.desc}
                      selected={filters.desc}
                      onChange={(v) => setFilters((p) => ({ ...p, desc: v }))}
                      controller={controller}
                    />
                  </TableHead>
                )}

                {visibleColumns.created && (
                  <TableHead className="text-center border dark:border-gray-600">
                    <HeaderFilter
                      selfKey="created"
                      label="Ngày nhập"
                      values={uniqueValues.created}
                      selected={filters.created}
                      onChange={(v) =>
                        setFilters((p) => ({ ...p, created: v }))
                      }
                      controller={controller}
                    />
                  </TableHead>
                )}

                {visibleColumns.updated && (
                  <TableHead className="text-center border dark:border-gray-600">
                    <HeaderFilter
                      selfKey="updated"
                      label="Ngày sửa"
                      values={uniqueValues.updated}
                      selected={filters.updated}
                      onChange={(v) =>
                        setFilters((p) => ({ ...p, updated: v }))
                      }
                      controller={controller}
                    />
                  </TableHead>
                )}
                {!isTechnician && (
                  <TableHead className="text-center border dark:border-gray-600">
                    Hành động
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {currentData.map((t, idx) => (
                <motion.tr
                  key={t.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25 }}
                  onMouseEnter={() => {
                    // tắt hiệu ứng NEW khi rê chuột vào hàng đó
                    if (highlightedId === t.id) setHighlightedId(null);
                  }}
                  className={`text-sm transition ${
                    highlightedId === t.id
                      ? "animate-rowPulse"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <TableCell className="text-center border dark:border-gray-600">
                    {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                  </TableCell>

                  {visibleColumns.code && (
                    <TableCell className="border dark:border-gray-600">
                      {t.id}
                    </TableCell>
                  )}

                  {visibleColumns.name && (
                    <TableCell className="border dark:border-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="whitespace-nowrap">{t.name}</span>
                        {highlightedId === t.id && (
                          <span className="px-2 py-[1px] text-[10px] rounded bg-emerald-500 text-white font-semibold animate-pulse">
                            NEW
                          </span>
                        )}
                      </div>
                    </TableCell>
                  )}

                  {visibleColumns.group && (
                    <TableCell className="border dark:border-gray-600">
                      {t.main_name}
                    </TableCell>
                  )}

                  {visibleColumns.desc && (
                    <TableCell className="border dark:border-gray-600">
                      <span className="line-clamp-2">
                        {t.description || "—"}
                      </span>
                    </TableCell>
                  )}

                  {visibleColumns.created && (
                    <TableCell className="text-center border dark:border-gray-600">
                      {new Date(t.created_at).toLocaleDateString("vi-VN")}
                    </TableCell>
                  )}

                  {visibleColumns.updated && (
                    <TableCell className="text-center border dark:border-gray-600">
                      {new Date(t.updated_at).toLocaleDateString("vi-VN")}
                    </TableCell>
                  )}
                  {!isTechnician && (
                    <TableCell className="text-center border dark:border-gray-600">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => {
                          setTypeForm({
                            name: t.name,
                            desc: t.description,
                            group: t.category_main_id,
                          });
                          setEditTypeId(t.id);
                          setShowForm(true);
                        }}
                      >
                        <Pencil size={16} />
                      </Button>
                    </TableCell>
                  )}
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* ===== Pagination (kiểu Unit) ===== */}
        <div className="flex justify-between items-center border-t dark:border-gray-600 px-4 py-2 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center gap-2 text-sm">
            <span className="dark:text-gray-200">Đi đến:</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              className="w-14 px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
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
      </div>
    </div>
  );
}
