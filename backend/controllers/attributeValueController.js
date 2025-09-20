const attributeValueService = require("../services/attributeValueService");

const attributeValueController = {
  createAttributeValue: async (req, res) => {
    try {
      const av = await attributeValueService.createAttributeValue({
        id: req.body.id,
        equipment_id: req.body.equipment_id,
        attribute_id: req.body.attribute_id,
        value: req.body.value,
      });

      res.status(201).json(av);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getAttributeValues: async (req, res) => {
    try {
      const values = await attributeValueService.getAttributeValues();
      res.json(values);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getAttributeValueById: async (req, res) => {
    try {
      const av = await attributeValueService.getAttributeValueById(req.params.id);
      res.json(av);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  getAttributeValuesByEquipmentId: async (req, res) => {
    try {
      const values = await attributeValueService.getAttributeValuesByEquipmentId(
        req.params.equipment_id
      );
      res.json(values);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getAttributeValuesByAttributeId: async (req, res) => {
    try {
      const values = await attributeValueService.getAttributeValuesByAttributeId(
        req.params.attribute_id
      );
      res.json(values);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  updateAttributeValue: async (req, res) => {
    try {
      const av = await attributeValueService.updateAttributeValue(req.params.id, {
        equipment_id: req.body.equipment_id,
        attribute_id: req.body.attribute_id,
        value: req.body.value,
      });

      res.json(av);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  deleteAttributeValue: async (req, res) => {
    try {
      await attributeValueService.deleteAttributeValue(req.params.id);
      res.json({ message: "AttributeValue deleted successfully" });
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },
};

module.exports = attributeValueController;
