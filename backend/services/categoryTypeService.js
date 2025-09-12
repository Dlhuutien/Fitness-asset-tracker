const categoryTypeRepository = require("../repositories/categoryTypeRepository");
const categoryMainRepository = require("../repositories/categoryMainRepository");

const categoryTypeService = {
  createCategoryType: async (data) => {
    if (!data.id || !data.name || !data.category_main_id) {
      throw new Error(
        "CategoryType id, name and category_main_id are required"
      );
    }

    const existing = await categoryTypeRepository.findById(data.id);
    if (existing) {
      throw new Error(`CategoryType with id ${data.id} already exists`);
    }

    const mainCategory = await categoryMainRepository.findById(
      data.category_main_id
    );
    if (!mainCategory) {
      throw new Error(
        `Category_main with id ${data.category_main_id} does not exist`
      );
    }

    return await categoryTypeRepository.create(data);
  },

  getCategoryTypes: async () => {
    return await categoryTypeRepository.findAll();
  },

  getCategoryTypeById: async (id) => {
    const type = await categoryTypeRepository.findById(id);
    if (!type) throw new Error("CategoryType not found");
    return type;
  },

  getCategoryTypesByMainId: async (category_main_id) => {
    return await categoryTypeRepository.findByMainId(category_main_id);
  },

  updateCategoryType: async (id, data) => {
    const existing = await categoryTypeRepository.findById(id);
    if (!existing) throw new Error("CategoryType not found");
    return await categoryTypeRepository.update(id, data);
  },

  deleteCategoryType: async (id) => {
    const existing = await categoryTypeRepository.findById(id);
    if (!existing) throw new Error("CategoryType not found");
    return await categoryTypeRepository.delete(id);
  },
};

module.exports = categoryTypeService;
