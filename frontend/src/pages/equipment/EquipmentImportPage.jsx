import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { CheckCircle2, PlusCircle } from "lucide-react";

// 🧩 Services
import VendorService from "@/services/vendorService";
import EquipmentService from "@/services/equipmentService";
import InvoiceService from "@/services/invoiceService";

// 🧠 Hooks
import useAuthRole from "@/hooks/useAuthRole";
import { useEquipmentData } from "@/hooks/useEquipmentUnitData";

// 🧱 Components
import VendorQuickAdd from "@/components/panel/vendor/VendorQuickAdd";
import VendorSection from "@/components/panel/importEquipment/VendorSection";
import EquipmentTable from "@/components/panel/importEquipment/EquipmentTable";
import ImportSummary from "@/components/panel/importEquipment/ImportSummary";
import { Button } from "@/components/ui/buttonn";

/**
 * 📦 Trang Nhập thiết bị vào kho (FitX Gym)
 */
export default function EquipmentImportPage({
  onRequestSwitchTab,
  onStartImport,
}) {
  const { mutate } = useSWRConfig();
  const { isSuperAdmin, branchId } = useAuthRole();
  const { eqUnits, refreshEquipmentUnits } = useEquipmentData();

  // ==============================
  // ⚙️ STATE QUẢN LÝ DỮ LIỆU
  // ==============================
  const [vendors, setVendors] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [checkedEquipmentId, setCheckedEquipmentId] = useState("");
  const [selectedItems, setSelectedItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // ==============================
  // 🧭 LOAD DỮ LIỆU NỀN
  // ==============================
  useEffect(() => {
    (async () => {
      try {
        const [v, e] = await Promise.all([
          VendorService.getAll(),
          EquipmentService.getAll(),
        ]);
        setVendors(v || []);
        setEquipments(e || []);
      } catch (err) {
        console.error("❌ Load import data error:", err);
        toast.error("Không thể tải dữ liệu import.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ==============================
  // ➕ THÊM NHANH NHÀ CUNG CẤP
  // ==============================
  const [openAddVendor, setOpenAddVendor] = useState(false);

  const handleSuccessAddVendor = async () => {
    setOpenAddVendor(false);
    try {
      const res = await VendorService.getAll();
      setVendors(res || []);
      toast.success("✅ Đã thêm nhà cung cấp mới!");
    } catch {
      toast.error("Không thể tải lại danh sách vendor!");
    }
  };

  // ==============================
  // 💰 TÍNH GIÁ NHẬP GẦN NHẤT THEO VENDOR
  // ==============================
  const vendorLatestPrices = useMemo(() => {
    if (!checkedEquipmentId || !Array.isArray(eqUnits)) return {};

    const related = eqUnits.filter(
      (u) => u.equipment_id === checkedEquipmentId
    );

    const byVendor = {};
    for (const u of related) {
      const vendor = u.vendor_id;
      if (!vendor) continue;
      const ts = new Date(u.created_at || u.updated_at || 0).getTime();
      if (!byVendor[vendor] || ts > byVendor[vendor].__ts) {
        byVendor[vendor] = {
          price: Number(u.cost) || 0,
          __ts: ts,
          unitId: u.id,
        };
      }
    }

    const out = {};
    Object.entries(byVendor).forEach(([vid, val]) => {
      out[vid] = val.price;
    });
    return out;
  }, [checkedEquipmentId, eqUnits]);

  // ==============================
  // 🧾 OVERLAY NHẬP HÀNG
  // ==============================
  // ==============================
  // 🧾 OVERLAY NHẬP HÀNG
  // ==============================
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlayMode, setOverlayMode] = useState("loading"); // "loading" | "success"
  const newFromUnitListRef = useRef(new Set());

  // 🧠 Theo dõi sự kiện FitX cập nhật thiết bị
  useEffect(() => {
    const handler = (e) => {
      const payload = e.detail;
      const ids = Array.isArray(payload)
        ? payload
        : payload?.newIds || (payload?.id ? [payload.id] : []);

      if (ids.length > 0) {
        let changed = false;
        ids.forEach((id) => {
          if (!newFromUnitListRef.current.has(id)) {
            newFromUnitListRef.current.add(id);
            changed = true;
          }
        });

        // ✅ Khi có NEW thực sự, chuyển sang success
        if (changed && overlayMode === "loading") {
          console.log("✅ Có thiết bị mới được thêm:", ids);
          setOverlayMode("success");
          toast.success("🎉 Thiết bị mới đã hiển thị trong danh sách!");
        }
      }
    };

    window.addEventListener("fitx-units-updated", handler);
    return () => window.removeEventListener("fitx-units-updated", handler);
  }, [overlayMode]);

  // ==============================
  // ✅ XÁC NHẬN NHẬP HÀNG (chỉ thành công khi có NEW)
  // ==============================
  const handleConfirmImport = async () => {
    try {
      if (!selectedVendor) {
        toast.error("⚠️ Vui lòng chọn nhà cung cấp!");
        return;
      }
      if (!branchId) {
        toast.error("⚠️ Vui lòng chọn chi nhánh nhập hàng!");
        return;
      }

      const items = Object.values(selectedItems).map((item) => ({
        equipment_id: item.id,
        vendor_id: selectedVendor,
        branch_id: branchId,
        cost: Number(item.price) || 0,
        quantity: Number(item.qty) || 0,
        warranty_duration: Number(item.warranty_duration) || 0,
      }));

      if (items.length === 0) {
        toast.warning("⚠️ Chưa có thiết bị nào để nhập!");
        return;
      }

      // 🔄 Hiển thị overlay đang xử lý
      setOverlayOpen(true);
      setOverlayMode("loading");
      setLoadingSubmit(true);

      // 🧾 Gửi request tạo hóa đơn nhập hàng
      const res = await InvoiceService.create({ items });
      toast.info("🧾 Đang cập nhật danh sách thiết bị...");

      // Gọi refresh SWR để backend phát event fitx-units-updated
      await refreshEquipmentUnits();

      // Khi có event, useEffect ở trên sẽ tự set overlayMode = "success"
    } catch (err) {
      console.error("❌ Lỗi nhập hàng:", err);
      toast.error("Không thể tạo hóa đơn nhập hàng!");
      setOverlayOpen(false);
    } finally {
      setLoadingSubmit(false);
      setSelectedItems({});
    }
  };

  // ==============================
  // ⏳ LOADING STATE
  // ==============================
  if (loading)
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-300 animate-pulse">
        Đang tải dữ liệu...
      </div>
    );

  // ==============================
  // 🧱 RENDER
  // ==============================
  return (
    <div className="space-y-6 relative">
      {/* Overlay nhập hàng */}
      {overlayOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-md">
          <div
            className="relative bg-gradient-to-br from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800 border border-emerald-400/30 dark:border-emerald-700/30 
                 shadow-2xl rounded-3xl w-[90%] max-w-md p-8 text-center overflow-hidden"
          >
            {/* Aura energy ring */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-400/10 to-purple-500/10 blur-3xl animate-pulse" />
            </div>

            {overlayMode === "loading" ? (
              <>
                {/* Animated energy ring */}
                <div className="relative w-20 h-20 mx-auto mb-5">
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin" />
                  <div className="absolute inset-[6px] rounded-full border-4 border-purple-400 border-b-transparent animate-[spin_1.5s_linear_infinite_reverse]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  Đang nhập hàng...
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Hệ thống FitX Gym đang cập nhật dữ liệu thiết bị mới của bạn.
                </p>
              </>
            ) : (
              <>
                {/* Success pulse */}
                <div className="relative w-20 h-20 mx-auto mb-5 flex items-center justify-center">
                  <div className="absolute w-20 h-20 rounded-full bg-emerald-400/20 blur-xl animate-ping" />
                  <div className="absolute w-16 h-16 rounded-full bg-emerald-500/30 blur-md" />
                  <div className="relative w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-purple-500 shadow-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-6 h-6 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  Nhập hàng thành công!
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Thiết bị mới đã được thêm vào hệ thống <b>FitX Gym</b> <br />
                  và sẽ hiển thị với nhãn{" "}
                  <span className="text-emerald-500">NEW</span>.
                </p>

                <div className="mt-6 flex justify-center">
                  <Button
                    onClick={() => {
                      setOverlayOpen(false);
                      setOverlayMode("loading");
                      newFromUnitListRef.current.clear();
                    }}
                    className="bg-gradient-to-r from-emerald-500 to-purple-500 hover:opacity-90 text-white font-semibold px-6 py-2 rounded-xl shadow-md transition"
                  >
                    Đồng ý
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 1️⃣ VENDOR SECTION */}
      <VendorSection
        vendors={vendors}
        selectedVendor={selectedVendor}
        onSelectVendor={setSelectedVendor}
        vendorLatestPrices={vendorLatestPrices}
        onAddVendor={() => setOpenAddVendor(true)}
      />

      {/* 2️⃣ EQUIPMENT TABLE */}
      <EquipmentTable
        equipments={equipments}
        selectedItems={selectedItems}
        setSelectedItems={setSelectedItems}
        checkedEquipmentId={checkedEquipmentId}
        onCheckPrice={setCheckedEquipmentId}
      />

      {/* 3️⃣ IMPORT SUMMARY */}
      <ImportSummary
        selectedVendor={selectedVendor}
        setSelectedVendor={setSelectedVendor}
        selectedItems={selectedItems}
        setSelectedItems={setSelectedItems}
        vendorLatestPrices={vendorLatestPrices}
        checkedEquipmentId={checkedEquipmentId}
        onConfirm={handleConfirmImport}
        isSuperAdmin={isSuperAdmin}
        branchId={branchId}
      />

      {/* ➕ MODAL THÊM NHANH NHÀ CUNG CẤP */}
      {openAddVendor && (
        <VendorQuickAdd
          open={openAddVendor}
          onClose={() => setOpenAddVendor(false)}
          onSuccess={handleSuccessAddVendor}
        />
      )}
    </div>
  );
}
