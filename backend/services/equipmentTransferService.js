const equipmentTransferRepository = require("../repositories/equipmentTransferRepository");
const equipmentTransferDetailRepository = require("../repositories/equipmentTransferDetailRepository");
const branchRepository = require("../repositories/branchRepository");
const equipmentUnitRepository = require("../repositories/equipmentUnitRepository");

const equipmentTransferService = {
  // ===================================================
  // CREATE MULTI-TRANSFER
  // ===================================================
  createTransfer: async (data, userSub) => {
    if (!Array.isArray(data.unit_ids) || data.unit_ids.length === 0) {
      throw new Error("unit_ids must be a non-empty array");
    }

    if (!data.to_branch_id) {
      throw new Error("to_branch_id is required");
    }

    // ✅ Kiểm tra tồn tại chi nhánh đích
    const toBranch = await branchRepository.findById(data.to_branch_id);
    if (!toBranch) throw new Error(`To branch ${data.to_branch_id} not found`);

    // ✅ Lấy unit đầu tiên để xác định chi nhánh nguồn
    const firstUnit = await equipmentUnitRepository.findById(data.unit_ids[0]);
    if (!firstUnit) throw new Error("Invalid first equipment unit");

    const from_branch_id = firstUnit.branch_id;
    if (!from_branch_id)
      throw new Error("Equipment unit does not have branch_id");

    // ✅ Kiểm tra trùng chi nhánh
    if (from_branch_id === data.to_branch_id) {
      throw new Error("From branch and To branch cannot be the same");
    }

    // ✅ Kiểm tra chi nhánh nguồn tồn tại
    const fromBranch = await branchRepository.findById(from_branch_id);
    if (!fromBranch) throw new Error(`From branch ${from_branch_id} not found`);

    // ✅ Mô tả chung
    const description = `Transfer ${data.unit_ids.length} unit(s) from ${fromBranch.name} to ${toBranch.name}`;

    // ✅ Tạo record master (Equipment_transfer)
    const transfer = await equipmentTransferRepository.create({
      from_branch_id,
      to_branch_id: data.to_branch_id,
      approved_by: userSub,
      description,
      move_start_date: data.move_start_date,
    });

    // ✅ Lặp qua từng unit → kiểm tra & tạo TransferDetail
    const blockedStatuses = [
      "Inactive",
      "Temporary Urgent",
      "In Progress",
      "Ready",
      "Failed",
      "Deleted",
      "Moving",
    ];

    const details = [];
    for (const unitId of data.unit_ids) {
      const unit = await equipmentUnitRepository.findById(unitId);
      if (!unit) {
        console.warn(`⚠️ Unit ${unitId} not found. Skipped.`);
        continue;
      }

      const oldStatus = unit.status || "Unknown"; // 🧩 Lưu trạng thái gốc

      // ❌ Kiểm tra trạng thái không hợp lệ
      if (blockedStatuses.includes(oldStatus)) {
        throw new Error(
          `Cannot transfer equipment unit ${unit.id} in status: ${oldStatus}`
        );
      }

      // ❌ Check chi nhánh khác nhau
      if (unit.branch_id === data.to_branch_id) {
        throw new Error(
          `Unit ${unit.id} is already in destination branch ${data.to_branch_id}`
        );
      }

      // ✅ Update unit sang trạng thái Moving
      await equipmentUnitRepository.update(unit.id, {
        status: "Moving",
        description,
      });

      // ✅ Tạo record TransferDetail
      const detail = await equipmentTransferDetailRepository.create({
        transfer_id: transfer.id,
        equipment_unit_id: unit.id,
      });

      // 🧩 Đính kèm trạng thái gốc để gửi email
      details.push({
        ...detail,
        old_status: oldStatus,
      });
    }

    return { transfer, details };
  },

  // ===================================================
  // 🔍 GET ALL TRANSFERS (kèm details + unit info)
  // ===================================================
  getTransfers: async () => {
    const transfers = await equipmentTransferRepository.findAll();
    const results = [];

    for (const t of transfers) {
      const details = await equipmentTransferDetailRepository.findByTransferId(
        t.id
      );

      // Join với EquipmentUnit để lấy thông tin đầy đủ
      const detailsWithUnits = [];
      for (const d of details) {
        const unit = await equipmentUnitRepository.findById(
          d.equipment_unit_id
        );
        detailsWithUnits.push({
          ...d,
          equipment_unit: unit,
        });
      }

      results.push({
        ...t,
        details: detailsWithUnits,
      });
    }

    return results;
  },

  // ===================================================
  // ✅ COMPLETE TRANSFER
  // ===================================================
  completeTransfer: async (id, move_receive_date, userSub) => {
    const existing = await equipmentTransferRepository.findById(id);
    if (!existing) throw new Error("EquipmentTransfer not found");

    // ❌ Không cho phép complete nếu đã completed
    if (existing.status === "Completed") {
      throw new Error("Transfer already completed");
    }

    // ✅ Hoàn tất record master
    const transfer = await equipmentTransferRepository.complete(
      id,
      move_receive_date,
      userSub
    );

    // ✅ Lấy chi nhánh đích
    const toBranch = await branchRepository.findById(existing.to_branch_id);
    if (!toBranch) {
      throw new Error(`Branch ${existing.to_branch_id} not found`);
    }

    // ✅ Lấy toàn bộ chi tiết
    const details = await equipmentTransferDetailRepository.findByTransferId(
      id
    );

    // ✅ Cập nhật trạng thái cho từng unit
    const description = `Transferred to branch ${toBranch.name}`;
    for (const d of details) {
      await equipmentUnitRepository.update(d.equipment_unit_id, {
        branch_id: existing.to_branch_id,
        status: "In Stock",
        description,
      });
    }

    return { transfer, details };
  },

  // ===================================================
  // 🗑 DELETE TRANSFER
  // ===================================================
  deleteTransfer: async (id) => {
    const existing = await equipmentTransferRepository.findById(id);
    if (!existing) throw new Error("EquipmentTransfer not found");
    return await equipmentTransferRepository.delete(id);
  },
};

module.exports = equipmentTransferService;
