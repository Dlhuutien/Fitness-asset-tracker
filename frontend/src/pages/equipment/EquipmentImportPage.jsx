import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/buttonn";
import { Label } from "@/components/ui/label";
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
import EquipmentUnitService from "@/services/equipmentUnitService";
import InvoiceService from "@/services/invoiceService";
import { toast } from "sonner";
import VendorQuickAdd from "@/components/layouts/vendor/VendorQuickAdd";
import { Plus, Loader2, RefreshCw } from "lucide-react";
import EquipmentQuickAdd from "@/components/layouts/importEquipment/EquipmentQuickAdd";

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

import { useSWRConfig } from "swr";
import { API } from "@/config/url";

export default function EquipmentImportPage() {
  const { mutate } = useSWRConfig();

  const [selectedVendor, setSelectedVendor] = useState("");
  const [selectedItems, setSelectedItems] = useState({});
  const [vendors, setVendors] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [equipmentUnits, setEquipmentUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [searchVendor, setSearchVendor] = useState("");
  const [search, setSearch] = useState("");
  const [openQuickAdd, setOpenQuickAdd] = useState(false);
  const [openQuickAddEquipment, setOpenQuickAddEquipment] = useState(false);

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

  // 🧭 Load dữ liệu ban đầu
  useEffect(() => {
    (async () => {
      try {
        const [vendorRes, equipRes, unitRes] = await Promise.all([
          VendorService.getAll(),
          EquipmentService.getAll(),
          EquipmentUnitService.getAll(),
        ]);

        setVendors(vendorRes);
        setEquipments(equipRes);
        setEquipmentUnits(unitRes);
      } catch (err) {
        console.error("❌ Lỗi khi load dữ liệu:", err);
        toast.error("Không thể tải dữ liệu từ server!");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

  const toggleSelectItem = (item) => {
    setSelectedItems((prev) => {
      const newItems = { ...prev };
      let attrs = [];

      if (Array.isArray(item.attributes)) attrs = item.attributes;
      else if (item.attributes && typeof item.attributes === "object")
        attrs = Object.entries(item.attributes).map(([k, v]) => ({
          attribute: k,
          value: v,
        }));

      if (newItems[item.id]) delete newItems[item.id];
      else
        newItems[item.id] = { ...item, attributes: attrs, price: "", qty: "" };

      return newItems;
    });
  };

  const updateField = (code, field, value) => {
    setSelectedItems((prev) => ({
      ...prev,
      [code]: {
        ...prev[code],
        [field]: value,
      },
    }));
  };

  const calcTotal = () =>
    Object.values(selectedItems).reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const qty = parseInt(item.qty) || 0;
      return sum + price * qty;
    }, 0);

  const handleConfirmImport = async () => {
    try {
      setLoadingSubmit(true);
      const items = Object.values(selectedItems).map((item) => ({
        equipment_id: item.id,
        branch_id: "GV",
        quantity: parseInt(item.qty) || 0,
        cost: parseFloat(item.price) || 0,
      }));

      await InvoiceService.create({ items });
      toast.success("✅ Nhập hàng thành công!");
      setSuccessMsg("✅ Nhập hàng thành công!");
      setErrorMsg("");
      mutate(`${API}equipmentUnit`);
      setSelectedItems({});
      setOpenDialog(false);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error("❌ Lỗi nhập hàng:", err);
      toast.error("❌ Có lỗi khi tạo hóa đơn!");
      setErrorMsg("❌ Có lỗi khi tạo hóa đơn!");
      setSuccessMsg("");
      setTimeout(() => setErrorMsg(""), 4000);
    } finally {
      setLoadingSubmit(false);
    }
  };

  // 🔍 Lọc thiết bị theo vendor
  const vendorEquipments = useMemo(() => {
    if (!selectedVendor) return [];
    return (equipments || []).filter((eq) => eq.vendor_id === selectedVendor);
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
    if (!selectedVendor) return [];

    let list = vendorEquipments;
    const q = search.trim().toLowerCase();

    if (q)
      list = list.filter(
        (eq) =>
          eq.name?.toLowerCase().includes(q) ||
          eq.main_name?.toLowerCase().includes(q) ||
          eq.type_name?.toLowerCase().includes(q)
      );

    return list.filter((e) =>
      Object.keys(filters).every((key) => {
        if (!filters[key] || filters[key].length === 0) return true;
        let val = "";
        switch (key) {
          case "id":
            val = e.id;
            break;
          case "name":
            val = e.name;
            break;
          case "main_name":
            val = e.main_name;
            break;
          case "type_name":
            val = e.type_name;
            break;
          case "warranty_duration":
            val = `${e.warranty_duration} năm`;
            break;
          default:
            val = "";
        }
        return filters[key].includes(val);
      })
    );
  }, [vendorEquipments, selectedVendor, search, filters]);

  if (loading)
    return (
      <div className="p-6 text-gray-500 dark:text-gray-300 animate-pulse">
        Đang tải dữ liệu...
      </div>
    );

  return (
    <div className="p-6 space-y-8">
      {/* ================== NHÀ CUNG CẤP ================== */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow space-y-3">
        <h3 className="font-semibold text-emerald-600 text-lg">
          🏢 Chọn nhà cung cấp
        </h3>

        {/* Tìm kiếm và refresh */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="🔍 Tìm theo tên, mã hoặc quốc gia..."
            value={searchVendor}
            onChange={(e) => setSearchVendor(e.target.value)}
            className="flex-1 h-9 text-sm dark:bg-gray-700 dark:text-white"
          />
          <Button
            size="icon"
            variant="outline"
            onClick={async () => {
              const data = await VendorService.getAll();
              setVendors(data);
              toast.success("🔄 Danh sách nhà cung cấp đã được làm mới!");
            }}
            className="border-emerald-400 text-emerald-500 hover:bg-emerald-50"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setOpenQuickAdd(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4"
          >
            ➕ Thêm mới
          </Button>
        </div>

        {/* Danh sách vendor */}
        <div className="max-h-[260px] overflow-y-auto border rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
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

      {/* ✅ Panel thêm nhà cung cấp */}
      <VendorQuickAdd
        open={openQuickAdd}
        onClose={() => setOpenQuickAdd(false)}
        onSuccess={(newVendor) => {
          setVendors((prev) => [...prev, newVendor]);
          setSelectedVendor(newVendor.id);
        }}
      />
      {/* ✅ Panel thêm thiết bị mới */}
      <EquipmentQuickAdd
        open={openQuickAddEquipment}
        onClose={() => setOpenQuickAddEquipment(false)}
        vendorId={selectedVendor}
        onSuccess={(newEquipment) => {
          setEquipments((prev) => [...prev, newEquipment]);
          toast.success("🎉 Thiết bị mới đã được thêm vào danh sách!");
        }}
      />

      {/* ================== DANH SÁCH THIẾT BỊ ================== */}
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
                className="w-60 h-8 text-sm dark:bg-gray-700 dark:text-gray-100"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => setOpenQuickAddEquipment(true)}
                className="border-emerald-400 text-emerald-500 hover:bg-emerald-50"
              >
                <Plus className="w-4 h-4" />
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
          <div className="border rounded p-6 text-center text-sm text-gray-600 dark:text-gray-300">
            Hãy chọn một nhà cung cấp để hiển thị danh sách thiết bị.
          </div>
        ) : (
          <div className="overflow-y-auto max-h-72 border rounded">
            <Table className="w-full text-sm">
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
                          setFilters((p) => ({
                            ...p,
                            warranty_duration: v,
                          }))
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
                    {visibleColumns.name && <TableCell>{item.name}</TableCell>}
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

      {/* Layout 3 - Chi tiết nhập hàng */}
      {Object.keys(selectedItems).length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4">
          <h3 className="font-semibold text-emerald-600 mb-2">
            Chi tiết nhập hàng
          </h3>
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {Object.values(selectedItems).map((item) => {
              const total =
                (parseFloat(item.price) || 0) * (parseInt(item.qty) || 0);
              return (
                <div
                  key={item.id}
                  className="flex flex-col md:flex-row gap-4 border rounded-lg p-4 bg-gray-50 dark:bg-gray-700"
                >
                  <div className="flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-48 h-36 object-contain rounded border"
                    />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-300 mb-2">
                        Mã: {item.id} | Bảo hành: {item.warranty_duration} năm
                      </p>
                    </div>

                    <div className="max-h-24 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-2 text-xs p-2">
                      {(item.attributes || []).map((attr, idx) => (
                        <div
                          key={idx}
                          className="text-gray-700 dark:text-gray-200"
                        >
                          <span className="font-medium">{attr.attribute}:</span>{" "}
                          {attr.value}
                        </div>
                      ))}
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
                          className="h-8 text-sm dark:bg-gray-600"
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
                          className="h-8 text-sm dark:bg-gray-600"
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

      {/* Layout 4 - Tổng tiền */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        {Object.keys(selectedItems).length > 0 ? (
          <>
            <h3 className="font-bold text-lg text-emerald-600">
              Tổng cộng: {calcTotal().toLocaleString()} VNĐ
            </h3>

            <div className="flex flex-col items-start md:items-end gap-2">
              {/* AlertDialog gắn liền nút */}
              <AlertDialog open={openDialog} onOpenChange={setOpenDialog}>
                <AlertDialogTrigger asChild>
                  <Button
                    className="bg-emerald-500 hover:bg-emerald-600 flex items-center gap-2"
                    disabled={loadingSubmit}
                  >
                    {loadingSubmit && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    {loadingSubmit ? "Đang xử lý..." : "Xác nhận nhập hàng"}
                  </Button>
                </AlertDialogTrigger>

                <AlertDialogContent className="dark:bg-gray-800">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xác nhận nhập hàng</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-500 dark:text-gray-400">
                      Bạn có chắc chắn muốn nhập{" "}
                      <b>{Object.keys(selectedItems).length}</b> thiết bị này
                      vào kho không?
                      <br />
                      Hành động này sẽ tạo hoá đơn nhập hàng mới.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="dark:border-gray-600 dark:text-gray-300">
                      Huỷ
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleConfirmImport}
                      disabled={loadingSubmit}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                      {loadingSubmit ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        "Xác nhận"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        ) : (
          <h3 className="font-bold text-lg text-gray-400 italic">
            Chưa chọn thiết bị nào để nhập hàng
          </h3>
        )}

        {/* 🔔 Thông báo (luôn hiển thị ngoài điều kiện selectedItems) */}
        {(successMsg || errorMsg) && (
          <div className="mt-4 w-full md:w-auto">
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
  );
}
