const equipmentTransferRepository = require("../repositories/equipmentTransferRepository");
const branchRepository = require("../repositories/branchRepository");
const equipmentUnitRepository = require("../repositories/equipmentUnitRepository");

const equipmentTransferService = {
  createTransfer: async (data, userSub) => {
    if (!data.equipment_unit_id || !data.to_branch_id) {
      throw new Error("equipment_unit_id and to_branch_id are required");
    }

    // Check equipment unit tồn tại
    const unit = await equipmentUnitRepository.findById(data.equipment_unit_id);
    if (!unit) {
      throw new Error(`Equipment unit ${data.equipment_unit_id} not found`);
    }

    // from_branch_id tự lấy từ unit.branch_id
    const from_branch_id = unit.branch_id;
    if (!from_branch_id) {
      throw new Error("Equipment unit does not have branch_id");
    }

    // Check to_branch tồn tại
    const toBranch = await branchRepository.findById(data.to_branch_id);
    if (!toBranch) {
      throw new Error(`To branch ${data.to_branch_id} not found`);
    }

    // Tạo transfer
    const transfer = await equipmentTransferRepository.create({
      ...data,
      from_branch_id,
      approved_by: userSub,
    });

    // Đổi branch_id của unit sang to_branch_id và set status = Moving
    await equipmentUnitRepository.update(data.equipment_unit_id, {
      branch_id: data.to_branch_id,
      status: "Moving",
    });

    return transfer;
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

    // Hoàn tất transfer
    const transfer = await equipmentTransferRepository.complete(
      id,
      move_receive_date
    );

    // Cập nhật trạng thái unit về "In Stock"
    await equipmentUnitRepository.update(existing.equipment_unit_id, {
      status: "In Stock",
    });

    return transfer;
  },

  deleteTransfer: async (id) => {
    const existing = await equipmentTransferRepository.findById(id);
    if (!existing) throw new Error("EquipmentTransfer not found");
    return await equipmentTransferRepository.delete(id);
  },
};

module.exports = equipmentTransferService;
