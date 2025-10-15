const categoryTypeRepository = require("../repositories/categoryTypeRepository");
const categoryMainRepository = require("../repositories/categoryMainRepository");
const equipmentRepository = require("../repositories/equipmentRepository");
const { generateTypeCode } = require("../utils/codeGenerator");

const categoryTypeService = {
  createCategoryType: async (data) => {
    const { name, category_main_id } = data;

    if (!name || !category_main_id) {
      throw new Error("CategoryType name and category_main_id are required");
    }

    // 🔹 Kiểm tra nhóm chính tồn tại
    const mainCategory = await categoryMainRepository.findById(
      category_main_id
    );
    if (!mainCategory) {
      throw new Error(
        `Category_main with id ${category_main_id} does not exist`
      );
    }

    // Kiểm tra tên trùng trong cùng nhóm
    const existingTypes = await categoryTypeRepository.findByMainId(
      category_main_id
    );
    const nameExists = existingTypes.some(
      (t) => t.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    if (nameExists) {
      throw new Error(
        `CategoryType name "${name}" already exists under main category "${mainCategory.name}"`
      );
    }

    // Sinh mã code mới (vd: Strength Machine → SM)
    const existingCodes = existingTypes.map((t) => t.id);
    const newId = generateTypeCode(name, existingCodes);

    // Tạo mới CategoryType
    const newType = await categoryTypeRepository.create({
      id: newId,
      name: name.trim(),
      description: data.description || null,
      category_main_id,
    });

    return newType;
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
