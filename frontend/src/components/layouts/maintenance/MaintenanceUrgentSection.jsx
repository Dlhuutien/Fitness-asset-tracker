import { useEffect, useState, useMemo } from "react";
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
import Status from "@/components/common/Status";
import { Grid, Loader2 } from "lucide-react";
import EquipmentUnitService from "@/services/equipmentUnitService";
import MaintainService from "@/services/MaintainService";
import { toast } from "sonner";
import {
  HeaderFilter,
  ColumnVisibilityButton,
  useGlobalFilterController,
  getUniqueValues,
} from "@/components/common/ExcelTableTools";

const STATUS_MAP = {
  active: "Hoạt động",
  inactive: "Ngưng hoạt động",
  "temporary urgent": "Ngừng tạm thời",
  "in progress": "Đang bảo trì",
  ready: "Bảo trì thành công",
  failed: "Bảo trì thất bại",
  moving: "Đang di chuyển",
  "in stock": "Thiết bị trong kho",
  deleted: "Đã xóa",
};

const ITEMS_PER_PAGE = 8;

export default function MaintenanceUrgentSection() {
  const [equipments, setEquipments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState(null);
  const [maintenanceSteps, setMaintenanceSteps] = useState({});
  const [cost, setCost] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingStart, setLoadingStart] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const controller = useGlobalFilterController();
  const [filters, setFilters] = useState({
    id: [],
    name: [],
    main_name: [],
    type_name: [],
    vendor_name: [],
    branch_id: [],
    status: [],
  });

  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    image: true,
    name: true,
    main_name: true,
    type_name: true,
    status: true,
    vendor_name: true,
    branch_id: true,
  });

  // 🧭 Load dữ liệu
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await EquipmentUnitService.getByStatusGroup([
          "Temporary Urgent",
          "In Progress",
        ]);
        setEquipments(data);
        setFiltered(data);
      } catch (err) {
        console.error("❌ Lỗi load thiết bị:", err);
        toast.error("Không thể tải danh sách thiết bị ngừng khẩn cấp");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ====== Tìm kiếm + Lọc nhóm ======
  useEffect(() => {
    const q = search.trim().toLowerCase();

    const f = equipments.filter((u) => {
      const matchSearch =
        !q ||
        u.equipment?.name?.toLowerCase().includes(q) ||
        u.equipment?.vendor_name?.toLowerCase().includes(q) ||
        u.equipment?.type_name?.toLowerCase().includes(q);

      if (activeGroup === "all") return matchSearch;
      return u.equipment?.main_name === activeGroup && matchSearch;
    });

    setFiltered(f);
    setCurrentPage(1);
  }, [search, activeGroup, equipments]);

  // ====== Excel-style lọc theo cột ======
  const uniqueValues = useMemo(
    () => ({
      id: getUniqueValues(equipments, (e) => e.id),
      name: getUniqueValues(equipments, (e) => e.equipment?.name),
      main_name: getUniqueValues(equipments, (e) => e.equipment?.main_name),
      type_name: getUniqueValues(equipments, (e) => e.equipment?.type_name),
      vendor_name: getUniqueValues(equipments, (e) => e.equipment?.vendor_name),
      branch_id: getUniqueValues(equipments, (e) => e.branch_id),
      status: getUniqueValues(
        equipments,
        (e) => STATUS_MAP[e.status?.toLowerCase()]
      ),
    }),
    [equipments]
  );

  const filteredByColumn = useMemo(() => {
    return (filtered || []).filter((e) => {
      const match = Object.keys(filters).every((key) => {
        if (!filters[key] || filters[key].length === 0) return true;
        let val = "";
        switch (key) {
          case "id":
            val = e.id;
            break;
          case "name":
            val = e.equipment?.name;
            break;
          case "main_name":
            val = e.equipment?.main_name;
            break;
          case "type_name":
            val = e.equipment?.type_name;
            break;
          case "vendor_name":
            val = e.equipment?.vendor_name;
            break;
          case "branch_id":
            val = e.branch_id;
            break;
          case "status":
            val = STATUS_MAP[e.status?.toLowerCase()];
            break;
          default:
            val = "";
        }
        return filters[key].includes(val);
      });
      return match;
    });
  }, [filtered, filters]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredByColumn.length / ITEMS_PER_PAGE)
  );
  const currentData = filteredByColumn.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const checkWarranty = (equipment) => {
    const today = new Date();
    return new Date(equipment.warranty_end_date) > today;
  };

  // 🟦 Bắt đầu bảo trì
  const handleStart = async () => {
    if (!selected) return;
    try {
      setLoadingStart(true);
      const m = await MaintainService.getByUnit(selected.id);
      if (!m) {
        toast.error("Không tìm thấy yêu cầu bảo trì đang hoạt động!");
        return;
      }
      await MaintainService.progress(m.id);
      toast.success("🔧 Đã bắt đầu bảo trì");
      setSuccessMsg("Thiết bị đã chuyển sang trạng thái 'Đang bảo trì'");
      setErrorMsg("");
      setEquipments((prev) =>
        prev.map((eq) =>
          eq.id === selected.id ? { ...eq, status: "In Progress" } : eq
        )
      );
      setSelected({ ...selected, status: "In Progress" });
      setMaintenanceSteps((prev) => ({ ...prev, [selected.id]: 2 }));
      setCost(checkWarranty(selected) ? "0" : "");
    } catch (err) {
      toast.error("Không thể bắt đầu bảo trì");
      setErrorMsg("Không thể bắt đầu bảo trì, vui lòng thử lại.");
    } finally {
      setLoadingStart(false);
    }
  };

  // 🟩 Hoàn tất bảo trì
  const finishMaintenance = async (result) => {
    if (!selected) return;
    try {
      setLoadingComplete(true);
      const m = await MaintainService.getByUnit(selected.id);
      if (!m) {
        toast.error("Không tìm thấy maintenance để hoàn tất!");
        return;
      }

      const payload = {
        status: result === "Bảo trì thành công" ? "Ready" : "Failed",
        cost: parseInt(cost || "0"),
        maintenance_detail: note,
      };

      const resultStatus = result === "Bảo trì thành công" ? "Ready" : "Failed";
      await MaintainService.complete(m.id, payload);

      // ✅ Hiển thị thông báo nổi trong UI
      setSuccessMsg(
        resultStatus === "Ready"
          ? "🎉 Thiết bị đã được bảo trì thành công!"
          : "⚠️ Thiết bị bảo trì thất bại — vui lòng kiểm tra lại."
      );

      // ✅ Hiển thị toast
      toast.success(
        resultStatus === "Ready"
          ? "Bảo trì thành công — Thiết bị đã cập nhật trạng thái."
          : "Bảo trì thất bại — Đã ghi nhận kết quả."
      );

      setErrorMsg("");

      // Đợi 2 giây rồi mới xóa khỏi danh sách
      setTimeout(() => {
        setEquipments((prev) => prev.filter((eq) => eq.id !== selected.id));
        setSelected(null);
        setMessage("");
      }, 2000);
    } catch (err) {
      toast.error("Không thể hoàn tất bảo trì");
      setErrorMsg("Không thể hoàn tất bảo trì, vui lòng thử lại.");
      setSuccessMsg("");
    } finally {
      setLoadingComplete(false);
    }
  };

  if (loading)
    return (
      <div className="p-6 text-gray-500 dark:text-gray-300 animate-pulse">
        Đang tải danh sách thiết bị...
      </div>
    );

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Sidebar bộ lọc */}
      <div className="col-span-3 space-y-4">
        <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
          Bộ lọc thiết bị
        </h2>

        {/* Ô tìm kiếm */}
        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow space-y-2">
          <h3 className="font-semibold text-sm dark:text-gray-200">Tìm kiếm</h3>
          <Input
            placeholder="Tìm tên, loại, nhà cung cấp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="dark:bg-gray-700 dark:text-gray-100"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearch("")}
              className="dark:border-gray-600 dark:text-gray-200"
            >
              Reset
            </Button>
            <Button
              size="sm"
              className="bg-emerald-500 text-white hover:bg-emerald-600"
            >
              Tìm
            </Button>
          </div>
        </div>

        {/* Nhóm thiết bị */}
        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h3 className="font-semibold text-sm mb-2 dark:text-gray-200">
            Hiển thị theo nhóm
          </h3>
          <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto">
            {[
              { id: "all", name: "Tất cả" },
              ...Array.from(
                new Set(equipments.map((e) => e.equipment?.main_name))
              ).map((n) => ({ id: n, name: n })),
            ].map((g, idx) => (
              <button
                key={idx}
                onClick={() => setActiveGroup(g.id)}
                className={`flex items-center gap-3 px-2 py-2 rounded-md border text-sm transition ${
                  activeGroup === g.id
                    ? "bg-emerald-100 border-emerald-500 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200"
                    : "bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                }`}
              >
                <Grid size={16} />
                <span className="flex-1 truncate">{g.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ======= Main content ======= */}
      <div className="col-span-9 space-y-3">
        {/* ⚙️ Nút hiển thị cột ra ngoài */}
        <div className="flex justify-end mb-2">
          <ColumnVisibilityButton
            visibleColumns={visibleColumns}
            setVisibleColumns={setVisibleColumns}
            labels={{
              id: "Mã Unit",
              image: "Ảnh",
              name: "Tên thiết bị",
              main_name: "Nhóm",
              type_name: "Loại",
              status: "Trạng thái",
              vendor_name: "Nhà cung cấp",
              branch_id: "Chi nhánh",
            }}
          />
        </div>

        {/* Bảng danh sách */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[1000px] border border-gray-200 dark:border-gray-600">
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-gray-700 text-sm font-semibold">
                  <TableHead>#</TableHead>
                  {visibleColumns.id && (
                    <TableHead>
                      <HeaderFilter
                        selfKey="id"
                        label="Mã định danh thiết bị"
                        values={uniqueValues.id}
                        selected={filters.id}
                        onChange={(v) => setFilters((p) => ({ ...p, id: v }))}
                        controller={controller}
                      />
                    </TableHead>
                  )}
                  {visibleColumns.image && <TableHead>Hình ảnh</TableHead>}
                  {visibleColumns.name && (
                    <TableHead>
                      <HeaderFilter
                        selfKey="name"
                        label="Tên thiết bị"
                        values={uniqueValues.name}
                        selected={filters.name}
                        onChange={(v) => setFilters((p) => ({ ...p, name: v }))}
                        controller={controller}
                      />
                    </TableHead>
                  )}
                  {visibleColumns.main_name && (
                    <TableHead>
                      <HeaderFilter
                        selfKey="main_name"
                        label="Nhóm"
                        values={uniqueValues.main_name}
                        selected={filters.main_name}
                        onChange={(v) =>
                          setFilters((p) => ({ ...p, main_name: v }))
                        }
                        controller={controller}
                      />
                    </TableHead>
                  )}
                  {visibleColumns.type_name && (
                    <TableHead>
                      <HeaderFilter
                        selfKey="type_name"
                        label="Loại"
                        values={uniqueValues.type_name}
                        selected={filters.type_name}
                        onChange={(v) =>
                          setFilters((p) => ({ ...p, type_name: v }))
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
                        onChange={(v) =>
                          setFilters((p) => ({ ...p, status: v }))
                        }
                        controller={controller}
                      />
                    </TableHead>
                  )}
                  {visibleColumns.vendor_name && (
                    <TableHead>
                      <HeaderFilter
                        selfKey="vendor_name"
                        label="Nhà cung cấp"
                        values={uniqueValues.vendor_name}
                        selected={filters.vendor_name}
                        onChange={(v) =>
                          setFilters((p) => ({ ...p, vendor_name: v }))
                        }
                        controller={controller}
                      />
                    </TableHead>
                  )}
                  {visibleColumns.branch_id && (
                    <TableHead>
                      <HeaderFilter
                        selfKey="branch_id"
                        label="Chi nhánh"
                        values={uniqueValues.branch_id}
                        selected={filters.branch_id}
                        onChange={(v) =>
                          setFilters((p) => ({ ...p, branch_id: v }))
                        }
                        controller={controller}
                      />
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>

              <TableBody>
                {currentData.map((row, idx) => {
                  const normalized = row.status?.trim().toLowerCase();
                  const translated = STATUS_MAP[normalized] || "Không xác định";
                  return (
                    <TableRow
                      key={row.id}
                      className={`cursor-pointer transition ${
                        selected?.id === row.id
                          ? "bg-blue-50 dark:bg-blue-900/30"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                      onClick={async () => {
                        setSuccessMsg("");
                        setErrorMsg("");
                        setSelected(row);
                        try {
                          // 🔍 Lấy maintenance hiện hành theo Unit ID
                          const maintenance = await MaintainService.getByUnit(
                            row.id
                          );

                          if (maintenance) {
                            setSelected((prev) => ({
                              ...prev,
                              maintenance_reason:
                                maintenance.maintenance_reason,
                              requested_by_name: maintenance.requested_by_name,
                              technician_name: maintenance.technician_name,
                            }));
                          } else {
                            console.warn(
                              "⚠️ Không có maintenance_reason cho thiết bị:",
                              row.id
                            );
                          }
                        } catch (err) {
                          console.error(
                            "❌ Lỗi khi lấy maintenance_reason:",
                            err
                          );
                          toast.error(
                            "Không thể lấy lý do bảo trì thiết bị này!"
                          );
                        }
                      }}
                    >
                      <TableCell className="text-center">
                        {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                      </TableCell>
                      {visibleColumns.id && <TableCell>{row.id}</TableCell>}
                      {visibleColumns.image && (
                        <TableCell>
                          <img
                            src={row.equipment?.image}
                            alt={row.equipment?.name}
                            className="w-12 h-10 object-contain rounded"
                          />
                        </TableCell>
                      )}
                      {visibleColumns.name && (
                        <TableCell>{row.equipment?.name}</TableCell>
                      )}
                      {visibleColumns.main_name && (
                        <TableCell>{row.equipment?.main_name}</TableCell>
                      )}
                      {visibleColumns.type_name && (
                        <TableCell>{row.equipment?.type_name}</TableCell>
                      )}
                      {visibleColumns.status && (
                        <TableCell className="text-center">
                          <Status status={translated} />{" "}
                        </TableCell>
                      )}
                      {visibleColumns.vendor_name && (
                        <TableCell>{row.equipment?.vendor_name}</TableCell>
                      )}
                      {visibleColumns.branch_id && (
                        <TableCell>{row.branch_id}</TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center border-t dark:border-gray-600 px-4 py-2 bg-gray-50 dark:bg-gray-700">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Tổng cộng: {filteredByColumn.length} thiết bị
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

        {/* ====== Panel chi tiết ====== */}
        {selected && (
          <div className="bg-white dark:bg-[#1e1e1e] shadow rounded-lg p-6 space-y-6">
            {/* 🧾 Chi tiết thiết bị */}
            <h2 className="text-lg font-semibold">Chi tiết thiết bị</h2>
            <div className="flex gap-6">
              <img
                src={selected.equipment?.image}
                alt={selected.equipment?.name}
                className="w-40 h-32 object-contain border rounded-lg"
              />
              <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
                <p>
                  <strong>Tên:</strong> {selected.equipment?.name}
                </p>
                <p>
                  <strong>Nhà cung cấp:</strong>{" "}
                  {selected.equipment?.vendor_name}
                </p>
                <p>
                  <strong>Nhóm:</strong> {selected.equipment?.main_name}
                </p>
                <p>
                  <strong>Chi nhánh:</strong> {selected.branch_id}
                </p>
                <p>
                  <strong>Bảo hành đến:</strong>{" "}
                  {selected.warranty_end_date?.slice(0, 10)}
                </p>
                <p>
                  <strong>Trạng thái:</strong>{" "}
                  <Status
                    status={
                      STATUS_MAP[selected.status?.toLowerCase()] ||
                      selected.status ||
                      "Không xác định"
                    }
                  />
                </p>
                <p className="col-span-2 mt-2">
                  <strong>Tình trạng bảo hành:</strong>{" "}
                  {checkWarranty(selected) ? (
                    <span className="text-green-600 font-semibold">
                      ✅ Còn hạn bảo trì
                    </span>
                  ) : (
                    <span className="text-red-600 font-semibold">
                      ❌ Hết hạn bảo trì
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* 🔧 Phiếu bảo trì */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
              <h2 className="text-lg font-semibold">Phiếu bảo trì</h2>
              <p>
                <strong>Lý do:</strong> {selected.maintenance_reason || "—"}
              </p>
              <p>
                <strong>Người yêu cầu:</strong>{" "}
                {selected.requested_by_name || "—"}
              </p>
              {selected.status?.toLowerCase() === "in progress" && (
                <p>
                  <strong>Người bảo trì:</strong>{" "}
                  {selected.technician_name || "—"}
                </p>
              )}

              {(!maintenanceSteps[selected.id] ||
                maintenanceSteps[selected.id] === 1) && (
                <Button
                  onClick={handleStart}
                  disabled={loadingStart}
                  className="bg-blue-500 text-white w-full flex items-center justify-center"
                >
                  {loadingStart ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    "Bắt đầu bảo trì"
                  )}
                </Button>
              )}

              {/* Step 2 */}
              {maintenanceSteps[selected.id] === 2 && (
                <div className="space-y-3">
                  {checkWarranty(selected) ? (
                    <p className="text-green-600 font-semibold">
                      Còn bảo hành — Chi phí: 0đ
                    </p>
                  ) : (
                    <div>
                      <p className="text-red-600 font-semibold mb-2">
                        Hết hạn bảo hành — nhập chi phí
                      </p>
                      <Input
                        type="number"
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                        placeholder="Chi phí"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm mb-1">Ghi chú:</label>
                    <Input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Nhập ghi chú bảo trì"
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button
                      onClick={() => finishMaintenance("Bảo trì thành công")}
                      disabled={loadingComplete}
                      className="bg-green-500 text-white flex-1 flex items-center justify-center"
                    >
                      {loadingComplete ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Đang gửi...
                        </>
                      ) : (
                        "Bảo trì thành công"
                      )}
                    </Button>

                    <Button
                      onClick={() => finishMaintenance("Bảo trì thất bại")}
                      disabled={loadingComplete}
                      className="bg-red-500 text-white flex-1 flex items-center justify-center"
                    >
                      {loadingComplete ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Đang gửi...
                        </>
                      ) : (
                        "Bảo trì thất bại"
                      )}
                    </Button>
                  </div>

                  {successMsg && (
                    <div className="px-4 py-2 text-sm rounded bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm">
                      {successMsg}
                    </div>
                  )}
                  {errorMsg && (
                    <div className="px-4 py-2 text-sm rounded bg-red-50 text-red-600 border border-red-200 shadow-sm">
                      {errorMsg}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
