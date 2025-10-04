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
import { Pencil, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

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

  // 🔎 check duplicate trực tiếp
  const isDuplicate = types.some(
    (t) => t.code === typeForm.code && t.id !== editTypeId
  );

  const isFormValid =
    typeForm.code &&
    typeForm.name &&
    typeForm.group &&
    typeForm.desc &&
    !isDuplicate;

  const handleSaveType = () => {
    if (!isFormValid) return; // 🚫 chặn luôn nếu không hợp lệ

    const group = groups.find((g) => g.code === typeForm.group);

    if (editTypeId) {
      setTypes((prev) =>
        prev.map((t) =>
          t.id === editTypeId
            ? {
                ...t,
                ...typeForm,
                groupName: group?.name || "",
                groupCode: group?.code || "",
                updatedAt: new Date().toLocaleString(),
              }
            : t
        )
      );
      setEditTypeId(null);
      setSuccessMsg("✅ Cập nhật loại thành công!");
    } else {
      const newType = {
        id: types.length + 1,
        ...typeForm,
        groupName: group?.name || "",
        groupCode: group?.code || "",
        createdAt: new Date().toLocaleString(),
        updatedAt: new Date().toLocaleString(),
      };
      setTypes([...types, newType]);
      setSuccessMsg("✅ Tạo loại thành công!");
    }

    setTypeForm({ code: "", name: "", desc: "", group: "" });
    setTimeout(() => setSuccessMsg(""), 2000);
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
            <option key={g.code} value={g.code}>
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
          />
          {isDuplicate && (
            <p className="text-red-500 text-sm mt-1">
              ❌ Mã loại này đã tồn tại, vui lòng nhập mã khác
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
            {currentData.map((t) => (
              <motion.tr
                key={t.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="hover:bg-indigo-50 dark:hover:bg-gray-800 transition"
              >
                <TableCell>{t.id}</TableCell>
                <TableCell>{t.code}</TableCell>
                <TableCell>{t.groupName}</TableCell>
                <TableCell>{t.name}</TableCell>
                <TableCell>{t.desc}</TableCell>
                <TableCell>{t.createdAt}</TableCell>
                <TableCell>{t.updatedAt}</TableCell>
                <TableCell>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      setTypeForm({
                        code: t.code,
                        name: t.name,
                        desc: t.desc,
                        group: t.groupCode,
                      });
                      setEditTypeId(t.id);
                    }}
                  >
                    <Pencil size={16} />
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
