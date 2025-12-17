// src/pages/BranchListPage.jsx
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
  Building2,
  MapPin,
  RefreshCw,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Plus,
  Layers,
  Grid3X3,
  Pencil,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import PageContainer from "@/components/common/PageContainer";
import { toast } from "sonner";
import BranchService from "@/services/branchService";
import {
  ColumnVisibilityButton,
  HeaderFilter,
  getUniqueValues,
} from "@/components/common/ExcelTableTools";
import { AnimatePresence, motion } from "framer-motion";

const ITEMS_PER_PAGE = 6;

export default function BranchListPage() {
  const [branches, setBranches] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);

  /* ================= FORM ================= */
  const [form, setForm] = useState({
    id: "",
    name: "",
    address: "",
    floorCount: 1,
    areas: [], // { floor: number, name: string }
  });
  const [formError, setFormError] = useState("");

  /* ================= FILTERS (Excel) ================= */
  const [selectedId, setSelectedId] = useState([]);
  const [selectedName, setSelectedName] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState([]);

  /* ================= VISIBLE COLUMNS ================= */
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    name: true,
    address: true,
    floor: true,
    area: true,
    action: true,
  });

  /* ================= FETCH ================= */
  const fetchBranches = async () => {
    setLoading(true);
    try {
      const data = await BranchService.getAll();
      setBranches(Array.isArray(data) ? data : []);
    } catch {
      toast.error("❌ Không thể tải danh sách chi nhánh");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  /* ================= HANDLERS ================= */
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm({
      id: "",
      name: "",
      address: "",
      floorCount: 1,
      areas: [],
    });
    setEditMode(false);
    setFormError("");
  };

  const handleEdit = (branch) => {
    setEditMode(true);
    setShowForm(true);

    const floorCount = Number(branch?.floorCount) > 0 ? Number(branch.floorCount) : 1;
    const areas = Array.isArray(branch?.areas) ? branch.areas : [];

    setForm({
      id: branch?.id || "",
      name: branch?.name || "",
      address: branch?.address || "",
      floorCount,
      areas: areas
        .filter((a) => Number(a?.floor) >= 1 && Number(a?.floor) <= floorCount)
        .map((a) => ({
          floor: Number(a.floor) || 1,
          name: a?.name || "",
        })),
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ===== Areas helpers (layout mới) =====
  const addAreaToFloor = (floor) => {
    setForm((prev) => ({
      ...prev,
      areas: [...prev.areas, { floor, name: "" }],
    }));
  };

  const updateAreaName = (index, value) => {
    setForm((prev) => {
      const next = [...prev.areas];
      next[index] = { ...next[index], name: value };
      return { ...prev, areas: next };
    });
  };

  const removeArea = (index) => {
    setForm((prev) => ({
      ...prev,
      areas: prev.areas.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    const name = (form.name || "").trim();
    const address = (form.address || "").trim();
    const id = (form.id || "").trim();

    if (!name || !address) {
      setFormError("⚠️ Vui lòng nhập tên và địa chỉ chi nhánh!");
      return;
    }
    if (!editMode && !id) {
      setFormError("⚠️ Vui lòng nhập mã chi nhánh!");
      return;
    }

    // cleanup areas
    const cleanedAreas = (form.areas || [])
      .map((a) => ({
        floor: Number(a.floor) || 1,
        name: (a.name || "").trim(),
      }))
      .filter((a) => a.floor >= 1 && a.floor <= form.floorCount && a.name);

    setLoading(true);
    try {
      if (editMode) {
        await BranchService.update(form.id, {
          name,
          address,
          floorCount: form.floorCount,
          areas: cleanedAreas,
        });
        toast.success("✅ Cập nhật chi nhánh thành công");
      } else {
        await BranchService.create({
          id,
          name,
          address,
          floorCount: form.floorCount,
          areas: cleanedAreas,
        });
        toast.success("✅ Thêm chi nhánh mới thành công");
      }

      await fetchBranches();
      resetForm();
      setShowForm(false);
    } catch (err) {
      toast.error("❌ Lỗi lưu chi nhánh");
    } finally {
      setLoading(false);
    }
  };

  /* ================= FILTERING ================= */
  const filtered = useMemo(() => {
    const q = (search || "").toLowerCase().trim();
    return (branches || []).filter((b) => {
      const matchSearch =
        !q ||
        (b?.name || "").toLowerCase().includes(q) ||
        (b?.id || "").toLowerCase().includes(q) ||
        (b?.address || "").toLowerCase().includes(q);

      const matchId = selectedId.length === 0 || selectedId.includes(b.id);
      const matchName = selectedName.length === 0 || selectedName.includes(b.name);
      const matchAddress =
        selectedAddress.length === 0 || selectedAddress.includes(b.address);

      return matchSearch && matchId && matchName && matchAddress;
    });
  }, [branches, search, selectedId, selectedName, selectedAddress]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentData = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedId, selectedName, selectedAddress]);

  // ===== Summary (Tổng quan) =====
  const summaryRows = useMemo(() => {
    const rows = [];
    for (let f = 1; f <= (Number(form.floorCount) || 1); f++) {
      const names = (form.areas || [])
        .filter((a) => Number(a.floor) === f)
        .map((a) => (a.name || "").trim())
        .filter(Boolean);
      if (names.length > 0) rows.push({ floor: f, names });
    }
    return rows;
  }, [form.floorCount, form.areas]);

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* ================= HEADER ================= */}
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-emerald-600 flex items-center gap-2">
            <Building2 className="w-5 h-5" /> Quản lý chi nhánh
          </h1>
        </div>

        {/* ================= FILTER BAR ================= */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border flex flex-wrap items-center gap-3">
          <Input
            placeholder="🔍 Tìm theo tên / mã / địa chỉ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-72 h-10"
          />

          <Button
            variant="outline"
            onClick={() => {
              setSearch("");
              setSelectedId([]);
              setSelectedName([]);
              setSelectedAddress([]);
            }}
            className="h-10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>

          <div className="ml-auto flex items-center gap-2">
            <Button
              onClick={() => {
                setShowForm((v) => !v);
                resetForm();
              }}
              className={`h-10 px-4 ${
                showForm
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-emerald-500 hover:bg-emerald-600"
              } text-white`}
            >
              <span className="flex items-center gap-2">
                {showForm ? (
                  <>
                    <XCircle className="w-4 h-4" /> Hủy
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" /> Thêm mới
                  </>
                )}
              </span>
            </Button>

            <ColumnVisibilityButton
              visibleColumns={visibleColumns}
              setVisibleColumns={setVisibleColumns}
              labels={{
                id: "Mã",
                name: "Tên",
                address: "Địa chỉ",
                floor: "Số tầng",
                area: "Số khu",
                action: "Thao tác",
              }}
            />
          </div>
        </div>

        {/* ================= FORM ================= */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="bg-white dark:bg-gray-800 rounded-xl border shadow p-6 space-y-6"
            >
              {/* Thông tin */}
              <div>
                <h2 className="font-semibold text-emerald-600 mb-3">
                  {editMode ? "✏️ Sửa chi nhánh" : "➕ Thêm chi nhánh mới"}
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Mã chi nhánh"
                    value={form.id}
                    disabled={editMode}
                    onChange={(e) => handleChange("id", e.target.value)}
                  />
                  <Input
                    placeholder="Tên chi nhánh"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                  />
                  <Input
                    placeholder="Địa chỉ"
                    value={form.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    className="md:col-span-2"
                  />
                </div>
              </div>

              {/* Cấu trúc không gian */}
              <div>
                <h2 className="font-semibold text-emerald-600 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Cấu trúc không gian
                </h2>

                {/* Chọn số tầng */}
                <div className="space-y-2 mb-4">
                  <label className="font-semibold text-gray-800 dark:text-gray-200">
                    Chọn số tầng
                  </label>

                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      value={form.floorCount}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (!Number.isInteger(v) || v < 1) return;

                        setForm((prev) => ({
                          ...prev,
                          floorCount: v,
                          areas: (prev.areas || []).filter(
                            (a) => Number(a.floor) >= 1 && Number(a.floor) <= v
                          ),
                        }));
                      }}
                      className="w-32 h-10"
                    />
                    <span className="text-sm text-gray-500">
                      số tầng của chi nhánh
                    </span>
                  </div>
                </div>

                {/* Khu theo tầng (mỗi tầng 1 dòng + nút + màu) */}
                <div className="space-y-2">
                  <label className="font-semibold text-gray-800 dark:text-gray-200">
                    Khu theo từng tầng
                  </label>

                  <div className="mt-2 max-h-[420px] overflow-y-auto space-y-2 pr-2">
                    {Array.from({ length: form.floorCount }, (_, i) => i + 1).map(
                      (floor) => {
                        const areasInFloor = (form.areas || [])
                          .map((a, idx) => ({ ...a, _idx: idx }))
                          .filter((a) => Number(a.floor) === floor);

                        return (
                          <div
                            key={floor}
                            className="flex items-start gap-3 p-3 rounded-xl border bg-gray-50 dark:bg-gray-900"
                          >
                            <div className="w-24 shrink-0 pt-2 font-semibold text-emerald-700 dark:text-emerald-300">
                              Tầng {floor}
                            </div>

                            <div className="flex-1 overflow-x-auto">
                              <div className="flex items-center gap-2 min-h-[44px]">
                                {areasInFloor.length === 0 && (
                                  <span className="text-sm text-gray-400 italic">
                                    Chưa có khu — bấm + để thêm
                                  </span>
                                )}

                                {areasInFloor.map((a) => (
                                  <div
                                    key={a._idx}
                                    className="flex items-center gap-2 bg-white dark:bg-gray-800 border rounded-lg px-2 py-2"
                                  >
                                    <Input
                                      className="h-9 w-44"
                                      placeholder="Tên khu"
                                      value={a.name}
                                      onChange={(e) =>
                                        updateAreaName(a._idx, e.target.value)
                                      }
                                    />

                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-9 w-9"
                                      onClick={() => removeArea(a._idx)}
                                    >
                                      ✕
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* nút + có màu */}
                            <Button
                              size="icon"
                              className="h-10 w-10 shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white"
                              onClick={() => addAreaToFloor(floor)}
                              title="Thêm khu"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      }
                    )}
                  </div>

                  {/* ===== TỔNG QUAN (bạn bị mất, mình trả lại) ===== */}
                  <div className="mt-5 border rounded-xl bg-gray-50 dark:bg-gray-900 p-4">
                    <h3 className="font-semibold text-emerald-600 mb-2">
                      Tổng quan cấu trúc chi nhánh
                    </h3>

                    {summaryRows.length === 0 ? (
                      <div className="text-sm text-gray-400 italic">
                        Chưa có khu nào để tổng hợp.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {summaryRows.map((row) => (
                          <div
                            key={row.floor}
                            className="bg-white dark:bg-gray-800 border rounded-lg p-3"
                          >
                            {/* dòng đúng format bạn muốn */}
                            <div className="font-medium text-gray-800 dark:text-gray-200">
                              Tầng {row.floor} : {row.names.length} khu :{" "}
                              <span className="text-gray-600 dark:text-gray-300 font-normal">
                                {row.names.join(", ")}
                              </span>
                            </div>

                            {/* chips cho dễ nhìn */}
                            <div className="mt-2 flex flex-wrap gap-2">
                              {row.names.map((n, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200 text-sm"
                                >
                                  {n}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {formError && (
                <p className="text-red-500 text-sm font-medium">{formError}</p>
              )}

              {/* FOOTER */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                >
                  Hủy
                </Button>

                <Button
                  onClick={handleSubmit}
                  className="px-6 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {editMode ? "Cập nhật" : "Lưu chi nhánh"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================= TABLE ================= */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100 dark:bg-gray-700">
                <TableHead>#</TableHead>

                {visibleColumns.id && (
                  <TableHead>
                    <HeaderFilter
                      selfKey="id"
                      label="Mã"
                      values={getUniqueValues(branches, "id")}
                      selected={selectedId}
                      onChange={setSelectedId}
                    />
                  </TableHead>
                )}

                {visibleColumns.name && (
                  <TableHead>
                    <HeaderFilter
                      selfKey="name"
                      label="Tên"
                      values={getUniqueValues(branches, "name")}
                      selected={selectedName}
                      onChange={setSelectedName}
                    />
                  </TableHead>
                )}

                {visibleColumns.address && (
                  <TableHead>
                    <HeaderFilter
                      selfKey="address"
                      label="Địa chỉ"
                      values={getUniqueValues(branches, "address")}
                      selected={selectedAddress}
                      onChange={setSelectedAddress}
                    />
                  </TableHead>
                )}

                {visibleColumns.floor && (
                  <TableHead>
                    <Layers className="w-4 h-4 inline mr-1" />
                    Số tầng
                  </TableHead>
                )}

                {visibleColumns.area && (
                  <TableHead>
                    <Grid3X3 className="w-4 h-4 inline mr-1" />
                    Số khu
                  </TableHead>
                )}

                {visibleColumns.action && (
                  <TableHead className="text-center">Thao tác</TableHead>
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {currentData.map((b, idx) => (
                <TableRow key={b.id}>
                  <TableCell>
                    {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                  </TableCell>

                  {visibleColumns.id && <TableCell>{b.id}</TableCell>}
                  {visibleColumns.name && <TableCell>{b.name}</TableCell>}

                  {visibleColumns.address && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        {b.address}
                      </div>
                    </TableCell>
                  )}

                  {visibleColumns.floor && (
                    <TableCell>{Number(b.floorCount) || 0}</TableCell>
                  )}

                  {visibleColumns.area && (
                    <TableCell>{Array.isArray(b.areas) ? b.areas.length : 0}</TableCell>
                  )}

                  {visibleColumns.action && (
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(b)}
                        className="inline-flex items-center gap-2"
                      >
                        <Pencil className="w-4 h-4" />
                        Sửa
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}

              {!loading && currentData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-gray-500 py-10">
                    Không có dữ liệu.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t bg-white dark:bg-gray-800">
            <div className="text-sm text-gray-500">
              Trang <span className="font-medium">{currentPage}</span> /{" "}
              <span className="font-medium">{totalPages}</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Trước
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="flex items-center gap-2"
              >
                Sau
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
