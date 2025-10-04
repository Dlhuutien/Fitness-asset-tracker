import { useState } from "react"; 
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/buttonn"; 
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import CategoryTypeService from "@/services/categoryTypeService";

const ITEMS_PER_PAGE = 4;

export default function EquipmentTypeSection({ types, setTypes, groups }) {
  const [typeForm, setTypeForm] = useState({
    code: "",
    name: "",
    desc: "",
    group: "",
  });
  const [editTypeId, setEditTypeId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [successMsg, setSuccessMsg] = useState("");

  // Kiểm tra duplicate id
  const isDuplicate = types.some(
    (t) => t.id === typeForm.code && t.id !== editTypeId
  );

  const isFormValid =
    typeForm.code && typeForm.name && typeForm.group && typeForm.desc && !isDuplicate;

  const handleSaveType = async () => {
    if (!isFormValid) return;

    try {
      if (editTypeId) {
        // UPDATE
        await CategoryTypeService.update(editTypeId, {
          name: typeForm.name,
          description: typeForm.desc,
          category_main_id: typeForm.group,
        });
        setSuccessMsg("✅ Cập nhật loại thành công!");
      } else {
        // CREATE
        await CategoryTypeService.create({
          id: typeForm.code,
          name: typeForm.name,
          description: typeForm.desc,
          category_main_id: typeForm.group,
        });
        setSuccessMsg("✅ Tạo loại thành công!");
      }

      // Reload từ API
      const updated = await CategoryTypeService.getAllWithDisplayName();
      setTypes(updated);

      setTypeForm({ code: "", name: "", desc: "", group: "" });
      setEditTypeId(null);
      setTimeout(() => setSuccessMsg(""), 2000);
    } catch (err) {
      console.error("❌ Lỗi khi lưu categoryType:", err);
    }
  };

  const handleDeleteType = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa loại này?")) return;
    try {
      await CategoryTypeService.delete(id);
      const updated = await CategoryTypeService.getAllWithDisplayName();
      setTypes(updated);
      setSuccessMsg("🗑️ Xóa loại thành công!");
      setTimeout(() => setSuccessMsg(""), 2000);
    } catch (err) {
      console.error("❌ Lỗi khi xóa categoryType:", err);
    }
  };

  const totalPages = Math.ceil(types.length / ITEMS_PER_PAGE);
  const currentData = types.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 space-y-6">
      {/* Form loại */}
      <div className="grid grid-cols-2 gap-6">
        <select
          className="h-12 w-full border rounded-lg px-3 text-sm 
                     bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200
                     border-gray-300 dark:border-gray-700"
          value={typeForm.group}
          onChange={(e) => setTypeForm({ ...typeForm, group: e.target.value })}
        >
          <option value="">-- Chọn nhóm --</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>

        <div>
          <Input
            className={`h-12 ${isDuplicate ? "border-red-500" : ""}`}
            placeholder="Mã loại VD: TM"
            value={typeForm.code}
            onChange={(e) =>
              setTypeForm({ ...typeForm, code: e.target.value })
            }
            readOnly={!!editTypeId}
          />
          {isDuplicate && (
            <p className="text-red-500 text-sm mt-1">
              ❌ Mã loại này đã tồn tại
            </p>
          )}
        </div>

        <Input
          className="h-12"
          placeholder="Tên loại VD: Treadmill"
          value={typeForm.name}
          onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
        />

        <Input
          className="h-12"
          placeholder="Mô tả loại"
          value={typeForm.desc}
          onChange={(e) => setTypeForm({ ...typeForm, desc: e.target.value })}
        />

        <div className="col-span-2 flex justify-end">
          <Button
            onClick={handleSaveType}
            disabled={!isFormValid}
            className={`h-12 px-8 font-semibold rounded-lg transition-all duration-300 ${
              isFormValid
                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 shadow-md"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {editTypeId ? "💾 Lưu" : "+ Tạo loại"}
          </Button>
        </div>
      </div>

      {/* Success message */}
      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex items-center text-emerald-600 gap-2 font-medium"
        >
          <CheckCircle2 size={18} /> {successMsg}
        </motion.div>
      )}

      {/* Table loại */}
      <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
        <Table className="min-w-full">
          <TableHeader className="bg-gray-50 dark:bg-gray-800">
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Mã loại</TableHead>
              <TableHead>Nhóm</TableHead>
              <TableHead>Tên loại</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead>Ngày nhập</TableHead>
              <TableHead>Ngày sửa</TableHead>
              <TableHead>Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.map((t, idx) => (
              <motion.tr
                key={t.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="hover:bg-indigo-50 dark:hover:bg-gray-800 transition"
              >
                <TableCell>{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</TableCell>
                <TableCell>{t.id}</TableCell>
                <TableCell>{t.main_name}</TableCell>
                <TableCell>{t.name}</TableCell>
                <TableCell>{t.description}</TableCell>
                <TableCell>{new Date(t.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(t.updated_at).toLocaleDateString()}</TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      setTypeForm({
                        code: t.id,
                        name: t.name,
                        desc: t.description,
                        group: t.category_main_id,
                      });
                      setEditTypeId(t.id);
                    }}
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={() => handleDeleteType(t.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center px-4 py-2 border-t dark:border-gray-700">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
        >
          «
        </Button>
        <span className="text-sm">
          Trang {currentPage}/{totalPages}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
        >
          »
        </Button>
      </div>
    </div>
  );
}
