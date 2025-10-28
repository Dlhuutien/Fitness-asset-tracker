const EquipmentTransferHistoryModel = require("../models/EquipmentTransferHistory");

const equipmentTransferHistoryRepository = {
  create: async (data) => EquipmentTransferHistoryModel.create(data),
  findByUnitId: async (unitId) =>
    EquipmentTransferHistoryModel.getByUnitId(unitId),
  findAll: async () => EquipmentTransferHistoryModel.getAll(),
  findByBranch: async (branchId) =>
    EquipmentTransferHistoryModel.findByBranch(branchId),
};

module.exports = equipmentTransferHistoryRepository;
