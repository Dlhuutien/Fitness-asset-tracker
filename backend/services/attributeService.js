const attributeRepository = require("../repositories/attributeRepository");
const attributeValueRepository = require("../repositories/attributeValueRepository");

const attributeService = {
  createAttribute: async (data) => {
    if (!data.name) throw new Error("Attribute name is required");

    return await attributeRepository.create(data);
  },

  getAttributes: async () => {
    return await attributeRepository.findAll();
  },

  getAttributeById: async (id) => {
    const attr = await attributeRepository.findById(id);
    if (!attr) throw new Error("Attribute not found");
    return attr;
  },

  updateAttribute: async (id, data) => {
    const existing = await attributeRepository.findById(id);
    if (!existing) throw new Error("Attribute not found");
    return await attributeRepository.update(id, data);
  },

  deleteAttribute: async (id) => {
    const existing = await attributeRepository.findById(id);
    if (!existing) throw new Error("Attribute not found");

    // Check nếu Attribute đang được dùng trong AttributeValue
    const values = await attributeValueRepository.findByAttributeId(id);
    if (values.length > 0) {
      throw new Error(
        `Cannot delete Attribute ${id} because it is still in use by equipment(s)`
      );
    }

    return await attributeRepository.delete(id);
  },
};

module.exports = attributeService;
