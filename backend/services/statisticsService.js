const equipmentUnitRepository = require("../repositories/equipmentUnitRepository");
const maintenanceRepository = require("../repositories/maintenanceRepository");
const maintenanceInvoiceRepository = require("../repositories/maintenanceInvoiceRepository");
const invoiceRepository = require("../repositories/invoiceRepository");
const invoiceDetailRepository = require("../repositories/invoiceDetailRepository");
const vendorRepository = require("../repositories/vendorRepository");
const userRepository = require("../repositories/userRepository");
const equipmentDisposalRepository = require("../repositories/equipmentDisposalRepository");
const equipmentDisposalDetailRepository = require("../repositories/equipmentDisposalDetailRepository");

// ===============================
// Helper: kiểm tra ngày trong kỳ (UTC+7)
// ===============================
function isInPeriod(dateStr, type, { year, month, quarter, week }) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const local = new Date(d.getTime() + 7 * 60 * 60 * 1000); // UTC+7

  switch (type) {
    case "year":
      return local.getFullYear() === year;

    case "quarter": {
      const q = Math.floor(local.getMonth() / 3) + 1;
      return local.getFullYear() === year && q === quarter;
    }

    case "month":
      return local.getFullYear() === year && local.getMonth() + 1 === month;

    case "week": {
      if (!month || !week) return false;
      if (local.getFullYear() !== year || local.getMonth() + 1 !== month)
        return false;
      const start = new Date(year, month - 1, 1);
      const startWeekday = start.getDay() === 0 ? 7 : start.getDay();
      const weekOfMonth = Math.ceil((local.getDate() + startWeekday - 1) / 7);
      return weekOfMonth === week;
    }

    default:
      return true;
  }
}

