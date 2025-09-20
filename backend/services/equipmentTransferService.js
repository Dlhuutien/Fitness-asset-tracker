const equipmentTransferRepository = require("../repositories/equipmentTransferRepository");
const branchRepository = require("../repositories/branchRepository");
const equipmentUnitRepository = require("../repositories/equipmentUnitRepository");

const equipmentTransferService = {
  createTransfer: async (data) => {
    if (!data.equipment_unit_id || !data.from_branch_id || !data.to_branch_id || !data.approved_by) {
      throw new Error("equipment_unit_id, from_branch_id, to_branch_id, and approved_by are required");
    }

    // Check equipment unit tồn tại
    const unit = await equipmentUnitRepository.findById(data.equipment_unit_id);
    if (!unit) {
      throw new Error(`Equipment unit ${data.equipment_unit_id} not found`);
    }

    // Check from_branch tồn tại
    const fromBranch = await branchRepository.findById(data.from_branch_id);
    if (!fromBranch) {
      throw new Error(`From branch ${data.from_branch_id} not found`);
    }

    // Check to_branch tồn tại
    const toBranch = await branchRepository.findById(data.to_branch_id);
    if (!toBranch) {
      throw new Error(`To branch ${data.to_branch_id} not found`);
    }

    return await equipmentTransferRepository.create(data);
  },

  getTransfers: async () => {
    return await equipmentTransferRepository.findAll();
  },

  getTransferById: async (id) => {
    const transfer = await equipmentTransferRepository.findById(id);
    if (!transfer) throw new Error("EquipmentTransfer not found");
    return transfer;
  },

  completeTransfer: async (id, move_receive_date) => {
    const existing = await equipmentTransferRepository.findById(id);
    if (!existing) throw new Error("EquipmentTransfer not found");

    if (existing.status === "Completed") {
      throw new Error("Transfer already completed");
    }

    return await equipmentTransferRepository.complete(id, move_receive_date);
  },

  deleteTransfer: async (id) => {
    const existing = await equipmentTransferRepository.findById(id);
    if (!existing) throw new Error("EquipmentTransfer not found");
    return await equipmentTransferRepository.delete(id);
  },
};

module.exports = equipmentTransferService;
