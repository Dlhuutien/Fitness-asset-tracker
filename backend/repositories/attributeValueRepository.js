const AttributeValueModel = require("../models/AttributeValue");

const attributeValueRepository = {
  create: async (data) => AttributeValueModel.createAttributeValue(data),
  findAll: async () => AttributeValueModel.getAttributeValues(),
  findById: async (id) => AttributeValueModel.getOneAttributeValue(id),
  findByEquipmentId: async (equipment_id) =>
    AttributeValueModel.getAttributeValuesByEquipmentId(equipment_id),
  findByAttributeId: async (attribute_id) =>
    AttributeValueModel.getAttributeValuesByAttributeId(attribute_id),
  update: async (id, data) => AttributeValueModel.updateAttributeValue(id, data),
  delete: async (id) => AttributeValueModel.deleteAttributeValue(id),
};

module.exports = attributeValueRepository;
