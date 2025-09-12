const CategoryTypeModel = require("../models/CategoryType");

const categoryTypeRepository = {
  create: async (data) => CategoryTypeModel.createCategoryType(data),
  findAll: async () => CategoryTypeModel.getCategoryTypes(),
  findById: async (id) => CategoryTypeModel.getOneCategoryType(id),
  findByMainId: async (category_main_id) => CategoryTypeModel.getCategoryTypesByMainId(category_main_id),
  update: async (id, data) => CategoryTypeModel.updateCategoryType(id, data),
  delete: async (id) => CategoryTypeModel.deleteCategoryType(id),
};

module.exports = categoryTypeRepository;
