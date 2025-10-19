const EquipmentDisposalModel = require("../models/EquipmentDisposal");

const equipmentDisposalRepository = {
  create: async (data) => EquipmentDisposalModel.create(data),
  findAll: async () => EquipmentDisposalModel.getAll(),
  findByBranch: async (branch_id) => EquipmentDisposalModel.getByBranch(branch_id),
  findById: async (id) => EquipmentDisposalModel.getById(id),
  updateTotal: async (id, total_value) => EquipmentDisposalModel.updateTotal(id, total_value),
};

module.exports = equipmentDisposalRepository;
