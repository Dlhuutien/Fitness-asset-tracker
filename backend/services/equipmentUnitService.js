const equipmentUnitRepository = require("../repositories/equipmentUnitRepository");

const equipmentUnitService = {
  getAllUnits: async () => {
    return await equipmentUnitRepository.findAll();
  },

  getUnitById: async (id) => {
    const unit = await equipmentUnitRepository.findById(id);
    if (!unit) throw new Error("Equipment Unit not found");
    return unit;
  },

  updateUnit: async (id, data) => {
    const existing = await equipmentUnitRepository.findById(id);
    if (!existing) throw new Error("Equipment Unit not found");
    return await equipmentUnitRepository.update(id, data);
  },

  deleteUnit: async (id) => {
    const existing = await equipmentUnitRepository.findById(id);
    if (!existing) throw new Error("Equipment Unit not found");
    return await equipmentUnitRepository.delete(id);
  },

  getUnitsByEquipmentId: async (equipment_id) => {
    return await equipmentUnitRepository.findByEquipmentId(equipment_id);
  },
};

module.exports = equipmentUnitService;
