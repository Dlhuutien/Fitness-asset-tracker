const equipmentTransferRepository = require("../repositories/equipmentTransferRepository");
const equipmentTransferDetailRepository = require("../repositories/equipmentTransferDetailRepository");
const branchRepository = require("../repositories/branchRepository");
const equipmentUnitRepository = require("../repositories/equipmentUnitRepository");
const userRepository = require("../repositories/userRepository");
const equipmentService = require("./equipmentService");

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
    const description = `Chuyển ${data.unit_ids.length} thiết bị từ ${fromBranch.name} sang ${toBranch.name}`;

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
  getTransfers: async (branchFilter = null) => {
    const transfers = branchFilter
      ? await equipmentTransferRepository.findByBranch(branchFilter)
      : await equipmentTransferRepository.findAll();
    const results = [];

    for (const t of transfers) {
      const details = await equipmentTransferDetailRepository.findByTransferId(
        t.id
      );

      const detailsWithUnits = [];
      for (const d of details) {
        const unit = await equipmentUnitRepository.findById(
          d.equipment_unit_id
        );
        let equipmentName = null;

        if (unit?.equipment_id) {
          const equipment = await equipmentService.getEquipmentById(
            unit.equipment_id
          );
          equipmentName = equipment?.name || null;
        }

        detailsWithUnits.push({
          ...d,
          equipment_unit: {
            ...unit,
            equipment_name: equipmentName,
          },
        });
      }

      // 🔹 Lấy tên người yêu cầu & người nhận (nếu có)
      let approvedByName = null;
      let receiverName = null;

      if (t.approved_by) {
        const approvedUser = await userRepository.getUserBySub(t.approved_by);
        approvedByName =
          approvedUser?.attributes?.name || approvedUser?.username || null;
      }

      if (t.receiver_id) {
        const receiverUser = await userRepository.getUserBySub(t.receiver_id);
        receiverName =
          receiverUser?.attributes?.name || receiverUser?.username || null;
      }

      results.push({
        ...t,
        approved_by_name: approvedByName,
        receiver_name: receiverName,
        details: detailsWithUnits,
      });
    }

    return results;
  },

  getTransfersByStatus: async (status, branchFilter = null) => {
    // 🟢 Lấy toàn bộ transfer có cùng status
    const transfers = await equipmentTransferRepository.findAllByStatus(status);

    // 🟡 Nếu có branchFilter (admin, technician...), thì lọc lại
    const filteredTransfers = branchFilter
      ? transfers.filter(
          (t) =>
            t.from_branch_id === branchFilter || t.to_branch_id === branchFilter
        )
      : transfers;

    const results = [];

    for (const t of filteredTransfers) {
      // 🧩 Lấy danh sách chi tiết
      const details = await equipmentTransferDetailRepository.findByTransferId(
        t.id
      );

      // Join với EquipmentUnit để lấy thông tin đầy đủ
      const detailsWithUnits = [];
      for (const d of details) {
        const unit = await equipmentUnitRepository.findById(
          d.equipment_unit_id
        );
        let equipmentName = null;

        if (unit?.equipment_id) {
          const equipment = await equipmentService.getEquipmentById(
            unit.equipment_id
          );
          equipmentName = equipment?.name || null;
        }

        detailsWithUnits.push({
          ...d,
          equipment_unit: {
            ...unit,
            equipment_name: equipmentName,
          },
        });
      }

      // 🔹 Lấy tên người yêu cầu và người nhận
      let approvedByName = null;
      let receiverName = null;

      if (t.approved_by) {
        const approvedUser = await userRepository.getUserBySub(t.approved_by);
        approvedByName =
          approvedUser?.attributes?.name || approvedUser?.username || null;
      }

      if (t.receiver_id) {
        const receiverUser = await userRepository.getUserBySub(t.receiver_id);
        receiverName =
          receiverUser?.attributes?.name || receiverUser?.username || null;
      }

      results.push({
        ...t,
        approved_by_name: approvedByName,
        receiver_name: receiverName,
        details: detailsWithUnits,
      });
    }

    return results;
  },

  // ===================================================
  // 🔎 GET ONE TRANSFER BY ID (kèm details + unit info)
  // ===================================================
  getTransferById: async (id) => {
    const transfer = await equipmentTransferRepository.findById(id);
    if (!transfer) throw new Error("EquipmentTransfer not found");

    const details = await equipmentTransferDetailRepository.findByTransferId(
      id
    );

    // Join với EquipmentUnit để lấy thông tin đầy đủ
    const detailsWithUnits = [];
    for (const d of details) {
      const unit = await equipmentUnitRepository.findById(d.equipment_unit_id);
      let equipmentName = null;

      if (unit?.equipment_id) {
        const equipment = await equipmentService.getEquipmentById(
          unit.equipment_id
        );
        equipmentName = equipment?.name || null;
      }

      detailsWithUnits.push({
        ...d,
        equipment_unit: {
          ...unit,
          equipment_name: equipmentName,
        },
      });
    }

    let approvedByName = null;
    let receiverName = null;

    if (transfer.approved_by) {
      const approvedUser = await userRepository.getUserBySub(
        transfer.approved_by
      );
      approvedByName =
        approvedUser?.attributes?.name || approvedUser?.username || null;
    }

    if (transfer.receiver_id) {
      const receiverUser = await userRepository.getUserBySub(
        transfer.receiver_id
      );
      receiverName =
        receiverUser?.attributes?.name || receiverUser?.username || null;
    }

    return {
      ...transfer,
      approved_by_name: approvedByName,
      receiver_name: receiverName,
      details: detailsWithUnits,
    };
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
