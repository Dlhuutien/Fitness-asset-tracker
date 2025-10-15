const categoryTypeService = require("../services/categoryTypeService");

const categoryTypeController = {
  createCategoryType: async (req, res) => {
    try {
      const type = await categoryTypeService.createCategoryType({
        category_main_id: req.body.category_main_id,
        name: req.body.name,
        description: req.body.description,
      });

      res.status(201).json(type);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getCategoryTypes: async (req, res) => {
    try {
      const types = await categoryTypeService.getCategoryTypes();
      res.json(types);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getCategoryTypeById: async (req, res) => {
    try {
      const type = await categoryTypeService.getCategoryTypeById(req.params.id);
      res.json(type);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  getCategoryTypesByMainId: async (req, res) => {
    try {
      const types = await categoryTypeService.getCategoryTypesByMainId(
        req.params.category_main_id
      );
      res.json(types);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  updateCategoryType: async (req, res) => {
    try {
      const type = await categoryTypeService.updateCategoryType(req.params.id, {
        category_main_id: req.body.category_main_id,
        name: req.body.name,
        description: req.body.description,
      });

      res.json(type);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  deleteCategoryType: async (req, res) => {
    try {
      await categoryTypeService.deleteCategoryType(req.params.id);
      res.json({ message: "CategoryType deleted successfully" });
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },
};

module.exports = categoryTypeController;
