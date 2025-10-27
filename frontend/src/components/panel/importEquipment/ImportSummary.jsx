import { useMemo } from "react";
import { Button } from "@/components/ui/buttonn";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ImportSummary({
  selectedVendor,
  setSelectedVendor,
  selectedItems,
  setSelectedItems,
  vendorLatestPrices = {},
  checkedEquipmentId,
  onConfirm,
  isSuperAdmin,
  branchId,
}) {
  // Lấy danh sách thiết bị đã chọn để nhập
  const rows = useMemo(() => Object.values(selectedItems || {}), [selectedItems]);

  // ⚡ Update dữ liệu + kiểm tra không âm
  const updateField = (id, field, value) => {
    const num = Number(value);
    if (isNaN(num)) return;

    if (num < 0) {
      toast.warning("⚠️ Giá trị không được âm!");
      setSelectedItems((prev) => ({
        ...prev,
        [id]: { ...prev[id], [field]: 0 },
      }));
      return;
    }

    setSelectedItems((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: num },
    }));
  };

  // Tính tổng tiền
  const totalBeforeTax = rows.reduce((sum, r) => {
    const p = Number(r.price) || 0;
    const q = Number(r.qty) || 0;
    return sum + p * q;
  }, 0);
  const taxAmount = Math.round(totalBeforeTax * 0.08);
  const totalWithTax = totalBeforeTax + taxAmount;

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
      <h3 className="text-lg font-semibold text-emerald-600">
        📦 Tổng hợp & Xác nhận
      </h3>

      {/* Thông tin vendor & thiết bị đang kiểm */}
      <div className="grid md:grid-cols-3 gap-3 text-sm">
        <div className="p-3 rounded-lg border bg-gray-50 dark:bg-gray-700">
          <div className="text-gray-500">Thiết bị đang kiểm giá:</div>
          <div className="font-semibold">{checkedEquipmentId || "—"}</div>
        </div>
        <div className="p-3 rounded-lg border bg-gray-50 dark:bg-gray-700">
          <div className="text-gray-500">Vendor đang chọn:</div>
          <div className="font-semibold">{selectedVendor || "—"}</div>
        </div>
        <div className="p-3 rounded-lg border bg-gray-50 dark:bg-gray-700">
          <div className="text-gray-500">Giá gần nhất (vendor đã chọn):</div>
          <div className="font-semibold">
            {selectedVendor && typeof vendorLatestPrices[selectedVendor] === "number"
              ? `${vendorLatestPrices[selectedVendor].toLocaleString("vi-VN")} đ`
              : "—"}
          </div>
        </div>
      </div>

      {/* Danh sách dòng thiết bị được chọn */}
      {rows.length > 0 ? (
        <div className="space-y-3">
          {rows.map((item) => {
            const total = (Number(item.price) || 0) * (Number(item.qty) || 0);
            return (
              <div
                key={item.id}
                className="flex flex-col md:flex-row gap-4 border rounded-lg p-4 bg-gray-50 dark:bg-gray-700 transition hover:shadow-md"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-40 h-32 object-contain rounded border bg-white dark:bg-gray-900"
                />

                <div className="flex-1 flex flex-col">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500 mb-2">Mã: {item.id}</p>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs text-gray-400">Giá (VNĐ)</Label>
                      <Input
                        type="number"
                        value={item.price || ""}
                        onChange={(e) =>
                          updateField(item.id, "price", e.target.value)
                        }
                        placeholder="VD: 12000000"
                        className="h-8 text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-gray-400">Số lượng</Label>
                      <Input
                        type="number"
                        value={item.qty || ""}
                        onChange={(e) => updateField(item.id, "qty", e.target.value)}
                        placeholder="VD: 2"
                        className="h-8 text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-gray-400">Bảo hành (năm)</Label>
                      <Input
                        type="number"
                        value={item.warranty_duration || ""}
                        onChange={(e) =>
                          updateField(item.id, "warranty_duration", e.target.value)
                        }
                        placeholder="VD: 2"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>

                  <div className="text-red-600 font-semibold text-sm mt-2">
                    Tổng: {total.toLocaleString("vi-VN")} VNĐ
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-sm text-gray-500 italic">
          Chưa chọn dòng thiết bị nào.
        </div>
      )}

      {/* Tổng cộng và xác nhận */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg border bg-gray-50 dark:bg-gray-700">
        <div className="space-y-1 text-sm">
          <div>
            Tổng (chưa thuế):{" "}
            <b>{totalBeforeTax.toLocaleString("vi-VN")} VNĐ</b>
          </div>
          <div>
            Thuế (8%): <b>{taxAmount.toLocaleString("vi-VN")} VNĐ</b>
          </div>
          <div className="text-emerald-600 font-bold text-base">
            Tổng cộng sau thuế: {totalWithTax.toLocaleString("vi-VN")} VNĐ
          </div>
        </div>

        <Button
          className="bg-gradient-to-r from-emerald-500 to-purple-500 hover:opacity-90 text-white font-semibold px-6 py-2 rounded-xl shadow-md transition"
          disabled={!rows.length}
          onClick={() =>
            onConfirm?.({
              selectedVendor,
              selectedItems,
              branchId,
            })
          }
        >
          Nhập thiết bị
        </Button>
      </div>
    </div>
  );
}
