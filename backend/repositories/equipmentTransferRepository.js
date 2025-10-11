const EquipmentTransferModel = require("../models/EquipmentTransfer");

const equipmentTransferRepository = {
  create: async (data) => EquipmentTransferModel.createTransfer(data),
  findAll: async () => EquipmentTransferModel.getTransfers(),
  findById: async (id) => EquipmentTransferModel.getOneTransfer(id),
  complete: async (id, move_receive_date, receiver_id) =>
    EquipmentTransferModel.completeTransfer(id, move_receive_date, receiver_id),
  delete: async (id) => EquipmentTransferModel.deleteTransfer(id),
};

module.exports = equipmentTransferRepository;
