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

  // 🧩 Fetch dữ liệu vendor
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

  // 🧮 Lọc và tìm kiếm
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
    return matchSearch && matchOrigin;
  });

  // 🔢 Phân trang
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentData = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // 🧱 Form handler
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

      // Refresh list
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

  // ====== Render ======
  if (loading && vendors.length === 0)
    return (
      <div className="p-4 animate-pulse text-gray-500">Đang tải dữ liệu...</div>
    );
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

        {/* Form thêm / cập nhật vendor */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow border border-emerald-100 dark:border-gray-700 space-y-4">
          <h2 className="text-lg font-semibold text-emerald-600">
            {editMode ? "✏️ Cập nhật nhà cung cấp" : "➕ Thêm nhà cung cấp mới"}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              placeholder="Mã nhà cung cấp (VD: MT)"
              value={form.id}
              onChange={(e) => handleChange("id", e.target.value.toUpperCase())}
              disabled={editMode}
              className={`dark:bg-gray-700 dark:text-white ${
                editMode ? "cursor-not-allowed opacity-70" : ""
              }`}
            />
            <Input
              placeholder="Tên nhà cung cấp (VD: Matrix Fitness)"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="dark:bg-gray-700 dark:text-white"
            />
            <Input
              placeholder="Quốc gia (VD: VIETNAM, USA...)"
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
          <div className="flex gap-2 justify-end">
            {editMode && (
              <Button
                variant="outline"
                onClick={resetForm}
                className="border-gray-400 dark:border-gray-600 dark:text-gray-200"
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

        {/* Bộ lọc + tìm kiếm */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-emerald-100 dark:border-gray-700 flex flex-wrap gap-3 items-center">
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

        {/* Bảng dữ liệu */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[800px] border border-gray-200 dark:border-gray-700">
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-gray-700 text-sm font-semibold">
                  <TableHead className="text-center border dark:border-gray-600">
                    #
                  </TableHead>
                  <TableHead className="border dark:border-gray-600">
                    Mã
                  </TableHead>
                  <TableHead className="border dark:border-gray-600">
                    Tên nhà cung cấp
                  </TableHead>
                  <TableHead className="border dark:border-gray-600">
                    Quốc gia
                  </TableHead>
                  <TableHead className="border dark:border-gray-600">
                    Mô tả
                  </TableHead>
                  <TableHead className="border dark:border-gray-600 text-center">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {currentData.map((v, idx) => (
                  <TableRow
                    key={v.id ?? idx}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                  >
                    <TableCell className="text-center border dark:border-gray-600">
                      {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                    </TableCell>
                    <TableCell className="border dark:border-gray-600 font-semibold text-emerald-600">
                      {v.id}
                    </TableCell>
                    <TableCell className="border dark:border-gray-600">
                      {v.name}
                    </TableCell>
                    <TableCell className="border dark:border-gray-600">
                      <div className="flex items-center gap-2">
                        <Globe2 className="w-4 h-4 text-gray-500" />
                        {v.origin}
                      </div>
                    </TableCell>
                    <TableCell className="border dark:border-gray-600 text-gray-600 dark:text-gray-300 italic">
                      {v.description || "-"}
                    </TableCell>
                    <TableCell className="border text-center dark:border-gray-600">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(v)}
                        className="text-xs dark:border-gray-600 dark:text-gray-200"
                      >
                        Sửa
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center border-t dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-700">
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
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                className="dark:border-gray-600 dark:text-gray-200"
              >
                »
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
