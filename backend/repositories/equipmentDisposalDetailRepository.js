const EquipmentDisposalDetailModel = require("../models/EquipmentDisposalDetail");

const equipmentDisposalDetailRepository = {
  create: async (data) => EquipmentDisposalDetailModel.create(data),
  findByDisposalId: async (disposal_id) =>
    EquipmentDisposalDetailModel.getByDisposalId(disposal_id),
  findAll: async () => EquipmentDisposalDetailModel.getAll(),
};

module.exports = equipmentDisposalDetailRepository;
