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
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import PageContainer from "@/components/common/PageContainer";
import { toast } from "sonner";
import BranchService from "@/services/branchService";
import {
  ColumnVisibilityButton,
  HeaderFilter,
  getUniqueValues,
} from "@/components/common/ExcelTableTools";

const ITEMS_PER_PAGE = 6;

export default function BranchListPage() {
  const [branches, setBranches] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [goToPage, setGoToPage] = useState("");
  const [editBranch, setEditBranch] = useState(null);
  const [form, setForm] = useState({ id: "", name: "", address: "" });

  // 🧩 Excel Filters
  const [selectedId, setSelectedId] = useState([]);
  const [selectedName, setSelectedName] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState([]);
  const [selectedCreated, setSelectedCreated] = useState([]);
  const [selectedUpdated, setSelectedUpdated] = useState([]);

  // 👁️ Column visibility
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    name: true,
    address: true,
    created: true,
    updated: true,
    action: true,
  });

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

  const handleEdit = (branch) => {
    setEditBranch(branch);
    setForm({
      id: branch.id,
      name: branch.name,
      address: branch.address,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

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

      const data = await BranchService.getAll();
      setBranches(data);
      setEditBranch(null);
      setForm({ id: "", name: "", address: "" });
    } catch (err) {
      toast.error("❌ Lỗi khi cập nhật chi nhánh!");
    } finally {
      setLoading(false);
    }
  };

  // 🧮 Filter logic
  const filtered = branches.filter((b) => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      b.name.toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q) ||
      (b.address || "").toLowerCase().includes(q);

    const matchId = selectedId.length === 0 || selectedId.includes(b.id);
    const matchName = selectedName.length === 0 || selectedName.includes(b.name);
    const matchAddress =
      selectedAddress.length === 0 || selectedAddress.includes(b.address);
    const matchCreated =
      selectedCreated.length === 0 ||
      selectedCreated.includes(
        new Date(b.created_at).toLocaleDateString("vi-VN")
      );
    const matchUpdated =
      selectedUpdated.length === 0 ||
      selectedUpdated.includes(
        new Date(b.updated_at).toLocaleDateString("vi-VN")
      );

    return (
      matchSearch &&
      matchId &&
      matchName &&
      matchAddress &&
      matchCreated &&
      matchUpdated
    );
  });

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

        {/* Thanh tìm kiếm + Hiển thị cột */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-emerald-100 dark:border-gray-700 flex flex-wrap justify-between items-center gap-3">
          <div className="flex flex-wrap gap-8 items-center">
            <Input
              placeholder="🔍 Tìm theo tên, mã hoặc địa chỉ..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full md:w-/3 dark:bg-gray-700 dark:text-white"
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
          <ColumnVisibilityButton
            visibleColumns={visibleColumns}
            setVisibleColumns={setVisibleColumns}
            labels={{
              id: "Mã chi nhánh",
              name: "Tên chi nhánh",
              address: "Địa chỉ",
              created: "Ngày tạo",
              updated: "Cập nhật gần nhất",
              action: "Thao tác",
            }}
          />
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
                        label="Mã chi nhánh"
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
                        label="Tên chi nhánh"
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

                  {visibleColumns.created && (
                    <TableHead>
                      <HeaderFilter
                        selfKey="created"
                        label="Ngày tạo"
                        values={getUniqueValues(
                          branches,
                          (b) =>
                            new Date(b.created_at).toLocaleDateString("vi-VN")
                        )}
                        selected={selectedCreated}
                        onChange={setSelectedCreated}
                      />
                    </TableHead>
                  )}

                  {visibleColumns.updated && (
                    <TableHead>
                      <HeaderFilter
                        selfKey="updated"
                        label="Cập nhật gần nhất"
                        values={getUniqueValues(
                          branches,
                          (b) =>
                            new Date(b.updated_at).toLocaleDateString("vi-VN")
                        )}
                        selected={selectedUpdated}
                        onChange={setSelectedUpdated}
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
                      colSpan={7}
                      className="text-center py-6 text-gray-500 dark:text-gray-400"
                    >
                      Không có chi nhánh nào phù hợp.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentData.map((b, idx) => (
                    <TableRow
                      key={b.id ?? idx}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                    >
                      <TableCell className="text-center">
                        {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                      </TableCell>
                      {visibleColumns.id && (
                        <TableCell className="font-semibold text-emerald-600">
                          {b.id}
                        </TableCell>
                      )}
                      {visibleColumns.name && <TableCell>{b.name}</TableCell>}
                      {visibleColumns.address && (
                        <TableCell>
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            {b.address}
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.created && (
                        <TableCell className="text-gray-600 dark:text-gray-300">
                          {new Date(b.created_at).toLocaleDateString("vi-VN")}
                        </TableCell>
                      )}
                      {visibleColumns.updated && (
                        <TableCell className="text-gray-600 dark:text-gray-300">
                          {new Date(b.updated_at).toLocaleDateString("vi-VN")}
                        </TableCell>
                      )}
                      {visibleColumns.action && (
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(b)}
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
