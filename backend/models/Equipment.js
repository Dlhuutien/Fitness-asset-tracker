const {
  PutCommand,
  ScanCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  BatchGetCommand,
} = require("@aws-sdk/lib-dynamodb");
const { dynamodb } = require("../utils/aws-helper");

const tableName = "Equipment";

const EquipmentModel = {
  tableName: tableName,

  // CREATE
  createEquipment: async (equipmentData) => {
    const item = {
      id: equipmentData.id,
      category_type_id: equipmentData.category_type_id,
      category_main_id: equipmentData.category_main_id,
      name: equipmentData.name,
      image: equipmentData.image || null,
      description: equipmentData.description,
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
    const res = await dynamodb.send(
      new GetCommand({ TableName: tableName, Key: { id } })
    );
    return res.Item;
  },

  // READ ALL
  getEquipments: async () => {
    try {
      const res = await dynamodb.send(
        new ScanCommand({ TableName: tableName })
      );
      return res.Items || [];
    } catch (error) {
      console.error("Error getting equipments:", error);
      throw error;
    }
  },

  getOneEquipment: async (id) => {
    try {
      const res = await dynamodb.send(
        new GetCommand({ TableName: tableName, Key: { id } })
      );
      return res.Item;
    } catch (error) {
      console.error("Error getting equipment:", error);
      throw error;
    }
  },

  // LẤY DANH SÁCH ID
  getAllIds: async () => {
    try {
      const res = await dynamodb.send(
        new ScanCommand({
          TableName: tableName,
          ProjectionExpression: "id", // chỉ lấy cột id
        })
      );
      return (res.Items || []).map((item) => item.id);
    } catch (error) {
      console.error("Error getting equipment IDs:", error);
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

  // ⚡️ BATCH GET NHIỀU EQUIPMENT CÙNG LÚC (tối đa 100 mỗi batch)
  batchFindByIds: async (ids = []) => {
    if (!ids.length) return [];

    const chunkSize = 100; // DynamoDB BatchGet giới hạn 100 item/lần
    const chunks = [];
    for (let i = 0; i < ids.length; i += chunkSize) {
      chunks.push(ids.slice(i, i + chunkSize));
    }

    const results = [];
    for (const batch of chunks) {
      const res = await dynamodb.send(
        new BatchGetCommand({
          RequestItems: {
            [tableName]: {
              Keys: batch.map((id) => ({ id })),
            },
          },
        })
      );
      const items = res.Responses?.[tableName] || [];
      results.push(...items);
    }

    return results;
  },

  // UPDATE
  updateEquipment: async (id, equipmentData) => {
    try {
      // ✅ Xử lý trước: nếu category_type_id rỗng -> bỏ qua không update
      const cleanData = { ...equipmentData };
      if (!cleanData.category_type_id) delete cleanData.category_type_id;
      const res = await dynamodb.send(
        new UpdateCommand({
          TableName: tableName,
          Key: { id },
          UpdateExpression: `set 
          ${
            cleanData.category_type_id
              ? "category_type_id = :category_type_id,"
              : ""
          }
          #n = :name,
          image = :image,
          description = :description,
          updated_at = :updatedAt`,
          ExpressionAttributeNames: { "#n": "name" },
          ExpressionAttributeValues: {
            ...(cleanData.category_type_id && {
              ":category_type_id": cleanData.category_type_id,
            }),
            ":name": cleanData.name,
            ":image": cleanData.image,
            ":description": cleanData.description,
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
      await dynamodb.send(
        new DeleteCommand({ TableName: tableName, Key: { id } })
      );
      return { id };
    } catch (error) {
      console.error("Error deleting equipment:", error);
      throw error;
    }
  },
};

module.exports = EquipmentModel;
