const categoryRepository = require("../repositories/categoryMainRepository");
const categoryTypeRepository = require("../repositories/categoryTypeRepository");

const categoryService = {
  createCategory: async (data) => {
    if (!data.id || !data.name) {
      throw new Error("Category id and name are required");
    }
    const existing = await categoryRepository.findById(data.id);
    if (existing) {
      throw new Error(`CategoryMain with id ${data.id} already exists`);
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

    // Kiểm tra xem có CategoryType nào map tới không
    const relatedTypes = await categoryTypeRepository.findByMainId(id);
    if (relatedTypes.length > 0) {
      throw new Error(
        `Cannot delete CategoryMain ${id} because ${relatedTypes.length} CategoryType(s) still reference it`
      );
    }

    return await categoryRepository.delete(id);
  },
};

module.exports = categoryService;
