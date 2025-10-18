const EquipmentUnitModel = require("../models/EquipmentUnit.js");

const equipmentUnitRepository = {
  create: async (data) => EquipmentUnitModel.createUnit(data),
  findById: async (id) => EquipmentUnitModel.getUnitById(id),
  findAll: async () => EquipmentUnitModel.getAllUnits(),
  findByBranch: async (branch_id) => EquipmentUnitModel.getByBranchId(branch_id),
  update: async (id, data) => EquipmentUnitModel.updateUnit(id, data),
  delete: async (id) => EquipmentUnitModel.deleteUnit(id),
  findByEquipmentId: async (equipment_id) =>
    EquipmentUnitModel.getByEquipmentId(equipment_id),
};

module.exports = equipmentUnitRepository;
