import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Truck, Search } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import EquipmentTransferService from "@/services/equipmentTransferService";
import Status from "@/components/common/Status";
import Branch from "@/components/common/Branch";

const STATUS_MAP = {
  active: "Hoạt động",
  inactive: "Ngưng sử dụng",
  maintenance: "Đang bảo trì",
  ready: "Bảo trì thành công",
  failed: "Bảo trì thất bại",
  "temporary urgent": "Ngừng tạm thời",
  "in stock": "Thiết bị trong kho",
};

export default function TransferHistory() {
  const [transfers, setTransfers] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        const data = await EquipmentTransferService.getByStatus("Completed");
        setTransfers(data);

        setTransfers(updated);
      } catch (err) {
        console.error("❌ Lỗi tải danh sách vận chuyển:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransfers();
  }, []);

  const filteredTransfers = useMemo(() => {
    if (!searchTerm) return transfers;
    const s = searchTerm.toLowerCase();
    return transfers.filter(
      (t) =>
        t.id.toLowerCase().includes(s) ||
        t.from_branch_id.toLowerCase().includes(s) ||
        t.to_branch_id.toLowerCase().includes(s) ||
        t.approved_by_name?.toLowerCase().includes(s) ||
        t.receiver_name?.toLowerCase().includes(s) ||
        t.description?.toLowerCase().includes(s)
    );
  }, [searchTerm, transfers]);

  if (loading)
    return (
      <div className="text-center py-10 text-gray-500">
        Đang tải lịch sử vận chuyển...
      </div>
    );

  return (
    <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-5">
      {/* ===== Header ===== */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Truck className="text-emerald-500" />
          <h2 className="text-lg font-semibold text-emerald-600">
            Lịch sử vận chuyển thiết bị
          </h2>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Tìm mã, chi nhánh, người..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 w-72 h-10 text-sm"
          />
        </div>
      </div>

      {/* ===== Table ===== */}
      <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow className="bg-gray-100 dark:bg-gray-700 text-sm font-semibold">
              <TableHead>#</TableHead>
              <TableHead>Mã vận chuyển</TableHead>
              <TableHead>Từ chi nhánh</TableHead>
              <TableHead>Đến chi nhánh</TableHead>
              <TableHead>Người yêu cầu</TableHead>
              <TableHead>Người nhận</TableHead>
              <TableHead>Ngày bắt đầu</TableHead>
              <TableHead>Ngày hoàn tất</TableHead>
              <TableHead className="text-center">Chi tiết</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredTransfers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-4 text-gray-500"
                >
                  Không có lịch sử vận chuyển nào.
                </TableCell>
              </TableRow>
            ) : (
              filteredTransfers.map((t, i) => (
                <>
                  {/* ===== Row chính ===== */}
                  <TableRow
                    key={t.id}
                    onClick={() => toggleExpand(t.id)}
                    className="text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-medium text-emerald-600">
                      {t.id}
                    </TableCell>
                    <TableCell>
                      <Branch id={t.from_branch_id} />
                    </TableCell>
                    <TableCell>
                      <Branch id={t.to_branch_id} />
                    </TableCell>
                    <TableCell>{t.approved_by_name || "—"}</TableCell>
                    <TableCell>{t.receiver_name || "—"}</TableCell>
                    <TableCell>
                      {new Date(t.move_start_date).toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell>
                      {new Date(
                        t.move_receive_date?.move_receive_date ||
                          t.move_receive_date
                      ).toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell className="text-center">
                      {expandedId === t.id ? (
                        <ChevronUp className="mx-auto text-emerald-500" />
                      ) : (
                        <ChevronDown className="mx-auto text-gray-500" />
                      )}
                    </TableCell>
                  </TableRow>

                  {/* ===== Bảng con ===== */}
                  <AnimatePresence>
                    {expandedId === t.id && (
                      <motion.tr
                        key={`${t.id}-details`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                        className="bg-emerald-50 dark:bg-gray-900/40"
                      >
                        <td colSpan={9} className="p-0">
                          <div className="overflow-hidden px-5 py-3">
                            <p className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">
                              Danh sách thiết bị được chuyển:
                            </p>
                            <Table className="min-w-[700px]">
                              <TableHeader>
                                <TableRow className="bg-emerald-100 dark:bg-gray-800 text-xs font-semibold">
                                  <TableHead>#</TableHead>
                                  <TableHead>Mã thiết bị</TableHead>
                                  <TableHead>Tên thiết bị</TableHead>
                                  <TableHead>Trạng thái</TableHead>
                                  <TableHead>Chi nhánh hiện tại</TableHead>
                                </TableRow>
                              </TableHeader>

                              <TableBody>
                                {t.details.map((d, idx) => (
                                  <TableRow key={d.id} className="text-xs">
                                    <TableCell>{idx + 1}</TableCell>
                                    <TableCell>{d.equipment_unit_id}</TableCell>
                                    <TableCell>
                                      {d.equipment_unit?.equipment_name ||
                                        "Chưa có thông tin"}
                                    </TableCell>
                                    <TableCell>
                                      <Status
                                        status={
                                          STATUS_MAP[
                                            d.equipment_unit?.status?.toLowerCase()
                                          ] ||
                                          d.equipment_unit?.status ||
                                          "Không xác định"
                                        }
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <span className="font-medium text-gray-700 dark:text-gray-200">
                                        <Branch
                                          id={d.equipment_unit?.branch_id}
                                        />
                                      </span>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
