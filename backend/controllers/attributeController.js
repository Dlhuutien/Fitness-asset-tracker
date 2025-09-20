const attributeService = require("../services/attributeService");

const attributeController = {
  createAttribute: async (req, res) => {
    try {
      const attr = await attributeService.createAttribute({
        name: req.body.name,
      });
      res.status(201).json(attr);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getAttributes: async (req, res) => {
    try {
      const attrs = await attributeService.getAttributes();
      res.json(attrs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getAttributeById: async (req, res) => {
    try {
      const attr = await attributeService.getAttributeById(req.params.id);
      res.json(attr);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  updateAttribute: async (req, res) => {
    try {
      const attr = await attributeService.updateAttribute(req.params.id, {
        name: req.body.name,
      });
      res.json(attr);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  deleteAttribute: async (req, res) => {
    try {
      await attributeService.deleteAttribute(req.params.id);
      res.json({ message: "Attribute deleted successfully" });
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },
};

module.exports = attributeController;
