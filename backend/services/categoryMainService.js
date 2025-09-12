const categoryRepository = require("../repositories/categoryMainRepository");

const categoryService = {
  createCategory: async (data) => {
    if (!data.id || !data.name) {
      throw new Error("Category id and name are required");
    }
    return await categoryRepository.create(data);
  },

  getCategories: async () => {
    return await categoryRepository.findAll();
  },

  getCategoryById: async (id) => {
    const category = await categoryRepository.findById(id);
    if (!category) throw new Error("Category not found");
    return category;
  },

  updateCategory: async (id, data) => {
    const existing = await categoryRepository.findById(id);
    if (!existing) throw new Error("Category not found");
    return await categoryRepository.update(id, data);
  },

  deleteCategory: async (id) => {
    const existing = await categoryRepository.findById(id);
    if (!existing) throw new Error("Category not found");
    return await categoryRepository.delete(id);
  },
};

module.exports = categoryService;
