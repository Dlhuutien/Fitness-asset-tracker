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
  // 🧮 Danh sách thiết bị được chọn
  const rows = useMemo(
    () => Object.values(selectedItems || {}),
    [selectedItems]
  );

  const updateField = (id, field, value) => {
    // Nếu là ngày BH → không parse số
    if (field === "warranty_start_date") {
      setSelectedItems((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          [field]: value,
          [`${field}Error`]: value ? "" : "Vui lòng chọn ngày bảo hành",
        },
      }));
      return;
    }

    const parsed = Number(value);

    // Không cho nhập chữ
    if (isNaN(parsed)) return;

    // ❗ KIỂM TRA ÂM — GHI LỖI VÀ TRẢ VỀ
    if (parsed < 0) {
      let label = "";
      if (field === "price") label = "Giá nhập";
      if (field === "qty") label = "Số lượng";
      if (field === "warranty_duration") label = "Số năm bảo hành";

      setSelectedItems((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          [field]: 0,
          [`${field}Error`]: `${label} không được nhỏ hơn 0`,
        },
      }));
      return;
    }

    // ❗ RÀNG BUỘC SỐ LƯỢNG 50
    if (field === "qty" && parsed > 50) {
      setSelectedItems((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          qty: 50,
          qtyError: "Số lượng tối đa là 50",
        },
      }));
      return;
    }

    // Cập nhật bình thường (và xóa lỗi nếu hợp lệ)
    setSelectedItems((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: parsed,
        [`${field}Error`]: "",
      },
    }));
  };

  // 💰 Tính tổng
  const totalBeforeTax = rows.reduce((sum, r) => {
    const p = Number(r.price) || 0;
    const q = Number(r.qty) || 0;
    return sum + p * q;
  }, 0);
  const taxAmount = Math.round(totalBeforeTax * 0.08);
  const totalWithTax = totalBeforeTax + taxAmount;

  // ============================
  // 🔒 RÀNG BUỘC ĐIỀU KIỆN BẮT BUỘC ĐỂ ĐƯỢC LƯU
  // ============================
  const canSave = (() => {
    // ❗ Chưa chọn nhà cung cấp
    if (!selectedVendor) return false;

    // ❗ Chưa chọn chi nhánh
    if (!branchId) return false;

    // ❗ Không có thiết bị nào
    if (rows.length === 0) return false;

    // ❗ Kiểm tra từng dòng thiết bị
    for (const item of rows) {
      if (!item.price || Number(item.price) <= 0) return false;
      if (!item.qty || Number(item.qty) <= 0) return false;
      if (!item.warranty_start_date) return false;
      if (!item.warranty_duration || Number(item.warranty_duration) <= 0)
        return false;
    }

    return true;
  })();

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
      <h3 className="text-lg font-semibold text-emerald-600">
        📦 Tổng hợp & Xác nhận
      </h3>

      {/* === Danh sách thiết bị đã chọn === */}
      {rows.length > 0 ? (
        <div className="space-y-3 max-h-[60vh] md:max-h-none overflow-y-auto overscroll-contain pr-1">
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

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500 mb-2">Mã: {item.id}</p>
                  </div>

                  {/* === Form nhập thông tin === */}
                  <div className="grid sm:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs text-gray-400">
                        Giá nhập (VNĐ)
                      </Label>
                      <Input
                        type="number"
                        value={item.price || ""}
                        onChange={(e) =>
                          updateField(item.id, "price", e.target.value)
                        }
                        placeholder="VD: 12000000"
                        className="h-8 text-sm"
                      />
                      {item.priceError && (
                        <p className="text-red-500 text-xs mt-1">
                          {item.priceError}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs text-gray-400">
                        Số lượng (tối đa 1 lần nhập được 50 thiết bị)
                      </Label>
                      <Input
                        type="number"
                        value={item.qty || ""}
                        onChange={(e) =>
                          updateField(item.id, "qty", e.target.value)
                        }
                        placeholder="VD: 2"
                        className="h-8 text-sm"
                      />
                      {item.qtyError && (
                        <p className="text-red-500 text-xs mt-1">
                          {item.qtyError}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs text-gray-400">
                        Ngày bắt đầu bảo hành
                      </Label>
                      <Input
                        type="date"
                        value={item.warranty_start_date || ""}
                        onChange={(e) =>
                          updateField(
                            item.id,
                            "warranty_start_date",
                            e.target.value
                          )
                        }
                        className="h-8 text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-gray-400">
                        Số năm bảo hành
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        value={item.warranty_duration || ""}
                        onChange={(e) =>
                          updateField(
                            item.id,
                            "warranty_duration",
                            e.target.value
                          )
                        }
                        placeholder="VD: 2"
                        className="h-8 text-sm"
                      />
                      {item.warranty_durationError && (
                        <p className="text-red-500 text-xs mt-1">
                          {item.warranty_durationError}
                        </p>
                      )}
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

      {/* === Tổng kết và xác nhận === */}
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

        <div className="flex gap-2">
          <Button
            className={
              "font-semibold px-6 py-2 rounded-xl shadow-md transition " +
              (canSave
                ? "bg-gradient-to-r from-emerald-500 to-purple-500 hover:opacity-90 text-white"
                : "bg-gray-400 text-white cursor-not-allowed opacity-60")
            }
            disabled={!canSave}
            onClick={() => {
              if (!canSave) {
                toast.error("⚠️ Vui lòng nhập đầy đủ thông tin bắt buộc!");
                return;
              }
              onConfirm();
            }}
          >
            Lưu
          </Button>
          <Button
            type="button"
            onClick={() => {
              setSelectedItems({});
            }}
            className="md:hidden flex-1 h-10 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg"
          >
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}
