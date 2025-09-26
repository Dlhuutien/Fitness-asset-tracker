const equipmentUnitRepository = require("../repositories/equipmentUnitRepository");
const equipmentRepository = require("../repositories/equipmentRepository");
const attributeValueRepository = require("../repositories/attributeValueRepository");
const attributeRepository = require("../repositories/attributeRepository");

const equipmentUnitService = {
  getAllUnits: async () => {
    const units = await equipmentUnitRepository.findAll();

    return Promise.all(
      units.map(async (u) => {
        const equipment = await equipmentRepository.findById(u.equipment_id);

        // lấy attributes
        const attrValues = await attributeValueRepository.findByEquipmentId(u.equipment_id);
        const attrs = await Promise.all(
          attrValues.map(async (av) => {
            const attr = await attributeRepository.findById(av.attribute_id);
            return { attribute: attr ? attr.name : av.attribute_id, value: av.value };
          })
        );

        return {
          ...u,
          equipment: {
            ...equipment,
            attributes: attrs,
          },
        };
      })
    );
  },

  getUnitById: async (id) => {
    const unit = await equipmentUnitRepository.findById(id);
    if (!unit) throw new Error("Equipment Unit not found");

    const equipment = await equipmentRepository.findById(unit.equipment_id);
    const attrValues = await attributeValueRepository.findByEquipmentId(unit.equipment_id);
    const attrs = await Promise.all(
      attrValues.map(async (av) => {
        const attr = await attributeRepository.findById(av.attribute_id);
        return { attribute: attr ? attr.name : av.attribute_id, value: av.value };
      })
    );

    return {
      ...unit,
      equipment: {
        ...equipment,
        attributes: attrs,
      },
    };
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
    const units = await equipmentUnitRepository.findByEquipmentId(equipment_id);

    const equipment = await equipmentRepository.findById(equipment_id);
    const attrValues = await attributeValueRepository.findByEquipmentId(equipment_id);
    const attrs = await Promise.all(
      attrValues.map(async (av) => {
        const attr = await attributeRepository.findById(av.attribute_id);
        return { attribute: attr ? attr.name : av.attribute_id, value: av.value };
      })
    );

    return units.map((u) => ({
      ...u,
      equipment: {
        ...equipment,
        attributes: attrs,
      },
    }));
  },
};

module.exports = equipmentUnitService;
