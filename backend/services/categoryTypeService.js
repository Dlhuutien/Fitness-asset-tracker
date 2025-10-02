const categoryTypeRepository = require("../repositories/categoryTypeRepository");
const categoryMainRepository = require("../repositories/categoryMainRepository");
const equipmentRepository = require("../repositories/equipmentRepository");

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
    const types = await categoryTypeRepository.findAll();

    // Gắn thêm main_name cho từng type
    return Promise.all(
      types.map(async (t) => {
        const main = await categoryMainRepository.findById(t.category_main_id);
        return {
          ...t,
          main_name: main ? main.name : null,
        };
      })
    );
  },

  getCategoryTypeById: async (id) => {
    const type = await categoryTypeRepository.findById(id);
    if (!type) throw new Error("CategoryType not found");

    const main = await categoryMainRepository.findById(type.category_main_id);
    return {
      ...type,
      main_name: main ? main.name : null,
    };
  },

  getCategoryTypesByMainId: async (category_main_id) => {
    const types = await categoryTypeRepository.findByMainId(category_main_id);
    const main = await categoryMainRepository.findById(category_main_id);

    return types.map((t) => ({
      ...t,
      main_name: main ? main.name : null,
    }));
  },

  updateCategoryType: async (id, data) => {
    const existing = await categoryTypeRepository.findById(id);
    if (!existing) throw new Error("CategoryType not found");
    return await categoryTypeRepository.update(id, data);
  },

  deleteCategoryType: async (id) => {
    const existing = await categoryTypeRepository.findById(id);
    if (!existing) throw new Error("CategoryType not found");

    // Check nếu có equipment đang tham chiếu đến category_type_id này
    const equipments = await equipmentRepository.findByCategoryTypeId(id);
    if (equipments.length > 0) {
      throw new Error(
        `Cannot delete CategoryType ${id} because it is referenced by ${equipments.length} equipment(s)`
      );
    }

    return await categoryTypeRepository.delete(id);
  },
};

module.exports = categoryTypeService;
