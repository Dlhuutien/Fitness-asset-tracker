const typeAttributeService = require("../services/typeAttributeService");

const typeAttributeController = {
  // ➕ Thêm attribute vào type
  addAttributeToType: async (req, res) => {
    try {
      const { attribute_id } = req.body;
      const { typeId } = req.params;

      const result = await typeAttributeService.addAttributeToType(typeId, attribute_id);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // 📄 Lấy toàn bộ attributes của type
  getAttributesByType: async (req, res) => {
    try {
      const { typeId } = req.params;
      const attrs = await typeAttributeService.getAttributesByType(typeId);
      res.json(attrs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // ❌ Xoá attribute khỏi type
  removeAttributeFromType: async (req, res) => {
    try {
      const { typeId, attrId } = req.params;
      const result = await typeAttributeService.removeAttributeFromType(typeId, attrId);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
};

module.exports = typeAttributeController;
