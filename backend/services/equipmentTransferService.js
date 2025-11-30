const equipmentTransferRepository = require("../repositories/equipmentTransferRepository");
const equipmentTransferDetailRepository = require("../repositories/equipmentTransferDetailRepository");
const branchRepository = require("../repositories/branchRepository");
const equipmentUnitRepository = require("../repositories/equipmentUnitRepository");
const userRepository = require("../repositories/userRepository");
const equipmentService = require("./equipmentService");
const equipmentRepository = require("../repositories/equipmentRepository");
const equipmentTransferHistoryRepository = require("../repositories/equipmentTransferHistoryRepository");
const { v4: uuidv4 } = require("uuid");

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
  // 🔍 GET ALL TRANSFERS (BatchGet + Parallel)
  // ===================================================
  getTransfers: async (branchFilter = null) => {
    console.time("⚡ getTransfers total");

    // 1️⃣ Lấy danh sách transfers
    const transfers = branchFilter
      ? await equipmentTransferRepository.findByBranch(branchFilter)
      : await equipmentTransferRepository.findAll();

    if (!transfers.length) return [];

    // 2️⃣ Lấy toàn bộ details song song
    const allDetails = await Promise.all(
      transfers.map((t) =>
        equipmentTransferDetailRepository.findByTransferId(t.id)
      )
    );
    const flatDetails = allDetails.flat();

    // 3️⃣ Gom toàn bộ unit_id & equipment_id duy nhất
    const unitIds = [...new Set(flatDetails.map((d) => d.equipment_unit_id))];
    const units = unitIds.length
      ? await equipmentUnitRepository.batchFindByIds(unitIds)
      : [];
    const equipmentIds = [...new Set(units.map((u) => u.equipment_id))];
    const equipments = equipmentIds.length
      ? await equipmentRepository.batchFindByIds(equipmentIds)
      : [];

    // 4️⃣ Tạo map lookup nhanh
    const unitMap = Object.fromEntries(units.map((u) => [u.id, u]));
    const equipmentMap = Object.fromEntries(equipments.map((e) => [e.id, e]));

    // 5️⃣ Gom danh sách user (duyệt + nhận)
    const userSubs = [
      ...new Set(
        transfers.flatMap((t) => [t.approved_by, t.receiver_id]).filter(Boolean)
      ),
    ];
    const userResults = await Promise.all(
      userSubs.map((sub) => userRepository.getUserBySub(sub))
    );
    const userMap = Object.fromEntries(
      userSubs.map((sub, i) => [sub, userResults[i]])
    );

    // 6️⃣ Map detail theo transfer_id
    const detailMap = {};
    transfers.forEach((t, i) => {
      detailMap[t.id] = allDetails[i] || [];
    });

    // 7️⃣ Ghép dữ liệu cuối
    const results = transfers.map((t) => {
      const details = detailMap[t.id].map((d) => {
        const unit = unitMap[d.equipment_unit_id];
        const eq = equipmentMap[unit?.equipment_id];
        return {
          ...d,
          equipment_unit: {
            ...unit,
            equipment_name: eq?.name || null,
          },
        };
      });

      const approvedByUser = userMap[t.approved_by];
      const receiverUser = userMap[t.receiver_id];

      return {
        ...t,
        approved_by_name:
          approvedByUser?.attributes?.name || approvedByUser?.username || null,
        receiver_name:
          receiverUser?.attributes?.name || receiverUser?.username || null,
        details,
      };
    });

    console.timeEnd("⚡ getTransfers total");
    return results;
  },

  // ===================================================
  // 🔍 GET TRANSFERS BY STATUS (BatchGet + Parallel)
  // ===================================================
  getTransfersByStatus: async (status, branchFilter = null) => {
    console.time("⚡ getTransfersByStatus total");

    // 1️⃣ Lấy transfer theo status + lọc branch
    const transfers = await equipmentTransferRepository.findAllByStatus(status);
    const filtered = branchFilter
      ? transfers.filter(
          (t) =>
            t.from_branch_id === branchFilter || t.to_branch_id === branchFilter
        )
      : transfers;
    if (!filtered.length) return [];

    // 2️⃣ Lấy toàn bộ details song song
    const allDetails = await Promise.all(
      filtered.map((t) =>
        equipmentTransferDetailRepository.findByTransferId(t.id)
      )
    );
    const flatDetails = allDetails.flat();

    // 3️⃣ Gom toàn bộ unit_id + equipment_id
    const unitIds = [...new Set(flatDetails.map((d) => d.equipment_unit_id))];
    const units = unitIds.length
      ? await equipmentUnitRepository.batchFindByIds(unitIds)
      : [];
    const equipmentIds = [...new Set(units.map((u) => u.equipment_id))];
    const equipments = equipmentIds.length
      ? await equipmentRepository.batchFindByIds(equipmentIds)
      : [];

    const unitMap = Object.fromEntries(units.map((u) => [u.id, u]));
    const equipmentMap = Object.fromEntries(equipments.map((e) => [e.id, e]));

    // 4️⃣ Gom user chung
    const userSubs = [
      ...new Set(
        filtered.flatMap((t) => [t.approved_by, t.receiver_id]).filter(Boolean)
      ),
    ];
    const userResults = await Promise.all(
      userSubs.map((sub) => userRepository.getUserBySub(sub))
    );
    const userMap = Object.fromEntries(
      userSubs.map((sub, i) => [sub, userResults[i]])
    );

    // 5️⃣ Map detail theo transfer_id
    const detailMap = {};
    filtered.forEach((t, i) => {
      detailMap[t.id] = allDetails[i] || [];
    });

    // 6️⃣ Kết hợp dữ liệu
    const results = filtered.map((t) => {
      const details = detailMap[t.id].map((d) => {
        const unit = unitMap[d.equipment_unit_id];
        const eq = equipmentMap[unit?.equipment_id];
        return {
          ...d,
          equipment_unit: {
            ...unit,
            equipment_name: eq?.name || null,
          },
        };
      });

      const approvedByUser = userMap[t.approved_by];
      const receiverUser = userMap[t.receiver_id];

      return {
        ...t,
        approved_by_name:
          approvedByUser?.attributes?.name || approvedByUser?.username || null,
        receiver_name:
          receiverUser?.attributes?.name || receiverUser?.username || null,
        details,
      };
    });

    console.timeEnd("⚡ getTransfersByStatus total");
    return results;
  },

  // ===================================================
  // 🔍 GET ONE TRANSFER BY ID (BatchGet Units + Equipments)
  // ===================================================
  getTransferById: async (id) => {
    console.time("⚡ getTransferById total");

    const transfer = await equipmentTransferRepository.findById(id);
    if (!transfer) throw new Error("EquipmentTransfer not found");

    // 1️⃣ Lấy toàn bộ details của transfer
    const details = await equipmentTransferDetailRepository.findByTransferId(
      id
    );
    if (!details.length) return { ...transfer, details: [] };

    // 2️⃣ BatchGet toàn bộ Units
    const unitIds = details.map((d) => d.equipment_unit_id);
    const units = await equipmentUnitRepository.batchFindByIds(unitIds);

    // 3️⃣ BatchGet toàn bộ Equipments
    const equipmentIds = [...new Set(units.map((u) => u.equipment_id))];
    const equipments = await equipmentRepository.batchFindByIds(equipmentIds);

    // 4️⃣ Tạo map nhanh
    const unitMap = Object.fromEntries(units.map((u) => [u.id, u]));
    const equipmentMap = Object.fromEntries(equipments.map((e) => [e.id, e]));

    // 5️⃣ Ghép dữ liệu
    const detailsWithUnits = details.map((d) => {
      const unit = unitMap[d.equipment_unit_id];
      const eq = equipmentMap[unit?.equipment_id];
      return {
        ...d,
        equipment_unit: {
          ...unit,
          equipment_name: eq?.name || null,
        },
      };
    });

    // 6️⃣ Song song lấy user
    const [approvedByUser, receiverUser] = await Promise.all([
      transfer.approved_by
        ? userRepository.getUserBySub(transfer.approved_by)
        : null,
      transfer.receiver_id
        ? userRepository.getUserBySub(transfer.receiver_id)
        : null,
    ]);

    const result = {
      ...transfer,
      approved_by_name:
        approvedByUser?.attributes?.name || approvedByUser?.username || null,
      receiver_name:
        receiverUser?.attributes?.name || receiverUser?.username || null,
      details: detailsWithUnits,
    };

    console.timeEnd("⚡ getTransferById total");
    return result;
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

      // 🧩 Ghi lại lịch sử vận chuyển (gọi repository trực tiếp)
      await equipmentTransferHistoryRepository.create({
        id: uuidv4(),
        equipment_unit_id: d.equipment_unit_id,
        from_branch_id: existing.from_branch_id,
        to_branch_id: existing.to_branch_id,
        transfer_id: id,
        moved_at: move_receive_date || new Date().toISOString(),
        receiver_id: userSub,
        description: `Thiết bị được chuyển từ ${existing.from_branch_id} sang ${existing.to_branch_id}`,
      });
    }

    return { transfer, details };
  },

  cancelTransfer: async (id, description_cancelled, userSub) => {
    const existing = await equipmentTransferRepository.findById(id);
    if (!existing) throw new Error("EquipmentTransfer not found");

    if (existing.status === "Completed") {
      throw new Error("Cannot cancel a completed transfer");
    }
    if (existing.status === "Cancelled") {
      throw new Error("Already cancelled");
    }

    const transfer = await equipmentTransferRepository.cancel(
      id,
      description_cancelled,
      userSub
    );

    return transfer;
  },

  confirmCancelTransfer: async (id, userSub) => {
    const existing = await equipmentTransferRepository.findById(id);
    if (!existing) throw new Error("EquipmentTransfer not found");

    if (existing.status !== "CancelRequested") {
      throw new Error("Transfer not waiting for cancel confirmation");
    }

    // Lấy toàn bộ chi tiết
    const details = await equipmentTransferDetailRepository.findByTransferId(
      id
    );

    // Trả từng unit từ Moving → In Stock
    for (const d of details) {
      await equipmentUnitRepository.update(d.equipment_unit_id, {
        status: "In Stock",
      });
    }

    // Cập nhật transfer → Cancelled
    const transfer = await equipmentTransferRepository.confirmCancel(
      id,
      userSub
    );

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
