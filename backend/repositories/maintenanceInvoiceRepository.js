const MaintenanceInvoiceModel = require("../models/MaintenanceInvoice");

const maintenanceInvoiceRepository = {
  create: async (maintenance_id, cost) =>
    MaintenanceInvoiceModel.create(maintenance_id, cost),
  findAll: async () => MaintenanceInvoiceModel.getAll(),
  findByMaintenanceId: async (maintenance_id) =>
    MaintenanceInvoiceModel.getByMaintenanceId(maintenance_id),
};

module.exports = maintenanceInvoiceRepository;
