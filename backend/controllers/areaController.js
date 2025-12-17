const areaService = require("../services/areaService");

module.exports = {
  createArea: async (req, res) => {
    try {
      const area = await areaService.createArea(req.body);
      res.status(201).json(area);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },

  getAreas: async (req, res) => {
    res.json(await areaService.getAreas());
  },

  getAreaById: async (req, res) => {
    try {
      res.json(await areaService.getAreaById(req.params.id));
    } catch (e) {
      res.status(404).json({ error: e.message });
    }
  },

  updateArea: async (req, res) => {
    try {
      res.json(await areaService.updateArea(req.params.id, req.body));
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },

  deleteArea: async (req, res) => {
    try {
      await areaService.deleteArea(req.params.id);
      res.json({ message: "Area deleted successfully" });
    } catch (e) {
      res.status(404).json({ error: e.message });
    }
  },
};
