import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Clock, UserRound, ListChecks } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/buttonn";
import { toast } from "sonner";
import {
  startOfMonth,
  startOfWeek,
  endOfMonth,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  startOfDay,
} from "date-fns";
import { vi } from "date-fns/locale";
import MaintenancePlanService from "@/services/MaintenancePlanService";
import EquipmentUnitService from "@/services/equipmentUnitService";

export default function AddScheduleSection({ onClose, onSaved }) {
  const [maintenancePlans, setMaintenancePlans] = useState([]);
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [expandedEquipment, setExpandedEquipment] = useState(null);
  const [selectedUnits, setSelectedUnits] = useState({});
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [cursor, setCursor] = useState(new Date());
  const [selectedDateObj, setSelectedDateObj] = useState(new Date());
  const [equipmentUnits, setEquipmentUnits] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const daysInView = eachDayOfInterval({
    start: startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }),
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await MaintenancePlanService.getAll();
        setMaintenancePlans(data);
      } catch (err) {
        console.error("❌ Lỗi khi tải kế hoạch bảo trì:", err);
        toast.error("Không thể tải danh sách kế hoạch bảo trì");
      }
    };
    fetchData();
  }, []);

  // ===== MOCK DATA =====
  useEffect(() => {
    const mockUsers = [
      {
        username: "khanh",
        roles: ["admin"],
        attributes: {
          name: "Đinh Quốc Khánh",
          sub: "29fa852c-b0f1-7055-acda-bafe048d75a9",
        },
      },
      {
        username: "tien",
        roles: ["technician"],
        attributes: {
          name: "Đặng Lê Hữu Tiến",
          sub: "a98a551c-e041-70f3-8c2b-5f53a6b54e1c",
        },
      },
    ];

    const mockRequests = [
      {
        id: "49a82c67-bae0-4881-bb5f-8a7705da4410",
        maintenance_reason: "Bảo trì định kỳ quý IV",
        status: "confirmed",
        assigned_to: "Đặng Lê Hữu Tiến",
        scheduled_at: "2025-11-05T15:50:00",
        units: [
          {
            id: "CAOMTT-PE-3",
            equipment_name: "Performance Elliptical",
          },
        ],
      },
      {
        id: "ccbfda65-d830-4c8e-bdd2-c2331303c03f",
        maintenance_reason: "Bảo trì định kỳ tháng 11",
        status: "pending",
        scheduled_at: "2025-11-13T00:00:00",
        units: [
          {
            id: "CAOTM-ET",
            equipment_name: "Endurance Treadmill",
          },
        ],
      },
      {
        id: "49a82c67-bae0-4881-bb5f-8a7705da44104",
        maintenance_reason: "Bảo trì định kỳ quý IV",
        status: "confirmed",
        assigned_to: "Đặng Lê Hữu Tiến",
        scheduled_at: "2025-11-15T15:50:00",
        units: [
          {
            id: "CAOMTT-PE-10",
            equipment_name: "Performance Elliptical",
          },
        ],
      },
    ];

    setUsers(mockUsers);
    setRequests(mockRequests);
  }, []);

  // ===== CHỌN UNIT =====
  const toggleUnit = (equipmentId, unitId) => {
    setSelectedUnits((prev) => {
      const eq = prev[equipmentId] || [];
      if (eq.includes(unitId)) {
        return { ...prev, [equipmentId]: eq.filter((id) => id !== unitId) };
      } else {
        return { ...prev, [equipmentId]: [...eq, unitId] };
      }
    });
  };

  const handleSave = () => {
    const totalSelected = Object.values(selectedUnits).flat().length;
    if (totalSelected === 0) {
      toast.error("⚠️ Vui lòng chọn ít nhất 1 thiết bị unit!");
      return;
    }
    toast.success(`✅ Đã lưu kế hoạch cho ${totalSelected} unit!`);
    onSaved?.();
    onClose?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[10001] bg-black/60 backdrop-blur-sm flex items-center justify-center"
    >
      <div className="relative bg-white rounded-3xl w-[90vw] max-w-[1200px] max-h-[90vh] overflow-y-auto overflow-x-hidden p-6 shadow-2xl border border-slate-200 space-y-6 text-slate-900">
        {/* ===== CARD 1 ===== */}
        <div className="p-4 rounded-2xl border border-emerald-300 bg-white">
          <h2 className="font-semibold mb-3 flex items-center gap-2 text-emerald-700">
            <ListChecks className="w-4 h-4" /> Danh sách thiết bị đến hạn bảo
            trì (bảo trì theo dòng)
          </h2>

          {/* === BẢNG DANH SÁCH THIẾT BỊ === */}
          <div className="border border-emerald-200 bg-white rounded-xl p-3 mb-5">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-emerald-700">
                Danh sách thiết bị đến hạn
              </h3>

              {/* Nút bỏ chọn tất cả */}
              {Object.keys(selectedUnits).length > 0 && (
                <Button
                  onClick={() => {
                    setSelectedUnits({});
                    setExpandedEquipment(null);
                    toast.info("🔄 Đã bỏ chọn tất cả thiết bị.");
                  }}
                  variant="outline"
                  className="text-sm border-emerald-300 text-amber-600 hover:bg-emerald-50"
                >
                  Bỏ chọn tất cả
                </Button>
              )}
            </div>

            <table className="min-w-full text-sm border border-emerald-200 rounded-lg overflow-hidden bg-white text-slate-900">
              <thead className="bg-emerald-100/70">
                <tr className="font-semibold">
                  <th className="px-3 py-2 text-left">Mã dòng</th>
                  <th className="px-3 py-2 text-left">Tên dòng</th>
                  <th className="px-3 py-2 text-left">Chu kỳ</th>
                  <th className="px-3 py-2 text-left">Tần suất</th>
                  <th className="px-3 py-2 text-left">Ngày bảo trì tới</th>
                </tr>
              </thead>
              <tbody>
                {maintenancePlans.map((plan) => {
                  // nếu đã chọn dòng khác, khóa những dòng còn lại
                  const isLocked =
                    Object.keys(selectedUnits).length > 0 &&
                    !selectedUnits[plan.equipment_id];
                  const isActive = expandedEquipment === plan.equipment_id;

                  return (
                    <tr
                      key={plan.equipment_id}
                      onClick={async () => {
                        if (isLocked) return;
                        setExpandedEquipment(plan.equipment_id);
                        setCurrentPage(1); // 🔹 reset về trang 1 khi chọn thiết bị khác

                        // 🔹 Nếu đã tải unit của dòng này rồi, bỏ qua
                        if (equipmentUnits[plan.equipment_id]) return;

                        try {
                          const res =
                            await EquipmentUnitService.getByStatusGroup([
                              "Active",
                              "In Stock",
                            ]);

                          // 🔹 Lọc theo dòng thiết bị
                          const filtered = res.filter(
                            (u) => u.equipment_id === plan.equipment_id
                          );

                          // 🔹 Sắp xếp lại — unit nào đã lên lịch (isScheduleLocked = true) sẽ nằm cuối
                          const sorted = filtered.sort((a, b) => {
                            if (a.isScheduleLocked === b.isScheduleLocked)
                              return 0;
                            return a.isScheduleLocked ? 1 : -1;
                          });

                          setEquipmentUnits((prev) => ({
                            ...prev,
                            [plan.equipment_id]: sorted,
                          }));
                        } catch (err) {
                          console.error("❌ Lỗi khi tải equipment units:", err);
                          toast.error("Không thể tải danh sách thiết bị con.");
                        }
                      }}
                      className={`border-t transition cursor-pointer ${
                        isActive ? "bg-emerald-100/60" : "hover:bg-emerald-50"
                      } ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <td className="px-3 py-2">{plan.equipment_id}</td>
                      <td className="px-3 py-2 font-medium">
                        {plan.equipment_name}
                      </td>
                      <td className="px-3 py-2">{plan.cycle}</td>
                      <td className="px-3 py-2">{plan.frequency}</td>
                      <td className="px-3 py-2">
                        {plan.next_maintenance_date.split("T")[0]}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Ghi chú khi đã chọn dòng */}
            {Object.keys(selectedUnits).length > 0 && (
              <div className="mt-3 text-sm text-amber-600 font-medium flex items-center gap-2">
                <span>🔒</span>
                {(() => {
                  const firstKey = Object.keys(selectedUnits)[0];
                  const plan = maintenancePlans.find(
                    (p) => p.equipment_id === firstKey
                  );
                  return (
                    <span>
                      Đã chọn thiết bị thuộc dòng{" "}
                      <span className="font-semibold text-amber-700">
                        {plan?.equipment_name || firstKey}
                      </span>
                      . Nếu muốn chọn dòng khác, hãy bấm "Bỏ chọn tất cả".
                    </span>
                  );
                })()}
              </div>
            )}
          </div>

          {/* === BẢNG CHI TIẾT UNIT === */}
          <div className="border border-emerald-200 bg-white rounded-xl p-3">
            <h3 className="font-semibold text-emerald-700 mb-2">
              Chi tiết thiết bị
            </h3>

            {!expandedEquipment ? (
              <p className="text-slate-500 text-sm italic">
                Chọn một thiết bị ở bảng trên để xem danh sách unit.
              </p>
            ) : (
              <>
                {(() => {
                  const allUnits = equipmentUnits[expandedEquipment] || [];
                  const totalPages = Math.max(
                    1,
                    Math.ceil(allUnits.length / ITEMS_PER_PAGE)
                  );
                  const paginatedUnits = allUnits.slice(
                    (currentPage - 1) * ITEMS_PER_PAGE,
                    currentPage * ITEMS_PER_PAGE
                  );

                  return (
                    <>
                      <table className="w-full text-sm border border-emerald-200 rounded-lg overflow-hidden bg-white">
                        <thead className="bg-emerald-100/60">
                          <tr className="text-slate-900 font-medium">
                            <th className="px-3 py-2 text-left">Chọn</th>
                            <th className="px-3 py-2 text-left">Hình</th>
                            <th className="px-3 py-2 text-left">
                              Mã định danh thiết bị
                            </th>
                            <th className="px-3 py-2 text-left">
                              Tên thiết bị
                            </th>
                            <th className="px-3 py-2 text-left">Trạng thái</th>
                            <th className="px-3 py-2 text-left">
                              Bảo trì gần nhất
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedUnits.map((unit) => {
                            const checked = selectedUnits[
                              expandedEquipment
                            ]?.includes(unit.id);
                            const locked = unit.isScheduleLocked;

                            return (
                              <tr
                                key={unit.id}
                                className={`border-t transition ${
                                  locked
                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                    : "hover:bg-emerald-50"
                                } ${checked ? "bg-emerald-100/40" : ""}`}
                              >
                                <td className="px-2 py-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={locked}
                                    onChange={() =>
                                      !locked &&
                                      toggleUnit(expandedEquipment, unit.id)
                                    }
                                    className="w-4 h-4 accent-emerald-600 disabled:opacity-40"
                                  />
                                </td>
                                <td className="px-2 py-2 relative">
                                  <img
                                    src={unit.equipment?.image}
                                    alt={unit.name}
                                    className="w-10 h-10 object-cover rounded border"
                                  />
                                  {locked && (
                                    <span className="absolute top-0 right-0 text-[10px] bg-amber-200 text-amber-800 px-1 rounded-sm font-medium">
                                      Đã lên lịch
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2">{unit.id}</td>
                                <td className="px-3 py-2">
                                  {unit.equipment?.name}
                                </td>
                                <td className="px-3 py-2">{unit.status}</td>
                                <td className="px-3 py-2 text-slate-600">
                                  {unit.lastMaintenance}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {/* === Thanh phân trang nhỏ === */}
                      {allUnits.length > ITEMS_PER_PAGE && (
                        <div className="flex justify-between items-center mt-3 text-sm text-slate-600">
                          <span>
                            Trang {currentPage} / {totalPages}
                          </span>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={currentPage === 1}
                              onClick={() =>
                                setCurrentPage((p) => Math.max(1, p - 1))
                              }
                              className="h-7 text-xs border-slate-300"
                            >
                              «
                            </Button>
                            {Array.from({ length: totalPages }).map((_, i) => (
                              <Button
                                key={i}
                                size="sm"
                                variant={
                                  currentPage === i + 1 ? "default" : "outline"
                                }
                                onClick={() => setCurrentPage(i + 1)}
                                className={`h-7 w-7 text-xs ${
                                  currentPage === i + 1
                                    ? "bg-emerald-500 text-white"
                                    : "border-slate-300"
                                }`}
                              >
                                {i + 1}
                              </Button>
                            ))}
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={currentPage === totalPages}
                              onClick={() =>
                                setCurrentPage((p) =>
                                  Math.min(totalPages, p + 1)
                                )
                              }
                              className="h-7 text-xs border-slate-300"
                            >
                              »
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            )}
          </div>
        </div>

        {/* ===== CARD 2: Thời gian bảo trì (có lịch hiển thị) ===== */}
        <div className="p-4 rounded-2xl border border-slate-300 bg-white">
          <h2 className="font-semibold mb-3 flex items-center gap-2 text-slate-900">
            <CalendarDays className="w-4 h-4" /> Thời gian bảo trì
          </h2>
          {/* === Mini Month Calendar === */}
          <div className="border border-emerald-200 rounded-2xl p-4 bg-white">
            <div className="flex justify-between items-center mb-3">
              <button
                onClick={() =>
                  setCursor(
                    (d) => new Date(d.getFullYear(), d.getMonth() - 1, 1)
                  )
                }
                className="px-2 py-1 rounded-md hover:bg-emerald-50 text-emerald-700"
              >
                ‹
              </button>
              <h3 className="font-semibold text-emerald-700">
                {format(cursor, "MMMM yyyy", { locale: vi })}
              </h3>
              <button
                onClick={() =>
                  setCursor(
                    (d) => new Date(d.getFullYear(), d.getMonth() + 1, 1)
                  )
                }
                className="px-2 py-1 rounded-md hover:bg-emerald-50 text-emerald-700"
              >
                ›
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-[12px] font-semibold text-slate-500 mb-2">
              {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {daysInView.map((day) => {
                const inMonth = isSameMonth(day, cursor);
                const selected = isSameDay(day, selectedDateObj);
                const today = new Date();
                const isPast = day < startOfDay(today);

                // Lọc requests có lịch trong ngày
                const dayRequests = requests.filter(
                  (r) =>
                    r.scheduled_at.split("T")[0] === format(day, "yyyy-MM-dd")
                );

                // Lọc maintenancePlans có “ngày bảo trì tới” trùng ngày
                const matchedPlans = maintenancePlans.filter(
                  (p) =>
                    p.next_maintenance_date.split("T")[0] ===
                    format(day, "yyyy-MM-dd")
                );

                const hasNextMaintenance = matchedPlans.length > 0;
                const hasEvents = dayRequests.length > 0;

                // Nếu có cả đúng hẹn và có lịch → màu vàng
                const highlightColor = hasNextMaintenance
                  ? "border-amber-400 bg-amber-50"
                  : hasEvents
                  ? "border-emerald-400 bg-emerald-50"
                  : "border-slate-200 hover:bg-slate-50";

                return (
                  <div
                    key={format(day, "yyyy-MM-dd")}
                    onClick={() => {
                      if (!isPast) setSelectedDateObj(day);
                    }}
                    className={`p-2 rounded-xl border text-[12px] min-h-[85px] transition-all flex flex-col justify-between cursor-pointer
        ${selected ? "border-emerald-500 bg-emerald-50" : highlightColor}
        ${!inMonth ? "opacity-50" : ""}
        ${isPast ? "opacity-40 pointer-events-none" : ""}
      `}
                  >
                    {/* ===== Ngày ===== */}
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-700">
                        {format(day, "d", { locale: vi })}
                      </span>
                      {isToday(day) && (
                        <span className="px-1 text-[10px] rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                          Hôm nay
                        </span>
                      )}
                    </div>

                    {/* ===== Nội dung trong ngày ===== */}
                    <div className="text-[10px] mt-1 space-y-0.5 truncate">
                      {/* Lịch đúng hẹn (hiện trước) */}
                      {hasNextMaintenance &&
                        matchedPlans.map((p) => (
                          <div
                            key={p.id}
                            className="text-amber-600 font-medium truncate"
                          >
                            • Lịch đúng hẹn
                            <div className="text-amber-700 text-[10px] font-normal truncate">
                              {p.equipment_name}
                            </div>
                          </div>
                        ))}

                      {/* Có lịch (hiện sau) */}
                      {hasEvents &&
                        dayRequests.map((r) => (
                          <div
                            key={r.id}
                            className="text-emerald-600 font-medium truncate mt-0.5"
                          >
                            • Có lịch
                            {r.units?.[0]?.equipment_name && (
                              <div className="text-emerald-700 text-[10px] font-normal truncate">
                                {r.units[0].equipment_name}
                              </div>
                            )}
                          </div>
                        ))}

                      {!hasNextMaintenance && !hasEvents && (
                        <div className="text-slate-400">&nbsp;</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* === Xác nhận ngày đã chọn === */}
          <div className="mt-5">
            <p className="font-medium text-slate-700">
              📅 Ngày được chọn:{" "}
              <span className="text-emerald-700 font-semibold">
                {format(selectedDateObj, "EEEE, dd/MM/yyyy", { locale: vi })}
              </span>
            </p>

            {/* Chọn giờ */}
            <div className="mt-3 flex items-center gap-3">
              <label className="text-sm text-slate-600">🕒 Giờ bắt đầu:</label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-40"
              />
            </div>
          </div>
          {/* === Danh sách thiết bị có lịch trong ngày === */}
          <div className="mt-5">
            <h4 className="text-sm font-semibold text-emerald-700 mb-2">
              Thiết bị đã có lịch trong ngày này:
            </h4>
            {(() => {
              const selDay = format(selectedDateObj, "yyyy-MM-dd");
              const sameDay = requests.filter(
                (r) => r.scheduled_at.split("T")[0] === selDay
              );

              if (sameDay.length === 0)
                return (
                  <p className="text-sm text-slate-500 italic">
                    Không có thiết bị nào được lên lịch.
                  </p>
                );

              // ⬇⬇⬇ Đặt đoạn này trong **return của IIFE**
              return (
                <ul className="text-sm space-y-2">
                  {sameDay.map((r) => (
                    <li
                      key={r.id}
                      className="p-2 border border-emerald-200 rounded-lg bg-emerald-50 flex justify-between"
                    >
                      <div>
                        <div className="font-medium text-emerald-700">
                          {r.units?.[0]?.equipment_name}
                        </div>
                        <div className="text-xs text-slate-500">
                          🕒 {r.scheduled_at.split("T")[1] || "Không rõ giờ"}
                        </div>

                        {/* 👷 Thêm người đảm nhận */}
                        {r.assigned_to ? (
                          <div className="text-xs text-slate-600 mt-0.5">
                            👨‍🔧 Người đảm nhận:{" "}
                            <span className="font-medium text-emerald-700">
                              {r.assigned_to}
                            </span>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500 mt-0.5 italic">
                            👷 Chưa có người đảm nhận
                          </div>
                        )}
                      </div>

                      <span
                        className={`px-2 py-0.5 text-xs rounded-md self-start ${
                          r.status === "confirmed"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {r.status === "confirmed"
                          ? "Đã lên lịch"
                          : "Chờ xác nhận"}
                      </span>
                    </li>
                  ))}
                </ul>
              );
            })()}
          </div>
        </div>

        {/* ===== CARD 3 ===== */}
        <div className="p-4 rounded-2xl border border-slate-300 bg-white">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <UserRound className="w-4 h-4" /> Chọn kỹ thuật viên (tùy chọn)
          </h2>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="border border-slate-300 rounded-md h-9 px-3 text-sm w-72"
          >
            <option value="">— Chưa chọn —</option>
            {users.map((u) => (
              <option key={u.username} value={u.attributes?.sub}>
                {u.attributes?.name} ({u.roles?.join(", ")})
              </option>
            ))}
          </select>
        </div>

        {/* ===== CARD 4 ===== */}
        <div className="p-4 rounded-2xl border border-slate-300 bg-white">
          <h2 className="font-semibold mb-3 flex items-center gap-2 text-slate-900">
            <Clock className="w-4 h-4" /> Lịch bảo trì hiện có
          </h2>

          <table className="min-w-full text-sm border border-slate-200 rounded-lg overflow-hidden bg-white">
            <thead className="bg-emerald-100/70">
              <tr>
                <th className="px-3 py-2 text-left">Mã</th>
                <th className="px-3 py-2 text-left">Tên thiết bị</th>
                <th className="px-3 py-2 text-left">Thời gian</th>
                <th className="px-3 py-2 text-left">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <>
                  <tr
                    key={r.id}
                    onClick={() =>
                      setExpandedEquipment((prev) =>
                        prev === r.id ? null : r.id
                      )
                    }
                    className={`border-t cursor-pointer hover:bg-emerald-50 transition ${
                      expandedEquipment === r.id ? "bg-emerald-100/60" : ""
                    }`}
                  >
                    <td className="px-3 py-2 font-medium text-emerald-700">
                      {r.id}
                    </td>
                    <td className="px-3 py-2">
                      {r.units?.[0]?.equipment_name}
                    </td>
                    <td className="px-3 py-2">{r.scheduled_at}</td>
                    <td className="px-3 py-2 capitalize">{r.status}</td>
                  </tr>

                  {/* Hiển thị unit khi expand */}
                  {expandedEquipment === r.id && (
                    <tr className="bg-emerald-50 transition">
                      <td colSpan={4} className="p-0">
                        <div className="px-5 py-3">
                          <p className="text-sm font-semibold mb-2 text-emerald-700">
                            Các unit sẽ được bảo trì:
                          </p>
                          <table className="min-w-full text-xs border border-emerald-200 rounded-md overflow-hidden bg-white">
                            <thead className="bg-emerald-100/70">
                              <tr>
                                <th className="px-3 py-2 text-left">
                                  Mã định danh thiết bị
                                </th>
                                <th className="px-3 py-2 text-left">
                                  Tên thiết bị
                                </th>
                                <th className="px-3 py-2 text-left">
                                  Trạng thái thiết bị
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {r.units.map((u) => (
                                <tr
                                  key={u.id}
                                  className="border-t hover:bg-emerald-50"
                                >
                                  <td className="px-3 py-2">{u.id}</td>
                                  <td className="px-3 py-2">
                                    {u.equipment_name}
                                  </td>
                                  <td className="px-3 py-2">
                                    {u.status || "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold px-6"
          >
            💾 Lưu
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
