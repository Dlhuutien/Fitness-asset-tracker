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
import {
  Plus,
  XCircle,
  Pencil,
  ImagePlus,
  Loader2,
  CheckCircle2,
  Search,
  Download,
  ArrowDownUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import CategoryMainService from "@/services/categoryMainService";
import {
  HeaderFilter,
  ColumnVisibilityButton,
  useGlobalFilterController,
  getUniqueValues,
} from "@/components/common/ExcelTableTools";
import { exportToExcel } from "@/services/Files";

const ITEMS_PER_PAGE = 8;

export default function EquipmentGroupPage() {
  const [groups, setGroups] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [groupForm, setGroupForm] = useState({
    name: "",
    desc: "",
    img: null,
    preview: "",
  });
  const [editGroupId, setEditGroupId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [highlightedId, setHighlightedId] = useState(null);
  const [search, setSearch] = useState("");
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [goToPage, setGoToPage] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const controller = useGlobalFilterController();
  const [filters, setFilters] = useState({
    code: [],
    name: [],
    desc: [],
    created: [],
    updated: [],
  });

  const [visibleColumns, setVisibleColumns] = useState({
    image: true,
    code: true,
    name: true,
    desc: true,
    created: true,
    updated: true,
  });

  // 🧭 Load nhóm thiết bị
  useEffect(() => {
    (async () => {
      try {
        const data = await CategoryMainService.getAll();
        setGroups(data);
      } catch (err) {
        toast.error("Không thể tải danh sách nhóm thiết bị!");
        console.error(err);
      }
    })();
  }, []);

  // 🖼 Upload ảnh
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const previewURL = URL.createObjectURL(file);
    setGroupForm((prev) => ({ ...prev, img: file, preview: previewURL }));
  };

  // 💾 Lưu nhóm
  const handleSaveGroup = async () => {
    if (!groupForm.name || !groupForm.desc) {
      setErrorMsg("⚠️ Vui lòng nhập đầy đủ thông tin nhóm thiết bị!");
      return;
    }

    // 🚨 Kiểm tra trùng tên nhóm (không phân biệt hoa thường)
    const duplicate = groups.find(
      (g) =>
        g.name.trim().toLowerCase() === groupForm.name.trim().toLowerCase() &&
        (!editGroupId || g.id !== editGroupId)
    );

    if (duplicate) {
      setErrorMsg("🚫 Đã trùng! Vui lòng đổi Tên nhóm khác.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      let newId = null;

      if (editGroupId) {
        await CategoryMainService.update(editGroupId, {
          name: groupForm.name.trim(),
          description: groupForm.desc.trim(),
          image: groupForm.img || null,
        });
        newId = editGroupId;
        toast.success("✅ Cập nhật nhóm thành công!");
      } else {
        const created = await CategoryMainService.create({
          name: groupForm.name.trim(),
          description: groupForm.desc.trim(),
          image: groupForm.img || null,
        });
        newId = created.id;
        toast.success("✅ Thêm nhóm mới thành công!");
      }

      const updated = await CategoryMainService.getAll();
      const sorted = updated.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setGroups(sorted);
      setHighlightedId(newId);

      setShowForm(false);
      setGroupForm({ name: "", desc: "", img: null, preview: "" });
      setEditGroupId(null);

      setTimeout(() => setHighlightedId(null), 30000);
    } catch (err) {
      console.error(err);
      setErrorMsg("❌ Có lỗi xảy ra khi lưu nhóm thiết bị.");
    } finally {
      setLoading(false);
    }
  };

  // 🧩 Bộ lọc & tìm kiếm
  const uniqueValues = useMemo(
    () => ({
      code: getUniqueValues(groups, (g) => g.id),
      name: getUniqueValues(groups, (g) => g.name),
      desc: getUniqueValues(groups, (g) => g.description),
      created: getUniqueValues(groups, (g) =>
        new Date(g.created_at).toLocaleDateString("vi-VN")
      ),
      updated: getUniqueValues(groups, (g) =>
        new Date(g.updated_at).toLocaleDateString("vi-VN")
      ),
    }),
    [groups]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (groups || [])
      .filter((g) => {
        const matchSearch =
          !q ||
          g.id.toLowerCase().includes(q) ||
          g.name.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q);

        const matchCode =
          filters.code.length === 0 || filters.code.includes(g.id);
        const matchName =
          filters.name.length === 0 || filters.name.includes(g.name);
        const matchDesc =
          filters.desc.length === 0 || filters.desc.includes(g.description);
        const matchCreated =
          filters.created.length === 0 ||
          filters.created.includes(
            new Date(g.created_at).toLocaleDateString("vi-VN")
          );
        const matchUpdated =
          filters.updated.length === 0 ||
          filters.updated.includes(
            new Date(g.updated_at).toLocaleDateString("vi-VN")
          );

        return (
          matchSearch &&
          matchCode &&
          matchName &&
          matchDesc &&
          matchCreated &&
          matchUpdated
        );
      })
      .sort((a, b) =>
        sortNewestFirst
          ? new Date(b.created_at) - new Date(a.created_at)
          : new Date(a.created_at) - new Date(b.created_at)
      );
  }, [groups, filters, search, sortNewestFirst]);

  // 🧭 Phân trang
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentData = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const isFormValid = groupForm.name && groupForm.desc;

  return (
    <div className="p-4 space-y-4 font-jakarta">
      {/* <style>{popupFixCss}</style> */}
      <style>{`
  table {
    border-collapse: collapse;
    width: 100%;
  }

  th, td {
    border: 1px solid rgba(209, 213, 219, 1); /* border-gray-300 */
  }

  .dark th, .dark td {
    border-color: rgba(75, 85, 99, 1); /* border-gray-600 trong dark mode */
  }
`}</style>

      <style>{`
        @keyframes rowPulse {
          0% { background-color: rgba(16,185,129,0.12); }
          50% { background-color: rgba(16,185,129,0.22); }
          100% { background-color: rgba(16,185,129,0.12); }
        }
        .animate-rowPulse { animation: rowPulse 1.2s ease-in-out infinite; }
      `}</style>
{/* ===== Toolbar ===== */}
<div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
  {/* ==== Nhóm trái: Tìm kiếm + Sắp xếp + Export Excel ==== */}
  <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base md:text-lg font-semibold text-emerald-600 mr-2">
            Danh sách nhóm thiết bị
          </h2>
    <Input
      placeholder="🔍 Tìm nhóm..."
      value={search}
      onChange={(e) => {
        setSearch(e.target.value);
        setCurrentPage(1);
      }}
      className="h-9 w-52 border-gray-300 dark:border-gray-700 text-sm"
    />

    <Button
      onClick={() => setSortNewestFirst((p) => !p)}
      className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-3"
    >
      <ArrowDownUp size={16} />
      {sortNewestFirst ? "Mới → Cũ" : "Cũ → Mới"}
    </Button>

    <Button
      onClick={() => {
        if (!filtered || filtered.length === 0) {
          toast.warning("⚠️ Không có dữ liệu để xuất!");
          return;
        }

        const data = filtered.map((g) => ({
          "Mã nhóm": g.id,
          "Tên nhóm": g.name,
          "Mô tả": g.description,
          "Ngày nhập": new Date(g.created_at).toLocaleDateString("vi-VN"),
          "Ngày sửa": new Date(g.updated_at).toLocaleDateString("vi-VN"),
        }));

        exportToExcel(data, "Danh_sach_nhom_thiet_bi");
        toast.success(`✅ Đã xuất ${data.length} nhóm ra Excel!`);
      }}
      className="flex items-center gap-2 h-9 rounded-lg border border-gray-200 bg-white text-gray-700 font-medium shadow-sm hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-200"
    >
      <Download className="w-4 h-4" />
      Export Excel
    </Button>
  </div>

  {/* ==== Nhóm phải: Thêm nhóm + Hiển thị cột ==== */}
  <div className="flex items-center gap-2">
    <Button
      onClick={() => {
        setShowForm((prev) => !prev);
        setGroupForm({ name: "", desc: "", img: null, preview: "" });
        setEditGroupId(null);
        setErrorMsg("");
      }}
      className={`flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium rounded-lg transition-all ${
        showForm
          ? "bg-red-500 hover:bg-red-600 text-white"
          : "bg-emerald-500 hover:bg-emerald-600 text-white"
      }`}
    >
      {showForm ? (
        <>
          <XCircle size={16} /> Hủy
        </>
      ) : (
        <>
          <Plus size={16} /> Thêm nhóm
        </>
      )}
    </Button>

    <div className="h-9 flex items-center">
      <ColumnVisibilityButton
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns}
        labels={{
          image: "Ảnh",
          code: "Mã nhóm",
          name: "Tên nhóm",
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
            key="group-form"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mt-2 border border-gray-200 dark:border-gray-700 shadow"
          >
            <div className="grid grid-cols-2 gap-10 items-start">
              {/* === CỘT TRÁI === */}
              <div className="space-y-6">
                {/* Tên nhóm */}
                <div className="flex flex-col space-y-1">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Tên nhóm
                  </label>
                  <Input
                    placeholder="VD: Cardio"
                    value={groupForm.name}
                    onChange={(e) =>
                      setGroupForm({ ...groupForm, name: e.target.value })
                    }
                    className="h-12"
                  />
                </div>

                {/* Mô tả nhóm */}
                <div className="flex flex-col space-y-1">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Mô tả nhóm
                  </label>
                  <Input
                    placeholder="Nhập mô tả nhóm thiết bị..."
                    value={groupForm.desc}
                    onChange={(e) =>
                      setGroupForm({ ...groupForm, desc: e.target.value })
                    }
                    className="h-12"
                  />
                </div>

                {/* Nút Lưu */}
                <div className="flex justify-center flex-col items-center gap-2">
                  <Button
                    onClick={handleSaveGroup}
                    disabled={!isFormValid || loading}
                    className={`h-12 w-1/2 font-semibold flex items-center justify-center gap-2 transition-all ${
                      isFormValid && !loading
                        ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:opacity-90 shadow-lg"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : editGroupId ? (
                      "💾 Cập nhật"
                    ) : (
                      "+ Lưu nhóm"
                    )}
                  </Button>

                  {/* 🧨 Hiển thị lỗi ngay trong form */}
                  {errorMsg && (
                    <p className="text-red-500 text-sm font-medium text-center mt-1">
                      {errorMsg}
                    </p>
                  )}
                  {successMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center text-emerald-600 gap-2 font-medium mt-1"
                    >
                      <CheckCircle2 size={18} /> {successMsg}
                    </motion.div>
                  )}
                </div>
              </div>

              {/* === CỘT PHẢI === */}
              <div className="flex flex-col items-center">
                <label
                  htmlFor="group-upload"
                  className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl w-72 h-72 cursor-pointer overflow-hidden hover:border-emerald-500 hover:shadow-xl transition group"
                >
                  {groupForm.preview ? (
                    <motion.img
                      key={groupForm.preview}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.4 }}
                      src={groupForm.preview}
                      alt="preview"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-gray-500">
                      <ImagePlus
                        size={48}
                        className="text-emerald-500 mb-1 group-hover:scale-110 transition"
                      />
                      <p className="text-sm font-medium group-hover:text-emerald-500">
                        Ảnh nhóm
                      </p>
                    </div>
                  )}
                  <input
                    id="group-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bảng danh sách */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="border border-gray-300 dark:border-gray-700 w-full border-collapse table-auto">
            <TableHeader>
              <TableRow className="bg-gray-100 dark:bg-gray-700 text-sm font-semibold">
                <TableHead className="text-center border dark:border-gray-600">
                  #
                </TableHead>
                {visibleColumns.image && (
                  <TableHead className="border dark:border-gray-600 text-center">
                    Ảnh
                  </TableHead>
                )}
                {visibleColumns.code && (
                  <TableHead className="border dark:border-gray-600">
                    <HeaderFilter
                      selfKey="code"
                      label="Mã nhóm"
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
                      label="Tên nhóm"
                      values={uniqueValues.name}
                      selected={filters.name}
                      onChange={(v) => setFilters((p) => ({ ...p, name: v }))}
                      controller={controller}
                    />
                  </TableHead>
                )}
                {visibleColumns.desc && (
                  <TableHead className="border dark:border-gray-600">
                    Mô tả
                  </TableHead>
                )}
                {visibleColumns.created && (
                  <TableHead className="border dark:border-gray-600">
                    Ngày nhập
                  </TableHead>
                )}
                {visibleColumns.updated && (
                  <TableHead className="border dark:border-gray-600">
                    Ngày sửa
                  </TableHead>
                )}
                <TableHead className="text-center border dark:border-gray-600">
                  Hành động
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {currentData.map((g, idx) => (
                <motion.tr
                  key={g.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  onMouseEnter={() => {
                    if (highlightedId === g.id) setHighlightedId(null);
                  }}
                  className={`text-sm transition-all ${
                    highlightedId === g.id
                      ? "animate-rowPulse"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <TableCell className="text-center">
                    {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                  </TableCell>

                  {visibleColumns.image && (
                    <TableCell className="text-center">
                      {g.image ? (
                        <img
                          src={g.image}
                          alt={g.name}
                          className="mx-auto h-9 w-auto max-w-[50px] object-contain"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">No img</span>
                      )}
                    </TableCell>
                  )}

                  {visibleColumns.code && (
                    <TableCell className="border dark:border-gray-600">
                      {g.id}
                    </TableCell>
                  )}

                  {visibleColumns.name && (
                    <TableCell className="border dark:border-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="whitespace-nowrap">{g.name}</span>
                        {highlightedId === g.id && (
                          <span className="px-2 py-[1px] text-[10px] rounded bg-emerald-500 text-white font-semibold animate-pulse">
                            NEW
                          </span>
                        )}
                      </div>
                    </TableCell>
                  )}

                  {visibleColumns.desc && (
                    <TableCell className="border dark:border-gray-600">
                      <span className="line-clamp-2">
                        {g.description || "—"}
                      </span>
                    </TableCell>
                  )}

                  {visibleColumns.created && (
                    <TableCell className="text-center border dark:border-gray-600">
                      {new Date(g.created_at).toLocaleDateString("vi-VN")}
                    </TableCell>
                  )}

                  {visibleColumns.updated && (
                    <TableCell className="text-center border dark:border-gray-600">
                      {new Date(g.updated_at).toLocaleDateString("vi-VN")}
                    </TableCell>
                  )}

                  <TableCell className="text-center border dark:border-gray-600">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        setGroupForm({
                          name: g.name,
                          desc: g.description,
                          img: g.image,
                          preview: g.image || "",
                        });
                        setEditGroupId(g.id);
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

        {/* ===== Pagination ===== */}
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
