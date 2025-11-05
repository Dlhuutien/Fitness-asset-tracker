const maintenanceRepository = require("../repositories/maintenanceRepository");
const maintenanceInvoiceRepository = require("../repositories/maintenanceInvoiceRepository");
const equipmentUnitRepository = require("../repositories/equipmentUnitRepository");
const equipmentRepository = require("../repositories/equipmentRepository");
const branchRepository = require("../repositories/branchRepository");
const userRepository = require("../repositories/userRepository");

const maintenanceService = {
  createMaintenance: async (data, role) => {
    // Check Unit tồn tại
    const unit = await equipmentUnitRepository.findById(data.equipment_unit_id);
    if (!unit) {
      throw new Error(`Equipment unit ${data.equipment_unit_id} not found`);
    }

    // Lấy branch_id từ unit
    const branch_id = unit.branch_id;
    if (!branch_id) {
      throw new Error(
        `Equipment unit ${unit.id} is not assigned to any branch`
      );
    }

    // Check Branch tồn tại
    const branch = await branchRepository.findById(branch_id);
    if (!branch) {
      throw new Error(`Branch ${branch_id} not found`);
    }

    // Các trạng thái không được phép tạo maintenance
    const blockedStatuses = [
      "Inactive",
      "Temporary Urgent",
      "In Progress",
      "Ready",
      "Failed",
      "Deleted",
      "Moving",
    ];
    if (blockedStatuses.includes(unit.status)) {
      throw new Error(
        `Cannot create maintenance for equipment unit in status: ${unit.status}`
      );
    }

    // Check warranty theo warranty_end_date
    let warranty = false;
    if (unit.warranty_end_date) {
      const now = new Date();
      const warrantyEnd = new Date(unit.warranty_end_date);
      warranty = warrantyEnd >= now;
    }

    // Nếu hợp lệ thì tạo maintenance (branch_id auto lấy từ unit)
    const m = await maintenanceRepository.create({
      ...data,
      branch_id,
      warranty,
      maintenance_request_id: data.maintenance_request_id || null,
    });

    // Luôn update status Unit = Temporary Urgent
    await equipmentUnitRepository.update(data.equipment_unit_id, {
      status: "Temporary Urgent",
    });

    return m;
  },

  progressMaintenance: async (id, data) => {
    // technician set In Progress
    const m = await maintenanceRepository.update(id, {
      user_id: data.user_id,
      maintenance_reason: data.maintenance_reason,
    });

    // update Unit status = In Progress
    await equipmentUnitRepository.update(m.equipment_unit_id, {
      status: "In Progress",
    });

    return m;
  },

  completeMaintenance: async (id, data) => {
    const success = data.status === "Ready";
    // Ready hoặc Failed
    const updated = await maintenanceRepository.update(id, {
      user_id: data.user_id,
      maintenance_detail: data.maintenance_detail,
      end_date: new Date().toISOString(),
      result: success,
    });

    // đổi status Unit theo kết quả
    await equipmentUnitRepository.update(updated.equipment_unit_id, {
      status: data.status,
    });

    // 🔓 Mở khóa thiết bị sau khi hoàn tất bảo trì
    await equipmentUnitRepository.update(updated.equipment_unit_id, {
      isScheduleLocked: false,
    });
    console.log(
      `🔓 Unlocked unit ${updated.equipment_unit_id} after maintenance complete`
    );

    if (success) {
      // tạo invoice với cost (nếu còn warranty thì 0)
      await maintenanceInvoiceRepository.create(
        updated.id,
        updated.warranty ? 0 : data.cost
      );
    }

    return {
      ...updated,
      status: data.status,
      result: success,
    };
  },

  // =======================================================
  // ⚡ GET ALL MAINTENANCE (song song + batch)
  // =======================================================
  getAll: async (branchFilter = null) => {
    console.time("⚡ getAll maintenances total");

    // 1️⃣ Lấy tất cả maintenance và invoice song song
    const [maintenances, allInvoices] = await Promise.all([
      branchFilter
        ? maintenanceRepository.findByBranch(branchFilter)
        : maintenanceRepository.findAll(),
      maintenanceInvoiceRepository.findAll(),
    ]);

    if (!maintenances.length) return [];

    // 2️⃣ Gom toàn bộ ID cần dùng
    const unitIds = [...new Set(maintenances.map((m) => m.equipment_unit_id))];
    const assignedUserIds = maintenances
      .map((m) => m.assigned_by)
      .filter(Boolean);
    const techUserIds = maintenances.map((m) => m.user_id).filter(Boolean);
    const userIds = [...new Set([...assignedUserIds, ...techUserIds])];

    // 3️⃣ Lấy unit, equipment, user song song
    const [units, users] = await Promise.all([
      unitIds.length ? equipmentUnitRepository.batchFindByIds(unitIds) : [],
      Promise.all(userIds.map((sub) => userRepository.getUserBySub(sub))),
    ]);

    // Tạo map user và unit
    const userMap = Object.fromEntries(userIds.map((id, i) => [id, users[i]]));
    const equipmentIds = [...new Set(units.map((u) => u.equipment_id))];
    const equipments = equipmentIds.length
      ? await equipmentRepository.batchFindByIds(equipmentIds)
      : [];

    const unitMap = Object.fromEntries(units.map((u) => [u.id, u]));
    const equipmentMap = Object.fromEntries(equipments.map((e) => [e.id, e]));

    // 4️⃣ Map invoices theo maintenance_id
    const invoiceMap = {};
    allInvoices.forEach((inv) => {
      if (!invoiceMap[inv.maintenance_id]) invoiceMap[inv.maintenance_id] = [];
      invoiceMap[inv.maintenance_id].push(inv);
    });

    // 5️⃣ Kết hợp dữ liệu nhanh O(1)
    const result = maintenances.map((m) => {
      const invoices = invoiceMap[m.id] || [];
      const unit = unitMap[m.equipment_unit_id];
      const eq = unit ? equipmentMap[unit.equipment_id] : null;
      const equipmentName = eq?.name || "Chưa có thông tin";

      const reqUser = userMap[m.assigned_by];
      const techUser = userMap[m.user_id];

      const requestedByName =
        reqUser?.attributes?.name ||
        reqUser?.UserAttributes?.find(
          (a) => a.Name === "name" || a.Name === "custom:name"
        )?.Value ||
        reqUser?.username ||
        reqUser?.Username ||
        "Chưa có thông tin";

      const technicianName =
        techUser?.attributes?.name ||
        techUser?.UserAttributes?.find(
          (a) => a.Name === "name" || a.Name === "custom:name"
        )?.Value ||
        techUser?.username ||
        techUser?.Username ||
        "Chưa có thông tin";

      return {
        ...m,
        invoices,
        requested_by_name: requestedByName,
        technician_name: technicianName,
        equipment_name: equipmentName,
      };
    });

    // 6️⃣ Sắp xếp mới nhất
    result.sort(
      (a, b) => new Date(b.end_date || 0) - new Date(a.end_date || 0)
    );

    console.timeEnd("⚡ getAll maintenances total");
    return result;
  },

  // =======================================================
  // ⚡ GET ALL RESULT MAINTENANCE (song song + batch)
  // =======================================================
  getAllResult: async (branchFilter = null) => {
    console.time("⚡ getAllResult maintenances total");

    // 1️⃣ Lấy tất cả maintenance và invoices song song
    const [maintenances, allInvoices] = await Promise.all([
      branchFilter
        ? maintenanceRepository.findByBranch(branchFilter)
        : maintenanceRepository.findAll(),
      maintenanceInvoiceRepository.findAll(),
    ]);

    // Chỉ lấy những maintenance có result true/false
    const filtered = maintenances.filter(
      (m) => m.result === true || m.result === false
    );
    if (!filtered.length) return [];

    // 2️⃣ Gom các ID cần thiết
    const unitIds = [...new Set(filtered.map((m) => m.equipment_unit_id))];
    const userIds = [
      ...new Set(
        filtered.flatMap((m) => [m.assigned_by, m.user_id]).filter(Boolean)
      ),
    ];

    // 3️⃣ Lấy unit, user, equipment song song
    const [units, users] = await Promise.all([
      unitIds.length ? equipmentUnitRepository.batchFindByIds(unitIds) : [],
      Promise.all(userIds.map((id) => userRepository.getUserBySub(id))),
    ]);
    const userMap = Object.fromEntries(userIds.map((id, i) => [id, users[i]]));

    const equipmentIds = [...new Set(units.map((u) => u.equipment_id))];
    const equipments = equipmentIds.length
      ? await equipmentRepository.batchFindByIds(equipmentIds)
      : [];

    const unitMap = Object.fromEntries(units.map((u) => [u.id, u]));
    const equipmentMap = Object.fromEntries(equipments.map((e) => [e.id, e]));

    // 4️⃣ Map invoices theo maintenance_id
    const invoiceMap = {};
    allInvoices.forEach((inv) => {
      if (!invoiceMap[inv.maintenance_id]) invoiceMap[inv.maintenance_id] = [];
      invoiceMap[inv.maintenance_id].push(inv);
    });

    // 5️⃣ Gộp dữ liệu cuối
    const result = filtered.map((m) => {
      const invoices = invoiceMap[m.id] || [];
      const unit = unitMap[m.equipment_unit_id];
      const eq = unit ? equipmentMap[unit.equipment_id] : null;
      const equipmentName = eq?.name || "Chưa có thông tin";

      const reqUser = userMap[m.assigned_by];
      const techUser = userMap[m.user_id];

      const requestedByName =
        reqUser?.attributes?.name ||
        reqUser?.username ||
        reqUser?.Username ||
        "Chưa có thông tin";

      const technicianName =
        techUser?.attributes?.name ||
        techUser?.username ||
        techUser?.Username ||
        "Chưa có thông tin";

      const resultText = m.result ? "Thành công" : "Thất bại";

      return {
        ...m,
        invoices,
        requested_by_name: requestedByName,
        technician_name: technicianName,
        equipment_name: equipmentName,
        result_text: resultText,
      };
    });

    result.sort(
      (a, b) => new Date(b.end_date || 0) - new Date(a.end_date || 0)
    );

    console.timeEnd("⚡ getAllResult maintenances total");
    return result;
  },

  // =======================================================
  // GET BY ID (thêm tên thiết bị)
  // =======================================================
  getById: async (id) => {
    const m = await maintenanceRepository.findById(id);
    if (!m) throw new Error("Maintenance not found");

    let equipmentName = "Chưa có thông tin";
    if (m.equipment_unit_id) {
      const unit = await equipmentUnitRepository.findById(m.equipment_unit_id);
      if (unit?.equipment_id) {
        const eq = await equipmentRepository.findById(unit.equipment_id);
        equipmentName = eq?.name || "Chưa có thông tin";
      }
    }

    return { ...m, equipment_name: equipmentName };
  },

  delete: async (id) => {
    return await maintenanceRepository.delete(id);
  },

  getByUnitId: async (equipment_unit_id) => {
    const all = await maintenanceRepository.findAll();
    const active = all.find(
      (m) => m.equipment_unit_id === equipment_unit_id && !m.end_date
    );
    if (!active) return null;

    // 👤 Lấy tên người yêu cầu
    let requestedByName = "Chưa có thông tin";
    if (active.assigned_by) {
      const reqUser = await userRepository.getUserBySub(active.assigned_by);
      requestedByName =
        reqUser?.attributes?.name ||
        reqUser?.UserAttributes?.find(
          (a) => a.Name === "name" || a.Name === "custom:name"
        )?.Value ||
        reqUser?.username ||
        reqUser?.Username ||
        "Chưa có thông tin";
    }

    // 👨‍🔧 Lấy tên kỹ thuật viên
    let technicianName = "Chưa có thông tin";
    if (active.user_id) {
      const techUser = await userRepository.getUserBySub(active.user_id);
      technicianName =
        techUser?.attributes?.name ||
        techUser?.UserAttributes?.find(
          (a) => a.Name === "name" || a.Name === "custom:name"
        )?.Value ||
        techUser?.username ||
        techUser?.Username ||
        "Chưa có thông tin";
    }

    return {
      ...active,
      requested_by_name: requestedByName,
      technician_name: technicianName,
    };
  },

  // =======================================================
  // Lịch sử bảo trì của 1 thiết bị
  // =======================================================
  getFullHistoryByUnit: async (equipment_unit_id) => {
    const allMaintenances = await maintenanceRepository.findAll();
    const allInvoices = await maintenanceInvoiceRepository.findAll();

    const history = allMaintenances.filter(
      (m) => m.equipment_unit_id === equipment_unit_id
    );

    const combined = [];
    for (const m of history) {
      const invoices = allInvoices.filter((inv) => inv.maintenance_id === m.id);

      let requestedByName = "Chưa có thông tin";
      let technicianName = "c";
      let equipmentName = "Chưa có thông tin";

      // 🧩 Lấy tên người yêu cầu
      if (m.assigned_by) {
        const reqUser = await userRepository.getUserBySub(m.assigned_by);
        requestedByName =
          reqUser?.attributes?.name || reqUser?.username || "Chưa có thông tin";
      }

      // 🧩 Lấy tên kỹ thuật viên
      if (m.user_id) {
        const techUser = await userRepository.getUserBySub(m.user_id);
        technicianName =
          techUser?.attributes?.name ||
          techUser?.username ||
          "Chưa có thông tin";
      }

      // 🧩 Lấy tên thiết bị
      const unit = await equipmentUnitRepository.findById(m.equipment_unit_id);
      if (unit?.equipment_id) {
        const eq = await equipmentRepository.findById(unit.equipment_id);
        equipmentName = eq?.name || "Chưa có thông tin";
      }

      combined.push({
        ...m,
        invoices,
        requested_by_name: requestedByName,
        technician_name: technicianName,
        equipment_name: equipmentName,
      });
    }

    combined.sort(
      (a, b) => new Date(b.end_date || 0) - new Date(a.end_date || 0)
    );

    return combined;
  },

  // =======================================================
  // Lịch sử gần nhất
  // =======================================================
  getLatestHistoryByUnit: async (equipment_unit_id) => {
    const allMaintenances = await maintenanceRepository.findAll();
    const allInvoices = await maintenanceInvoiceRepository.findAll();

    const history = allMaintenances.filter(
      (m) => m.equipment_unit_id === equipment_unit_id
    );
    if (history.length === 0) return null;

    history.sort(
      (a, b) =>
        new Date(b.end_date || b.start_date) -
        new Date(a.end_date || a.start_date)
    );

    const latest = history[0];
    const invoices = allInvoices.filter(
      (inv) => inv.maintenance_id === latest.id
    );

    let requestedByName = "Chưa có thông tin";
    let technicianName = "Chưa có thông tin";
    let equipmentName = "Chưa có thông tin";

    if (latest.assigned_by) {
      const reqUser = await userRepository.getUserBySub(latest.assigned_by);
      requestedByName =
        reqUser?.attributes?.name || reqUser?.username || "Chưa có thông tin";
    }

    if (latest.user_id) {
      const techUser = await userRepository.getUserBySub(latest.user_id);
      technicianName =
        techUser?.attributes?.name || techUser?.username || "Chưa có thông tin";
    }

    const unit = await equipmentUnitRepository.findById(
      latest.equipment_unit_id
    );
    if (unit?.equipment_id) {
      const eq = await equipmentRepository.findById(unit.equipment_id);
      equipmentName = eq?.name || "Chưa có thông tin";
    }

    return {
      ...latest,
      invoices,
      requested_by_name: requestedByName,
      technician_name: technicianName,
      equipment_name: equipmentName,
    };
  },
};

module.exports = maintenanceService;