// ===============================
// Service chính
// ===============================
const statisticsService = {
  /**
   * 📊 Thống kê tổng hợp hiện tại (theo tháng / quý / năm)
   */
  async getStatistics({
    type = "month",
    year,
    month,
    quarter,
    week,
    branchFilter,
    userRole,
  }) {
    console.log("📊 [Statistics Params]:", {
      type,
      year,
      month,
      quarter,
      week,
      branchFilter,
      userRole,
    });

    // 1️⃣ Lấy dữ liệu gốc (raw)
    const [
      units,
      maintenances,
      maintenanceInvoices,
      invoices,
      invoiceDetails,
      vendors,
      disposals,
      disposalDetails,
    ] = await Promise.all([
      branchFilter
        ? equipmentUnitRepository.findByBranch(branchFilter)
        : equipmentUnitRepository.findAll(),
      branchFilter
        ? maintenanceRepository.findByBranch(branchFilter)
        : maintenanceRepository.findAll(),
      maintenanceInvoiceRepository.findAll().catch(() => []),
      branchFilter
        ? invoiceRepository.findByBranch(branchFilter)
        : invoiceRepository.findAll(),
      invoiceDetailRepository.findAll().catch(() => []),
      vendorRepository.findAll().catch(() => []),
      branchFilter
        ? equipmentDisposalRepository.findByBranch(branchFilter)
        : equipmentDisposalRepository.findAll?.() || [],
      equipmentDisposalDetailRepository.findAll().catch(() => []),
    ]);

    // 🧩 Tính cutoff (giới hạn thời gian cuối kỳ)
    let cutoff = null;
    if (type === "week" && week && month) {
      const startOfMonth = new Date(year, month - 1, 1);
      const startWeekday =
        startOfMonth.getDay() === 0 ? 7 : startOfMonth.getDay();
      const startDay = (week - 1) * 7 - (startWeekday - 1) + 1;
      const endDay = Math.min(startDay + 6, new Date(year, month, 0).getDate());
      cutoff = new Date(year, month - 1, endDay, 23, 59, 59);
    } else if (type === "month" && month) {
      cutoff = new Date(year, month, 0, 23, 59, 59); // Cuối tháng
    } else if (type === "quarter" && quarter) {
      const endMonth = quarter * 3;
      cutoff = new Date(year, endMonth, 0, 23, 59, 59); // Cuối quý
    } else if (type === "year") {
      cutoff = new Date(year, 11, 31, 23, 59, 59); // Cuối năm
    }

    // 2️⃣ Tổng số thiết bị (trừ thiết bị đã thanh lý) / vendor
    const disposedUnitIds = disposalDetails
      .filter((det) =>
        disposals.some((disp) =>
          isInPeriod(disp.created_at, type, { year, month, quarter, week })
        )
      )
      .map((d) => d.equipment_unit_id);

    const totalEquipments = units.filter((u) => {
      const createdAt = new Date(u.created_at || u.import_date || 0);
      const notDisposed = !disposedUnitIds.includes(u.id);
      if (cutoff) return createdAt <= cutoff && notDisposed;
      return notDisposed;
    }).length;

    const totalVendors = vendors.length;

    // 3️⃣ Nhân viên (gọi bằng quyền super-admin)
    let totalStaff = 0;
    try {
      const all = await userRepository.listUsers({ role: "super-admin" });
      if (Array.isArray(all.users)) {
        totalStaff = all.users.filter(
          (u) => !u.roles?.includes("super-admin")
        ).length;
      }
    } catch (err) {
      console.warn("⚠️ Lỗi khi lấy danh sách user:", err.message);
    }

    // 4️⃣ Thiết bị nhập hàng trong kỳ
    const importInvoices = invoices.filter((inv) =>
      isInPeriod(inv.created_at, type, { year, month, quarter, week })
    );
    const importInvoiceIds = importInvoices.map((i) => i.id);
    const newEquipmentUnits = invoiceDetails.filter((det) =>
      importInvoiceIds.includes(det.invoice_id)
    ).length;

    // 5️⃣ Bảo trì
    const maintenanceThisPeriod = maintenances.filter((m) =>
      isInPeriod(m.start_date, type, { year, month, quarter, week })
    );
    const maintenanceInProgress = maintenanceThisPeriod.filter(
      (m) => !m.result && !m.end_date
    ).length;
    const maintenanceSuccess = maintenanceThisPeriod.filter(
      (m) => m.result === true
    ).length;
    const maintenanceFailed = maintenanceThisPeriod.filter(
      (m) => m.result === false
    ).length;

    // 6️⃣ Chi phí (lọc theo kỳ)
    const importCost = invoices
      .filter((inv) =>
        isInPeriod(inv.created_at, type, { year, month, quarter, week })
      )
      .reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);

    const maintenanceCost = maintenanceInvoices
      .filter((inv) =>
        isInPeriod(inv.created_at, type, { year, month, quarter, week })
      )
      .reduce((sum, inv) => sum + (Number(inv.cost) || 0), 0);

    // 7️⃣ Thanh lý thiết bị
    const disposalThisPeriod = disposals.filter((d) =>
      isInPeriod(d.created_at, type, { year, month, quarter, week })
    );
    const disposalCost = disposalThisPeriod.reduce(
      (sum, d) => sum + (Number(d.total_value) || 0),
      0
    );
    const disposedUnits = disposalDetails.filter((det) =>
      disposalThisPeriod.some((disp) => disp.id === det.disposal_id)
    ).length;

    // 8️⃣ Đếm thiết bị theo trạng thái
    const targetStatuses = [
      "Active",
      "Inactive",
      "Temporary Urgent",
      "In Progress",
      "In Stock",
      "Moving",
      "Ready",
      "Failed",
    ];
    const equipmentStatusCount = {};
    for (const status of targetStatuses) {
      equipmentStatusCount[status] = units.filter((u) => {
        const createdAt = new Date(u.created_at || u.import_date || 0);
        const notDisposed = !disposedUnitIds.includes(u.id);
        if (cutoff)
          return createdAt <= cutoff && u.status === status && notDisposed;
        return u.status === status && notDisposed;
      }).length;
    }

    // 9️⃣ Đếm thiết bị còn hạn / hết hạn bảo hành (trừ thiết bị đã thanh lý)
    const now = new Date();

    const warrantyValid = units.filter((u) => {
      const createdAt = new Date(u.created_at || u.import_date || 0);
      const notDisposed = !disposedUnitIds.includes(u.id);
      if (!u.warranty_end_date) return false;
      if (cutoff)
        return (
          createdAt <= cutoff &&
          new Date(u.warranty_end_date) >= cutoff &&
          notDisposed
        );
      return new Date(u.warranty_end_date) >= now && notDisposed;
    }).length;

    const warrantyExpired = units.filter((u) => {
      const createdAt = new Date(u.created_at || u.import_date || 0);
      const notDisposed = !disposedUnitIds.includes(u.id);
      if (!u.warranty_end_date) return false;
      if (cutoff)
        return (
          createdAt <= cutoff &&
          new Date(u.warranty_end_date) < cutoff &&
          notDisposed
        );
      return new Date(u.warranty_end_date) < now && notDisposed;
    }).length;

    // 🔟 Tổng hợp kết quả
    const summary = {
      totalEquipments,
      newEquipmentUnits,
      disposedUnits,
      maintenanceInProgress,
      maintenanceSuccess,
      maintenanceFailed,
      totalStaff,
      totalVendors,
      importCost,
      maintenanceCost,
      disposalCost,
      equipmentStatusCount,
      warrantyValid,
      warrantyExpired,
    };

    return {
      period: { type, year, month, quarter, week, branchFilter },
      summary,
    };
  },

  /**
   * 📈 Thống kê xu hướng (trend chart)
   * → Trả dữ liệu tương tự getStatistics, nhưng chia theo tháng / quý
   */
  async getTrend({ type = "month", year, month, branchFilter }) {
    // 🔹 Log ra để kiểm tra query thực tế
    console.log("📊 [getTrend received]:", { type, year, month, branchFilter });

    // 🔹 Ép kiểu về số
    year = Number(year);
    month = month ? Number(month) : null;

    // ✅ Kiểm tra hợp lệ khi thống kê theo tuần
    if (type === "week" && (!month || isNaN(month))) {
      throw new Error(
        "❌ Cần truyền 'month' hợp lệ khi thống kê theo tuần (VD: month=10)"
      );
    }

    const [
      units,
      maintenances,
      maintenanceInvoices,
      invoices,
      invoiceDetails,
      vendors,
      usersData,
      disposals,
      disposalDetails,
    ] = await Promise.all([
      branchFilter
        ? equipmentUnitRepository.findByBranch(branchFilter)
        : equipmentUnitRepository.findAll(),
      branchFilter
        ? maintenanceRepository.findByBranch(branchFilter)
        : maintenanceRepository.findAll(),
      maintenanceInvoiceRepository.findAll().catch(() => []),
      branchFilter
        ? invoiceRepository.findByBranch(branchFilter)
        : invoiceRepository.findAll(),
      invoiceDetailRepository.findAll().catch(() => []),
      vendorRepository.findAll().catch(() => []),
      userRepository
        .listUsers({ role: "super-admin" })
        .catch(() => ({ users: [] })),
      branchFilter
        ? equipmentDisposalRepository.findByBranch(branchFilter)
        : equipmentDisposalRepository.findAll?.() || [],
      equipmentDisposalDetailRepository.findAll().catch(() => []),
    ]);

    const totalVendors = vendors.length;
    const totalStaff = Array.isArray(usersData.users)
      ? usersData.users.filter((u) => !u.roles?.includes("super-admin")).length
      : 0;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentQuarter = Math.floor((currentMonth - 1) / 3) + 1;
    const currentWeek = Math.ceil(now.getDate() / 7);

    const trendData = [];

    // 🆕 THỐNG KÊ THEO TUẦN TRONG THÁNG
    // 🆕 THỐNG KÊ THEO TUẦN TRONG THÁNG
    if (type === "week") {
      if (!month || isNaN(month))
        throw new Error("❌ Cần truyền 'month' hợp lệ khi thống kê theo tuần.");

      const daysInMonth = new Date(year, month, 0).getDate();
      const totalWeeks = Math.ceil(daysInMonth / 7);
      const isCurrentMonth = year === currentYear && month === currentMonth;

      for (let w = 1; w <= totalWeeks; w++) {
        // Ẩn tuần chưa tới (nếu là tháng hiện tại)
        if (isCurrentMonth && w > currentWeek) continue;

        const label = `Tuần ${w}`;

        // Lọc dữ liệu theo tuần
        const importInvoices = invoices.filter((inv) =>
          isInPeriod(inv.created_at, "week", { year, month, week: w })
        );
        const importInvoiceIds = importInvoices.map((x) => x.id);
        const newEquipmentUnits = invoiceDetails.filter((det) =>
          importInvoiceIds.includes(det.invoice_id)
        ).length;

        const maintenanceThisPeriod = maintenances.filter((m) =>
          isInPeriod(m.start_date, "week", { year, month, week: w })
        );
        const maintenanceInProgress = maintenanceThisPeriod.filter(
          (m) => !m.result && !m.end_date
        ).length;
        const maintenanceSuccess = maintenanceThisPeriod.filter(
          (m) => m.result === true
        ).length;
        const maintenanceFailed = maintenanceThisPeriod.filter(
          (m) => m.result === false
        ).length;

        const importCost = importInvoices.reduce(
          (sum, inv) => sum + (Number(inv.total) || 0),
          0
        );
        const maintenanceCost = maintenanceInvoices
          .filter((inv) =>
            isInPeriod(inv.created_at, "week", { year, month, week: w })
          )
          .reduce((sum, inv) => sum + (Number(inv.cost) || 0), 0);

        const disposalThisPeriod = disposals.filter((d) =>
          isInPeriod(d.created_at, "week", { year, month, week: w })
        );
        const disposalCost = disposalThisPeriod.reduce(
          (sum, d) => sum + (Number(d.total_value) || 0),
          0
        );
        const disposedUnits = disposalDetails.filter((det) =>
          disposalThisPeriod.some((disp) => disp.id === det.disposal_id)
        ).length;

        // 🔹 Xác định thời điểm cuối tuần (cutoff)
        const startOfMonth = new Date(year, month - 1, 1);
        const startWeekday =
          startOfMonth.getDay() === 0 ? 7 : startOfMonth.getDay();
        const startDay = (w - 1) * 7 - (startWeekday - 1) + 1;
        const endDay = Math.min(
          startDay + 6,
          new Date(year, month, 0).getDate()
        );
        const cutoff = new Date(year, month - 1, endDay, 23, 59, 59);

        // 🔹 Danh sách ID thiết bị đã thanh lý tới thời điểm tuần này
        const disposedUnitIdsTillNow = disposalDetails
          .filter((det) =>
            disposals.some((disp) =>
              isInPeriod(disp.created_at, "week", { year, month, week: w })
            )
          )
          .map((d) => d.equipment_unit_id);

        // 🔹 Đếm thiết bị còn lại tới hết tuần đó
        const totalEquipments = units.filter((u) => {
          const createdAt = new Date(u.created_at || u.import_date || 0);
          return createdAt <= cutoff && !disposedUnitIdsTillNow.includes(u.id);
        }).length;

        // 🔹 Đếm thiết bị theo trạng thái
        const targetStatuses = [
          "Active",
          "Inactive",
          "Temporary Urgent",
          "In Progress",
          "In Stock",
          "Moving",
          "Ready",
          "Failed",
        ];
        const equipmentStatusCount = {};
        for (const status of targetStatuses) {
          equipmentStatusCount[status] = units.filter((u) => {
            const createdAt = new Date(u.created_at || u.import_date || 0);
            return (
              createdAt <= cutoff &&
              u.status === status &&
              !disposedUnitIdsTillNow.includes(u.id)
            );
          }).length;
        }

        // 🔹 Bảo hành (tính đến thời điểm cuối tuần)
        const warrantyValid = units.filter((u) => {
          const createdAt = new Date(u.created_at || u.import_date || 0);
          return (
            createdAt <= cutoff &&
            u.warranty_end_date &&
            new Date(u.warranty_end_date) >= cutoff &&
            !disposedUnitIdsTillNow.includes(u.id)
          );
        }).length;

        const warrantyExpired = units.filter((u) => {
          const createdAt = new Date(u.created_at || u.import_date || 0);
          return (
            createdAt <= cutoff &&
            u.warranty_end_date &&
            new Date(u.warranty_end_date) < cutoff &&
            !disposedUnitIdsTillNow.includes(u.id)
          );
        }).length;

        // 🧾 Ghi kết quả
        trendData.push({
          label,
          totalEquipments,
          newEquipmentUnits,
          disposedUnits,
          maintenanceInProgress,
          maintenanceSuccess,
          maintenanceFailed,
          totalStaff,
          totalVendors,
          importCost,
          maintenanceCost,
          disposalCost,
          equipmentStatusCount,
          warrantyValid,
          warrantyExpired,
        });
      }

      return trendData;
    }

    // ⚙️ Giữ nguyên toàn bộ logic cũ cho month / quarter
    const limit =
      type === "quarter"
        ? year === currentYear
          ? currentQuarter
          : 4
        : year === currentYear
        ? currentMonth
        : 12;

    for (let i = 1; i <= limit; i++) {
      const label = type === "quarter" ? `Quý ${i}` : `Tháng ${i}`;

      if (
        year === currentYear &&
        ((type === "month" && i > currentMonth) ||
          (type === "quarter" && i > currentQuarter))
      ) {
        trendData.push({
          label,
          totalEquipments: 0,
          newEquipmentUnits: 0,
          disposedUnits: 0,
          maintenanceInProgress: 0,
          maintenanceSuccess: 0,
          maintenanceFailed: 0,
          totalStaff,
          totalVendors,
          importCost: 0,
          maintenanceCost: 0,
          disposalCost: 0,
          equipmentStatusCount: {
            Active: 0,
            Inactive: 0,
            "Temporary Urgent": 0,
            "In Progress": 0,
            "In Stock": 0,
            Moving: 0,
            Ready: 0,
            Failed: 0,
          },
          warrantyValid: 0,
          warrantyExpired: 0,
        });
        continue;
      }

      // Dữ liệu trong kỳ (lọc theo tháng hoặc quý)
      const importInvoices = invoices.filter((inv) =>
        isInPeriod(inv.created_at, type, { year, month: i, quarter: i })
      );
      const importInvoiceIds = importInvoices.map((x) => x.id);
      const newEquipmentUnits = invoiceDetails.filter((det) =>
        importInvoiceIds.includes(det.invoice_id)
      ).length;

      const maintenanceThisPeriod = maintenances.filter((m) =>
        isInPeriod(m.start_date, type, { year, month: i, quarter: i })
      );
      const maintenanceInProgress = maintenanceThisPeriod.filter(
        (m) => !m.result && !m.end_date
      ).length;
      const maintenanceSuccess = maintenanceThisPeriod.filter(
        (m) => m.result === true
      ).length;
      const maintenanceFailed = maintenanceThisPeriod.filter(
        (m) => m.result === false
      ).length;

      const importCost = importInvoices.reduce(
        (sum, inv) => sum + (Number(inv.total) || 0),
        0
      );
      const maintenanceCost = maintenanceInvoices
        .filter((inv) =>
          isInPeriod(inv.created_at, type, { year, month: i, quarter: i })
        )
        .reduce((sum, inv) => sum + (Number(inv.cost) || 0), 0);

      const disposalThisPeriod = disposals.filter((d) =>
        isInPeriod(d.created_at, type, { year, month: i, quarter: i })
      );
      const disposalCost = disposalThisPeriod.reduce(
        (sum, d) => sum + (Number(d.total_value) || 0),
        0
      );
      const disposedUnits = disposalDetails.filter((det) =>
        disposalThisPeriod.some((disp) => disp.id === det.disposal_id)
      ).length;

      // Danh sách ID thiết bị đã thanh lý tới thời điểm này
      const disposedUnitIdsTillNow = disposalDetails
        .filter((det) =>
          disposals.some((disp) =>
            isInPeriod(disp.created_at, type, { year, month: i, quarter: i })
          )
        )
        .map((d) => d.equipment_unit_id);

      // Tổng thiết bị đến hết kỳ (tháng/quý)
      const totalEquipments = units.filter((u) => {
        const createdAt = new Date(u.created_at || u.import_date || 0);
        const localCreated = new Date(createdAt.getTime() + 7 * 60 * 60 * 1000);
        const createdYear = localCreated.getFullYear();
        const createdMonth = localCreated.getMonth() + 1;
        const createdQuarter = Math.floor((createdMonth - 1) / 3) + 1;

        if (type === "month")
          return (
            createdYear === year &&
            createdMonth <= i &&
            !disposedUnitIdsTillNow.includes(u.id)
          );
        else
          return (
            createdYear === year &&
            createdQuarter <= i &&
            !disposedUnitIdsTillNow.includes(u.id)
          );
      }).length;

      // Trạng thái thiết bị
      const targetStatuses = [
        "Active",
        "Inactive",
        "Temporary Urgent",
        "In Progress",
        "In Stock",
        "Moving",
        "Ready",
        "Failed",
      ];
      const equipmentStatusCount = {};
      for (const status of targetStatuses) {
        equipmentStatusCount[status] = units.filter((u) => {
          const createdAt = new Date(u.created_at || u.import_date || 0);
          const localCreated = new Date(
            createdAt.getTime() + 7 * 60 * 60 * 1000
          );
          const createdYear = localCreated.getFullYear();
          const createdMonth = localCreated.getMonth() + 1;
          const createdQuarter = Math.floor((createdMonth - 1) / 3) + 1;

          if (type === "month")
            return (
              createdYear === year && createdMonth <= i && u.status === status
            );
          else
            return (
              createdYear === year && createdQuarter <= i && u.status === status
            );
        }).length;
      }

      // Bảo hành (trừ thiết bị đã thanh lý tới thời điểm này)
      const endMonth = type === "month" ? i : i * 3;
      const cutoff = new Date(year, endMonth, 0, 23, 59, 59);

      const warrantyValid = units.filter((u) => {
        const createdAt = new Date(u.created_at || u.import_date || 0);
        const localCreated = new Date(createdAt.getTime() + 7 * 60 * 60 * 1000);
        const createdYear = localCreated.getFullYear();
        const createdMonth = localCreated.getMonth() + 1;
        const createdQuarter = Math.floor((createdMonth - 1) / 3) + 1;

        const inRange =
          type === "month"
            ? createdYear === year && createdMonth <= i
            : createdYear === year && createdQuarter <= i;

        return (
          inRange &&
          u.warranty_end_date &&
          new Date(u.warranty_end_date) >= cutoff &&
          !disposedUnitIdsTillNow.includes(u.id)
        );
      }).length;

      const warrantyExpired = units.filter((u) => {
        const createdAt = new Date(u.created_at || u.import_date || 0);
        const localCreated = new Date(createdAt.getTime() + 7 * 60 * 60 * 1000);
        const createdYear = localCreated.getFullYear();
        const createdMonth = localCreated.getMonth() + 1;
        const createdQuarter = Math.floor((createdMonth - 1) / 3) + 1;

        const inRange =
          type === "month"
            ? createdYear === year && createdMonth <= i
            : createdYear === year && createdQuarter <= i;

        return (
          inRange &&
          u.warranty_end_date &&
          new Date(u.warranty_end_date) < cutoff &&
          !disposedUnitIdsTillNow.includes(u.id)
        );
      }).length;

      trendData.push({
        label,
        totalEquipments,
        newEquipmentUnits,
        disposedUnits,
        maintenanceInProgress,
        maintenanceSuccess,
        maintenanceFailed,
        totalStaff,
        totalVendors,
        importCost,
        maintenanceCost,
        disposalCost,
        equipmentStatusCount,
        warrantyValid,
        warrantyExpired,
      });
    }

    return trendData;
  },
};

module.exports = statisticsService;
