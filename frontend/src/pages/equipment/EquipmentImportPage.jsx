import { useState, useEffect, useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/buttonn";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";

import {
  Table,
  TableHead,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";

import VendorService from "@/services/vendorService";
import EquipmentService from "@/services/equipmentService";
import InvoiceService from "@/services/invoiceService";
import { toast } from "sonner";
import VendorQuickAdd from "@/components/panel/vendor/VendorQuickAdd";
import EquipmentQuickAdd from "@/components/panel/importEquipment/EquipmentQuickAdd";
import BranchService from "@/services/branchService";
import useAuthRole from "@/hooks/useAuthRole";

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

import {
  HeaderFilter,
  ColumnVisibilityButton,
  useGlobalFilterController,
  getUniqueValues,
} from "@/components/common/ExcelTableTools";

import { Loader2, RefreshCw, CheckCircle2, ChevronRight } from "lucide-react";
import { useSWRConfig } from "swr";
import { API } from "@/config/url";
import { useEquipmentData } from "@/hooks/useEquipmentUnitData";
const NO_IMG_DATA_URI =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="Arial" font-size="14">No image</text></svg>';

export default function EquipmentImportPage({
  onRequestSwitchTab,
  onStartImport,
}) {
  const { mutate } = useSWRConfig();
  const { refreshEquipmentUnits } = useEquipmentData(); // ✅ dùng hook đã fix key
  const navigate = useNavigate();
  const [selectedVendor, setSelectedVendor] = useState("");
  const [selectedItems, setSelectedItems] = useState({});
  const [vendors, setVendors] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchVendor, setSearchVendor] = useState("");
  const [search, setSearch] = useState("");
  const [openQuickAdd, setOpenQuickAdd] = useState(false);
  const [openQuickAddEquipment, setOpenQuickAddEquipment] = useState(false);
  const { isSuperAdmin, branchId } = useAuthRole();

  // ===== Overlay + theo dõi NEW record =====
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlayMode, setOverlayMode] = useState("loading"); // "loading" | "success"
  const newFromUnitListRef = useRef(new Set());
  const expectedAtLeastRef = useRef(1);

  const controller = useGlobalFilterController();
  const [filters, setFilters] = useState({
    id: [],
    name: [],
    main_name: [],
    type_name: [],
    warranty_duration: [],
  });
  const [visibleColumns, setVisibleColumns] = useState({
    select: true,
    id: true,
    main_name: true,
    type_name: true,
    name: true,
    warranty_duration: true,
  });
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");

  // ✅ Load branch list & set default branch nếu user thường
  useEffect(() => {
    (async () => {
      try {
        const data = await BranchService.getAll();
        setBranches(data || []);

        // Nếu không phải super-admin thì gán branch mặc định
        if (!isSuperAdmin && branchId) {
          setSelectedBranch(branchId);
        }
      } catch (err) {
        console.error("❌ Lỗi khi load branch:", err);
        toast.error("Không thể tải danh sách chi nhánh!");
      }
    })();
  }, [isSuperAdmin, branchId]);

  // ✅ Load vendor + equipment độc lập
  useEffect(() => {
    (async () => {
      try {
        const [vendorRes, equipRes] = await Promise.all([
          VendorService.getAll(),
          EquipmentService.getAll(),
        ]);
        setVendors(vendorRes || []);
        setEquipments(equipRes || []);
      } catch (err) {
        console.error("❌ Lỗi khi load dữ liệu:", err);
        toast.error("Không thể tải dữ liệu từ server!");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 🎯 Lắng nghe event từ UnitList khi có NEW record
  useEffect(() => {
    const handler = (e) => {
      const payload = e.detail;
      let ids = [];

      if (Array.isArray(payload)) ids = payload;
      else if (payload?.newIds && Array.isArray(payload.newIds))
        ids = payload.newIds;
      else if (payload?.id) ids = [payload.id];

      if (ids.length > 0) {
        let changed = false;
        ids.forEach((id) => {
          if (!newFromUnitListRef.current.has(id)) {
            newFromUnitListRef.current.add(id);
            changed = true;
          }
        });

        if (changed && overlayMode === "loading") {
          console.log("✅ Phát hiện thiết bị mới, chuyển sang success overlay");
          setOverlayMode("success");
          toast.success(
            "🎉 Đã phát hiện thiết bị mới hiển thị trong danh sách!"
          );
        }
      }
    };

    window.addEventListener("fitx-units-updated", handler);
    return () => window.removeEventListener("fitx-units-updated", handler);
  }, [overlayOpen, overlayMode]);

  // 🔁 Đổi vendor
  const handleChangeVendor = (val) => {
    setSelectedVendor(val);
    setSelectedItems({});
    setFilters({
      id: [],
      name: [],
      main_name: [],
      type_name: [],
      warranty_duration: [],
    });
    setSearch("");
  };

  // ✅ Xác nhận nhập hàng
// ✅ Xác nhận nhập hàng
const handleConfirmImport = async () => {
  try {
    setLoadingSubmit(true);
    if (onStartImport) onStartImport();

    // ✅ bật overlay Loading
    setOverlayOpen(true);
    setOverlayMode("loading");

    if (!selectedBranch) {
      toast.error("⚠️ Vui lòng chọn chi nhánh nhập hàng!");
      setLoadingSubmit(false);
      return;
    }

    const items = Object.values(selectedItems).map((item) => ({
      equipment_id: item.id,
      branch_id: selectedBranch,
      quantity: Number.parseInt(item.qty) || 0,
      cost: Number.parseFloat(item.price) || 0,
    }));

    // 🧾 Gọi API tạo hóa đơn nhập hàng
    await InvoiceService.create({ items });
    toast.info("🧾 Đang chờ cập nhật danh sách thiết bị...");

    // 🌀 Refresh SWR
    await refreshEquipmentUnits();

    // 🔁 Revalidate lần 2 sau 2s để chắc chắn SWR có data mới
    setTimeout(() => {
      console.log("⏳ Force refresh lần 2 equipmentUnit...");
      refreshEquipmentUnits();
    }, 2000);

    // ✅ Auto success fallback (frontend-only)
    // Nếu sau 3s không có event fitx-units-updated → auto chuyển success
    const autoSuccessTimer = setTimeout(() => {
      if (overlayMode === "loading") {
        console.log("⚙️ Auto success fallback triggered");
        setOverlayMode("success");
        toast.success("🎉 Nhập hàng thành công (auto fallback)");

        // ❌ Bỏ đoạn tự tắt overlay - để user chủ động bấm nút
        // setTimeout(() => {
        //   setOverlayOpen(false);
        //   setOverlayMode("loading");
        //   newFromUnitListRef.current.clear();
        // }, 2500);
      }
    }, 3000);

    // ✅ Nếu event thật đến thì clear fallback
    window.addEventListener(
      "fitx-units-updated",
      () => clearTimeout(autoSuccessTimer),
      { once: true }
    );
  } catch (err) {
    console.error("❌ Lỗi nhập hàng:", err);
    toast.error("❌ Có lỗi khi tạo hóa đơn!");
    setOverlayOpen(false);
  } finally {
    setLoadingSubmit(false);
    setSelectedItems({});
  }
};


  // ===== Lọc và hiển thị =====
  const vendorEquipments = useMemo(() => {
    return equipments.filter((eq) => eq.vendor_id === selectedVendor);
  }, [equipments, selectedVendor]);

  const uniqueValues = useMemo(
    () => ({
      id: getUniqueValues(vendorEquipments, (e) => e.id),
      name: getUniqueValues(vendorEquipments, (e) => e.name),
      main_name: getUniqueValues(vendorEquipments, (e) => e.main_name),
      type_name: getUniqueValues(vendorEquipments, (e) => e.type_name),
      warranty_duration: getUniqueValues(
        vendorEquipments,
        (e) => `${e.warranty_duration} năm`
      ),
    }),
    [vendorEquipments]
  );

  const filteredEquipments = useMemo(() => {
    const q = search.toLowerCase().trim();
    return vendorEquipments.filter((e) => {
      const matchSearch =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.main_name.toLowerCase().includes(q) ||
        e.type_name.toLowerCase().includes(q);

      const matchFilters = Object.entries(filters).every(([key, vals]) => {
        if (!vals.length) return true;
        let v = "";
        switch (key) {
          case "id":
            v = e.id;
            break;
          case "name":
            v = e.name;
            break;
          case "main_name":
            v = e.main_name;
            break;
          case "type_name":
            v = e.type_name;
            break;
          case "warranty_duration":
            v = `${e.warranty_duration} năm`;
            break;
          default:
            v = "";
        }
        return vals.includes(v);
      });

      return matchSearch && matchFilters;
    });
  }, [vendorEquipments, search, filters]);

  const toggleSelectItem = (item) => {
    setSelectedItems((prev) => {
      const next = { ...prev };
      if (next[item.id]) delete next[item.id];
      else next[item.id] = { ...item, price: "", qty: "" };
      return next;
    });
  };

  const updateField = (id, field, value) => {
    setSelectedItems((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const calcTotal = () =>
    Object.values(selectedItems).reduce((sum, i) => {
      const price = Number(i.price) || 0;
      const qty = Number(i.qty) || 0;
      return sum + price * qty;
    }, 0);

  if (loading)
    return (
      <div className="p-6 text-gray-500 dark:text-gray-300 animate-pulse">
        Đang tải dữ liệu...
      </div>
    );

  // ===== Overlay =====
  const Overlay = () =>
    overlayOpen && (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-emerald-300 shadow-xl p-6 max-w-md w-full text-center">
          {overlayMode === "loading" ? (
            <>
              <div className="w-12 h-12 mx-auto mb-3 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <h3 className="text-lg font-semibold text-emerald-600">
                Đang nhập hàng
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Hệ thống đang cập nhật danh sách thiết bị…
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto w-12 h-12 mb-3 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="text-emerald-600" size={28} />
              </div>
              <h3 className="text-lg font-semibold text-emerald-600">
                Nhập hàng thành công
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Các thiết bị mới đã hiển thị trong danh sách với nhãn <b>NEW</b>
                .
              </p>
              <div className="flex justify-center gap-3 mt-5">
                <Button
                  onClick={() => {
                    setOverlayOpen(false);
                    setOverlayMode("loading");
                    newFromUnitListRef.current.clear();
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800"
                >
                  Đồng ý
                </Button>
                <Button
                  onClick={() => {
                    setOverlayOpen(false);
                    setOverlayMode("loading");
                    newFromUnitListRef.current.clear();
                    navigate("/app/equipment/directory");
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-1"
                >
                  Chuyển đến danh mục thiết bị <ChevronRight size={16} />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    );

  return (
    <div className="p-6 space-y-8 relative">
      <Overlay />
      {/* 🏬 Chi nhánh nhập hàng */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow space-y-3">
        <h3 className="font-semibold text-emerald-600 text-lg">
          🏬 Chi nhánh nhập hàng
        </h3>

        {isSuperAdmin ? (
          // 🔹 Super admin: được chọn chi nhánh
          <div className="flex items-center gap-2">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="border rounded-md p-2 w-full dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="">-- Chọn chi nhánh --</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.id})
                </option>
              ))}
            </select>
            <Button
              size="icon"
              variant="outline"
              onClick={async () => {
                const data = await BranchService.getAll();
                setBranches(data || []);
                toast.success("🔄 Danh sách chi nhánh đã làm mới!");
              }}
            >
              <RefreshCw size={16} />
            </Button>
          </div>
        ) : (
          // 🔸 User thường: hiển thị chi nhánh cố định
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-emerald-600">
              Bạn đang nhập hàng cho chi nhánh:
            </p>
            <span className="px-3 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold text-sm border border-emerald-400/50">
              {branches.find((b) => b.id === branchId)?.name ||
                branchId ||
                "Không xác định"}
            </span>
          </div>
        )}
      </div>

      {/* Nhà cung cấp */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow space-y-3">
        <h3 className="font-semibold text-emerald-600 text-lg">
          🏢 Chọn nhà cung cấp
        </h3>
        <div className="flex items-center gap-2">
          <Input
            placeholder="🔍 Tìm theo tên, mã hoặc quốc gia..."
            value={searchVendor}
            onChange={(e) => setSearchVendor(e.target.value)}
            className="flex-1 h-9 text-sm"
          />
          <Button
            size="icon"
            variant="outline"
            onClick={async () => {
              const data = await VendorService.getAll();
              setVendors(data || []);
              toast.success("🔄 Danh sách nhà cung cấp đã làm mới!");
            }}
          >
            <RefreshCw size={16} />
          </Button>
          <Button
            onClick={() => setOpenQuickAdd(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-4"
          >
            ➕ Thêm mới
          </Button>
        </div>

        <div className="max-h-[260px] overflow-y-auto border rounded-lg divide-y">
          {vendors
            .filter((v) => {
              const q = searchVendor.toLowerCase();
              return (
                v.name.toLowerCase().includes(q) ||
                v.id.toLowerCase().includes(q) ||
                (v.origin || "").toLowerCase().includes(q)
              );
            })
            .map((v) => (
              <div
                key={v.id}
                onClick={() => handleChangeVendor(v.id)}
                className={`p-3 cursor-pointer transition ${
                  selectedVendor === v.id
                    ? "bg-emerald-50 dark:bg-gray-700"
                    : "hover:bg-emerald-50 dark:hover:bg-gray-700"
                }`}
              >
                <p className="font-semibold text-emerald-600 text-sm">
                  {v.name}
                </p>
                <p className="text-xs text-gray-500">
                  Mã: {v.id} • Quốc gia: {v.origin}
                </p>
              </div>
            ))}
        </div>
      </div>

      {/* QuickAdd */}
      <VendorQuickAdd
        open={openQuickAdd}
        onClose={() => setOpenQuickAdd(false)}
        onSuccess={(newVendor) => {
          setVendors((prev) => [...prev, newVendor]);
          setSelectedVendor(newVendor.id);
        }}
      />
      <EquipmentQuickAdd
        open={openQuickAddEquipment}
        onClose={() => setOpenQuickAddEquipment(false)}
        vendorId={selectedVendor}
        onSuccess={(newEq) => {
          setEquipments((prev) => [...prev, newEq]);
          toast.success("🎉 Thiết bị mới đã được thêm!");
        }}
      />

      {/* Danh sách thiết bị */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-emerald-600 text-lg">
            🧾 Danh sách loại thiết bị
          </h3>
          {selectedVendor && (
            <div className="flex items-center gap-3">
              <Input
                placeholder="Tìm kiếm thiết bị..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-60 h-8 text-sm"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => setOpenQuickAddEquipment(true)}
              >
                +
              </Button>
              <ColumnVisibilityButton
                visibleColumns={visibleColumns}
                setVisibleColumns={setVisibleColumns}
                labels={{
                  select: "Chọn",
                  id: "Mã thẻ kho",
                  main_name: "Nhóm",
                  type_name: "Loại",
                  name: "Tên thiết bị",
                  warranty_duration: "Bảo hành",
                }}
              />
            </div>
          )}
        </div>

        {!selectedVendor ? (
          <div className="p-6 text-center text-sm text-gray-500 border rounded">
            Hãy chọn một nhà cung cấp để hiển thị danh sách thiết bị.
          </div>
        ) : (
          <div className="overflow-y-auto max-h-72 border rounded">
            <Table className="text-sm">
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-gray-700">
                  {visibleColumns.select && <TableHead>Chọn</TableHead>}
                  {visibleColumns.id && (
                    <TableHead>
                      <HeaderFilter
                        selfKey="id"
                        label="Mã thẻ kho"
                        values={uniqueValues.id}
                        selected={filters.id}
                        onChange={(v) => setFilters((p) => ({ ...p, id: v }))}
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
                  {visibleColumns.warranty_duration && (
                    <TableHead>
                      <HeaderFilter
                        selfKey="warranty_duration"
                        label="Bảo hành"
                        values={uniqueValues.warranty_duration}
                        selected={filters.warranty_duration}
                        onChange={(v) =>
                          setFilters((p) => ({ ...p, warranty_duration: v }))
                        }
                        controller={controller}
                      />
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEquipments.map((item) => (
                  <TableRow key={item.id} className="border-t">
                    {visibleColumns.select && (
                      <TableCell className="text-center">
                        <input
                          type="checkbox"
                          checked={!!selectedItems[item.id]}
                          onChange={() => toggleSelectItem(item)}
                        />
                      </TableCell>
                    )}
                    {visibleColumns.id && <TableCell>{item.id}</TableCell>}
                    {visibleColumns.main_name && (
                      <TableCell>{item.main_name}</TableCell>
                    )}
                    {visibleColumns.type_name && (
                      <TableCell>{item.type_name}</TableCell>
                    )}
                    {visibleColumns.name && (
                      <TableCell className="flex items-center gap-2">
                        <img
                          src={item.image || NO_IMG_DATA_URI}
                          alt={item.name}
                          className="w-10 h-8 object-contain rounded border"
                        />
                        <span>{item.name}</span>
                      </TableCell>
                    )}
                    {visibleColumns.warranty_duration && (
                      <TableCell>{item.warranty_duration} năm</TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Chi tiết nhập hàng */}
      {Object.keys(selectedItems).length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4">
          <h3 className="font-semibold text-emerald-600">Chi tiết nhập hàng</h3>
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {Object.values(selectedItems).map((item) => {
              const total = (Number(item.price) || 0) * (Number(item.qty) || 0);
              return (
                <div
                  key={item.id}
                  className="flex flex-col md:flex-row gap-4 border rounded-lg p-4 bg-gray-50 dark:bg-gray-700"
                >
                  <img
                    src={item.image || NO_IMG_DATA_URI}
                    alt={item.name}
                    className="w-48 h-36 object-contain rounded border"
                  />
                  <div className="flex-1 flex flex-col">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-xs text-gray-500 mb-2">
                        Mã: {item.id} | Bảo hành: {item.warranty_duration} năm
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <Label className="text-xs">Giá (VNĐ)</Label>
                        <Input
                          type="number"
                          value={item.price}
                          onChange={(e) =>
                            updateField(item.id, "price", e.target.value)
                          }
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Số lượng</Label>
                        <Input
                          type="number"
                          value={item.qty}
                          onChange={(e) =>
                            updateField(item.id, "qty", e.target.value)
                          }
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                    <div className="text-red-600 font-semibold text-sm mt-2">
                      Tổng: {total.toLocaleString()} VNĐ
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tổng cộng + xác nhận */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex justify-between items-center">
        {Object.keys(selectedItems).length ? (
          <>
            <h3 className="font-bold text-lg text-emerald-600">
              Tổng cộng: {calcTotal().toLocaleString()} VNĐ
            </h3>
            <AlertDialog open={openDialog} onOpenChange={setOpenDialog}>
              <AlertDialogTrigger asChild>
                <Button
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  disabled={loadingSubmit}
                >
                  {loadingSubmit ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang xử
                      lý...
                    </>
                  ) : (
                    "Xác nhận nhập hàng"
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận nhập hàng</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn có chắc chắn muốn nhập{" "}
                    <b>{Object.keys(selectedItems).length}</b> thiết bị vào kho?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Huỷ</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmImport}>
                    Xác nhận
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : (
          <h3 className="font-bold text-lg text-gray-400 italic">
            Chưa chọn thiết bị nào để nhập hàng
          </h3>
        )}
      </div>
    </div>
  );
}
