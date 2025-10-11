const EquipmentTransferDetailModel = require("../models/EquipmentTransferDetail");

const equipmentTransferDetailRepository = {
  create: async (data) => EquipmentTransferDetailModel.createDetail(data),
  findByTransferId: async (transfer_id) =>
    EquipmentTransferDetailModel.getByTransferId(transfer_id),
  delete: async (id) => EquipmentTransferDetailModel.deleteDetail(id),
};

module.exports = equipmentTransferDetailRepository;
