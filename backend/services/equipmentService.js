const equipmentRepository = require("../repositories/equipmentRepository");
const vendorRepository = require("../repositories/vendorRepository");
const categoryTypeRepository = require("../repositories/categoryTypeRepository");
const categoryMainRepository = require("../repositories/categoryMainRepository");
const attributeValueRepository = require("../repositories/attributeValueRepository");
const attributeRepository = require("../repositories/attributeRepository");

const equipmentService = {
  createEquipment: async (data) => {
    // 1. Validate bắt buộc
    if (!data.name || !data.vendor_id || !data.category_type_id) {
      throw new Error(
        "Equipment name, vendor_id, category_type_id are required"
      );
    }

    // 2. Check vendor
    const vendor = await vendorRepository.findById(data.vendor_id);
    if (!vendor) {
      throw new Error(`Vendor with id ${data.vendor_id} does not exist`);
    }

    // 3. Check category_type
    const categoryType = await categoryTypeRepository.findById(
      data.category_type_id
    );
    if (!categoryType) {
      throw new Error(
        `CategoryType with id ${data.category_type_id} does not exist`
      );
    }

    // 4. Generate id
    const category_main_id = categoryType.category_main_id;
    const equipmentId = `${category_main_id}${data.category_type_id}${data.vendor_id}`;
    data.id = equipmentId;

    // 5. Check duplicate
    const existing = await equipmentRepository.findById(equipmentId);
    if (existing) {
      throw new Error(`Equipment with id ${equipmentId} already exists`);
    }

    // 6. Create Equipment
    const newEquipment = {
      ...data,
      id: equipmentId,
    };
    await equipmentRepository.create(newEquipment);

    // 7. Nếu có attributes thì lưu AttributeValue
    if (Array.isArray(data.attributes)) {
      for (const av of data.attributes) {
        if (!av.attribute_id || !av.value) {
          throw new Error("Each attribute must include attribute_id and value");
        }

        // check attribute tồn tại
        const attr = await attributeRepository.findById(av.attribute_id);
        if (!attr) {
          throw new Error(
            `Attribute with id ${av.attribute_id} does not exist`
          );
        }

        await attributeValueRepository.create({
          equipment_id: equipmentId,
          attribute_id: av.attribute_id,
          value: av.value,
        });
      }
    }

    // 8. Load lại attributes với tên
    const attrValues = await attributeValueRepository.findByEquipmentId(
      equipmentId
    );
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

    // lấy thêm attribute values cho từng equipment
    const result = [];
    for (const eq of equipments) {
      const attrValues = await attributeValueRepository.findByEquipmentId(
        eq.id
      );

      // map sang {attributeName: value}
      const attrs = [];
      for (const av of attrValues) {
        const attr = await attributeRepository.findById(av.attribute_id);
        attrs.push({
          attribute: attr ? attr.name : av.attribute_id,
          value: av.value,
        });
      }

      result.push({
        ...eq,
        attributes: attrs,
      });
    }

    return result;
  },

  getEquipmentById: async (id) => {
    const equipment = await equipmentRepository.findById(id);
    if (!equipment) throw new Error("Equipment not found");

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
      attributes: attrs,
    };
  },

  getEquipmentsByCategoryTypeId: async (category_type_id) => {
    const equipments = await equipmentRepository.findByCategoryTypeId(category_type_id);
    return Promise.all(
      equipments.map(async (eq) => {
        const attrValues = await attributeValueRepository.findByEquipmentId(eq.id);
        const attrs = await Promise.all(
          attrValues.map(async (av) => {
            const attr = await attributeRepository.findById(av.attribute_id);
            return { attribute: attr ? attr.name : av.attribute_id, value: av.value };
          })
        );
        return { ...eq, attributes: attrs };
      })
    );
  },

  getEquipmentsByVendorId: async (vendor_id) => {
    const equipments = await equipmentRepository.findByVendorId(vendor_id);
    return Promise.all(
      equipments.map(async (eq) => {
        const attrValues = await attributeValueRepository.findByEquipmentId(eq.id);
        const attrs = await Promise.all(
          attrValues.map(async (av) => {
            const attr = await attributeRepository.findById(av.attribute_id);
            return { attribute: attr ? attr.name : av.attribute_id, value: av.value };
          })
        );
        return { ...eq, attributes: attrs };
      })
    );
  },

  updateEquipment: async (id, data) => {
    const existing = await equipmentRepository.findById(id);
    if (!existing) throw new Error("Equipment not found");
    return await equipmentRepository.update(id, data);
  },

  deleteEquipment: async (id) => {
    const existing = await equipmentRepository.findById(id);
    if (!existing) throw new Error("Equipment not found");
    return await equipmentRepository.delete(id);
  },
};

module.exports = equipmentService;
