const equipmentService = require("../services/equipmentService");

const equipmentController = {
  createEquipment: async (req, res) => {
    try {
      const equipment = await equipmentService.createEquipment(req.body);
      res.status(201).json(equipment);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getEquipments: async (req, res) => {
    try {
      const equipments = await equipmentService.getEquipments();
      res.json(equipments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getEquipmentById: async (req, res) => {
    try {
      const equipment = await equipmentService.getEquipmentById(req.params.id);
      res.json(equipment);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  updateEquipment: async (req, res) => {
    try {
      const equipment = await equipmentService.updateEquipment(
        req.params.id,
        req.body
      );
      res.json(equipment);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  deleteEquipment: async (req, res) => {
    try {
      await equipmentService.deleteEquipment(req.params.id);
      res.json({ message: "Equipment deleted" });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
  getByCategoryTypeId: async (req, res) => {
    try {
      const items = await equipmentService.getEquipmentsByCategoryTypeId(
        req.params.category_type_id
      );
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getByVendorId: async (req, res) => {
    try {
      const items = await equipmentService.getEquipmentsByVendorId(
        req.params.vendor_id
      );
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = equipmentController;
