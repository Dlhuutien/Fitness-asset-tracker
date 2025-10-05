import { useState, useEffect } from "react";
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
import { Pencil, ImagePlus, CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import CategoryMainService from "@/services/categoryMainService";

export default function EquipmentGroupSection({ groups, setGroups }) {
  const [groupForm, setGroupForm] = useState({
    code: "",
    name: "",
    desc: "",
    img: null,
    preview: "",
  });
  const [editGroupId, setEditGroupId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ===== Load Category Main từ API =====
  useEffect(() => {
    (async () => {
      try {
        const data = await CategoryMainService.getAll();
        setGroups(data);
      } catch (err) {
        console.error("Không lấy được CategoryMain:", err);
      }
    })();
  }, [setGroups]);

  // ===== Upload ảnh (preview + file) =====
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const previewURL = URL.createObjectURL(file);
    setGroupForm((prev) => ({ ...prev, img: file, preview: previewURL }));
  };

  // ===== Tạo / Cập nhật nhóm =====
  const handleSaveGroup = async () => {
    if (!groupForm.code || !groupForm.name || !groupForm.desc) return;

    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (editGroupId) {
        // Update
        await CategoryMainService.update(editGroupId, {
          name: groupForm.name,
          description: groupForm.desc,
          image: groupForm.img || null,
        });
      } else {
        // Create
        await CategoryMainService.create({
          id: groupForm.code,
          name: groupForm.name,
          description: groupForm.desc,
          image: groupForm.img || null,
        });
      }

      // Reload danh sách
      const updated = await CategoryMainService.getAll();
      setGroups(updated);

      // Reset form
      setGroupForm({ code: "", name: "", desc: "", img: null, preview: "" });
      setEditGroupId(null);
      setSuccessMsg("✅ Lưu nhóm thành công!");
      setTimeout(() => setSuccessMsg(""), 2000);
    } catch (err) {
      console.error(err);
      setErrorMsg("❌ Có lỗi khi lưu nhóm!");
    } finally {
      setLoading(false); 
    }
  };

  const isFormValid = groupForm.code && groupForm.name && groupForm.desc;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 space-y-6">
      {/* Form nhóm */}
      <div className="grid grid-cols-2 gap-10 items-start">
        {/* Cột trái */}
        <div className="space-y-6 w-full">
          <div className="grid grid-cols-2 gap-6">
            <Input
              placeholder="Mã nhóm VD: CAO"
              value={groupForm.code}
              onChange={(e) =>
                setGroupForm({ ...groupForm, code: e.target.value })
              }
              className="h-12"
              readOnly={!!editGroupId}
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

          {/* Mô tả */}
          <div className="col-span-2">
            <Input
              placeholder="Mô tả nhóm"
              value={groupForm.desc}
              onChange={(e) =>
                setGroupForm({ ...groupForm, desc: e.target.value })
              }
              className="h-12"
            />
          </div>

          {/* Nút lưu */}
          <div className="flex justify-center">
            <Button
              onClick={handleSaveGroup}
              disabled={!isFormValid || loading}
              className={`h-12 w-1/2 text-base font-semibold rounded-lg flex items-center justify-center gap-2 transition-all duration-300 ${
                isFormValid && !loading
                  ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:opacity-90 shadow-lg"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang xử lý...
                </>
              ) : editGroupId ? (
                "💾 Cập nhật"
              ) : (
                "+ Lưu"
              )}
            </Button>
          </div>
        </div>

        {/* Cột phải: Upload ảnh */}
        <label
          htmlFor="group-upload"
          className="ml-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl w-72 h-72 cursor-pointer overflow-hidden hover:border-emerald-500 hover:shadow-xl transition group"
        >
          {groupForm.preview ? (
            <motion.img
              key={groupForm.preview}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              src={groupForm.preview}
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

      {/* Bảng nhóm */}
      <div className="overflow-y-auto max-h-64 rounded-lg border border-gray-200 dark:border-gray-700 shadow-inner">
        <Table>
          <TableHeader className="bg-emerald-50 dark:bg-gray-800">
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Ảnh</TableHead>
              <TableHead>Mã nhóm</TableHead>
              <TableHead>Tên nhóm</TableHead>
              <TableHead>Mô tả</TableHead>
              <TableHead>Ngày nhập</TableHead>
              <TableHead>Ngày sửa</TableHead>
              <TableHead>Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((g, idx) => (
              <TableRow
                key={g.id}
                className="hover:bg-emerald-50 dark:hover:bg-gray-800 transition"
              >
                <TableCell>{idx + 1}</TableCell>
                <TableCell>
                  {g.image ? (
                    <img
                      src={g.image}
                      alt={g.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <span className="text-xs text-gray-400">No img</span>
                  )}
                </TableCell>
                <TableCell>{g.id}</TableCell>
                <TableCell>{g.name}</TableCell>
                <TableCell>{g.description}</TableCell>
                <TableCell>
                  {new Date(g.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {new Date(g.updated_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      setGroupForm({
                        code: g.id,
                        name: g.name,
                        desc: g.description,
                        img: g.image,
                        preview: g.image || "",
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
