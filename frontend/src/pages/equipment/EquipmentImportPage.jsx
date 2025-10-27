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
export default function EquipmentImportPage({ onRequestSwitchTab, onStartImport }) {
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

    const related = eqUnits.filter((u) => u.equipment_id === checkedEquipmentId);

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

      const res = await InvoiceService.create({ items });
      toast.info("🧾 Đang cập nhật danh sách thiết bị...");

      await refreshEquipmentUnits();
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
