const attributeRepository = require("../repositories/attributeRepository");
const typeAttributeRepository = require("../repositories/typeAttributeRepository");

const typeAttributeService = {
  /**
   * 🧩 Thêm attribute cho một Category Type
   * - Nếu attribute chưa tồn tại => tạo mới trong bảng Attribute
   * - Nếu đã tồn tại nhưng chưa gắn với type => tạo record trong Type_Attribute
   */
  addAttributeToType: async (category_type_id, attribute_id) => {
    if (!attribute_id) throw new Error("attribute_id is required");
    if (!category_type_id) throw new Error("category_type_id is required");

    const allAttrs = await attributeRepository.findAll();
    const attr = allAttrs.find((a) => a.id === attribute_id);

    if (!attr) throw new Error(`Attribute with id ${attribute_id} not found`);

    // Check trùng
    const exists = await typeAttributeRepository.findOne(
      category_type_id,
      attribute_id
    );
    if (exists) throw new Error(`Attribute already linked with this type`);

    const link = await typeAttributeRepository.create({
      category_type_id,
      attribute_id,
    });

    return { ...link, attribute: attr };
  },

  /**
   * 🔍 Lấy tất cả attributes của type
   */
  getAttributesByType: async (category_type_id) => {
    const links = await typeAttributeRepository.findByTypeId(category_type_id);
    const attrIds = links.map((l) => l.attribute_id);

    const allAttrs = await attributeRepository.findAll();
    const filtered = allAttrs.filter((a) => attrIds.includes(a.id));

    return filtered;
  },

  /**
   * ❌ Xoá attribute khỏi type
   */
  removeAttributeFromType: async (category_type_id, attribute_id) => {
    const links = await typeAttributeRepository.findByTypeId(category_type_id);
    const target = links.find((l) => l.attribute_id === attribute_id);
    if (!target)
      throw new Error("This attribute is not linked to the specified type.");

    await typeAttributeRepository.delete(target.id);
    return { deleted: target.id };
  },
};

module.exports = typeAttributeService;
