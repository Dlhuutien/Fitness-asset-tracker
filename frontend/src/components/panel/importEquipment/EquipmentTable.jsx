import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Table, TableHeader, TableHead, TableBody, TableRow, TableCell,
} from "@/components/ui/table";
import {
  ColumnVisibilityButton,
  HeaderFilter,
  getUniqueValues,
  useGlobalFilterController,
} from "@/components/common/ExcelTableTools";
import { Button } from "@/components/ui/buttonn";

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
        (filters.main_name.length === 0 || filters.main_name.includes(e.main_name)) &&
        (filters.type_name.length === 0 || filters.type_name.includes(e.type_name));

      return matchSearch && match;
    });
  }, [equipments, search, filters]);

  const togglePick = (item) => {
    setSelectedItems((prev) => {
      const next = { ...prev };
      if (next[item.id]) delete next[item.id];
      else next[item.id] = { ...item, price: "", qty: "", warranty_duration: "" };
      return next;
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-emerald-600">🧾 Danh sách dòng thiết bị</h3>

        <div className="flex items-center gap-3">
          <Input
            placeholder="Tìm kiếm thiết bị..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 h-9 text-sm"
          />
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
              {visibleColumns.check && <TableHead className="text-center">Check giá</TableHead>}
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
                    onChange={(v) => setFilters((p) => ({ ...p, main_name: v }))}
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
                    onChange={(v) => setFilters((p) => ({ ...p, type_name: v }))}
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
              <TableHead className="text-center">Chọn nhập</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filtered.map((item) => {
              const picked = !!selectedItems[item.id];
              const checked = checkedEquipmentId === item.id;
              return (
                <TableRow key={item.id} className="border-t">
                  {visibleColumns.check && (
                    <TableCell className="text-center">
                      <input
                        type="radio"
                        name="check-price"
                        checked={checked}
                        onChange={() => onCheckPrice(item.id)}
                      />
                    </TableCell>
                  )}
                  {visibleColumns.id && <TableCell>{item.id}</TableCell>}
                  {visibleColumns.main_name && <TableCell>{item.main_name}</TableCell>}
                  {visibleColumns.type_name && <TableCell>{item.type_name}</TableCell>}
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
                  <TableCell className="text-center">
                    <input
                      type="checkbox"
                      checked={picked}
                      onChange={() => togglePick(item)}
                    />
                  </TableCell>
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
