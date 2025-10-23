const TypeAttributeModel = require("../models/TypeAttribute");

const typeAttributeRepository = {
  create: async (data) => await TypeAttributeModel.create(data),

  findAll: async () => await TypeAttributeModel.getAll(),

  findById: async (id) => await TypeAttributeModel.getById(id),

  findByTypeId: async (typeId) =>
    await TypeAttributeModel.getAttributesByTypeId(typeId),

  findByAttributeId: async (attrId) =>
    await TypeAttributeModel.getTypesByAttributeId(attrId),

  findOne: async (typeId, attrId) =>
    await TypeAttributeModel.findOne(typeId, attrId),

  delete: async (id) => await TypeAttributeModel.delete(id),

  deleteByTypeId: async (typeId) =>
    await TypeAttributeModel.deleteByTypeId(typeId),
};

module.exports = typeAttributeRepository;
