// repositories/maintenanceRequestRepository.js
const MaintenanceRequestModel = require("../models/MaintenanceRequest");

const maintenanceRequestRepository = {
  create: (data) => MaintenanceRequestModel.create(data),
  findAll: () => MaintenanceRequestModel.findAll(),
  findById: (id) => MaintenanceRequestModel.findById(id),
  findByUnitId: (unitId) => MaintenanceRequestModel.findByUnitId(unitId),
  findByBranchId: (branchId) => MaintenanceRequestModel.findByBranchId(branchId),
  update: (id, data) => MaintenanceRequestModel.update(id, data),
  delete: (id) => MaintenanceRequestModel.delete(id),
};

module.exports = maintenanceRequestRepository;
