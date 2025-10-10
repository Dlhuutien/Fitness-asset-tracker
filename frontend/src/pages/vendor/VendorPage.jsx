import { useEffect, useState } from "react";
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
  Globe2,
  RefreshCw,
  PlusCircle,
  CheckCircle2,
} from "lucide-react";
import VendorService from "@/services/vendorService";
import PageContainer from "@/components/common/PageContainer";
import { toast } from "sonner";
import {
  ColumnVisibilityButton,
  HeaderFilter,
  getUniqueValues,
} from "@/components/common/ExcelTableTools";

const ITEMS_PER_PAGE = 6;

export default function VendorPage() {
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState("");
  const [filterOrigin, setFilterOrigin] = useState("all");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [goToPage, setGoToPage] = useState("");
  const [form, setForm] = useState({
    id: "",
    name: "",
    origin: "",
    description: "",
  });
  const [editMode, setEditMode] = useState(false);

  // 🔍 Bộ lọc từng cột (Excel Filter)
  const [selectedId, setSelectedId] = useState([]);
  const [selectedName, setSelectedName] = useState([]);
  const [selectedOrigin, setSelectedOrigin] = useState([]);
  const [selectedDesc, setSelectedDesc] = useState([]);

  // 👁️ Hiển thị cột
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    name: true,
    origin: true,
    description: true,
    action: true,
  });

  // 🧩 Fetch vendors
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true);
        const data = await VendorService.getAll();
        setVendors(data);
      } catch (err) {
        console.error("❌ Lỗi khi tải vendor:", err);
        setErrorMsg("Không thể tải danh sách nhà cung cấp.");
      } finally {
        setLoading(false);
      }
    };
    fetchVendors();
  }, []);

  // 🧮 Filter + search
  const filtered = vendors.filter((v) => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      v.name.toLowerCase().includes(q) ||
      v.id.toLowerCase().includes(q) ||
      (v.description || "").toLowerCase().includes(q);

    const matchOrigin =
      filterOrigin === "all" ||
      v.origin.toLowerCase() === filterOrigin.toLowerCase();

    const matchHeaderId =
      selectedId.length === 0 || selectedId.includes(v.id);
    const matchHeaderName =
      selectedName.length === 0 || selectedName.includes(v.name);
    const matchHeaderOrigin =
      selectedOrigin.length === 0 || selectedOrigin.includes(v.origin);
    const matchHeaderDesc =
      selectedDesc.length === 0 ||
      selectedDesc.includes(v.description || "(Trống)");

    return (
      matchSearch &&
      matchOrigin &&
      matchHeaderId &&
      matchHeaderName &&
      matchHeaderOrigin &&
      matchHeaderDesc
    );
  });

  // 🔢 Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentData = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // ✏️ Form handlers
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm({ id: "", name: "", origin: "", description: "" });
    setEditMode(false);
  };

  const handleSubmit = async () => {
    if (!form.id || !form.name || !form.origin) {
      toast.warning("⚠️ Vui lòng nhập đầy đủ các trường bắt buộc!");
      return;
    }

    try {
      setLoading(true);
      if (editMode) {
        await VendorService.update(form.id, form);
        toast.success(`✅ Đã cập nhật nhà cung cấp "${form.name}"`);
      } else {
        await VendorService.create(form);
        toast.success(`✅ Đã thêm nhà cung cấp "${form.name}"`);
      }
      const data = await VendorService.getAll();
      setVendors(data);
      resetForm();
    } catch (err) {
      console.error("❌ Lỗi khi lưu vendor:", err);
      toast.error(
        `❌ ${
          err.response?.data?.message || err.message || "Không thể lưu vendor"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (vendor) => {
    setForm({
      id: vendor.id,
      name: vendor.name,
      origin: vendor.origin,
      description: vendor.description || "",
    });
    setEditMode(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading && vendors.length === 0)
    return <div className="p-4 text-gray-500 animate-pulse">Đang tải...</div>;
  if (errorMsg)
    return <div className="p-4 text-red-500 text-sm">{errorMsg}</div>;

  return (
    <PageContainer>
      <div className="space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-emerald-600 flex items-center gap-2">
            <Building2 className="w-5 h-5" /> Quản lý nhà cung cấp
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Thêm, chỉnh sửa và xem danh sách các vendor thiết bị gym.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow border border-emerald-100 dark:border-gray-700 space-y-4">
          <h2 className="text-lg font-semibold text-emerald-600">
            {editMode ? "✏️ Cập nhật nhà cung cấp" : "➕ Thêm nhà cung cấp mới"}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              placeholder="Mã (VD: MT)"
              value={form.id}
              onChange={(e) => handleChange("id", e.target.value.toUpperCase())}
              disabled={editMode}
              className={`dark:bg-gray-700 dark:text-white ${
                editMode ? "cursor-not-allowed opacity-70" : ""
              }`}
            />
            <Input
              placeholder="Tên nhà cung cấp"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="dark:bg-gray-700 dark:text-white"
            />
            <Input
              placeholder="Quốc gia"
              value={form.origin}
              onChange={(e) =>
                handleChange("origin", e.target.value.toUpperCase())
              }
              className="dark:bg-gray-700 dark:text-white"
            />
            <Input
              placeholder="Mô tả ngắn (tùy chọn)"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2">
            {editMode && (
              <Button
                variant="outline"
                onClick={resetForm}
                className="dark:border-gray-600 dark:text-gray-200"
              >
                Hủy
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white flex items-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Đang lưu...
                </>
              ) : editMode ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Cập nhật
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" /> Thêm mới
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Bộ lọc */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-emerald-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3 items-center">
            <Input
              placeholder="🔍 Tìm theo tên, mã hoặc mô tả..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full md:w-1/3 dark:bg-gray-700 dark:text-white"
            />
            <select
              value={filterOrigin}
              onChange={(e) => {
                setFilterOrigin(e.target.value);
                setCurrentPage(1);
              }}
              className="border rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">🌏 Tất cả quốc gia</option>
              {Array.from(new Set(vendors.map((v) => v.origin))).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSearch("");
                setFilterOrigin("all");
              }}
              className="flex items-center gap-2 dark:border-gray-600"
            >
              <RefreshCw className="w-4 h-4" /> Reset
            </Button>
          </div>

          {/* 👁️ Hiển thị cột */}
          <div className="ml-auto">
            <ColumnVisibilityButton
              visibleColumns={visibleColumns}
              setVisibleColumns={setVisibleColumns}
              labels={{
                id: "Mã",
                name: "Tên nhà cung cấp",
                origin: "Quốc gia",
                description: "Mô tả",
                action: "Thao tác",
              }}
            />
          </div>
        </div>

        {/* Bảng dữ liệu */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[900px] border border-gray-200 dark:border-gray-700">
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-gray-700 text-sm font-semibold">
                  <TableHead>#</TableHead>

                  {visibleColumns.id && (
                    <TableHead>
                      <HeaderFilter
                        selfKey="id"
                        label="Mã"
                        values={getUniqueValues(vendors, "id")}
                        selected={selectedId}
                        onChange={setSelectedId}
                      />
                    </TableHead>
                  )}

                  {visibleColumns.name && (
                    <TableHead>
                      <HeaderFilter
                        selfKey="name"
                        label="Tên nhà cung cấp"
                        values={getUniqueValues(vendors, "name")}
                        selected={selectedName}
                        onChange={setSelectedName}
                      />
                    </TableHead>
                  )}

                  {visibleColumns.origin && (
                    <TableHead>
                      <HeaderFilter
                        selfKey="origin"
                        label="Quốc gia"
                        values={getUniqueValues(vendors, "origin")}
                        selected={selectedOrigin}
                        onChange={setSelectedOrigin}
                      />
                    </TableHead>
                  )}

                  {visibleColumns.description && (
                    <TableHead>
                      <HeaderFilter
                        selfKey="desc"
                        label="Mô tả"
                        values={getUniqueValues(vendors, "description")}
                        selected={selectedDesc}
                        onChange={setSelectedDesc}
                      />
                    </TableHead>
                  )}

                  {visibleColumns.action && (
                    <TableHead className="text-center">Thao tác</TableHead>
                  )}
                </TableRow>
              </TableHeader>

              <TableBody>
                {currentData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-6 text-gray-500 dark:text-gray-400"
                    >
                      Không có nhà cung cấp phù hợp.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentData.map((v, idx) => (
                    <TableRow
                      key={v.id ?? idx}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                    >
                      <TableCell className="text-center">
                        {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                      </TableCell>
                      {visibleColumns.id && (
                        <TableCell className="font-semibold text-emerald-600">
                          {v.id}
                        </TableCell>
                      )}
                      {visibleColumns.name && <TableCell>{v.name}</TableCell>}
                      {visibleColumns.origin && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Globe2 className="w-4 h-4 text-gray-500" />
                            {v.origin}
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.description && (
                        <TableCell className="text-gray-600 italic">
                          {v.description || "-"}
                        </TableCell>
                      )}
                      {visibleColumns.action && (
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(v)}
                            className="text-xs dark:border-gray-600 dark:text-gray-200"
                          >
                            Sửa
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
