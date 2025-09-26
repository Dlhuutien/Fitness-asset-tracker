const {
  PutCommand,
  ScanCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");
const { dynamodb } = require("../utils/aws-helper");

const tableName = "Equipment";

const EquipmentModel = {
  tableName: tableName,

  // CREATE
  createEquipment: async (equipmentData) => {
    const item = {
      id: equipmentData.id, // format = main_id + type_id + vendor_id + số thứ tự
      vendor_id: equipmentData.vendor_id,
      category_type_id: equipmentData.category_type_id,
      category_main_id: equipmentData.category_main_id,
      name: equipmentData.name,
      image: equipmentData.image || null,
      description: equipmentData.description,
      warranty_duration: equipmentData.warranty_duration || 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await dynamodb.send(
        new PutCommand({
          TableName: tableName,
          Item: item,
        })
      );
      return item;
    } catch (error) {
      console.error("Error creating equipment:", error);
      throw error;
    }
  },

  // CREATE (generic)
  create: async (data) => {
    await dynamodb.send(new PutCommand({ TableName: tableName, Item: data }));
    return data;
  },

  // READ ONE
  findById: async (id) => {
    const res = await dynamodb.send(new GetCommand({ TableName: tableName, Key: { id } }));
    return res.Item;
  },

  // READ ALL
  getEquipments: async () => {
    try {
      const res = await dynamodb.send(new ScanCommand({ TableName: tableName }));
      return res.Items || [];
    } catch (error) {
      console.error("Error getting equipments:", error);
      throw error;
    }
  },

  getOneEquipment: async (id) => {
    try {
      const res = await dynamodb.send(new GetCommand({ TableName: tableName, Key: { id } }));
      return res.Item;
    } catch (error) {
      console.error("Error getting equipment:", error);
      throw error;
    }
  },

  // FIND BY PREFIX (để tạo id tự động)
  findByPrefix: async (prefix) => {
    const res = await dynamodb.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression: "begins_with(id, :prefix)",
        ExpressionAttributeValues: { ":prefix": prefix },
      })
    );
    return res.Items || [];
  },

  // QUERY theo category_type_id
  getByCategoryTypeId: async (category_type_id) => {
    const res = await dynamodb.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: "category_type_id-index",
        KeyConditionExpression: "category_type_id = :id",
        ExpressionAttributeValues: { ":id": category_type_id },
      })
    );
    return res.Items || [];
  },

  // QUERY theo vendor_id
  getByVendorId: async (vendor_id) => {
    const res = await dynamodb.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: "vendor_id-index",
        KeyConditionExpression: "vendor_id = :id",
        ExpressionAttributeValues: { ":id": vendor_id },
      })
    );
    return res.Items || [];
  },

  // UPDATE
  updateEquipment: async (id, equipmentData) => {
    try {
      const res = await dynamodb.send(
        new UpdateCommand({
          TableName: tableName,
          Key: { id },
          UpdateExpression: `set 
            vendor_id = :vendor_id,
            category_type_id = :category_type_id,
            category_main_id = :category_main_id,
            #n = :name,
            image = :image,
            description = :description,
            warranty_duration = :warranty_duration,
            updated_at = :updatedAt`,
          ExpressionAttributeNames: { "#n": "name" },
          ExpressionAttributeValues: {
            ":vendor_id": equipmentData.vendor_id,
            ":category_type_id": equipmentData.category_type_id,
            ":category_main_id": equipmentData.category_main_id,
            ":name": equipmentData.name,
            ":image": equipmentData.image,
            ":description": equipmentData.description,
            ":warranty_duration": equipmentData.warranty_duration,
            ":updatedAt": new Date().toISOString(),
          },
          ReturnValues: "ALL_NEW",
        })
      );
      return res.Attributes;
    } catch (error) {
      console.error("Error updating equipment:", error);
      throw error;
    }
  },

  // DELETE
  deleteEquipment: async (id) => {
    try {
      await dynamodb.send(new DeleteCommand({ TableName: tableName, Key: { id } }));
      return { id };
    } catch (error) {
      console.error("Error deleting equipment:", error);
      throw error;
    }
  },
};

module.exports = EquipmentModel;
