import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  ColumnVisibilityButton,
  HeaderFilter,
  getUniqueValues,
  useGlobalFilterController,
} from "@/components/common/ExcelTableTools";
import { Button } from "@/components/ui/buttonn";
import EquipmentAddCardPage from "@/pages/equipment/EquipmentAddCardPage";
import { PlusCircle } from "lucide-react";

const NO_IMG_DATA_URI =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="Arial" font-size="14">No image</text></svg>';

export default function EquipmentTable({
  equipments = [],
  selectedItems,
  setSelectedItems,
  checkedEquipmentId,
  onCheckPrice,
}) {
  const controller = useGlobalFilterController();
  const [openAddEquipment, setOpenAddEquipment] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    id: [],
    name: [],
    main_name: [],
    type_name: [],
  });
  const [visibleColumns, setVisibleColumns] = useState({
    check: true,
    id: true,
    main_name: true,
    type_name: true,
    name: true,
  });

  const uniqueValues = useMemo(
    () => ({
      id: getUniqueValues(equipments, (e) => e.id),
      name: getUniqueValues(equipments, (e) => e.name),
      main_name: getUniqueValues(equipments, (e) => e.main_name),
      type_name: getUniqueValues(equipments, (e) => e.type_name),
    }),
    [equipments]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return (equipments || []).filter((e) => {
      const matchSearch =
        !q ||
        e.name?.toLowerCase().includes(q) ||
        e.main_name?.toLowerCase().includes(q) ||
        e.type_name?.toLowerCase().includes(q) ||
        e.id?.toLowerCase().includes(q);

      const match =
        (filters.id.length === 0 || filters.id.includes(e.id)) &&
        (filters.name.length === 0 || filters.name.includes(e.name)) &&
        (filters.main_name.length === 0 ||
          filters.main_name.includes(e.main_name)) &&
        (filters.type_name.length === 0 ||
          filters.type_name.includes(e.type_name));

      return matchSearch && match;
    });
  }, [equipments, search, filters]);

  const togglePick = (item) => {
    setSelectedItems((prev) => {
      const next = { ...prev };
      if (next[item.id]) delete next[item.id];
      else
        next[item.id] = { ...item, price: "", qty: "", warranty_duration: "" };
      return next;
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
        <h3 className="text-lg font-semibold text-emerald-600">
          🧾 Danh sách dòng thiết bị
        </h3>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3">
          <Input
            placeholder="Tìm kiếm thiết bị..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 h-9 text-sm"
          />
          <Button
            type="button"
            onClick={() => setOpenAddEquipment(true)}
            className="hidden md:flex h-9 text-[13px] bg-gradient-to-r from-emerald-500 to-emerald-600
                hover:brightness-110 text-white rounded-lg shadow items-center justify-center gap-1"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Thêm mới Dòng thiết bị
          </Button>
          <ColumnVisibilityButton
            visibleColumns={visibleColumns}
            setVisibleColumns={setVisibleColumns}
            labels={{
              check: "Check giá",
              id: "Mã dòng thiết bị",
              main_name: "Nhóm",
              type_name: "Loại",
              name: "Tên thiết bị",
            }}
          />
        </div>
      </div>

      <div className="overflow-y-auto max-h-[360px] border rounded-lg">
        <Table className="text-sm">
          <TableHeader>
            <TableRow className="bg-gray-100 dark:bg-gray-700">
              {/* === Cột Chọn nhập (đưa lên đầu) === */}
              <TableHead className="text-center">Chọn nhập</TableHead>

              {visibleColumns.id && (
                <TableHead>
                  <HeaderFilter
                    selfKey="id"
                    label="Mã dòng thiết bị"
                    values={uniqueValues.id}
                    selected={filters.id}
                    onChange={(v) => setFilters((p) => ({ ...p, id: v }))}
                    controller={controller}
                  />
                </TableHead>
              )}

              {visibleColumns.main_name && (
                <TableHead>
                  <HeaderFilter
                    selfKey="main_name"
                    label="Nhóm"
                    values={uniqueValues.main_name}
                    selected={filters.main_name}
                    onChange={(v) =>
                      setFilters((p) => ({ ...p, main_name: v }))
                    }
                    controller={controller}
                  />
                </TableHead>
              )}

              {visibleColumns.type_name && (
                <TableHead>
                  <HeaderFilter
                    selfKey="type_name"
                    label="Loại"
                    values={uniqueValues.type_name}
                    selected={filters.type_name}
                    onChange={(v) =>
                      setFilters((p) => ({ ...p, type_name: v }))
                    }
                    controller={controller}
                  />
                </TableHead>
              )}

              {visibleColumns.name && (
                <TableHead>
                  <HeaderFilter
                    selfKey="name"
                    label="Tên thiết bị"
                    values={uniqueValues.name}
                    selected={filters.name}
                    onChange={(v) => setFilters((p) => ({ ...p, name: v }))}
                    controller={controller}
                  />
                </TableHead>
              )}
            </TableRow>
          </TableHeader>

          {openAddEquipment && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div
                className="
      bg-white dark:bg-gray-900 
      rounded-2xl shadow-2xl border border-gray-300 dark:border-gray-700 
      w-[90vw] max-w-[1300px] h-[90vh] 
      flex flex-col overflow-hidden
    "
              >
                {/* ==== Header cố định ==== */}
                <div className="flex-shrink-0 sticky top-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b px-6 py-4 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-emerald-600">
                      ➕ Thêm dòng thiết bị mới
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Điền thông tin cơ bản, phân loại và khai báo thông số kỹ
                      thuật
                    </p>
                  </div>
                  <button
                    onClick={() => setOpenAddEquipment(false)}
                    className="text-gray-400 hover:text-red-500 transition"
                  >
                    ✕
                  </button>
                </div>

                {/* ==== Body cuộn ==== */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <EquipmentAddCardPage
                    onSuccessAdd={() => setOpenAddEquipment(false)}
                    onCancel={() => setOpenAddEquipment(false)}
                  />
                </div>

                {/* ==== Footer cố định ==== */}
                <div className="flex-shrink-0 sticky bottom-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-t px-6 py-4 flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setOpenAddEquipment(false)}
                    className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                  >
                    Hủy
                  </Button>

                  <Button
                    type="button"
                    className="h-10 text-sm px-6 bg-gradient-to-r from-emerald-500 to-purple-500 text-white hover:opacity-90 flex items-center gap-2 rounded-lg shadow-md"
                    onClick={() => {
                      const form = document.querySelector("form");
                      form?.requestSubmit();
                    }}
                  >
                    Tạo dòng thiết bị
                  </Button>
                </div>
              </div>
            </div>
          )}

          <TableBody>
            {filtered.map((item) => {
              const picked = !!selectedItems[item.id];
              return (
                <TableRow
                  key={item.id}
                  className="border-t hover:bg-emerald-50/50 dark:hover:bg-gray-700/50 transition"
                >
                  {/* === Checkbox chọn nhập (đưa lên đầu) === */}
                  <TableCell className="text-center">
                    <input
                      type="checkbox"
                      checked={picked}
                      onChange={() => togglePick(item)}
                    />
                  </TableCell>

                  {visibleColumns.id && <TableCell>{item.id}</TableCell>}
                  {visibleColumns.main_name && (
                    <TableCell>{item.main_name}</TableCell>
                  )}
                  {visibleColumns.type_name && (
                    <TableCell>{item.type_name}</TableCell>
                  )}
                  {visibleColumns.name && (
                    <TableCell className="flex items-center gap-2">
                      <img
                        src={item.image || NO_IMG_DATA_URI}
                        alt={item.name}
                        className="w-10 h-8 object-contain rounded border"
                      />
                      <span>{item.name}</span>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {Object.keys(selectedItems).length > 0 && (
        <div className="text-xs text-gray-500">
          Đã chọn: <b>{Object.keys(selectedItems).length}</b> dòng
        </div>
      )}
    </div>
  );
}
