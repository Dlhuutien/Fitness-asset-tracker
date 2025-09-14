const equipmentRepository = require("../repositories/equipmentRepository");
const vendorRepository = require("../repositories/vendorRepository");
const categoryTypeRepository = require("../repositories/categoryTypeRepository");
const categoryMainRepository = require("../repositories/categoryMainRepository");

const equipmentService = {
  createEquipment: async (data) => {
    // Kiểm tra các trường bắt buộc
    if (!data.name || !data.vendor_id || !data.category_type_id) {
      throw new Error("Equipment name, vendor_id, category_type_id are required");
    }

    // Kiểm tra vendor tồn tại
    const vendor = await vendorRepository.findById(data.vendor_id);
    if (!vendor) {
      throw new Error(`Vendor with id ${data.vendor_id} does not exist`);
    }

    // Kiểm tra category_type tồn tại
    const categoryType = await categoryTypeRepository.findById(data.category_type_id);
    if (!categoryType) {
      throw new Error(
        `CategoryType with id ${data.category_type_id} does not exist`
      );
    }

    // 2. Tạo id tự động: main + type + vendor
    const category_main_id = categoryType.category_main_id;
    const equipmentId = `${category_main_id}${data.category_type_id}${data.vendor_id}`;
    data.id = equipmentId;
    
    // Kiểm tra tồn tại thiết bị với id này (đặt ở đây sau khi tạo id)
    const existing = await equipmentRepository.findById(equipmentId);
    if (existing) {
      throw new Error(`Equipment with id ${equipmentId} already exists`);
    }

    // 3. Tạo Equipment
    const newEquipment = {
      ...data,
      id: equipmentId,
    };

    // Tạo mới equipment
    return await equipmentRepository.create(newEquipment);
  },

  getEquipments: async () => await equipmentRepository.findAll(),

  getEquipmentById: async (id) => {
    const equipment = await equipmentRepository.findById(id);
    if (!equipment) throw new Error("Equipment not found");
    return equipment;
  },

  getEquipmentsByCategoryTypeId: async (category_type_id) => {
    const result = await dynamodb.send(
      new QueryCommand({
        TableName: EquipmentModel.tableName,
        IndexName: "category_type_id-index",
        KeyConditionExpression: "category_type_id = :id",
        ExpressionAttributeValues: {
          ":id": category_type_id,
        },
      })
    );
    return result.Items || [];
  },

  getEquipmentsByVendorId: async (vendor_id) => {
    const result = await dynamodb.send(
      new QueryCommand({
        TableName: EquipmentModel.tableName,
        IndexName: "vendor_id-index",
        KeyConditionExpression: "vendor_id = :id",
        ExpressionAttributeValues: {
          ":id": vendor_id,
        },
      })
    );
    return result.Items || [];
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
