const categoryRepository = require("../repositories/categoryMainRepository");
const categoryTypeRepository = require("../repositories/categoryTypeRepository");
const equipmentRepository = require("../repositories/equipmentRepository");
const equipmentUnitRepository = require("../repositories/equipmentUnitRepository");

const equipmentHierarchyService = {
  async getEquipmentHierarchy(branchFilter = null) {
    // 🧩 Lấy dữ liệu gốc
    const [mains, types, equipments, units] = await Promise.all([
      categoryRepository.findAll(),
      categoryTypeRepository.findAll(),
      equipmentRepository.findAll(),
      branchFilter
        ? equipmentUnitRepository.findByBranch(branchFilter)
        : equipmentUnitRepository.findAll(),
    ]);

    // 🧮 Đếm unit theo equipment_id
    const unitCountMap = {};
    for (const u of units) {
      if (!unitCountMap[u.equipment_id]) unitCountMap[u.equipment_id] = 0;
      unitCountMap[u.equipment_id]++;
    }

    // 🧱 Gom nhóm
    const result = mains.map((main) => {
      const mainTypes = types.filter((t) => t.category_main_id === main.id);
      const typeBlocks = mainTypes.map((t) => {
        const relatedEquipments = equipments.filter(
          (e) => e.category_type_id === t.id
        );
        const equipmentBlocks = relatedEquipments.map((eq) => ({
          equipment_id: eq.id,
          equipment_name: eq.name,
          unit_count: unitCountMap[eq.id] || 0,
        }));

        return {
          type_id: t.id,
          type_name: t.name,
          equipments: equipmentBlocks,
        };
      });

      return {
        main_id: main.id,
        main_name: main.name,
        types: typeBlocks,
      };
    });

    return result;
  },
};

module.exports = equipmentHierarchyService;
