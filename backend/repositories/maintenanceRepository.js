const MaintenanceModel = require("../models/Maintenance");

const maintenanceRepository = {
  create: async (data) => MaintenanceModel.createMaintenance(data),
  findAll: async () => MaintenanceModel.getAll(),
  findById: async (id) => MaintenanceModel.getById(id),
  update: async (id, data) => MaintenanceModel.updateMaintenance(id, data),
  delete: async (id) => MaintenanceModel.deleteMaintenance(id),
};

module.exports = maintenanceRepository;
