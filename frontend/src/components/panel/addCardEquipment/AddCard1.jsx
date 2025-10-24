import { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/buttonn";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ClipboardList, Image as ImageIcon, PlusCircle, Search, X } from "lucide-react";

export default function AddCard1({
  formData,
  setFormData,
  handleFileChange,
  groups = [],
  types = [],
  setOpenQuickAddGroup,
  setOpenQuickAddType,
}) {
  const [searchGroup, setSearchGroup] = useState("");
  const [searchType, setSearchType] = useState("");

  const filteredGroups = useMemo(() => {
    const q = searchGroup.trim().toLowerCase();
    return q ? groups.filter((g) => g.name.toLowerCase().includes(q)) : groups;
  }, [groups, searchGroup]);

  const filteredTypes = useMemo(() => {
    const list = types.filter(
      (t) => !formData.group || t.category_main_id === formData.group
    );
    const q = searchType.trim().toLowerCase();
    return q ? list.filter((t) => t.name.toLowerCase().includes(q)) : list;
  }, [types, formData.group, searchType]);

  return (
    <div className="bg-white/90 dark:bg-gray-800/90 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b dark:border-gray-700 bg-gradient-to-r from-emerald-100/70 via-white to-transparent dark:from-emerald-900/30">
        <ClipboardList className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        <h3 className="text-[15px] font-semibold text-emerald-700 dark:text-emerald-300">
          Thông tin chung & Phân loại dòng thiết bị
        </h3>
      </div>

      {/* Body */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* --- LEFT 2/3 --- */}
        <div className="lg:col-span-2 flex flex-col justify-between space-y-5">
          {/* Tên thiết bị */}
          <div>
            <Label className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">
              Tên dòng thiết bị <span className="text-red-500">*</span>
            </Label>
            <Input
              name="name"
              placeholder="VD: Treadmill Aura 500"
              value={formData.name || ""}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              className="h-10 mt-1 text-[14px] border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Mô tả */}
          <div>
            <Label className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">
              Mô tả
            </Label>
            <Textarea
              name="description"
              placeholder="Mô tả ngắn về thiết bị (tùy chọn)"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData((p) => ({ ...p, description: e.target.value }))
              }
              className="text-sm min-h-[90px] mt-1 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Nhóm & Loại */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {/* Nhóm thiết bị */}
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">
                Nhóm thiết bị <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-3">
                <Select
                  value={formData.group}
                  onValueChange={(v) =>
                    setFormData((p) => ({ ...p, group: v, type: "" }))
                  }
                >
                  <SelectTrigger className="h-11 flex-1 text-[14px] border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 hover:border-emerald-400 focus:ring-2 focus:ring-emerald-500 transition">
                    <SelectValue placeholder="Chọn nhóm" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-md text-[13px] animate-fadeIn p-0">
                    {/* Thanh tìm kiếm cố định */}
                    <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 border-b dark:border-gray-700">
                      <div className="flex items-center gap-2 bg-emerald-50/60 dark:bg-emerald-950/30 px-2 py-2 border-b border-emerald-200 dark:border-emerald-800">
                        <Search className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <input
                          type="text"
                          value={searchGroup}
                          onChange={(e) => setSearchGroup(e.target.value)}
                          placeholder="Tìm nhóm..."
                          className="w-full text-xs bg-transparent outline-none dark:text-gray-100 placeholder:text-gray-400"
                        />
                      </div>
                    </div>

                    {/* Danh sách cuộn riêng */}
                    <div className="max-h-[210px] overflow-y-auto">
                      {filteredGroups.length === 0 ? (
                        <div className="p-2 text-xs text-gray-500">
                          Không có nhóm nào
                        </div>
                      ) : (
                        filteredGroups.map((g) => (
                          <SelectItem
                            key={g.id}
                            value={g.id}
                            className="hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all cursor-pointer"
                          >
                            <span className="font-medium">{g.name}</span>{" "}
                            <span className="text-xs text-gray-500">— {g.id}</span>
                          </SelectItem>
                        ))
                      )}
                    </div>
                  </SelectContent>
                </Select>

                {/* Nút Thêm Nhóm */}
                <Button
                  onClick={() => setOpenQuickAddGroup(true)}
                  className="h-11 min-w-[90px] text-[13px] bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 text-white rounded-lg shadow flex items-center justify-center gap-1 whitespace-nowrap"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Nhóm
                </Button>
              </div>
            </div>

            {/* Loại thiết bị */}
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">
                Loại thiết bị <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-3">
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData((p) => ({ ...p, type: v }))}
                  disabled={!formData.group}
                >
                  <SelectTrigger className="h-11 flex-1 text-[14px] border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 hover:border-emerald-400 focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 transition">
                    <SelectValue placeholder="Chọn loại theo nhóm" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-md text-[13px] animate-fadeIn p-0">
                    <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 border-b dark:border-gray-700">
                      <div className="flex items-center gap-2 bg-emerald-50/60 dark:bg-emerald-950/30 px-2 py-2 border-b border-emerald-200 dark:border-emerald-800">
                        <Search className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <input
                          type="text"
                          value={searchType}
                          onChange={(e) => setSearchType(e.target.value)}
                          placeholder="Tìm loại..."
                          className="w-full text-xs bg-transparent outline-none dark:text-gray-100 placeholder:text-gray-400"
                        />
                      </div>
                    </div>

                    <div className="max-h-[210px] overflow-y-auto">
                      {filteredTypes.length === 0 ? (
                        <div className="p-2 text-xs text-gray-500">
                          {formData.group
                            ? "Không có loại cho nhóm này"
                            : "Vui lòng chọn nhóm trước"}
                        </div>
                      ) : (
                        filteredTypes.map((t) => (
                          <SelectItem
                            key={t.id}
                            value={t.id}
                            className="hover:bg-emerald-50 dark:hover:bg-emerald-900/30 cursor-pointer transition-all"
                          >
                            <span className="font-medium">{t.name}</span>{" "}
                            <span className="text-xs text-gray-500">— {t.id}</span>
                          </SelectItem>
                        ))
                      )}
                    </div>
                  </SelectContent>
                </Select>

                {/* Nút Thêm Loại */}
                <Button
                  onClick={() => setOpenQuickAddType(true)}
                  disabled={!formData.group}
                  className="h-11 min-w-[90px] text-[13px] bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 text-white rounded-lg shadow flex items-center justify-center gap-1 whitespace-nowrap disabled:opacity-50"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Loại
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT 1/3 (Hình ảnh) --- */}
        <div className="flex flex-col justify-between space-y-3 h-full">
          <Label className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">
            Hình ảnh
          </Label>
          <div className="relative border-2 border-dashed rounded-xl overflow-hidden flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-all hover:border-emerald-400">
            {formData.preview ? (
              <img
                src={formData.preview}
                alt="preview"
                className="w-full h-full object-cover transition-all hover:brightness-105"
              />
            ) : (
              <div className="flex flex-col items-center text-gray-500 text-xs">
                <ImageIcon className="w-6 h-6 mb-1" />
                Chưa chọn ảnh
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>

          {formData.preview && (
            <Button
              type="button"
              variant="outline"
              className="w-full h-8 text-xs"
              onClick={() =>
                setFormData((p) => ({ ...p, image: null, preview: "" }))
              }
            >
              <X className="w-3.5 h-3.5 mr-1" /> Xóa ảnh
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
