const equipmentUnitRepository = require("../repositories/equipmentUnitRepository");
const equipmentRepository = require("../repositories/equipmentRepository");
const vendorRepository = require("../repositories/vendorRepository");
const categoryTypeRepository = require("../repositories/categoryTypeRepository");
const categoryMainRepository = require("../repositories/categoryMainRepository");
const attributeValueRepository = require("../repositories/attributeValueRepository");
const attributeRepository = require("../repositories/attributeRepository");
const equipmentTransferHistoryRepository = require("../repositories/equipmentTransferHistoryRepository");

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

    // Gom vendor_id từ unit để join vendor nhanh
    const vendorIds = [
      ...new Set(units.map((u) => u.vendor_id).filter(Boolean)),
    ];
    const vendors = vendorIds.length
      ? await Promise.all(vendorIds.map((id) => vendorRepository.findById(id)))
      : [];
    const vendorMap = Object.fromEntries(
      vendorIds.map((id, i) => [id, vendors[i]])
    );

    // 4️⃣ Cache tạm vendor/type/main để tránh query trùng
    const typeCache = {};
    const mainCache = {};

    // 5️⃣ Bổ sung tên Vendor, Type, Main cho mỗi thiết bị
    const enrichedEquipments = await Promise.all(
      equipments.map(async (eq) => {
        if (!eq) return null;

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
      vendor_name: vendorMap[u.vendor_id]?.name || null,
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

    const vendor = unit.vendor_id
      ? await vendorRepository.findById(unit.vendor_id)
      : null;

    // 2️⃣ Lấy thông tin thiết bị tương ứng
    const eq = await equipmentRepository.findById(unit.equipment_id);
    if (!eq) throw new Error("Equipment not found");

    // 3️⃣ Join type, main
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
      type_name: type ? type.name : null,
      main_name: main ? main.name : null,
      attributes,
    };

    // 6️⃣ Gộp dữ liệu cuối cùng
    return {
      ...unit,
      vendor_name: vendor?.name || null,
      equipment,
    };
  },

  // Cập nhật thiết bị
  updateUnit: async (id, data, userBranchId = null) => {
    const existing = await equipmentUnitRepository.findById(id);
    if (!existing) throw new Error("Equipment Unit not found");

    if (userBranchId && userBranchId !== existing.branch_id) {
      throw new Error(
        "Bạn không có quyền cập nhật thiết bị này (chỉ được xem)."
      );
    }

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
    if (!units?.length) return [];

    const eq = await equipmentRepository.findById(equipment_id);
    if (!eq) throw new Error("Equipment not found");

    // Lấy type & main của thiết bị
    const type = await categoryTypeRepository.findById(eq.category_type_id);
    const main = type
      ? await categoryMainRepository.findById(type.category_main_id)
      : null;

    const equipment = {
      ...eq,
      type_name: type ? type.name : null,
      main_name: main ? main.name : null,
    };

    // Gom vendor_id từ units
    const vendorIds = [
      ...new Set(units.map((u) => u.vendor_id).filter(Boolean)),
    ];
    const vendors = vendorIds.length
      ? await Promise.all(vendorIds.map((id) => vendorRepository.findById(id)))
      : [];
    const vendorMap = Object.fromEntries(
      vendorIds.map((id, i) => [id, vendors[i]])
    );

    // Gộp vendor_name + equipment vào từng unit
    return units.map((u) => ({
      ...u,
      vendor_name: vendorMap[u.vendor_id]?.name || null,
      equipment,
    }));
  },

  // ===================================================
  // 🔍 LẤY THIẾT BỊ TỪNG THUỘC CHI NHÁNH NHƯNG ĐÃ CHUYỂN ĐI
  // ===================================================
  getUnitsPreviouslyInBranch: async (branchId) => {
    if (!branchId) throw new Error("Branch ID is required");

    // 1️⃣ Lấy toàn bộ lịch sử chuyển liên quan tới chi nhánh này
    const histories = await equipmentTransferHistoryRepository.findByBranch(
      branchId
    );
    if (!histories.length) return [];

    // 2️⃣ Lấy danh sách unit từng ở chi nhánh này
    const relatedUnitIds = [
      ...new Set(histories.map((h) => h.equipment_unit_id)),
    ];

    // 3️⃣ Lấy thông tin chi tiết các unit
    const allUnits = await equipmentUnitRepository.batchFindByIds(
      relatedUnitIds
    );

    // 4️⃣ Lọc bỏ những unit hiện tại vẫn còn ở chi nhánh đó
    const filteredUnits = allUnits.filter((u) => u.branch_id !== branchId);
    if (!filteredUnits.length) return [];

    // 5️⃣ Gom equipment_id & vendor_id để join nhanh
    const equipmentIds = [...new Set(filteredUnits.map((u) => u.equipment_id))];
    const equipments = await equipmentRepository.batchFindByIds(equipmentIds);

    const vendorIds = [
      ...new Set(filteredUnits.map((u) => u.vendor_id).filter(Boolean)),
    ];
    const vendors = vendorIds.length
      ? await Promise.all(vendorIds.map((id) => vendorRepository.findById(id)))
      : [];
    const vendorMap = Object.fromEntries(
      vendorIds.map((id, i) => [id, vendors[i]])
    );

    // 6️⃣ Join type & main name cho mỗi equipment
    const typeCache = {};
    const mainCache = {};
    const enrichedEquipments = await Promise.all(
      equipments.map(async (eq) => {
        if (!eq) return null;
        let type = typeCache[eq.category_type_id];
        if (!type) {
          type = await categoryTypeRepository.findById(eq.category_type_id);
          typeCache[eq.category_type_id] = type;
        }

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
          type_name: type?.name || null,
          main_name: main?.name || null,
        };
      })
    );

    const equipmentMap = Object.fromEntries(
      enrichedEquipments.filter(Boolean).map((eq) => [eq.id, eq])
    );

    // 7️⃣ Trả về format thống nhất với getAllUnits()
    return filteredUnits.map((u) => ({
      ...u,
      vendor_name: vendorMap[u.vendor_id]?.name || null,
      equipment: equipmentMap[u.equipment_id] || null,
    }));
  },
};

module.exports = equipmentUnitService;
