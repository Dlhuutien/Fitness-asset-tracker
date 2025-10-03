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
import { Pencil, ImagePlus, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function EquipmentGroupSection({ groups, setGroups }) {
  const [groupForm, setGroupForm] = useState({
    code: "",
    name: "",
    desc: "",
    vendor: "",
    img: "",
  });
  const [editGroupId, setEditGroupId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Mock vendors
  const vendors = [
    { id: "VN001", name: "Technogym" },
    { id: "VN002", name: "Life Fitness" },
    { id: "VN003", name: "Matrix Fitness" },
  ];

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) =>
      setGroupForm((prev) => ({ ...prev, img: event.target.result }));
    reader.readAsDataURL(file);
  };

  const handleSaveGroup = () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (!groupForm.code || !groupForm.name || !groupForm.desc || !groupForm.vendor) return;

    const exists = groups.some(
      (g) =>
        g.code.toLowerCase().trim() === groupForm.code.toLowerCase().trim() &&
        g.id !== editGroupId
    );
    if (exists) {
      setErrorMsg("❌ Mã nhóm đã tồn tại, nhập mã khác!");
      return;
    }

    if (editGroupId) {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === editGroupId
            ? { ...g, ...groupForm, updatedAt: new Date().toLocaleString() }
            : g
        )
      );
      setEditGroupId(null);
    } else {
      const newGroup = {
        id: groups.length + 1,
        ...groupForm,
        createdAt: new Date().toLocaleString(),
        updatedAt: new Date().toLocaleString(),
      };
      setGroups([...groups, newGroup]);
    }

    setGroupForm({ code: "", name: "", desc: "", vendor: "", img: "" });
    setSuccessMsg("✅ Tạo nhóm thành công!");
    setTimeout(() => setSuccessMsg(""), 2000);
  };

  const isFormValid =
    groupForm.code && groupForm.name && groupForm.desc && groupForm.vendor;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 space-y-6">
      {/* Form nhóm */}
      <div className="grid grid-cols-2 gap-10 items-start">
        {/* Cột trái */}
        <div className="space-y-6 w-full">
          {/* Hàng 1: Mã + Tên */}
          <div className="grid grid-cols-2 gap-6">
            <Input
              placeholder="Mã nhóm VD: CAO"
              value={groupForm.code}
              onChange={(e) =>
                setGroupForm({ ...groupForm, code: e.target.value })
              }
              className="h-12"
            />
            <Input
              placeholder="Tên nhóm VD: Cardio"
              value={groupForm.name}
              onChange={(e) =>
                setGroupForm({ ...groupForm, name: e.target.value })
              }
              className="h-12"
            />
          </div>

          {/* Hàng 2: Mô tả + Vendor */}
          <div className="grid grid-cols-2 gap-6">
            <Input
              placeholder="Mô tả nhóm"
              value={groupForm.desc}
              onChange={(e) =>
                setGroupForm({ ...groupForm, desc: e.target.value })
              }
              className="h-12"
            />
            <select
              value={groupForm.vendor}
              onChange={(e) =>
                setGroupForm({ ...groupForm, vendor: e.target.value })
              }
              className="h-12 border rounded-lg px-3 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            >
              <option value="">-- Chọn nhà cung cấp --</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.name}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Hàng 3: Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleSaveGroup}
              disabled={!isFormValid}
              className={`h-12 w-1/2 text-base font-semibold rounded-lg transition-all duration-300 ${
                isFormValid
                  ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:opacity-90 shadow-lg"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {editGroupId ? "💾 Lưu" : "+ Tạo nhóm"}
            </Button>
          </div>
        </div>

        {/* Cột phải: Upload ảnh vuông to */}
        <label
          htmlFor="group-upload"
          className="ml-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl w-72 h-72 cursor-pointer overflow-hidden hover:border-emerald-500 hover:shadow-xl transition group"
        >
          {groupForm.img ? (
            <motion.img
              key={groupForm.img} // reload preview khi đổi ảnh
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              src={groupForm.img}
              alt="preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center text-gray-500">
              <ImagePlus
                size={48}
                className="text-emerald-500 mb-1 group-hover:scale-110 transition"
              />
              <p className="text-sm font-medium group-hover:text-emerald-500">
                Ảnh nhóm
              </p>
            </div>
          )}
          <input
            id="group-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </label>
      </div>

      {/* Error + Success */}
      {errorMsg && <p className="text-red-500 font-medium">{errorMsg}</p>}
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

      {/* Table nhóm */}
      <div className="overflow-y-auto max-h-64 rounded-lg border border-gray-200 dark:border-gray-700 shadow-inner">
        <Table>
          <TableHeader className="bg-emerald-50 dark:bg-gray-800">
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Ảnh</TableHead>
              <TableHead>Mã nhóm</TableHead>
              <TableHead>Tên nhóm</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead>Nhà cung cấp</TableHead>
              <TableHead>Ngày nhập</TableHead>
              <TableHead>Ngày sửa</TableHead>
              <TableHead>Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((g) => (
              <TableRow
                key={g.id}
                className="hover:bg-emerald-50 dark:hover:bg-gray-800 transition"
              >
                <TableCell>{g.id}</TableCell>
                <TableCell>
                  {g.img ? (
                    <img
                      src={g.img}
                      alt={g.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <span className="text-xs text-gray-400">No img</span>
                  )}
                </TableCell>
                <TableCell>{g.code}</TableCell>
                <TableCell>{g.name}</TableCell>
                <TableCell>{g.desc}</TableCell>
                <TableCell>{g.vendor}</TableCell>
                <TableCell>{g.createdAt}</TableCell>
                <TableCell>{g.updatedAt}</TableCell>
                <TableCell>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      setGroupForm({
                        code: g.code,
                        name: g.name,
                        desc: g.desc,
                        vendor: g.vendor,
                        img: g.img,
                      });
                      setEditGroupId(g.id);
                    }}
                  >
                    <Pencil size={16} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
