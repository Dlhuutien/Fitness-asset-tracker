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
  MapPin,
  CalendarClock,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import PageContainer from "@/components/common/PageContainer";
import { toast } from "sonner";
import BranchService from "@/services/branchService";

const ITEMS_PER_PAGE = 6;

// 🔧 Mock data (sau này thay bằng BranchService)
const MOCK_BRANCHES = [
  {
    updated_at: "2025-09-19T05:55:23.566Z",
    created_at: "2025-09-19T05:55:23.566Z",
    address: "364, Dương Quảng Hàm, Gò Vấp, HCM",
    id: "GV",
    name: "Fitness X Gym GV",
  },
  {
    updated_at: "2025-09-21T11:37:40.116Z",
    created_at: "2025-09-20T07:40:26.337Z",
    address: "Lê Văn Sĩ, Q3, HCM",
    id: "Q3",
    name: "Fitness X Gym Q3",
  },
];

export default function BranchListPage() {
  const [branches, setBranches] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [goToPage, setGoToPage] = useState("");
  const [editBranch, setEditBranch] = useState(null);
  const [form, setForm] = useState({ id: "", name: "", address: "" });

  // 🧭 Giả lập fetch API
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoading(true);
        const data = await BranchService.getAll();
        setBranches(data);
      } catch (err) {
        console.error("❌ Lỗi khi tải chi nhánh:", err);
        setErrorMsg("Không thể tải danh sách chi nhánh.");
      } finally {
        setLoading(false);
      }
    };
    fetchBranches();
  }, []);

  // 🧩 Chọn chi nhánh để sửa
  const handleEdit = (branch) => {
    setEditBranch(branch);
    setForm({
      id: branch.id,
      name: branch.name,
      address: branch.address,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 🧱 Cập nhật giá trị form
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // 💾 Giả lập cập nhật chi nhánh
  const handleUpdate = async () => {
    if (!form.name || !form.address) {
      toast.warning("⚠️ Vui lòng nhập đủ tên và địa chỉ!");
      return;
    }

    try {
      setLoading(true);
      const updatedBranch = await BranchService.update(form.id, {
        name: form.name,
        address: form.address,
      });
      toast.success(`✅ Đã cập nhật chi nhánh "${updatedBranch.name}"`);

      // Cập nhật lại danh sách
      const data = await BranchService.getAll();
      setBranches(data);

      // Reset form
      setEditBranch(null);
      setForm({ id: "", name: "", address: "" });
    } catch (err) {
      toast.error("❌ Lỗi khi cập nhật chi nhánh!");
    } finally {
      setLoading(false);
    }
  };

  // 🧮 Tìm kiếm
  const filtered = branches.filter((b) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      b.name.toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q) ||
      (b.address || "").toLowerCase().includes(q)
    );
  });

  // 🔢 Phân trang
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentData = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading && branches.length === 0)
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
            <Building2 className="w-5 h-5" /> Quản lý chi nhánh
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Cập nhật thông tin các chi nhánh trong hệ thống FitX Gym.
          </p>
        </div>

        {/* Form chỉnh sửa */}
        {editBranch && (
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow border border-emerald-100 dark:border-gray-700 space-y-4">
            <h2 className="text-lg font-semibold text-emerald-600">
              ✏️ Cập nhật chi nhánh {editBranch.id}
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                value={form.id}
                disabled
                className="cursor-not-allowed opacity-70 dark:bg-gray-700 dark:text-gray-300"
              />
              <Input
                placeholder="Tên chi nhánh"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="dark:bg-gray-700 dark:text-white"
              />
              <Input
                placeholder="Địa chỉ chi nhánh"
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                className="md:col-span-2 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditBranch(null);
                  setForm({ id: "", name: "", address: "" });
                }}
                className="dark:border-gray-600 dark:text-gray-200"
              >
                Hủy
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={loading}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Đang lưu...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Lưu thay đổi
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Thanh tìm kiếm */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-emerald-100 dark:border-gray-700 flex flex-wrap gap-3 items-center">
          <Input
            placeholder="🔍 Tìm theo tên, mã hoặc địa chỉ..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full md:w-1/3 dark:bg-gray-700 dark:text-white"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSearch("");
              setCurrentPage(1);
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
                    Mã chi nhánh
                  </TableHead>
                  <TableHead className="border dark:border-gray-600">
                    Tên chi nhánh
                  </TableHead>
                  <TableHead className="border dark:border-gray-600">
                    Địa chỉ
                  </TableHead>
                  <TableHead className="border dark:border-gray-600">
                    Ngày tạo
                  </TableHead>
                  <TableHead className="border dark:border-gray-600">
                    Cập nhật gần nhất
                  </TableHead>
                  <TableHead className="text-center border dark:border-gray-600">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {currentData.map((b, idx) => (
                  <TableRow
                    key={b.id ?? idx}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                  >
                    <TableCell className="text-center border dark:border-gray-600">
                      {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                    </TableCell>
                    <TableCell className="border dark:border-gray-600 font-semibold text-emerald-600">
                      {b.id}
                    </TableCell>
                    <TableCell className="border dark:border-gray-600">
                      {b.name}
                    </TableCell>
                    <TableCell className="border dark:border-gray-600">
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        {b.address}
                      </div>
                    </TableCell>
                    <TableCell className="border dark:border-gray-600 text-gray-600 dark:text-gray-300">
                      {new Date(b.created_at).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell className="border dark:border-gray-600 text-gray-600 dark:text-gray-300">
                      {new Date(b.updated_at).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell className="border text-center dark:border-gray-600">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(b)}
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
        </div>
      </div>
    </PageContainer>
  );
}
