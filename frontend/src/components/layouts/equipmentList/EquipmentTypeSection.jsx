import { useState, useMemo } from "react";
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
import { Download } from "lucide-react";
import { toast } from "sonner";
import { exportToExcel } from "@/services/Files";

import {
  Pencil,
  CheckCircle2,
  Search,
  Plus,
  XCircle,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CategoryTypeService from "@/services/categoryTypeService";
import {
  HeaderFilter,
  ColumnVisibilityButton,
  useGlobalFilterController,
  getUniqueValues,
} from "@/components/common/ExcelTableTools";

const ITEMS_PER_PAGE = 4;

export default function EquipmentTypeSection({ types, setTypes, groups }) {
  const [showForm, setShowForm] = useState(false);
  const [typeForm, setTypeForm] = useState({
    name: "",
    desc: "",
    group: "",
  });
  const [editTypeId, setEditTypeId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [successMsg, setSuccessMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedId, setHighlightedId] = useState(null);
  const [loading, setLoading] = useState(false);

  const controller = useGlobalFilterController();
  const [filters, setFilters] = useState({
    code: [],
    group: [],
    name: [],
    desc: [],
    created: [],
    updated: [],
  });

  const [visibleColumns, setVisibleColumns] = useState({
    code: true,
    group: true,
    name: true,
    desc: true,
    created: true,
    updated: true,
  });

  const isFormValid = typeForm.name && typeForm.group && typeForm.desc;

  // 💾 Lưu hoặc cập nhật loại
  const handleSaveType = async () => {
    if (!isFormValid) return;
    setLoading(true);
    try {
      let newId = null;

      if (editTypeId) {
        await CategoryTypeService.update(editTypeId, {
          name: typeForm.name,
          description: typeForm.desc,
          category_main_id: typeForm.group,
        });
        newId = editTypeId;
        setSuccessMsg("✅ Cập nhật loại thành công!");
      } else {
        const newItem = await CategoryTypeService.create({
          name: typeForm.name,
          description: typeForm.desc,
          category_main_id: typeForm.group,
        });
        newId = newItem.id;
        setSuccessMsg("✅ Tạo loại thành công!");
      }

      const updated = await CategoryTypeService.getAllWithDisplayName();
      setTypes(updated);

      // 🟢 Bôi đen dòng vừa thêm hoặc sửa
      setHighlightedId(newId);

      // 🧹 Reset form
      setTypeForm({ name: "", desc: "", group: "" });
      setEditTypeId(null);
      setShowForm(false);
      setTimeout(() => setSuccessMsg(""), 2000);

      // ⏳ Tự bỏ bôi đen sau 30 giây
      setTimeout(() => setHighlightedId(null), 30000);
    } catch (err) {
      console.error("❌ Lỗi khi lưu categoryType:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔍 Unique values cho dropdown filter
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

  // 🎯 Lọc dữ liệu
  const filteredTypes = useMemo(() => {
    return (types || []).filter((t) => {
      const matchSearch =
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.main_name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCode =
        filters.code.length === 0 || filters.code.includes(t.id);
      const matchGroup =
        filters.group.length === 0 || filters.group.includes(t.main_name);
      const matchName =
        filters.name.length === 0 || filters.name.includes(t.name);
      const matchDesc =
        filters.desc.length === 0 || filters.desc.includes(t.description);
      const matchCreated =
        filters.created.length === 0 ||
        filters.created.includes(
          new Date(t.created_at).toLocaleDateString("vi-VN")
        );
      const matchUpdated =
        filters.updated.length === 0 ||
        filters.updated.includes(
          new Date(t.updated_at).toLocaleDateString("vi-VN")
        );

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
  }, [types, filters, searchTerm]);

  const totalPages = Math.ceil(filteredTypes.length / ITEMS_PER_PAGE);
  const currentData = filteredTypes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 space-y-6">
      {/* 🔘 Nút toggle form */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-emerald-600">
          Danh sách loại thiết bị
        </h2>
        <Button
          onClick={() => {
            setShowForm((prev) => !prev);
            setTypeForm({ name: "", desc: "", group: "" });
            setEditTypeId(null);
          }}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white"
        >
          {showForm ? (
            <>
              <XCircle size={18} /> {editTypeId ? "Hủy cập nhật" : "Hủy thêm"}
            </>
          ) : (
            <>
              <Plus size={18} /> Thêm loại
            </>
          )}
        </Button>
      </div>

      {/* 🧾 Form thêm loại - ẩn/hiện bằng AnimatePresence */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            key="type-form"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mt-2 space-y-6"
          >
            <div className="grid grid-cols-2 gap-6">
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

              <Input
                className="h-12"
                placeholder="Tên loại VD: Treadmill"
                value={typeForm.name}
                onChange={(e) =>
                  setTypeForm({ ...typeForm, name: e.target.value })
                }
              />

              <Input
                className="h-12"
                placeholder="Mô tả loại"
                value={typeForm.desc}
                onChange={(e) =>
                  setTypeForm({ ...typeForm, desc: e.target.value })
                }
              />

              <div className="col-span-2 flex justify-center">
                <Button
                  onClick={handleSaveType}
                  disabled={!isFormValid || loading}
                  className={`h-12 w-1/2 text-base font-semibold rounded-lg flex items-center justify-center gap-2 transition-all duration-300 ${
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
              </div>
            </div>

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center text-emerald-600 gap-2 font-medium mt-2"
              >
                <CheckCircle2 size={18} /> {successMsg}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3">
        {/* Nút Export Excel */}
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
              "Ngày tạo": new Date(t.created_at).toLocaleDateString("vi-VN"),
              "Ngày sửa": new Date(t.updated_at).toLocaleDateString("vi-VN"),
            }));

            exportToExcel(data, "Danh_sach_loai_thiet_bi");
            toast.success(`✅ Đã xuất ${data.length} bản ghi ra Excel!`);
          }}
          className="flex items-center gap-2 h-9 rounded-lg border border-gray-200 bg-white text-gray-700 font-medium shadow-sm hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 hover:-translate-y-[1px] transition-all duration-200"
        >
          <Download className="w-4 h-4" />
          Export Excel
        </Button>

        <ColumnVisibilityButton
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          labels={{
            code: "Mã loại",
            group: "Nhóm",
            name: "Tên loại",
            desc: "Mô tả",
            created: "Ngày nhập",
            updated: "Ngày sửa",
          }}
        />
      </div>

      {/* Table loại */}
      <div className="overflow-x-auto rounded-lg border dark:border-gray-700 shadow-inner">
        <Table className="min-w-full">
          <TableHeader className="bg-gray-50 dark:bg-gray-800">
            <TableRow className="[&>th]:py-3 [&>th]:px-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
              <TableHead>#</TableHead>
              {visibleColumns.code && (
                <TableHead>
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
              {visibleColumns.group && (
                <TableHead>
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
              {visibleColumns.name && (
                <TableHead>
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
              {visibleColumns.desc && (
                <TableHead>
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
                <TableHead>
                  <HeaderFilter
                    selfKey="created"
                    label="Ngày nhập"
                    values={uniqueValues.created}
                    selected={filters.created}
                    onChange={(v) => setFilters((p) => ({ ...p, created: v }))}
                    controller={controller}
                  />
                </TableHead>
              )}
              {visibleColumns.updated && (
                <TableHead>
                  <HeaderFilter
                    selfKey="updated"
                    label="Ngày sửa"
                    values={uniqueValues.updated}
                    selected={filters.updated}
                    onChange={(v) => setFilters((p) => ({ ...p, updated: v }))}
                    controller={controller}
                  />
                </TableHead>
              )}
              <TableHead className="text-center">Hành động</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {currentData.map((t, idx) => (
              <motion.tr
                key={t.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className={`transition-all duration-500 hover:bg-emerald-50 dark:hover:bg-gray-800 
                ${
                  highlightedId === t.id
                    ? "bg-emerald-100 dark:bg-emerald-800/40"
                    : ""
                }`}
              >
                <TableCell>
                  {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                </TableCell>
                {visibleColumns.code && <TableCell>{t.id}</TableCell>}
                {visibleColumns.group && <TableCell>{t.main_name}</TableCell>}
                {visibleColumns.name && <TableCell>{t.name}</TableCell>}
                {visibleColumns.desc && <TableCell>{t.description}</TableCell>}
                {visibleColumns.created && (
                  <TableCell>
                    {new Date(t.created_at).toLocaleDateString("vi-VN")}
                  </TableCell>
                )}
                {visibleColumns.updated && (
                  <TableCell>
                    {new Date(t.updated_at).toLocaleDateString("vi-VN")}
                  </TableCell>
                )}
                <TableCell className="text-center">
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
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center px-4 py-2 border-t dark:border-gray-700">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
        >
          «
        </Button>
        <span className="text-sm">
          Trang {currentPage}/{totalPages}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
        >
          »
        </Button>
      </div>
    </div>
  );
}
