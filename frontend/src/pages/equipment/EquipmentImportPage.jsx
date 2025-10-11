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
import { Loader2 } from "lucide-react";

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

  const [search, setSearch] = useState("");

  // Excel filter states
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

  // Khi đổi vendor: reset lựa chọn + bộ lọc + search
  const handleChangeVendor = (val) => {
    setSelectedVendor(val);
    setSelectedItems({});
    setSearch("");
    setFilters({
      id: [],
      name: [],
      main_name: [],
      type_name: [],
      warranty_duration: [],
    });
  };

  const toggleSelectItem = (item) => {
    setSelectedItems((prev) => {
      const newItems = { ...prev };

      // Chuẩn hoá attributes -> mảng {attribute, value}
      let attrs = [];
      if (Array.isArray(item.attributes)) {
        attrs = item.attributes;
      } else if (item.attributes && typeof item.attributes === "object") {
        attrs = Object.entries(item.attributes).map(([k, v]) => ({
          attribute: k,
          value: v,
        }));
      }

      if (newItems[item.id]) {
        delete newItems[item.id];
      } else {
        newItems[item.id] = { ...item, attributes: attrs, price: "", qty: "" };
      }
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
      const items = Object.values(selectedItems).map((item) => ({
        equipment_id: item.id,
        branch_id: "GV", // set cứng demo
        quantity: parseInt(item.qty) || 0,
        cost: parseFloat(item.price) || 0,
      }));

      if (items.length === 0) {
        toast.error("Chưa chọn thiết bị nào!");
        return;
      }

      setLoadingSubmit(true);
      const res = await InvoiceService.create({ items });
      toast.success("Tạo invoice thành công!");
      console.log("✅ Invoice created:", res);

      // invalidate cache
      mutate(`${API}equipmentUnit`);

      // reset
      setSelectedItems({});
    } catch (err) {
      console.error("❌ Lỗi khi tạo invoice:", err);
      toast.error(err.error || "Có lỗi khi tạo invoice");
    } finally {
      setLoadingSubmit(false);
    }
  };

  // Danh sách thiết bị theo vendor đã chọn
  const vendorEquipments = useMemo(() => {
    if (!selectedVendor) return [];
    return (equipments || []).filter((eq) => eq.vendor_id === selectedVendor);
  }, [equipments, selectedVendor]);

  // Unique values CHỈ dựa trên vendorEquipments
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

  // Lọc theo search + các cột (chỉ khi có vendor)
  const filteredEquipments = useMemo(() => {
    if (!selectedVendor) return [];

    let list = vendorEquipments;

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (eq) =>
          eq.name?.toLowerCase().includes(q) ||
          eq.main_name?.toLowerCase().includes(q) ||
          eq.type_name?.toLowerCase().includes(q)
      );
    }

    // Lọc theo từng cột
    return list.filter((e) => {
      const match = Object.keys(filters).every((key) => {
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
      });
      return match;
    });
  }, [vendorEquipments, selectedVendor, search, filters]);

  if (loading)
    return (
      <div className="p-6 text-gray-500 dark:text-gray-300 animate-pulse">
        Đang tải dữ liệu...
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      {/* Layout 1 + 2 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Vendor select */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow col-span-1">
          <h3 className="font-semibold text-emerald-600 mb-2">
            Chọn nhà cung cấp
          </h3>
          <select
            className="w-full border rounded p-2 text-sm dark:bg-gray-700 dark:text-gray-100"
            value={selectedVendor}
            onChange={(e) => handleChangeVendor(e.target.value)}
          >
            <option value="">-- Chọn --</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        {/* Equipment list */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow col-span-3 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-emerald-600">
              Danh sách loại thiết bị
            </h3>

            {/* Chỉ hiển thị thanh tìm + hiển thị cột khi đã chọn vendor */}
            {selectedVendor && (
              <div className="flex items-center gap-3">
                <Input
                  placeholder="Tìm kiếm thiết bị..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-60 h-8 text-sm dark:bg-gray-700 dark:text-gray-100"
                />
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

          {/* Nếu chưa chọn vendor -> hiển thị nhắc */}
          {!selectedVendor ? (
            <div className="border rounded p-6 text-center text-sm text-gray-600 dark:text-gray-300">
              Hãy <span className="font-semibold">chọn nhà cung cấp</span> để
              hiển thị danh sách thiết bị.
            </div>
          ) : (
            <div className="overflow-y-auto max-h-64 border rounded">
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
                          onChange={(v) =>
                            setFilters((p) => ({ ...p, name: v }))
                          }
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
                      {visibleColumns.name && (
                        <TableCell>{item.name}</TableCell>
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
                        <div key={idx} className="text-gray-700 dark:text-gray-200">
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
      {Object.keys(selectedItems).length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex justify-between items-center">
          <h3 className="font-bold text-lg text-emerald-600">
            Tổng cộng: {calcTotal().toLocaleString()} VNĐ
          </h3>
          <Button
            className="bg-emerald-500 hover:bg-emerald-600 flex items-center gap-2"
            onClick={handleConfirmImport}
            disabled={loadingSubmit}
          >
            {loadingSubmit && <Loader2 className="w-4 h-4 animate-spin" />}
            {loadingSubmit ? "Đang xử lý..." : "Xác nhận nhập hàng"}
          </Button>
        </div>
      )}
    </div>
  );
}
