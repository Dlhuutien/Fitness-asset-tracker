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

    // Các trạng thái không được phép transfer
    const blockedStatuses = [
      "Inactive",
      "Temporary Urgent",
      "In Progress",
      "Ready",
      "Failed",
      "Deleted",
      "Moving",
    ];
    if (blockedStatuses.includes(unit.status)) {
      throw new Error(
        `Cannot transfer equipment unit in status: ${unit.status}`
      );
    }

    // from_branch_id tự lấy từ unit.branch_id
    const from_branch_id = unit.branch_id;
    if (!from_branch_id) {
      throw new Error("Equipment unit does not have branch_id");
    }

    // Check trùng branch
    if (from_branch_id === data.to_branch_id) {
      throw new Error("From branch and To branch cannot be the same");
    }

    // Check from_branch và to_branch tồn tại
    const fromBranch = await branchRepository.findById(from_branch_id);
    if (!fromBranch) {
      throw new Error(`From branch ${from_branch_id} not found`);
    }

    const toBranch = await branchRepository.findById(data.to_branch_id);
    if (!toBranch) {
      throw new Error(`To branch ${data.to_branch_id} not found`);
    }

    // Tự động sinh description
    const description = `Transfer equipment from branch ${fromBranch.name} to ${toBranch.name}`;

    // Tạo transfer
    const transfer = await equipmentTransferRepository.create({
      ...data,
      from_branch_id,
      approved_by: userSub,
      description,
    });

    // Đổi status của unit sang Moving + thêm description
    await equipmentUnitRepository.update(data.equipment_unit_id, {
      status: "Moving",
      description,
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

    // Không cho phép complete nếu đã Completed
    if (existing.status === "Completed") {
      throw new Error("Transfer already completed");
    }

    // Hoàn tất transfer
    const transfer = await equipmentTransferRepository.complete(
      id,
      move_receive_date
    );

    // Lấy thông tin chi nhánh đích
    const toBranch = await branchRepository.findById(existing.to_branch_id);
    if (!toBranch) {
      throw new Error(`Branch ${existing.to_branch_id} not found`);
    }

    // Tạo description với tên chi nhánh
    const description = `Transferred to branch ${toBranch.name}`;

    // Cập nhật trạng thái unit về "In Stock" + branch_id + description
    await equipmentUnitRepository.update(existing.equipment_unit_id, {
      branch_id: existing.to_branch_id,
      status: "In Stock",
      description,
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
