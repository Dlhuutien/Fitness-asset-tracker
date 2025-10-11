const maintenanceRepository = require("../repositories/maintenanceRepository");
const maintenanceInvoiceRepository = require("../repositories/maintenanceInvoiceRepository");
const equipmentUnitRepository = require("../repositories/equipmentUnitRepository");
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
    // Ready hoặc Failed
    const updated = await maintenanceRepository.update(id, {
      user_id: data.user_id,
      maintenance_detail: data.maintenance_detail,
      end_date: new Date().toISOString(),
    });

    // đổi status Unit theo kết quả
    await equipmentUnitRepository.update(updated.equipment_unit_id, {
      status: data.status,
    });

    if (data.status === "Ready") {
      // tạo invoice với cost (nếu còn warranty thì 0)
      await maintenanceInvoiceRepository.create(
        updated.id,
        updated.warranty ? 0 : data.cost
      );
    }

    return {
      ...updated,
      status: data.status,
    };
  },

  getAll: async () => {
    return await maintenanceRepository.findAll();
  },

  getById: async (id) => {
    const m = await maintenanceRepository.findById(id);
    if (!m) throw new Error("Maintenance not found");
    return m;
  },

  delete: async (id) => {
    return await maintenanceRepository.delete(id);
  },

  getByUnitId: async (equipment_unit_id) => {
    const all = await maintenanceRepository.findAll();
    const active = all.find(
      (m) => m.equipment_unit_id === equipment_unit_id && !m.end_date // nghĩa là chưa hoàn thành
    );
    return active || null;
  },

  // Lấy toàn bộ lịch sử bảo trì (bao gồm hóa đơn) của 1 Unit
  getFullHistoryByUnit: async (equipment_unit_id) => {
    const allMaintenances = await maintenanceRepository.findAll();
    const allInvoices = await maintenanceInvoiceRepository.findAll();

    // 🧩 Lọc các maintenance thuộc unit
    const history = allMaintenances.filter(
      (m) => m.equipment_unit_id === equipment_unit_id
    );

    const combined = [];
    for (const m of history) {
      const invoices = allInvoices.filter((inv) => inv.maintenance_id === m.id);

      // 🧩 Lấy thông tin người yêu cầu & người sửa chữa
      let requestedByName = "Không rõ";
      let technicianName = "Không rõ";

      if (m.assigned_by) {
        const reqUser = await userRepository.getUserBySub(m.assigned_by);
        requestedByName =
          reqUser?.attributes?.name || reqUser?.username || "Không rõ";
      }

      if (m.user_id) {
        const techUser = await userRepository.getUserBySub(m.user_id);
        technicianName =
          techUser?.attributes?.name || techUser?.username || "Không rõ";
      }

      combined.push({
        ...m,
        invoices,
        requested_by_name: requestedByName,
        technician_name: technicianName,
      });
    }

    // 🔁 Sắp xếp mới nhất trước
    combined.sort(
      (a, b) => new Date(b.end_date || 0) - new Date(a.end_date || 0)
    );

    return combined;
  },

  // Lấy lịch sử bảo trì gần nhất của 1 Unit (bao gồm hóa đơn)
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

    // 🧩 Thêm tên người yêu cầu & kỹ thuật viên
    let requestedByName = "Không rõ";
    let technicianName = "Không rõ";

    if (latest.assigned_by) {
      const reqUser = await userRepository.getUserBySub(latest.assigned_by);
      requestedByName =
        reqUser?.attributes?.name || reqUser?.username || "Không rõ";
    }

    if (latest.user_id) {
      const techUser = await userRepository.getUserBySub(latest.user_id);
      technicianName =
        techUser?.attributes?.name || techUser?.username || "Không rõ";
    }

    return {
      ...latest,
      invoices,
      requested_by_name: requestedByName,
      technician_name: technicianName,
    };
  },
};

module.exports = maintenanceService;
