const equipmentUnitRepository = require("../repositories/equipmentUnitRepository");
const equipmentService = require("./equipmentService");

const equipmentUnitService = {
  getAllUnits: async (branchFilter = null) => {
    // Nếu có branchFilter → chỉ lấy theo chi nhánh
    const units = branchFilter
      ? await equipmentUnitRepository.findByBranch(branchFilter)
      : await equipmentUnitRepository.findAll();

    return Promise.all(
      units.map(async (u) => {
        const equipment = await equipmentService.getEquipmentById(
          u.equipment_id
        );
        return { ...u, equipment };
      })
    );
  },

  // Lấy chi tiết 1 thiết bị theo ID
  getUnitById: async (id) => {
    const unit = await equipmentUnitRepository.findById(id);
    if (!unit) throw new Error("Equipment Unit not found");

    const equipment = await equipmentService.getEquipmentById(
      unit.equipment_id
    );

    return {
      ...unit,
      equipment,
    };
  },

  // Cập nhật thiết bị
  updateUnit: async (id, data) => {
    const existing = await equipmentUnitRepository.findById(id);
    if (!existing) throw new Error("Equipment Unit not found");
    return await equipmentUnitRepository.update(id, data);
  },

  // Xóa thiết bị
  deleteUnit: async (id) => {
    const existing = await equipmentUnitRepository.findById(id);
    if (!existing) throw new Error("Equipment Unit not found");
    return await equipmentUnitRepository.delete(id);
  },

  // Lấy tất cả theo thiết bị
  getUnitsByEquipmentId: async (equipment_id) => {
    const units = await equipmentUnitRepository.findByEquipmentId(equipment_id);
    const equipment = await equipmentService.getEquipmentById(equipment_id);

    return units.map((u) => ({
      ...u,
      equipment,
    }));
  },
};

module.exports = equipmentUnitService;
