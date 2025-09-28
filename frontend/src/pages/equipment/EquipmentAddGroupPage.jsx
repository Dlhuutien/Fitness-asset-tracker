import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, ImagePlus, Dumbbell, Activity } from "lucide-react";

// Mock nhóm
const initialGroups = [
  {
    id: 1,
    code: "CAO",
    name: "Cardio",
    desc: "Cardio Machines",
    createdAt: "27/08/2025 14:46",
    updatedAt: "27/08/2025 14:46",
    icon: Activity,
  },
  {
    id: 2,
    code: "STH",
    name: "Kháng lực",
    desc: "Strength Machines",
    createdAt: "27/08/2025 14:46",
    updatedAt: "27/08/2025 14:46",
    icon: Dumbbell,
  },
];

// Mock loại
const initialTypes = [
  {
    id: 1,
    code: "TM",
    name: "Treadmill",
    groupCode: "CAO",
    groupName: "Cardio",
    desc: "Máy chạy bộ trong nhà",
    img: "",
    createdAt: "27/08/2025 14:46",
    updatedAt: "27/08/2025 14:46",
  },
  {
    id: 2,
    code: "RD",
    name: "Rubber Dumbbells",
    groupCode: "STH",
    groupName: "Kháng lực",
    desc: "Tạ tay bọc cao su",
    img: "",
    createdAt: "27/08/2025 14:46",
    updatedAt: "27/08/2025 14:46",
  },
];

const ITEMS_PER_PAGE = 4;

