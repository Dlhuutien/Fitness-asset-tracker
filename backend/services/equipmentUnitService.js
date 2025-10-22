const equipmentUnitRepository = require("../repositories/equipmentUnitRepository");
const equipmentRepository = require("../repositories/equipmentRepository");
const vendorRepository = require("../repositories/vendorRepository");
const categoryTypeRepository = require("../repositories/categoryTypeRepository");
const categoryMainRepository = require("../repositories/categoryMainRepository");
const attributeValueRepository = require("../repositories/attributeValueRepository");
const attributeRepository = require("../repositories/attributeRepository");

const equipmentUnitService = {
  getAllUnits: async (branchFilter = null) => {
    console.time("getAllUnits");

    // 1️⃣ Lấy danh sách Unit
    const units = branchFilter
      ? await equipmentUnitRepository.findByBranch(branchFilter)
      : await equipmentUnitRepository.findAll();

    if (!units?.length) return [];

    // 2️⃣ Gom các equipment_id duy nhất
    const equipmentIds = [...new Set(units.map((u) => u.equipment_id))];

    // 3️⃣ ⚡ Lấy toàn bộ thiết bị 1 lượt (BatchGet)
    const equipments = await equipmentRepository.batchFindByIds(equipmentIds);

    // 4️⃣ Cache tạm vendor/type/main để tránh query trùng
    const vendorCache = {};
    const typeCache = {};
    const mainCache = {};

    // 5️⃣ Bổ sung tên Vendor, Type, Main cho mỗi thiết bị
    const enrichedEquipments = await Promise.all(
      equipments.map(async (eq) => {
        if (!eq) return null;

        // Vendor cache
        let vendor = vendorCache[eq.vendor_id];
        if (!vendor) {
          vendor = await vendorRepository.findById(eq.vendor_id);
          vendorCache[eq.vendor_id] = vendor;
        }

        // Type cache
        let type = typeCache[eq.category_type_id];
        if (!type) {
          type = await categoryTypeRepository.findById(eq.category_type_id);
          typeCache[eq.category_type_id] = type;
        }

        // Main cache
        let main = null;
        if (type) {
          const mainId = type.category_main_id;
          if (mainCache[mainId]) {
            main = mainCache[mainId];
          } else {
            main = await categoryMainRepository.findById(mainId);
            mainCache[mainId] = main;
          }
        }

        return {
          ...eq,
          vendor_name: vendor?.name || null,
          type_name: type?.name || null,
          main_name: main?.name || null,
        };
      })
    );

    // 6️⃣ Tạo map để join nhanh
    const equipmentMap = Object.fromEntries(
      enrichedEquipments.filter(Boolean).map((eq) => [eq.id, eq])
    );

    // 7️⃣ Gộp vào kết quả cuối
    const result = units.map((u) => ({
      ...u,
      equipment: equipmentMap[u.equipment_id] || null,
    }));

    console.timeEnd("getAllUnits");
    return result;
  },

  // Lấy chi tiết 1 thiết bị theo ID
  getUnitById: async (id) => {
    // 1️⃣ Lấy thông tin unit
    const unit = await equipmentUnitRepository.findById(id);
    if (!unit) throw new Error("Equipment Unit not found");

    // 2️⃣ Lấy thông tin thiết bị tương ứng
    const eq = await equipmentRepository.findById(unit.equipment_id);
    if (!eq) throw new Error("Equipment not found");

    // 3️⃣ Join vendor, type, main
    const vendor = await vendorRepository.findById(eq.vendor_id);
    const type = await categoryTypeRepository.findById(eq.category_type_id);
    const main = type
      ? await categoryMainRepository.findById(type.category_main_id)
      : null;

    // 4️⃣ Lấy attributes
    const attrValues = await attributeValueRepository.findByEquipmentId(eq.id);
    const attributes = await Promise.all(
      attrValues.map(async (av) => {
        const attr = await attributeRepository.findById(av.attribute_id);
        return {
          attribute: attr ? attr.name : av.attribute_id,
          value: av.value,
        };
      })
    );

    // 5️⃣ Gộp dữ liệu thiết bị
    const equipment = {
      ...eq,
      vendor_name: vendor ? vendor.name : null,
      type_name: type ? type.name : null,
      main_name: main ? main.name : null,
      attributes,
    };

    // 6️⃣ Gộp dữ liệu cuối cùng
    return {
      ...unit,
      equipment,
    };
  },

  // Cập nhật thiết bị
  updateUnit: async (id, data) => {
    const existing = await equipmentUnitRepository.findById(id);
    if (!existing) throw new Error("Equipment Unit not found");
    return await equipmentUnitRepository.update(id, data);
  },

  // Xóa thiết bị
  deleteUnit: async (id) => {
    const existing = await equipmentUnitRepository.findById(id);
    if (!existing) throw new Error("Equipment Unit not found");
    return await equipmentUnitRepository.delete(id);
  },

  // Lấy tất cả theo thiết bị
  getUnitsByEquipmentId: async (equipment_id) => {
    const units = await equipmentUnitRepository.findByEquipmentId(equipment_id);
    const eq = await equipmentRepository.findById(equipment_id);
    if (!eq) throw new Error("Equipment not found");

    const vendor = await vendorRepository.findById(eq.vendor_id);
    const type = await categoryTypeRepository.findById(eq.category_type_id);
    const main = type
      ? await categoryMainRepository.findById(type.category_main_id)
      : null;

    const equipment = {
      ...eq,
      vendor_name: vendor ? vendor.name : null,
      type_name: type ? type.name : null,
      main_name: main ? main.name : null,
    };

    return units.map((u) => ({ ...u, equipment }));
  },
};

module.exports = equipmentUnitService;
