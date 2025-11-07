import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/buttonn";
import MaintenancePlanService from "@/services/MaintenancePlanService";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  CalendarDays,
  Wrench,
  PackageCheck,
  Loader2,
  CheckCircle2,
  StickyNote,
} from "lucide-react";

export default function ScheduleEvent({ open, onClose, onSaved }) {
  const [form, setForm] = useState({
    equipment_id: "",
    frequency: "3_months",
    next_maintenance_date: "",
    note: "",
  });
  const [loading, setLoading] = useState(false);
  const [nextDatePreview, setNextDatePreview] = useState("");
  const [success, setSuccess] = useState(false);

useEffect(() => {
  // Mỗi lần mở modal thì reset form về trống
  setForm({
    equipment_id: "",
    frequency: "3_months",
    next_maintenance_date: "",
    note: "",
  });
}, [open]);


  // 🔁 Dự kiến ngày tiếp theo
  useEffect(() => {
    if (!form.next_maintenance_date) return setNextDatePreview("");
    const d = new Date(form.next_maintenance_date);
    if (form.frequency === "1_month") d.setMonth(d.getMonth() + 1);
    if (form.frequency === "3_months") d.setMonth(d.getMonth() + 3);
    if (form.frequency === "6_months") d.setMonth(d.getMonth() + 6);
    if (form.frequency === "1_year") d.setFullYear(d.getFullYear() + 1);
    setNextDatePreview(format(d, "dd/MM/yyyy", { locale: vi }));
  }, [form.frequency, form.next_maintenance_date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
await MaintenancePlanService.create(form);
toast.success("🎉 Đã tạo kế hoạch mới!");

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSaved();
        onClose();
      }, 1200);
    } catch {
      toast.error("Không thể lưu kế hoạch!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="fitx-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-[440px] rounded-3xl overflow-hidden
                       bg-gradient-to-br from-white via-slate-50 to-emerald-50
                       shadow-[0_0_35px_rgba(16,185,129,0.25)] border border-emerald-200"
          >
            {/* === Header Gradient FitX === */}
            <div className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-teal-500 text-white px-6 py-4 font-semibold text-lg tracking-wide flex items-center justify-between shadow-inner">
              "🛠️ Lên lịch bảo trì mới"

            </div>

            {/* === Form Body === */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 relative">
              {/* ✅ Overlay khi lưu thành công */}
              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center rounded-3xl z-20"
                  >
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-2 animate-bounce" />
                    <p className="text-emerald-600 font-semibold text-lg">
                      Đã lưu thành công!
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mã thiết bị */}
              <div>
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-emerald-500" />
                  Mã thiết bị
                </label>
                <Input
                  placeholder="VD: CAOTMJS-01"
                  value={form.equipment_id}
                  onChange={(e) =>
                    setForm({ ...form, equipment_id: e.target.value })
                  }
                  required
                  className="mt-1 border-slate-300 focus:ring-emerald-400"
                />
              </div>

              {/* Tần suất */}
              <div>
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-cyan-500" />
                  Tần suất định kỳ
                </label>
                <select
                  value={form.frequency}
                  onChange={(e) =>
                    setForm({ ...form, frequency: e.target.value })
                  }
                  className="w-full mt-1 border border-slate-300 rounded-md h-9 px-2 bg-white text-sm focus:ring-2 focus:ring-emerald-400 outline-none transition"
                >
                  <option value="1_month">🗓️ Mỗi 1 tháng</option>
                  <option value="3_months">📆 Mỗi 3 tháng</option>
                  <option value="6_months">🛠️ Mỗi 6 tháng</option>
                  <option value="1_year">🏁 Mỗi 1 năm</option>
                </select>
              </div>

              {/* Ngày bảo trì tiếp theo */}
              <div>
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-amber-500" />
                  Ngày bắt đầu bảo trì
                </label>
                <Input
                  type="date"
                  value={form.next_maintenance_date}
                  onChange={(e) =>
                    setForm({ ...form, next_maintenance_date: e.target.value })
                  }
                  required
                  className="mt-1 border-slate-300 focus:ring-emerald-400"
                />
                {nextDatePreview && (
                  <p className="text-xs text-slate-500 mt-1 italic">
                    🔁 Dự kiến bảo trì kế tiếp:{" "}
                    <span className="text-emerald-600 font-medium">
                      {nextDatePreview}
                    </span>
                  </p>
                )}
              </div>

              {/* Ghi chú */}
              <div>
                <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-pink-500" />
                  Ghi chú (tùy chọn)
                </label>
                <textarea
                  rows={3}
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="Ghi chú thêm cho kế hoạch bảo trì..."
                  className="w-full mt-1 border border-slate-300 rounded-md px-2 py-1.5 text-sm resize-none focus:ring-2 focus:ring-emerald-400 outline-none transition"
                />
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="border-slate-300 hover:bg-slate-100"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-teal-500 text-white font-semibold shadow-md hover:opacity-90"
                >
                  {loading && (
                    <Loader2 className="animate-spin w-4 h-4 mr-2 inline-block" />
                  )}
                  {loading ? "Đang lưu..." : "Lưu kế hoạch"}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