export default function EquipmentAddGroupPage() {
  const [tab, setTab] = useState("group"); // group | type

  // state nhóm
  const [groups, setGroups] = useState(initialGroups);
  const [groupForm, setGroupForm] = useState({ code: "", name: "", desc: "" });
  const [editGroupId, setEditGroupId] = useState(null);

  // state loại
  const [types, setTypes] = useState(initialTypes);
  const [typeForm, setTypeForm] = useState({
    code: "",
    name: "",
    desc: "",
    group: "",
    img: "",
  });
  const [editTypeId, setEditTypeId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // thêm/sửa nhóm
  const handleSaveGroup = () => {
    if (!groupForm.code || !groupForm.name)
      return alert("Vui lòng nhập đủ thông tin nhóm");

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
        icon: Activity,
      };
      setGroups([...groups, newGroup]);
    }
    setGroupForm({ code: "", name: "", desc: "" });
  };

  // thêm/sửa loại
  const handleSaveType = () => {
    if (!typeForm.code || !typeForm.name || !typeForm.group)
      return alert("Vui lòng nhập đủ thông tin loại");

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
    }

    setTypeForm({ code: "", name: "", desc: "", group: "", img: "" });
  };

  // upload ảnh
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setTypeForm((prev) => ({ ...prev, img: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  // phân trang loại
  const totalPages = Math.ceil(types.length / ITEMS_PER_PAGE);
  const currentData = types.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6 text-gray-800 dark:text-gray-200">
      {/* Tabs */}
      <div className="flex gap-4 border-b pb-2 dark:border-gray-700">
        {[
          { key: "group", label: "📂 Tạo Nhóm" },
          { key: "type", label: "🏷️ Tạo Loại" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative px-4 py-2 font-medium ${
              tab === t.key
                ? "text-emerald-600 border-b-2 border-emerald-500"
                : "text-gray-500 dark:text-gray-400 hover:text-emerald-500"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab nhóm */}
      {tab === "group" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 space-y-6">
          {/* Form nhóm */}
          <div className="grid grid-cols-3 gap-4">
            <Input
              placeholder="Mã nhóm VD: CAO"
              className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700"
              value={groupForm.code}
              onChange={(e) =>
                setGroupForm({ ...groupForm, code: e.target.value })
              }
            />
            <Input
              placeholder="Tên nhóm VD: Cardio"
              className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700"
              value={groupForm.name}
              onChange={(e) =>
                setGroupForm({ ...groupForm, name: e.target.value })
              }
            />
            <Input
              placeholder="Mô tả nhóm"
              className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700"
              value={groupForm.desc}
              onChange={(e) =>
                setGroupForm({ ...groupForm, desc: e.target.value })
              }
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleSaveGroup}
              className="h-10 px-6 text-sm bg-emerald-500 text-white hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 rounded-lg"
            >
              {editGroupId ? "💾 Lưu" : "+ Tạo nhóm"}
            </Button>
          </div>

          {/* Table nhóm (scroll dọc) */}
          <div className="overflow-y-auto max-h-64 rounded-lg border border-gray-200 dark:border-gray-700">
            <Table>
              <TableHeader className="bg-gray-50 dark:bg-gray-800">
                <TableRow>
                  <TableHead className="text-center w-10">#</TableHead>
                  <TableHead>Icon</TableHead>
                  <TableHead>Mã nhóm</TableHead>
                  <TableHead>Tên nhóm</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Ngày nhập</TableHead>
                  <TableHead>Ngày sửa</TableHead>
                  <TableHead className="text-center">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((g) => (
                  <TableRow
                    key={g.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <TableCell className="text-center">{g.id}</TableCell>
                    <TableCell>
                      {g.icon && <g.icon className="text-emerald-500" size={18} />}
                    </TableCell>
                    <TableCell>{g.code}</TableCell>
                    <TableCell>{g.name}</TableCell>
                    <TableCell>{g.desc}</TableCell>
                    <TableCell>{g.createdAt}</TableCell>
                    <TableCell>{g.updatedAt}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => {
                          setGroupForm({
                            code: g.code,
                            name: g.name,
                            desc: g.desc,
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
      )}

      {/* Tab loại */}
      {tab === "type" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-6 space-y-6">
          {/* Form loại */}
          <div className="grid grid-cols-3 gap-6 items-start">
            {/* Inputs */}
            <div className="col-span-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <select
                  className="h-11 w-full border rounded-lg px-3 text-sm 
                             bg-white dark:bg-gray-800 
                             text-gray-800 dark:text-gray-200
                             border-gray-300 dark:border-gray-700"
                  value={typeForm.group}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, group: e.target.value })
                  }
                >
                  <option value="">-- Chọn nhóm --</option>
                  {groups.map((g) => (
                    <option key={g.code} value={g.code}>
                      {g.name}
                    </option>
                  ))}
                </select>
                <Input
                  className="h-11 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700"
                  placeholder="Mã loại VD: TM"
                  value={typeForm.code}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, code: e.target.value })
                  }
                />
              </div>
              <Input
                className="h-11 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700"
                placeholder="Tên loại VD: Treadmill"
                value={typeForm.name}
                onChange={(e) =>
                  setTypeForm({ ...typeForm, name: e.target.value })
                }
              />
              <Input
                className="h-11 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700"
                placeholder="Mô tả loại"
                value={typeForm.desc}
                onChange={(e) =>
                  setTypeForm({ ...typeForm, desc: e.target.value })
                }
              />
            </div>

            {/* Upload + Button */}
            <div className="flex flex-col items-center gap-4 w-full">
              <label
                htmlFor="file-upload"
                className="flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg w-36 h-36 cursor-pointer hover:border-emerald-500 transition overflow-hidden"
              >
                {typeForm.img ? (
                  <img
                    src={typeForm.img}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                    <ImagePlus size={24} className="text-emerald-500 mb-1" />
                    <p className="text-xs font-medium">Tải ảnh</p>
                  </div>
                )}
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>

              <Button
                onClick={handleSaveType}
                className="w-36 h-11 text-sm bg-emerald-500 text-white hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 rounded-lg"
              >
                {editTypeId ? "💾 Lưu" : "+ Tạo loại"}
              </Button>
            </div>
          </div>

          {/* Table loại (scroll ngang + phân trang) */}
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <Table className="min-w-full">
              <TableHeader className="bg-gray-50 dark:bg-gray-800">
                <TableRow>
                  <TableHead className="w-10 text-center">#</TableHead>
                  <TableHead>Mã loại</TableHead>
                  <TableHead>Nhóm</TableHead>
                  <TableHead>Tên loại</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Ảnh</TableHead>
                  <TableHead>Ngày nhập</TableHead>
                  <TableHead>Ngày sửa</TableHead>
                  <TableHead className="text-center">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentData.map((t) => (
                  <TableRow
                    key={t.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <TableCell className="text-center">{t.id}</TableCell>
                    <TableCell>{t.code}</TableCell>
                    <TableCell>{t.groupName}</TableCell>
                    <TableCell>{t.name}</TableCell>
                    <TableCell>{t.desc}</TableCell>
                    <TableCell>
                      {t.img ? (
                        <img
                          src={t.img}
                          alt={t.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">No img</span>
                      )}
                    </TableCell>
                    <TableCell>{t.createdAt}</TableCell>
                    <TableCell>{t.updatedAt}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => {
                          setTypeForm({
                            code: t.code,
                            name: t.name,
                            desc: t.desc,
                            group: t.groupCode,
                            img: t.img,
                          });
                          setEditTypeId(t.id);
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

          {/* Pagination */}
          <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 px-4 py-2">
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
      )}
    </div>
  );
}
