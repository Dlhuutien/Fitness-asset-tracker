const maintenanceRepository = require("../repositories/maintenanceRepository");
const maintenanceInvoiceRepository = require("../repositories/maintenanceInvoiceRepository");
const equipmentUnitRepository = require("../repositories/equipmentUnitRepository");
const branchRepository = require("../repositories/branchRepository");

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

    // Update status Unit
    if (role === "technician") {
      await equipmentUnitRepository.update(data.equipment_unit_id, {
        status: "In Progress",
      });
    } else {
      await equipmentUnitRepository.update(data.equipment_unit_id, {
        status: "Temporary Urgent",
      });
    }

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

    return updated;
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
};

module.exports = maintenanceService;
