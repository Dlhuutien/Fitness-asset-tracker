const AttributeModel = require("../models/Attribute");

const attributeRepository = {
  create: async (data) => AttributeModel.createAttribute(data),
  findAll: async () => AttributeModel.getAttributes(),
  findById: async (id) => AttributeModel.getOneAttribute(id),
  update: async (id, data) => AttributeModel.updateAttribute(id, data),
  delete: async (id) => AttributeModel.deleteAttribute(id),
};

module.exports = attributeRepository;
