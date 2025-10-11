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
  // Xóa tất cả attribute value của 1 thiết bị
  deleteAllByEquipmentId: async (equipment_id) =>
    AttributeValueModel.deleteAllByEquipmentId(equipment_id),
  // Xóa 1 attribute cụ thể theo equipment_id + attribute_id
  deleteByEquipmentAndAttribute: async (equipment_id, attribute_id) =>
    AttributeValueModel.deleteByEquipmentAndAttribute(equipment_id, attribute_id),
};

module.exports = attributeValueRepository;
