const categoryService = require("../services/categoryMainService");
const { uploadFile } = require("../services/file.service");

const categoryController = {
  createCategory: async (req, res) => {
    try {
      let imageUrl = null;
      if (req.file) {
        imageUrl = await uploadFile(req.file);
      }

      const category = await categoryService.createCategory({
        id: req.body.id,
        name: req.body.name,
        description: req.body.description,
        image: imageUrl,
      });

      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getCategories: async (req, res) => {
    try {
      const categories = await categoryService.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getCategoryById: async (req, res) => {
    try {
      const category = await categoryService.getCategoryById(req.params.id);
      res.json(category);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  updateCategory: async (req, res) => {
    try {
      let imageUrl = req.body.image;
      if (req.file) {
        imageUrl = await uploadFile(req.file);
      }

      const category = await categoryService.updateCategory(req.params.id, {
        name: req.body.name,
        description: req.body.description,
        image: imageUrl,
      });

      res.json(category);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  deleteCategory: async (req, res) => {
    try {
      await categoryService.deleteCategory(req.params.id);
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },
};

module.exports = categoryController;
