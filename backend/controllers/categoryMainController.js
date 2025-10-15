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
      console.log("[UPDATE CATEGORY] Nhận request:");
      console.log("- Params ID:", req.params.id);
      console.log("- Body:", req.body);
      console.log(
        "- File:",
        req.file ? req.file.originalname : "Không có file"
      );

      const { name, description } = req.body;
      // Lấy dữ liệu category cũ trong DB
      const oldCategory = await categoryService.getCategoryById(req.params.id);

      let imageUrl = oldCategory.image; // mặc định giữ ảnh cũ
      if (req.file) {
        console.log("Uploading new file...");
        imageUrl = await uploadFile(req.file);
        console.log("Uploaded file URL:", imageUrl);
      }

      // Cập nhật DB
      const category = await categoryService.updateCategory(req.params.id, {
        name,
        description,
        image: imageUrl,
      });

      console.log("Update thành công:", category);
      res.json(category);
    } catch (error) {
      console.error("[Error updating category]:", error);
      res.status(400).json({ error: error.message, stack: error.stack });
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
