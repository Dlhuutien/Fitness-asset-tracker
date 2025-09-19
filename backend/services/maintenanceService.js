const maintenanceRepository = require("../repositories/maintenanceRepository");
const maintenanceInvoiceRepository = require("../repositories/maintenanceInvoiceRepository");

const maintenanceService = {
  createMaintenance: async (data) => {
    return await maintenanceRepository.create(data);
  },

  progressMaintenance: async (id, data) => {
    // technician set In Progress
    return await maintenanceRepository.update(id, {
      user_id: data.user_id,
      maintenance_reason: data.maintenance_reason,
    });
  },

  completeMaintenance: async (id, data) => {
    // Ready hoặc Failed
    const updated = await maintenanceRepository.update(id, {
      user_id: data.user_id,
      maintenance_detail: data.maintenance_detail,
      end_date: new Date().toISOString(),
    });

    if (data.status === "Ready") {
      // tạo invoice với cost (nếu còn warranty thì 0)
      await maintenanceInvoiceRepository.create(
        updated.id,
        data.warranty ? 0 : data.cost
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
