const categoryRepository = require("../repositories/categoryMainRepository");
const categoryTypeRepository = require("../repositories/categoryTypeRepository");
const { generateTypeCode } = require("../utils/codeGenerator");

const categoryService = {
  createCategory: async (data) => {
    if (!data.name) {
      throw new Error("Category name is required");
    }

    // Kiểm tra tên trùng (không phân biệt hoa thường)
    const existingCategories = await categoryRepository.findAll();
    const nameExists = existingCategories.some(
      (c) => c.name.trim().toLowerCase() === data.name.trim().toLowerCase()
    );
    if (nameExists) {
      throw new Error(`Category name "${data.name}" already exists`);
    }

    // Sinh mã code mới (vd: Cardio → CA)
    const existingCodes = existingCategories.map((c) => c.id);
    const newId = generateTypeCode(data.name, existingCodes);

    // Tạo mới CategoryMain
    const newCategory = await categoryRepository.create({
      id: newId,
      name: data.name.trim(),
      description: data.description || null,
    });

    return newCategory;
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
