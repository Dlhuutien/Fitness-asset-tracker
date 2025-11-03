const MaintenancePlanModel = require("../models/MaintenancePlan");

const maintenancePlanRepository = {
  create: async (data) => MaintenancePlanModel.createPlan(data),
  findAll: async () => MaintenancePlanModel.findAll(),
  findById: async (id) => MaintenancePlanModel.findById(id),
  findByEquipmentId: async (eid) => MaintenancePlanModel.findByEquipmentId(eid),
  update: async (id, data) => MaintenancePlanModel.updatePlan(id, data),
  delete: async (id) => MaintenancePlanModel.deletePlan(id),
};

module.exports = maintenancePlanRepository;
