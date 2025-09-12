const CategoryModel = require("../models/CategoryMain");

const categoryRepository = {
  create: async (data) => CategoryModel.createCategory(data),
  findAll: async () => CategoryModel.getCategories(),
  findById: async (id) => CategoryModel.getOneCategory(id),
  update: async (id, data) => CategoryModel.updateCategory(id, data),
  delete: async (id) => CategoryModel.deleteCategory(id),
};

module.exports = categoryRepository;
