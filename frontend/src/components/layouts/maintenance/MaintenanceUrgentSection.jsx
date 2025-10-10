import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/buttonn";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Status from "@/components/common/Status";
import EquipmentUnitService from "@/services/equipmentUnitService";
import { toast } from "sonner";

import {
  HeaderFilter,
  ColumnVisibilityButton,
  getUniqueValues,
  getStatusVN,
  useGlobalFilterController,
} from "@/components/common/ExcelTableTools";

const ITEMS_PER_PAGE = 8;

export default function MaintenanceUrgentSection() {
  const [equipments, setEquipments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Bộ lọc Excel-style
  const [filters, setFilters] = useState({
    id: [],
    name: [],
    main_name: [],
    type_name: [],
    status: [],
    vendor_name: [],
    branch_id: [],
  });
  const controller = useGlobalFilterController();

  // Ẩn/hiện cột
  const [visibleColumns, setVisibleColumns] = useState({
    id: true,
    image: true,
    name: true,
    main_name: true,
    type_name: true,
    status: true,
    vendor_name: true,
    branch_id: true,
  });

  // 🧭 Load dữ liệu
  useEffect(() => {
    (async () => {
      try {
        const data = await EquipmentUnitService.getByStatusGroup([
          "Temporary Urgent",
          "In Progress",
        ]);
        setEquipments(data || []);
        setFiltered(data || []);
        setCurrentPage(1);
      } catch (err) {
        console.error(err);
        toast.error("Không thể tải danh sách thiết bị.");
      }
    })();
  }, []);

  // 🧩 Unique values cho dropdown
  const unique = useMemo(() => {
    const list = equipments || [];
    return {
      id: getUniqueValues(list, (e) => e.id),
      name: getUniqueValues(list, (e) => e.equipment?.name),
      main_name: getUniqueValues(list, (e) => e.equipment?.main_name),
      type_name: getUniqueValues(list, (e) => e.equipment?.type_name),
      status: getUniqueValues(list, (e) => getStatusVN(e.status)),
      vendor_name: getUniqueValues(list, (e) => e.equipment?.vendor_name),
      branch_id: getUniqueValues(list, (e) => e.branch_id),
    };
  }, [equipments]);

  // 🧠 Hàm khớp giá trị filter an toàn
  const matches = (vals, val) =>
    vals.length === 0 ||
    vals.some(
      (v) => String(v).trim().toLowerCase() === String(val).trim().toLowerCase()
    );

  // 🧩 Áp filter
  useEffect(() => {
    let rs = [...(equipments || [])];

    rs = rs.filter((r) => {
      const id = String(r.id ?? "");
      const name = String(r.equipment?.name ?? "");
      const main_name = String(r.equipment?.main_name ?? "");
      const type_name = String(r.equipment?.type_name ?? "");
      const statusVN = getStatusVN(r.status);
      const vendor_name = String(r.equipment?.vendor_name ?? "");
      const branch_id = String(r.branch_id ?? "");

      return (
        matches(filters.id, id) &&
        matches(filters.name, name) &&
        matches(filters.main_name, main_name) &&
        matches(filters.type_name, type_name) &&
        matches(filters.status, statusVN) &&
        matches(filters.vendor_name, vendor_name) &&
        matches(filters.branch_id, branch_id)
      );
    });

    setFiltered(rs);
    setCurrentPage(1);
  }, [filters, equipments]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentData = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
          Danh sách thiết bị bảo trì khẩn cấp
        </h2>

        <ColumnVisibilityButton
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          labels={{
            id: "Mã Unit",
            image: "Hình ảnh",
            name: "Tên thiết bị",
            main_name: "Nhóm",
            type_name: "Loại",
            status: "Trạng thái",
            vendor_name: "Nhà cung cấp",
            branch_id: "Chi nhánh",
          }}
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[1100px] border border-gray-200 dark:border-gray-600">
            <TableHeader>
              <TableRow className="bg-gray-100 dark:bg-gray-700 text-sm font-semibold">
                <TableHead className="text-center">#</TableHead>

                {visibleColumns.id && (
                  <TableHead>
                    <HeaderFilter
                      selfKey="id"
                      label="Mã Unit"
                      values={unique.id}
                      selected={filters.id}
                      onChange={(vals) => setFilters((f) => ({ ...f, id: vals }))}
                      controller={controller}
                    />
                  </TableHead>
                )}

                {visibleColumns.image && <TableHead>Hình ảnh</TableHead>}

                {visibleColumns.name && (
                  <TableHead>
                    <HeaderFilter
                      selfKey="name"
                      label="Tên thiết bị"
                      values={unique.name}
                      selected={filters.name}
                      onChange={(vals) => setFilters((f) => ({ ...f, name: vals }))}
                      controller={controller}
                    />
                  </TableHead>
                )}

                {visibleColumns.main_name && (
                  <TableHead>
                    <HeaderFilter
                      selfKey="main_name"
                      label="Nhóm"
                      values={unique.main_name}
                      selected={filters.main_name}
                      onChange={(vals) => setFilters((f) => ({ ...f, main_name: vals }))}
                      controller={controller}
                    />
                  </TableHead>
                )}

                {visibleColumns.type_name && (
                  <TableHead>
                    <HeaderFilter
                      selfKey="type_name"
                      label="Loại"
                      values={unique.type_name}
                      selected={filters.type_name}
                      onChange={(vals) => setFilters((f) => ({ ...f, type_name: vals }))}
                      controller={controller}
                    />
                  </TableHead>
                )}

                {visibleColumns.status && (
                  <TableHead className="text-center">
                    <HeaderFilter
                      selfKey="status"
                      label="Trạng thái"
                      values={unique.status}
                      selected={filters.status}
                      onChange={(vals) => setFilters((f) => ({ ...f, status: vals }))}
                      controller={controller}
                    />
                  </TableHead>
                )}

                {visibleColumns.vendor_name && (
                  <TableHead>
                    <HeaderFilter
                      selfKey="vendor_name"
                      label="Nhà cung cấp"
                      values={unique.vendor_name}
                      selected={filters.vendor_name}
                      onChange={(vals) => setFilters((f) => ({ ...f, vendor_name: vals }))}
                      controller={controller}
                    />
                  </TableHead>
                )}

                {visibleColumns.branch_id && (
                  <TableHead>
                    <HeaderFilter
                      selfKey="branch_id"
                      label="Chi nhánh"
                      values={unique.branch_id}
                      selected={filters.branch_id}
                      onChange={(vals) => setFilters((f) => ({ ...f, branch_id: vals }))}
                      controller={controller}
                    />
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {currentData.map((row, idx) => (
                <TableRow key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <TableCell className="text-center">
                    {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                  </TableCell>

                  {visibleColumns.id && <TableCell>{row.id}</TableCell>}

                  {visibleColumns.image && (
                    <TableCell>
                      <img
                        src={row.equipment?.image}
                        alt={row.equipment?.name}
                        className="w-12 h-10 object-contain rounded"
                      />
                    </TableCell>
                  )}

                  {visibleColumns.name && <TableCell>{row.equipment?.name}</TableCell>}
                  {visibleColumns.main_name && <TableCell>{row.equipment?.main_name}</TableCell>}
                  {visibleColumns.type_name && <TableCell>{row.equipment?.type_name}</TableCell>}

                  {visibleColumns.status && (
                    <TableCell className="text-center">
                      <Status status={getStatusVN(row.status)} />
                    </TableCell>
                  )}

                  {visibleColumns.vendor_name && (
                    <TableCell>{row.equipment?.vendor_name}</TableCell>
                  )}

                  {visibleColumns.branch_id && <TableCell>{row.branch_id}</TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex justify-end items-center gap-2 px-4 py-2 border-t dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            className="dark:border-gray-600 dark:text-gray-200"
          >
            «
          </Button>
          <span className="text-sm dark:text-gray-200">
            {currentPage}/{totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            className="dark:border-gray-600 dark:text-gray-200"
          >
            »
          </Button>
        </div>
      </div>
    </div>
  );
}
