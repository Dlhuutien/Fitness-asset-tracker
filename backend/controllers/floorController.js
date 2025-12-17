const floorService = require("../services/floorService");

module.exports = {
  createFloor: async (req, res) => {
    try {
      const floor = await floorService.createFloor(req.body);
      res.status(201).json(floor);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },

  getFloors: async (req, res) => {
    res.json(await floorService.getFloors());
  },

  getFloorById: async (req, res) => {
    try {
      res.json(await floorService.getFloorById(req.params.id));
    } catch (e) {
      res.status(404).json({ error: e.message });
    }
  },

  updateFloor: async (req, res) => {
    try {
      res.json(await floorService.updateFloor(req.params.id, req.body));
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },

  deleteFloor: async (req, res) => {
    try {
      await floorService.deleteFloor(req.params.id);
      res.json({ message: "Floor deleted successfully" });
    } catch (e) {
      res.status(404).json({ error: e.message });
    }
  },
};
