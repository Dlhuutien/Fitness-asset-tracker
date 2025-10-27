import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { CheckCircle2, PlusCircle } from "lucide-react";

// 🧩 Services
import VendorService from "@/services/vendorService";
import EquipmentService from "@/services/equipmentService";
import InvoiceService from "@/services/invoiceService";
import BranchService from "@/services/branchService";

// 🧠 Hooks
import useAuthRole from "@/hooks/useAuthRole";
import { useEquipmentData } from "@/hooks/useEquipmentUnitData";

// 🧱 Components
import VendorQuickAdd from "@/components/panel/vendor/VendorQuickAdd";
import VendorSection from "@/components/panel/importEquipment/VendorSection";
import EquipmentTable from "@/components/panel/importEquipment/EquipmentTable";
import ImportSummary from "@/components/panel/importEquipment/ImportSummary";
import BranchSelector from "@/components/panel/importEquipment/BranchSelector"; // 🏬 thêm dòng này
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
  const [branches, setBranches] = useState([]); // 🏬 Thêm danh sách chi nhánh
  const [selectedBranch, setSelectedBranch] = useState(branchId || ""); // 🏬 Chi nhánh đang chọn
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
        const [v, e, b] = await Promise.all([
          VendorService.getAll(),
          EquipmentService.getAll(),
          BranchService.getAll(), // 🏬 lấy chi nhánh
        ]);
        setVendors(v || []);
        setEquipments(e || []);
        setBranches(b || []);
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
  // ✅ XÁC NHẬN NHẬP HÀNG
  // ==============================
  // ==============================
  const handleConfirmImport = async () => {
    try {
      const finalBranchId = isSuperAdmin ? selectedBranch : branchId;

      if (!selectedVendor) {
        toast.error("⚠️ Vui lòng chọn nhà cung cấp!");
        return;
      }
      if (!finalBranchId) {
        toast.error("⚠️ Vui lòng chọn chi nhánh nhập hàng!");
        return;
      }

      const items = Object.values(selectedItems).map((item) => ({
        equipment_id: item.id,
        vendor_id: selectedVendor,
        branch_id: finalBranchId,
        cost: Number(item.price) || 0,
        quantity: Number(item.qty) || 0,
        warranty_duration: Number(item.warranty_duration) || 0,
      }));

      if (items.length === 0) {
        toast.warning("⚠️ Chưa có thiết bị nào để nhập!");
        return;
      }

      setOverlayOpen(true);
      setOverlayMode("loading");
      setLoadingSubmit(true);

      await InvoiceService.create({ items });
      toast.info("🧾 Đang cập nhật danh sách thiết bị...");

      // 🔁 Refresh lại danh sách thiết bị
      await refreshEquipmentUnits();
      const newData = eqUnits || []; // 🟢 đọc lại dữ liệu sau mutate

      // 🔍 Kiểm tra thiết bị NEW
      const hasNew = Array.isArray(newData)
        ? newData.some(
            (u) =>
              (u.status && String(u.status).toUpperCase() === "NEW") ||
              (u.badge && String(u.badge).toUpperCase() === "NEW")
          )
        : false;

      if (hasNew) {
        console.log("✅ Phát hiện thiết bị NEW sau khi nhập hàng");
        setOverlayMode("success");
        toast.success("🎉 Thiết bị mới đã được thêm vào hệ thống!");
      } else {
        console.warn(
          "⚠️ Không phát hiện thiết bị NEW — fallback success sau 1s"
        );
        setTimeout(() => setOverlayMode("success"), 1000);
      }
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
      {/* 🌀 OVERLAY NHẬP HÀNG */}
      {overlayOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-2xl border border-emerald-500/30 w-[90%] max-w-md text-center overflow-hidden">
            {/* 🌈 Hiệu ứng aura glow (đã fix pointer-events) */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-purple-500/10 blur-2xl animate-pulse" />
            </div>

            {overlayMode === "loading" ? (
              <>
                {/* 🔄 LOADING ANIMATION */}
                <div className="relative w-20 h-20 mx-auto mb-5">
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin" />
                  <div className="absolute inset-[6px] rounded-full border-4 border-purple-400 border-b-transparent animate-[spin_1.5s_linear_infinite_reverse]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-emerald-600 dark:text-emerald-400">
                  Đang nhập hàng...
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Hệ thống FitX Gym đang thêm thiết bị mới vào kho.
                </p>
              </>
            ) : (
              <>
                {/* ✅ SUCCESS ANIMATION */}
                <div className="relative w-20 h-20 mx-auto mb-5 flex items-center justify-center">
                  <div className="absolute w-20 h-20 rounded-full bg-emerald-400/20 blur-xl animate-ping" />
                  <div className="absolute w-16 h-16 rounded-full bg-emerald-500/30 blur-md" />
                  <div className="relative w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-purple-500 shadow-lg">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  Nhập hàng thành công!
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Thiết bị mới đã được thêm vào hệ thống <b>FitX Gym</b> với
                  trạng thái{" "}
                  <span className="text-emerald-500 font-semibold">NEW</span>.
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

      {/* 🏬 0️⃣ BRANCH SELECTOR */}
      <BranchSelector
        branches={branches}
        selectedBranch={selectedBranch}
        setSelectedBranch={setSelectedBranch}
        isSuperAdmin={isSuperAdmin}
        branchId={branchId}
      />

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
        branchId={isSuperAdmin ? selectedBranch : branchId}
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
