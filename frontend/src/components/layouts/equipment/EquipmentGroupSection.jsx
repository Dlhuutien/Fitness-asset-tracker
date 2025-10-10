import { useState, useEffect, useMemo } from "react";
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
import {
  HeaderFilter,
  ColumnVisibilityButton,
  useGlobalFilterController,
  getUniqueValues,
} from "@/components/common/ExcelTableTools";

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

  // Excel-style filter
  const controller = useGlobalFilterController();
  const [filters, setFilters] = useState({
    code: [],
    name: [],
    desc: [],
    created: [],
    updated: [],
  });

  const [visibleColumns, setVisibleColumns] = useState({
    image: true,
    code: true,
    name: true,
    desc: true,
    created: true,
    updated: true,
  });

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
        await CategoryMainService.update(editGroupId, {
          name: groupForm.name,
          description: groupForm.desc,
          image: groupForm.img || null,
        });
      } else {
        await CategoryMainService.create({
          id: groupForm.code,
          name: groupForm.name,
          description: groupForm.desc,
          image: groupForm.img || null,
        });
      }

      const updated = await CategoryMainService.getAll();
      setGroups(updated);
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

  // ===== Excel-style filter logic =====
  const uniqueValues = useMemo(
    () => ({
      code: getUniqueValues(groups, (g) => g.id),
      name: getUniqueValues(groups, (g) => g.name),
      desc: getUniqueValues(groups, (g) => g.description),
      created: getUniqueValues(groups, (g) =>
        new Date(g.created_at).toLocaleDateString("vi-VN")
      ),
      updated: getUniqueValues(groups, (g) =>
        new Date(g.updated_at).toLocaleDateString("vi-VN")
      ),
    }),
    [groups]
  );

  const filteredGroups = useMemo(() => {
    return (groups || []).filter((g) => {
      const matchCode = filters.code.length === 0 || filters.code.includes(g.id);
      const matchName = filters.name.length === 0 || filters.name.includes(g.name);
      const matchDesc =
        filters.desc.length === 0 || filters.desc.includes(g.description);
      const matchCreated =
        filters.created.length === 0 ||
        filters.created.includes(new Date(g.created_at).toLocaleDateString("vi-VN"));
      const matchUpdated =
        filters.updated.length === 0 ||
        filters.updated.includes(new Date(g.updated_at).toLocaleDateString("vi-VN"));

      return matchCode && matchName && matchDesc && matchCreated && matchUpdated;
    });
  }, [groups, filters]);

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
              onChange={(e) => setGroupForm({ ...groupForm, code: e.target.value })}
              className="h-12"
              readOnly={!!editGroupId}
            />
            <Input
              placeholder="Tên nhóm VD: Cardio"
              value={groupForm.name}
              onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
              className="h-12"
            />
          </div>

          <div className="col-span-2">
            <Input
              placeholder="Mô tả nhóm"
              value={groupForm.desc}
              onChange={(e) => setGroupForm({ ...groupForm, desc: e.target.value })}
              className="h-12"
            />
          </div>

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
              <p className="text-sm font-medium group-hover:text-emerald-500">Ảnh nhóm</p>
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

      {/* Filter controls */}
      <div className="flex justify-end mb-2">
        <ColumnVisibilityButton
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          labels={{
            image: "Ảnh",
            code: "Mã nhóm",
            name: "Tên nhóm",
            desc: "Mô tả",
            created: "Ngày nhập",
            updated: "Ngày sửa",
          }}
        />
      </div>

      {/* Bảng nhóm */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-inner">
        <Table>
          <TableHeader className="bg-emerald-50 dark:bg-gray-800">
            <TableRow className="text-sm font-semibold text-gray-700 dark:text-gray-200 [&>th]:py-3 [&>th]:px-2">
              <TableHead className="text-center">#</TableHead>

              {visibleColumns.image && <TableHead>Ảnh</TableHead>}

              {visibleColumns.code && (
                <TableHead>
                  <HeaderFilter
                    selfKey="code"
                    label="Mã nhóm"
                    values={uniqueValues.code}
                    selected={filters.code}
                    onChange={(v) => setFilters((p) => ({ ...p, code: v }))}
                    controller={controller}
                  />
                </TableHead>
              )}

              {visibleColumns.name && (
                <TableHead>
                  <HeaderFilter
                    selfKey="name"
                    label="Tên nhóm"
                    values={uniqueValues.name}
                    selected={filters.name}
                    onChange={(v) => setFilters((p) => ({ ...p, name: v }))}
                    controller={controller}
                  />
                </TableHead>
              )}

              {visibleColumns.desc && (
                <TableHead>
                  <HeaderFilter
                    selfKey="desc"
                    label="Mô tả"
                    values={uniqueValues.desc}
                    selected={filters.desc}
                    onChange={(v) => setFilters((p) => ({ ...p, desc: v }))}
                    controller={controller}
                  />
                </TableHead>
              )}

              {visibleColumns.created && (
                <TableHead>
                  <HeaderFilter
                    selfKey="created"
                    label="Ngày nhập"
                    values={uniqueValues.created}
                    selected={filters.created}
                    onChange={(v) => setFilters((p) => ({ ...p, created: v }))}
                    controller={controller}
                  />
                </TableHead>
              )}

              {visibleColumns.updated && (
                <TableHead>
                  <HeaderFilter
                    selfKey="updated"
                    label="Ngày sửa"
                    values={uniqueValues.updated}
                    selected={filters.updated}
                    onChange={(v) => setFilters((p) => ({ ...p, updated: v }))}
                    controller={controller}
                  />
                </TableHead>
              )}

              {/* Không có filter ở hành động */}
              <TableHead className="text-center">Hành động</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredGroups.map((g, idx) => (
              <TableRow
                key={g.id}
                className="hover:bg-emerald-50 dark:hover:bg-gray-800 transition"
              >
                <TableCell className="text-center">{idx + 1}</TableCell>

                {visibleColumns.image && (
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
                )}

                {visibleColumns.code && <TableCell>{g.id}</TableCell>}
                {visibleColumns.name && <TableCell>{g.name}</TableCell>}
                {visibleColumns.desc && <TableCell>{g.description}</TableCell>}
                {visibleColumns.created && (
                  <TableCell>{new Date(g.created_at).toLocaleDateString()}</TableCell>
                )}
                {visibleColumns.updated && (
                  <TableCell>{new Date(g.updated_at).toLocaleDateString()}</TableCell>
                )}

                <TableCell className="text-center">
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
