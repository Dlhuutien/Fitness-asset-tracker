import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/buttonn";
import { Label } from "@/components/ui/label";

import VendorService from "@/services/vendorService";
import EquipmentService from "@/services/equipmentService";
import EquipmentUnitService from "@/services/equipmentUnitService";

import InvoiceService from "@/services/invoiceService";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Fake data vendors + equipments
const vendors = ["Technogym", "Matrix Fitness"];

const equipmentData = {
  Technogym: [
    {
      code: "TG-1",
      name: "Technogym Treadmill 1",
      warranty: "2 năm",
      group: "Cardio",
      type: "Treadmill",
      image: "https://via.placeholder.com/150x100.png?text=Treadmill+1",
      attributes: {
        "Độ dốc": "0-15%",
        "Công suất": "3.5 HP",
        "Trọng lượng": "120kg",
        "Kích thước": "200×90×150cm",
      },
    },
    {
      code: "TG-2",
      name: "Technogym Treadmill 2",
      warranty: "2 năm",
      group: "Cardio",
      type: "Treadmill",
      image: "https://via.placeholder.com/150x100.png?text=Treadmill+2",
      attributes: {
        "Độ dốc": "0-20%",
        "Công suất": "4 HP",
        "Trọng lượng": "130kg",
        "Kích thước": "210×95×155cm",
      },
    },
  ],
  "Matrix Fitness": [
    {
      code: "MT-1",
      name: "Matrix Bike 1",
      warranty: "1 năm",
      group: "Cardio",
      type: "Bike",
      image: "https://via.placeholder.com/150x100.png?text=Bike+1",
      attributes: {
        "Kháng lực": "32 levels",
        "Trọng lượng": "70kg",
        "Kích thước": "110×50×140cm",
      },
    },
    {
      code: "MT-2",
      name: "Matrix Bike 2",
      warranty: "1 năm",
      group: "Cardio",
      type: "Bike",
      image: "https://via.placeholder.com/150x100.png?text=Bike+2",
      attributes: {
        "Kháng lực": "24 levels",
        "Trọng lượng": "65kg",
        "Kích thước": "105×48×138cm",
      },
    },
  ],
};

export default function EquipmentImportPage() {
  const [selectedVendor, setSelectedVendor] = useState("");
  const [selectedItems, setSelectedItems] = useState({});

  const [vendors, setVendors] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [equipmentUnits, setEquipmentUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  const [loadingSubmit, setLoadingSubmit] = useState(false); // ✅ loading khi submit

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vendorRes, equipRes, unitRes] = await Promise.all([
          VendorService.getAll(),
          EquipmentService.getAll(),
          EquipmentUnitService.getAll(),
        ]);

        console.log("✅ Vendor list:", vendorRes);
        console.log("✅ Equipment list:", equipRes);
        console.log("✅ EquipmentUnit list:", unitRes);

        setVendors(vendorRes);
        setEquipments(equipRes);
        setEquipmentUnits(unitRes);
      } catch (err) {
        console.error("❌ Lỗi khi load dữ liệu:", err);
        toast.error("Không thể tải dữ liệu từ server!");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleSelectItem = (item) => {
    setSelectedItems((prev) => {
      const newItems = { ...prev };

      // Normalize attributes
      let attrs = [];
      if (Array.isArray(item.attributes)) {
        attrs = item.attributes; // từ API
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

  const calcTotal = () => {
    return Object.values(selectedItems).reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const qty = parseInt(item.qty) || 0;
      return sum + price * qty;
    }, 0);
  };

  const handleConfirmImport = async () => {
    try {
      const items = Object.values(selectedItems).map((item) => ({
        equipment_id: item.id, // từ DB
        branch_id: "GV", // ✅ set cứng chi nhánh GV
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

      // Reset sau khi nhập hàng
      setSelectedItems({});
    } catch (err) {
      console.error("❌ Lỗi khi tạo invoice:", err);
      toast.error(err.error || "Có lỗi khi tạo invoice");
    } finally {
      setLoadingSubmit(false);
    }
  };

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
            onChange={(e) => {
              setSelectedVendor(e.target.value);
              setSelectedItems({});
            }}
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
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow col-span-3">
          <h3 className="font-semibold text-emerald-600 mb-2">
            Danh sách loại thiết bị
          </h3>
          <div className="overflow-y-auto max-h-48 border rounded">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="p-2">Chọn</th>
                  <th className="p-2">Mã thẻ kho</th>
                  <th className="p-2">Nhóm</th>
                  <th className="p-2">Loại</th>
                  <th className="p-2">Tên</th>
                  <th className="p-2">Bảo hành</th>
                </tr>
              </thead>
              <tbody>
                {equipments
                  .filter((eq) => eq.vendor_id === selectedVendor)
                  .map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-2 text-center">
                        <input
                          type="checkbox"
                          checked={!!selectedItems[item.id]}
                          onChange={() => toggleSelectItem(item)}
                        />
                      </td>
                      <td className="p-2">{item.id}</td>
                      <td className="p-2">{item.main_name}</td>
                      <td className="p-2">{item.type_name}</td>
                      <td className="p-2">{item.name}</td>
                      <td className="p-2">{item.warranty_duration} năm</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
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
                  key={item.code}
                  className="flex flex-col md:flex-row gap-4 border rounded-lg p-4 bg-gray-50 dark:bg-gray-700"
                >
                  {/* Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-48 h-36 object-contain rounded border"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-300 mb-2">
                        Mã: {item.id} | Bảo hành: {item.warranty_duration} năm
                      </p>
                    </div>

                    {/* Attributes */}
                    <div className="max-h-24 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-2 text-xs p-2">
                      {item.attributes.map((attr, idx) => (
                        <div
                          key={idx}
                          className="text-gray-700 dark:text-gray-200"
                        >
                          <span className="font-medium">{attr.attribute}:</span>{" "}
                          {attr.value}
                        </div>
                      ))}
                    </div>

                    {/* Price + Qty */}
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
