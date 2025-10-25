import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/buttonn";
import { Label } from "@/components/ui/label";
import {
  Settings2,
  RotateCcw,
  Filter,
  AlertCircle,
  PlusCircle,
} from "lucide-react";
import { toast } from "sonner";
import AttributeService from "@/services/attributeService";
import TypeAttributeService from "@/services/typeAttributeService";

export default function AddCard3({
  formData,
  attributes,
  setAttributes,
  typeAttributes,
  setTypeAttributes,
  selectedAttrs,
  setSelectedAttrs,
  searchAttr,
  setSearchAttr,
  attrTab,
  setAttrTab,
  showAddAttr,
  setShowAddAttr,
  newAttr,
  setNewAttr,
  loadingAdd,
  setLoadingAdd,
  clearAllChecked,
  clearAllInputs,
  spinClearChecked,
  spinClearInputs,
}) {
  // 🔹 Lọc danh sách thông số hiện có trong type
  const filteredTypeAttributes = useMemo(() => {
    const q = searchAttr.trim().toLowerCase();
    return q
      ? typeAttributes.filter((a) => a.name?.toLowerCase().includes(q))
      : typeAttributes;
  }, [searchAttr, typeAttributes]);

  // 🔹 Danh sách attribute có sẵn nhưng chưa gắn type
  const availableAttributes = useMemo(() => {
    const used = new Set(typeAttributes.map((t) => t.id));
    return attributes.filter((a) => !used.has(a.id));
  }, [attributes, typeAttributes]);

  // 🔹 Lọc trong danh sách attribute có sẵn
  const filteredAvailable = useMemo(() => {
    const q = searchAttr.trim().toLowerCase();
    return q
      ? availableAttributes.filter((a) => a.name?.toLowerCase().includes(q))
      : availableAttributes;
  }, [searchAttr, availableAttributes]);

  // 🧩 Thêm nhiều attribute vào type (có kèm value)
  const handleBulkAdd = async () => {
    const selectedList = Object.entries(selectedAttrs).map(([name, value]) => {
      const attr = attributes.find(
        (a) => a.name.toLowerCase() === name.toLowerCase()
      );
      return attr ? { id: attr.id, name: attr.name, value } : { name, value };
    });

    if (!selectedList.length) return;

    try {
      setLoadingAdd(true);
      await TypeAttributeService.bulkAddAttributesToType(
        formData.type,
        selectedList
      );
      toast.success("✅ Đã thêm thông số vào loại thiết bị!");
      const updated = await TypeAttributeService.getAttributesByType(
        formData.type
      );
      setTypeAttributes(updated || []);
      setShowAddAttr(false);
      setSelectedAttrs({});
    } catch (err) {
      toast.error(err?.response?.data?.error || "Không thể thêm thông số!");
    } finally {
      setLoadingAdd(false);
    }
  };

  // 🧩 Tạo attribute mới hoàn toàn
  const handleAddNewAttribute = async () => {
    const trimmed = newAttr.trim();
    if (!trimmed) return;
    try {
      setLoadingAdd(true);
      const created = await AttributeService.create({ name: trimmed });
      setAttributes((prev) => [...prev, created]);
      toast.success(`🎉 Đã thêm thông số "${trimmed}"!`);
      setNewAttr("");
    } catch (err) {
      toast.error("Không thể thêm thông số mới!");
    } finally {
      setLoadingAdd(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b dark:border-gray-700 bg-gradient-to-r from-emerald-100/60 dark:from-emerald-900/30">
        <Settings2 className="w-4 h-4 text-emerald-500" />
        <h3 className="text-[15px] font-semibold text-emerald-700 dark:text-emerald-300">
          Thông số kỹ thuật
        </h3>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={async () => {
            const all = await AttributeService.getAll();
            setAttributes(all || []);
            setShowAddAttr(true);
          }}
          disabled={!formData?.type}
          className="ml-auto h-8 text-xs flex items-center gap-1 text-emerald-600 hover:text-emerald-700"
        >
          <PlusCircle className="w-4 h-4" /> Thêm thông số mới
        </Button>
      </div>

      {/* Nội dung */}
      <div className="p-4 space-y-3">
        {/* Nếu chưa chọn loại thiết bị */}
        {!formData.type ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400 text-sm gap-2">
            <AlertCircle className="w-5 h-5 text-emerald-500" />
            <p>
              Hãy chọn nhóm và loại thiết bị trước để xem thông số kỹ thuật.
            </p>
          </div>
        ) : showAddAttr ? (
          // === KHU VỰC THÊM THÔNG SỐ ===
          <div className="space-y-3">
            {/* Thanh tìm kiếm + thêm nhanh */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="Tìm thông số có sẵn..."
                value={searchAttr}
                onChange={(e) => setSearchAttr(e.target.value)}
                className="h-8 text-xs w-64"
              />
              <Input
                placeholder="Tên thông số mới..."
                value={newAttr}
                onChange={(e) => setNewAttr(e.target.value)}
                className="h-8 text-xs w-48"
              />
              <Button
                onClick={handleAddNewAttribute}
                disabled={loadingAdd || !newAttr.trim()}
                className="h-8 text-xs bg-emerald-500 hover:bg-emerald-600"
              >
                {loadingAdd ? "Đang thêm..." : "Thêm mới"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddAttr(false)}
                className="h-8 text-xs ml-auto"
              >
                Đóng
              </Button>
            </div>

            {/* Danh sách attribute có sẵn */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[260px] overflow-y-auto border rounded-md p-3 dark:border-gray-700">
              {filteredAvailable.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">
                  Không còn thông số nào để thêm.
                </p>
              ) : (
                filteredAvailable.map((attr) => (
                  <label
                    key={attr.id}
                    className={`flex items-center gap-2 text-xs px-2 py-1 rounded cursor-pointer ${
                      selectedAttrs[attr.name]
                        ? "bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="accent-emerald-500"
                      checked={selectedAttrs[attr.name] !== undefined}
                      onChange={() =>
                        setSelectedAttrs((prev) => {
                          const next = { ...prev };
                          if (attr.name in next) {
                            // ✅ Nếu đã có key thì bỏ tick
                            delete next[attr.name];
                          } else {
                            // ✅ Nếu chưa có thì tick chọn
                            next[attr.name] = "";
                          }
                          return next;
                        })
                      }
                    />
                    <span className="truncate">{attr.name}</span>
                  </label>
                ))
              )}
            </div>

            {/* Ô nhập giá trị cho các thông số đã chọn */}
            {Object.keys(selectedAttrs).length > 0 && (
              <div className="border rounded-md p-3 bg-gray-50 dark:bg-gray-900/40 space-y-2 mt-3">
                <h4 className="text-xs font-semibold text-emerald-600">
                  Nhập giá trị cho {Object.keys(selectedAttrs).length} thông số:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[240px] overflow-y-auto">
                  {Object.entries(selectedAttrs).map(([attr, val]) => (
                    <div key={attr} className="space-y-1">
                      <Label className="text-xs">{attr}</Label>
                      <Input
                        placeholder={`Nhập ${attr}`}
                        value={val}
                        onChange={(e) =>
                          setSelectedAttrs((prev) => ({
                            ...prev,
                            [attr]: e.target.value,
                          }))
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nút xác nhận thêm */}
            <div className="flex justify-end">
              <Button
                onClick={handleBulkAdd}
                disabled={loadingAdd || Object.keys(selectedAttrs).length === 0}
                className="h-8 text-xs bg-emerald-500 hover:bg-emerald-600"
              >
                {loadingAdd ? "Đang thêm..." : "Thêm vào loại thiết bị"}
              </Button>
            </div>
          </div>
        ) : attrTab === "pick" ? (
          // === TAB CHỌN THÔNG SỐ ===
          <>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Tìm thông số..."
                value={searchAttr}
                onChange={(e) => setSearchAttr(e.target.value)}
                className="h-8 text-xs w-56"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setSelectedAttrs(
                    Object.fromEntries(
                      filteredTypeAttributes.map((a) => [a.name, ""])
                    )
                  )
                }
                className="h-8 text-xs flex items-center gap-1"
              >
                <Filter className="w-3.5 h-3.5" /> Chọn tất cả
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={clearAllChecked}
                className="h-8 text-xs flex items-center gap-1"
              >
                <RotateCcw
                  className={`w-4 h-4 ${
                    spinClearChecked ? "animate-spin" : ""
                  }`}
                />
                Clear Checked
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 max-h-[260px] overflow-y-auto border rounded-md p-3 dark:border-gray-700">
              {filteredTypeAttributes.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">
                  Không tìm thấy thông số nào
                </p>
              ) : (
                filteredTypeAttributes.map((attr) => (
                  <label
                    key={attr.id}
                    className={`flex items-center gap-2 text-xs px-2 py-1 rounded cursor-pointer ${
                      selectedAttrs[attr.name]
                        ? "bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="accent-emerald-500"
                      checked={selectedAttrs[attr.name] !== undefined}
                      onChange={() =>
                        setSelectedAttrs((prev) => {
                          const next = { ...prev };
                          if (attr.name in next) {
                            // ✅ Nếu đã có key thì bỏ tick
                            delete next[attr.name];
                          } else {
                            // ✅ Nếu chưa có thì tick chọn
                            next[attr.name] = "";
                          }
                          return next;
                        })
                      }
                    />
                    <span className="truncate">{attr.name}</span>
                  </label>
                ))
              )}
            </div>

            {/* 🟢 Thêm phần nhập giá trị ngay bên dưới tab pick */}
            {Object.keys(selectedAttrs).length > 0 && (
              <div className="border rounded-md p-3 bg-gray-50 dark:bg-gray-900/40 space-y-2 mt-3">
                <h4 className="text-xs font-semibold text-emerald-600">
                  Nhập giá trị cho {Object.keys(selectedAttrs).length} thông số:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[240px] overflow-y-auto">
                  {Object.entries(selectedAttrs).map(([attr, val]) => (
                    <div key={attr} className="space-y-1">
                      <Label className="text-xs">{attr}</Label>
                      <Input
                        placeholder={`Nhập ${attr}`}
                        value={val}
                        onChange={(e) =>
                          setSelectedAttrs((prev) => ({
                            ...prev,
                            [attr]: e.target.value,
                          }))
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          // === TAB NHẬP GIÁ TRỊ ===
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {Object.keys(selectedAttrs).length} thông số đã chọn
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllInputs}
                className="h-8 text-xs flex items-center gap-1"
              >
                <RotateCcw
                  className={`w-4 h-4 ${spinClearInputs ? "animate-spin" : ""}`}
                />
                Clear Inputs
              </Button>
            </div>

            {/* Ô nhập giá trị cho các thông số đã chọn */}
            {Object.keys(selectedAttrs).length > 0 && (
              <div className="border rounded-md p-3 bg-gray-50 dark:bg-gray-900/40 space-y-2 mt-3">
                <h4 className="text-xs font-semibold text-emerald-600">
                  Nhập giá trị cho {Object.keys(selectedAttrs).length} thông số:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[240px] overflow-y-auto">
                  {Object.entries(selectedAttrs).map(([attr, val]) => (
                    <div key={attr} className="space-y-1">
                      <Label className="text-xs">{attr}</Label>
                      <Input
                        placeholder={`Nhập ${attr}`}
                        value={val}
                        onChange={(e) =>
                          setSelectedAttrs((prev) => ({
                            ...prev,
                            [attr]: e.target.value,
                          }))
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
