const attributeValueRepository = require("../repositories/attributeValueRepository");
const attributeRepository = require("../repositories/attributeRepository");
const equipmentRepository = require("../repositories/equipmentRepository");

const attributeValueService = {
  createAttributeValue: async (data) => {
    if (!data.attribute_id || !data.equipment_id || !data.value) {
      throw new Error("attribute_id, equipment_id, and value are required");
    }

    // Check tồn tại attribute
    const attribute = await attributeRepository.findById(data.attribute_id);
    if (!attribute) {
      throw new Error(`Attribute with id ${data.attribute_id} does not exist`);
    }

    // Check tồn tại equipment
    const equipment = await equipmentRepository.findById(data.equipment_id);
    if (!equipment) {
      throw new Error(`Equipment with id ${data.equipment_id} does not exist`);
    }

    // Check nếu đã tồn tại cùng equipment_id + attribute_id
    const existingValues = await attributeValueRepository.findByEquipmentId(
      data.equipment_id
    );
    const duplicated = existingValues.find(
      (item) => item.attribute_id === data.attribute_id
    );
    if (duplicated) {
      throw new Error(
        `AttributeValue with equipment_id ${data.equipment_id} and attribute_id ${data.attribute_id} already exists`
      );
    }

    return await attributeValueRepository.create(data);
  },

  getAttributeValues: async () => {
    return await attributeValueRepository.findAll();
  },

  getAttributeValueById: async (id) => {
    const av = await attributeValueRepository.findById(id);
    if (!av) throw new Error("AttributeValue not found");
    return av;
  },

  getAttributeValuesByEquipmentId: async (equipment_id) => {
    return await attributeValueRepository.findByEquipmentId(equipment_id);
  },

  getAttributeValuesByAttributeId: async (attribute_id) => {
    return await attributeValueRepository.findByAttributeId(attribute_id);
  },

  updateAttributeValue: async (id, data) => {
    const existing = await attributeValueRepository.findById(id);
    if (!existing) throw new Error("AttributeValue not found");

    return await attributeValueRepository.update(id, data);
  },

  deleteAttributeValue: async (id) => {
    const existing = await attributeValueRepository.findById(id);
    if (!existing) throw new Error("AttributeValue not found");

    return await attributeValueRepository.delete(id);
  },
};

module.exports = attributeValueService;
