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
  PlusCircle,
  CheckCircle2,
  XCircle,
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
  const [errorMsg, setErrorMsg] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [form, setForm] = useState({ id: "", name: "", address: "" });
  const [formError, setFormError] = useState("");

  // Excel Filters
  const [selectedId, setSelectedId] = useState([]);
  const [selectedName, setSelectedName] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState([]);
  const [selectedCreated, setSelectedCreated] = useState([]);
  const [selectedUpdated, setSelectedUpdated] = useState([]);

  // Visible columns
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    name: true,
    address: true,
    created: true,
    updated: true,
    action: true,
  });

  // Fetch branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoading(true);
        const data = await BranchService.getAll();
        setBranches(data);
      } catch {
        setErrorMsg("Không thể tải danh sách chi nhánh.");
      } finally {
        setLoading(false);
      }
    };
    fetchBranches();
  }, []);

  // Handle form change
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Reset form state
  const resetForm = () => {
    setForm({ id: "", name: "", address: "" });
    setEditMode(false);
    setFormError("");
  };

  // Handle edit
  const handleEdit = (branch) => {
    setEditMode(true);
    setShowForm(true);
    setForm({
      id: branch.id,
      name: branch.name,
      address: branch.address,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Submit create/update
  const handleSubmit = async () => {
    if (!form.name.trim() || !form.address.trim()) {
      setFormError("⚠️ Vui lòng nhập tên và địa chỉ!");
      toast.warning("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    try {
      setLoading(true);

      if (editMode) {
        await BranchService.update(form.id, {
          name: form.name,
          address: form.address,
        });
        toast.success("✅ Cập nhật chi nhánh thành công");
      } else {
        await BranchService.create({
          id: form.id.trim(),
          name: form.name.trim(),
          address: form.address.trim(),
        });
        toast.success("✅ Thêm chi nhánh mới thành công!");
      }

      const updated = await BranchService.getAll();
      setBranches(updated);

      resetForm();
      setShowForm(false);
    } catch (err) {
      toast.error("❌ Lỗi lưu chi nhánh!");
    } finally {
      setLoading(false);
    }
  };

  // Filtering
  const filtered = branches.filter((b) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      b.name.toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q) ||
      b.address.toLowerCase().includes(q);

    const matchId = selectedId.length === 0 || selectedId.includes(b.id);
    const matchName =
      selectedName.length === 0 || selectedName.includes(b.name);
    const matchAddress =
      selectedAddress.length === 0 || selectedAddress.includes(b.address);

    return matchSearch && matchId && matchName && matchAddress;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentData = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <PageContainer>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-emerald-600 flex items-center gap-2">
            <Building2 className="w-5 h-5" /> Quản lý chi nhánh
          </h1>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border flex flex-wrap justify-between gap-3">
          {/* search */}
          <div className="flex gap-3">
            <Input
              placeholder="🔍 Tìm theo tên / mã / địa chỉ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="dark:bg-gray-700 dark:text-white"
            />

            <Button
              size="sm"
              variant="outline"
              onClick={() => setSearch("")}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Reset
            </Button>
          </div>

          {/* right */}
          <div className="flex ml-auto gap-3">
            <Button
              onClick={() => {
                setShowForm((v) => !v);
                resetForm();
              }}
              className={`h-10 flex items-center gap-2 px-4 text-sm font-medium rounded-lg ${
                showForm
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-emerald-500 hover:bg-emerald-600"
              } text-white`}
            >
              {showForm ? (
                <>
                  <XCircle size={18} /> Hủy
                </>
              ) : (
                <>
                  <PlusCircle size={18} /> Thêm mới
                </>
              )}
            </Button>

            <ColumnVisibilityButton
              visibleColumns={visibleColumns}
              setVisibleColumns={setVisibleColumns}
              labels={{
                id: "Mã",
                name: "Tên chi nhánh",
                address: "Địa chỉ",
                created: "Ngày tạo",
                updated: "Cập nhật",
                action: "Thao tác",
              }}
            />
          </div>
        </div>

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white dark:bg-gray-800 p-5 rounded-xl border space-y-4"
            >
              <h2 className="text-lg font-semibold text-emerald-600">
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

              {formError && <p className="text-red-500 text-sm">{formError}</p>}

              <div className="flex justify-end">
                <Button
                  onClick={handleSubmit}
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white flex gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Đang lưu...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Lưu
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
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

                  {visibleColumns.action && (
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(b)}
                      >
                        Sửa
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageContainer>
  );
}
