import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/buttonn";
import { Label } from "@/components/ui/label";
import {
  Settings2,
  RotateCcw,
  PlusCircle,
  Filter,
  AlertCircle,
} from "lucide-react";

export default function AddCard3({
  formData,
  attributes,
  typeAttributes,
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
  addNewAttribute,
  loadingAdd,
  clearAllChecked,
  clearAllInputs,
  spinClearChecked,
  spinClearInputs,
  errorMsg,
  successMsg,
}) {
  const poolForPick = formData.type ? typeAttributes : attributes;
  const filteredPickPool = useMemo(() => {
    const q = searchAttr.trim().toLowerCase();
    return q
      ? poolForPick.filter((a) => a.name.toLowerCase().includes(q))
      : poolForPick;
  }, [searchAttr, poolForPick]);

  return (
    <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b dark:border-gray-700 bg-gradient-to-r from-emerald-100/60 via-white to-transparent dark:from-emerald-900/30">
        <Settings2 className="w-4 h-4 text-emerald-500" />
        <h3 className="text-[15px] font-semibold text-emerald-700 dark:text-emerald-300">
          Thông số kỹ thuật
        </h3>
      </div>

      <div className="p-4 space-y-3">
        {/* Tabs */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-gray-50 dark:bg-gray-900">
            <button
              type="button"
              onClick={() => setAttrTab("pick")}
              className={`px-3 py-1.5 text-xs rounded-md transition ${
                attrTab === "pick"
                  ? "bg-white dark:bg-gray-800 shadow text-emerald-600"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              Chọn thông số
            </button>
            <button
              type="button"
              onClick={() => setAttrTab("values")}
              className={`px-3 py-1.5 text-xs rounded-md transition ${
                attrTab === "values"
                  ? "bg-white dark:bg-gray-800 shadow text-emerald-600"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              Nhập giá trị
            </button>
          </div>

          {/* Thêm thông số mới */}
          <div className="ml-auto flex items-center gap-2">
            {!showAddAttr ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (!formData?.type) return; // chặn nếu chưa có loại
                  setShowAddAttr(true);
                }}
                disabled={!formData?.type} // 🔹 disable khi chưa chọn loại
                className={`h-8 text-xs flex items-center gap-1 transition ${
                  !formData?.type
                    ? "opacity-50 cursor-not-allowed text-gray-400"
                    : "text-emerald-600 hover:text-emerald-700"
                }`}
                title={
                  !formData?.type
                    ? "Vui lòng chọn nhóm và loại thiết bị trước khi thêm thông số mới"
                    : "Thêm thông số mới"
                }
              >
                <PlusCircle className="w-4 h-4" /> Thêm thông số mới
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Tên thông số"
                  value={newAttr}
                  onChange={(e) => setNewAttr(e.target.value)}
                  className="h-8 text-xs w-48"
                />
                <Button
                  type="button"
                  onClick={addNewAttribute}
                  disabled={loadingAdd}
                  className="h-8 text-xs bg-emerald-500 hover:bg-emerald-600"
                >
                  {loadingAdd ? "Đang thêm..." : "Thêm"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs"
                  onClick={() => {
                    setShowAddAttr(false);
                    setNewAttr("");
                  }}
                >
                  Hủy
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="p-2 rounded border text-xs bg-emerald-50 border-emerald-200 text-emerald-700">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="p-2 rounded border text-xs bg-red-50 border-red-200 text-red-700">
            {errorMsg}
          </div>
        )}

        {/* Nếu chưa chọn loại */}
        {!formData.type ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400 text-sm gap-2">
            <AlertCircle className="w-5 h-5 text-emerald-500" />
            <p>
              Hãy chọn nhóm và loại thiết bị trước để xem thông số kỹ thuật.
            </p>
          </div>
        ) : attrTab === "pick" ? (
          <>
            {/* Tool line */}
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
                      filteredPickPool.map((a) => [a.name, ""])
                    )
                  )
                }
                className="h-8 text-xs flex items-center gap-1"
              >
                <Filter className="w-3.5 h-3.5" />
                Chọn tất cả
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

            {/* Danh sách thông số */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 max-h-[260px] overflow-y-auto border rounded-md p-3 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/60">
              {filteredPickPool.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">
                  Không tìm thấy thông số nào
                </p>
              ) : (
                filteredPickPool.map((attr) => (
                  <label
                    key={attr.id}
                    className={`flex items-center gap-2 text-xs px-2 py-1 rounded cursor-pointer ${
                      selectedAttrs[attr.name] !== undefined
                        ? "bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="accent-emerald-500"
                      checked={selectedAttrs[attr.name] !== undefined}
                      onChange={() => {
                        setSelectedAttrs((prev) => {
                          const next = { ...prev };
                          if (next[attr.name] !== undefined)
                            delete next[attr.name];
                          else next[attr.name] = "";
                          return next;
                        });
                      }}
                    />
                    <span className="truncate">{attr.name}</span>
                  </label>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            {/* Tab nhập giá trị */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {Object.keys(selectedAttrs).length} thông số đã chọn
              </span>
              <div className="ml-auto flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={clearAllInputs}
                  className="h-8 text-xs flex items-center gap-1"
                >
                  <RotateCcw
                    className={`w-4 h-4 ${
                      spinClearInputs ? "animate-spin" : ""
                    }`}
                  />
                  Clear Inputs
                </Button>
              </div>
            </div>

            {/* Form nhập giá trị */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[320px] overflow-y-auto p-3 border rounded-md dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/60">
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
          </>
        )}
      </div>
    </div>
  );
}
