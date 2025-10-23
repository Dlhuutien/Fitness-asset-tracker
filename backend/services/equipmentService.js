const equipmentRepository = require("../repositories/equipmentRepository");
const categoryTypeRepository = require("../repositories/categoryTypeRepository");
const categoryMainRepository = require("../repositories/categoryMainRepository");
const attributeValueRepository = require("../repositories/attributeValueRepository");
const attributeRepository = require("../repositories/attributeRepository");
const { generateEquipmentCode } = require("../utils/codeGenerator");

const equipmentService = {
  createEquipment: async (data) => {
    if (!data.name || !data.category_type_id) {
      throw new Error("Equipment name và category_type_id là bắt buộc");
    }

    // Lấy type + main
    const categoryType = await categoryTypeRepository.findById(
      data.category_type_id
    );
    if (!categoryType)
      throw new Error(`CategoryType ${data.category_type_id} does not exist`);

    const categoryMain = await categoryMainRepository.findById(
      categoryType.category_main_id
    );
    if (!categoryMain)
      throw new Error(
        `CategoryMain ${categoryType.category_main_id} does not exist`
      );

    // Lấy danh sách ID hiện có
    const existingIds = await equipmentRepository.findAllIds();

    // Sinh ID: $vendor$main$type-$name
    const newId = generateEquipmentCode(
      {
        mainId: categoryMain.id,
        typeId: data.category_type_id,
        name: data.name,
      },
      existingIds
    );

    // Check trùng ID
    const existing = await equipmentRepository.findById(newId);
    if (existing) throw new Error(`Equipment with id ${newId} already exists`);

    // Tạo bản ghi thiết bị
    const newEquipment = {
      ...data,
      id: newId,
      category_main_id: categoryMain.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await equipmentRepository.create(newEquipment);

    // Gắn attributes (nếu có)
    if (Array.isArray(data.attributes)) {
      for (const av of data.attributes) {
        if (!av.attribute_id || !av.value)
          throw new Error("Each attribute must include attribute_id and value");

        const attr = await attributeRepository.findById(av.attribute_id);
        if (!attr) throw new Error(`Attribute ${av.attribute_id} not found`);

        await attributeValueRepository.create({
          equipment_id: newId,
          attribute_id: av.attribute_id,
          value: av.value,
        });
      }
    }

    // Load lại attributes để trả về
    const attrValues = await attributeValueRepository.findByEquipmentId(newId);
    const attrs = [];
    for (const av of attrValues) {
      const attr = await attributeRepository.findById(av.attribute_id);
      attrs.push({
        attribute: attr ? attr.name : av.attribute_id,
        value: av.value,
      });
    }

    return {
      ...newEquipment,
      attributes: attrs,
    };
  },

  getEquipments: async () => {
    const equipments = await equipmentRepository.findAll();

    const result = [];
    for (const eq of equipments) {
      const type = await categoryTypeRepository.findById(eq.category_type_id);
      const main = type
        ? await categoryMainRepository.findById(type.category_main_id)
        : null;

      result.push({
        ...eq,
        type_name: type ? type.name : null,
        main_name: main ? main.name : null,
      });
    }

    return result;
  },

  getEquipmentById: async (id) => {
    const equipment = await equipmentRepository.findById(id);
    if (!equipment) throw new Error("Equipment not found");

    const type = await categoryTypeRepository.findById(
      equipment.category_type_id
    );
    const main = type
      ? await categoryMainRepository.findById(type.category_main_id)
      : null;

    // const attrValues = await attributeValueRepository.findByEquipmentId(id);
    // const attrs = [];
    // for (const av of attrValues) {
    //   const attr = await attributeRepository.findById(av.attribute_id);
    //   attrs.push({
    //     attribute: attr ? attr.name : av.attribute_id,
    //     value: av.value,
    //   });
    // }

    return {
      ...equipment,
      type_name: type ? type.name : null,
      main_name: main ? main.name : null,
      // attributes: attrs,
    };
  },

  getEquipmentAttributeById: async (id) => {
    const equipment = await equipmentRepository.findById(id);
    if (!equipment) throw new Error("Equipment not found");

    const type = await categoryTypeRepository.findById(
      equipment.category_type_id
    );
    const main = type
      ? await categoryMainRepository.findById(type.category_main_id)
      : null;

    const attrValues = await attributeValueRepository.findByEquipmentId(id);
    const attrs = [];
    for (const av of attrValues) {
      const attr = await attributeRepository.findById(av.attribute_id);
      attrs.push({
        attribute: attr ? attr.name : av.attribute_id,
        value: av.value,
      });
    }

    return {
      ...equipment,
      type_name: type ? type.name : null,
      main_name: main ? main.name : null,
      attributes: attrs,
    };
  },

  getEquipmentsByCategoryTypeId: async (category_type_id) => {
    const equipments = await equipmentRepository.findByCategoryTypeId(
      category_type_id
    );
    return Promise.all(
      equipments.map(async (eq) => {
        const type = await categoryTypeRepository.findById(eq.category_type_id);
        const main = type
          ? await categoryMainRepository.findById(type.category_main_id)
          : null;

        const attrValues = await attributeValueRepository.findByEquipmentId(
          eq.id
        );
        const attrs = await Promise.all(
          attrValues.map(async (av) => {
            const attr = await attributeRepository.findById(av.attribute_id);
            return {
              attribute: attr ? attr.name : av.attribute_id,
              value: av.value,
            };
          })
        );

        return {
          ...eq,
          type_name: type ? type.name : null,
          main_name: main ? main.name : null,
          attributes: attrs,
        };
      })
    );
  },

  updateEquipment: async (id, data) => {
    const existing = await equipmentRepository.findById(id);
    if (!existing) throw new Error("Equipment not found");

    // Update thông tin chính
    const updated = await equipmentRepository.update(id, {
      ...existing,
      ...data,
      updated_at: new Date().toISOString(),
    });

    // Nếu có attributes → reset toàn bộ
    if (Array.isArray(data.attributes)) {
      // Xóa toàn bộ attribute cũ
      await attributeValueRepository.deleteAllByEquipmentId(id);

      // Thêm lại toàn bộ attribute mới
      for (const av of data.attributes) {
        if (!av.attribute_id || !av.value) {
          throw new Error("Each attribute must include attribute_id and value");
        }

        const attr = await attributeRepository.findById(av.attribute_id);
        if (!attr) {
          throw new Error(
            `Attribute with id ${av.attribute_id} does not exist`
          );
        }

        await attributeValueRepository.create({
          equipment_id: id,
          attribute_id: av.attribute_id,
          value: av.value,
        });
      }
    }

    // Load lại attribute để trả về
    const attrValues = await attributeValueRepository.findByEquipmentId(id);
    const attrs = [];
    for (const av of attrValues) {
      const attr = await attributeRepository.findById(av.attribute_id);
      attrs.push({
        attribute: attr ? attr.name : av.attribute_id,
        value: av.value,
      });
    }

    return {
      ...updated,
      attributes: attrs,
    };
  },

  deleteEquipment: async (id) => {
    const existing = await equipmentRepository.findById(id);
    if (!existing) throw new Error("Equipment not found");
    return await equipmentRepository.delete(id);
  },
};

module.exports = equipmentService;
