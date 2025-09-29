import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/buttonn";
import { Label } from "@/components/ui/label";

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

  const toggleSelectItem = (item) => {
    setSelectedItems((prev) => {
      const newItems = { ...prev };
      if (newItems[item.code]) {
        delete newItems[item.code];
      } else {
        newItems[item.code] = { ...item, price: "", qty: "" };
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
              <option key={v} value={v}>
                {v}
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
                {selectedVendor &&
                  equipmentData[selectedVendor]?.map((item) => (
                    <tr key={item.code} className="border-t">
                      <td className="p-2 text-center">
                        <input
                          type="checkbox"
                          checked={!!selectedItems[item.code]}
                          onChange={() => toggleSelectItem(item)}
                        />
                      </td>
                      <td className="p-2">{item.code}</td>
                      <td className="p-2">{item.group}</td>
                      <td className="p-2">{item.type}</td>
                      <td className="p-2">{item.name}</td>
                      <td className="p-2">{item.warranty}</td>
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
                        Mã: {item.code} | Bảo hành: {item.warranty}
                      </p>
                    </div>

                    {/* Scroll attributes */}
                    <div className="max-h-24 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-2 text-xs p-2">
                      {Object.entries(item.attributes).map(([k, v]) => (
                        <div
                          key={k}
                          className="text-gray-700 dark:text-gray-200"
                        >
                          <span className="font-medium">{k}:</span> {v}
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
                            updateField(item.code, "price", e.target.value)
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
                            updateField(item.code, "qty", e.target.value)
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
          <Button className="bg-emerald-500 hover:bg-emerald-600">
            Xác nhận nhập hàng
          </Button>
        </div>
      )}
    </div>
  );
}
