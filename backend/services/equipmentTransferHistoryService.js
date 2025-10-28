const equipmentTransferHistoryRepository = require("../repositories/equipmentTransferHistoryRepository");
const branchRepository = require("../repositories/branchRepository");
const userRepository = require("../repositories/userRepository");
const equipmentUnitRepository = require("../repositories/equipmentUnitRepository");
const equipmentRepository = require("../repositories/equipmentRepository");

const equipmentTransferHistoryService = {
  // ===================================================
  // 🔍 LẤY TOÀN BỘ LỊCH SỬ (cho admin / super-admin)
  // ===================================================
  getAllHistories: async () => {
    const histories = await equipmentTransferHistoryRepository.findAll();
    if (!histories.length) return [];

    // Cache để tránh query trùng
    const branches = {};
    const users = {};
    const units = {};
    const equipments = {};

    for (const h of histories) {
      // Chi nhánh
      if (h.from_branch_id && !branches[h.from_branch_id])
        branches[h.from_branch_id] = await branchRepository.findById(h.from_branch_id);
      if (h.to_branch_id && !branches[h.to_branch_id])
        branches[h.to_branch_id] = await branchRepository.findById(h.to_branch_id);

      // Người nhận
      if (h.receiver_id && !users[h.receiver_id])
        users[h.receiver_id] = await userRepository.getUserBySub(h.receiver_id);

      // Thiết bị unit + base equipment
      if (h.equipment_unit_id && !units[h.equipment_unit_id]) {
        const unit = await equipmentUnitRepository.findById(h.equipment_unit_id);
        units[h.equipment_unit_id] = unit;
        if (unit?.equipment_id && !equipments[unit.equipment_id]) {
          equipments[unit.equipment_id] = await equipmentRepository.findById(unit.equipment_id);
        }
      }
    }

    // Map enrich kết quả
    return histories.map((h) => {
      const unit = units[h.equipment_unit_id];
      const equipment = unit ? equipments[unit.equipment_id] : null;

      return {
        ...h,
        from_branch_name: branches[h.from_branch_id]?.name || h.from_branch_id,
        to_branch_name: branches[h.to_branch_id]?.name || h.to_branch_id,
        receiver_name:
          users[h.receiver_id]?.attributes?.name ||
          users[h.receiver_id]?.username ||
          null,
        equipment_name: equipment?.name || unit?.equipment_id || null,
      };
    });
  },

  // ===================================================
  // 🔍 LẤY LỊCH SỬ THEO 1 UNIT CỤ THỂ
  // ===================================================
  getHistoryByUnitId: async (equipment_unit_id) => {
    const histories = await equipmentTransferHistoryRepository.findByUnitId(equipment_unit_id);
    if (!histories.length) return [];

    const branches = {};
    const users = {};
    let equipment = null;

    // Lấy unit + equipment
    const unit = await equipmentUnitRepository.findById(equipment_unit_id);
    if (unit?.equipment_id) {
      equipment = await equipmentRepository.findById(unit.equipment_id);
    }

    // Join thêm chi nhánh + user
    for (const h of histories) {
      if (h.from_branch_id && !branches[h.from_branch_id])
        branches[h.from_branch_id] = await branchRepository.findById(h.from_branch_id);
      if (h.to_branch_id && !branches[h.to_branch_id])
        branches[h.to_branch_id] = await branchRepository.findById(h.to_branch_id);
      if (h.receiver_id && !users[h.receiver_id])
        users[h.receiver_id] = await userRepository.getUserBySub(h.receiver_id);
    }

    return histories.map((h) => ({
      ...h,
      from_branch_name: branches[h.from_branch_id]?.name || h.from_branch_id,
      to_branch_name: branches[h.to_branch_id]?.name || h.to_branch_id,
      receiver_name:
        users[h.receiver_id]?.attributes?.name ||
        users[h.receiver_id]?.username ||
        null,
      equipment_name: equipment?.name || unit?.equipment_id || null,
    }));
  },
};

module.exports = equipmentTransferHistoryService;
