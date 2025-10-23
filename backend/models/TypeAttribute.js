const {
  PutCommand,
  ScanCommand,
  GetCommand,
  DeleteCommand,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");
const { dynamodb } = require("../utils/aws-helper");
const { v4: uuidv4 } = require("uuid");

const tableName = "Type_attribute";

const TypeAttributeModel = {
  // ✅ Tạo mới
  create: async (data) => {
    const item = {
      id: uuidv4(),
      category_type_id: data.category_type_id,
      attribute_id: data.attribute_id,
      created_at: new Date().toISOString(),
    };

    await dynamodb.send(
      new PutCommand({
        TableName: tableName,
        Item: item,
      })
    );

    return item;
  },

  // ✅ Lấy toàn bộ
  getAll: async () => {
    const result = await dynamodb.send(new ScanCommand({ TableName: tableName }));
    return result.Items || [];
  },

  // ✅ Lấy theo id
  getById: async (id) => {
    const result = await dynamodb.send(
      new GetCommand({
        TableName: tableName,
        Key: { id },
      })
    );
    return result.Item;
  },

  // ✅ Lấy toàn bộ attributes theo type
  getAttributesByTypeId: async (category_type_id) => {
    const result = await dynamodb.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: "category_type_id-index",
        KeyConditionExpression: "category_type_id = :tid",
        ExpressionAttributeValues: {
          ":tid": category_type_id,
        },
      })
    );
    return result.Items || [];
  },

  // ✅ Lấy toàn bộ types có attribute cụ thể
  getTypesByAttributeId: async (attribute_id) => {
    const result = await dynamodb.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: "attribute_id-index",
        KeyConditionExpression: "attribute_id = :aid",
        ExpressionAttributeValues: {
          ":aid": attribute_id,
        },
      })
    );
    return result.Items || [];
  },

  // ✅ Xóa theo id
  delete: async (id) => {
    await dynamodb.send(
      new DeleteCommand({
        TableName: tableName,
        Key: { id },
      })
    );
    return { id };
  },

  // ✅ Xóa tất cả theo type_id
  deleteByTypeId: async (category_type_id) => {
    const items = await TypeAttributeModel.getAttributesByTypeId(category_type_id);
    for (const item of items) {
      await dynamodb.send(
        new DeleteCommand({
          TableName: tableName,
          Key: { id: item.id },
        })
      );
    }
    return { deleted: items.length };
  },

  // ✅ Tìm cặp type + attribute (check trùng)
  findOne: async (category_type_id, attribute_id) => {
    const result = await dynamodb.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: "category_type_id-index",
        KeyConditionExpression: "category_type_id = :tid",
        ExpressionAttributeValues: { ":tid": category_type_id },
      })
    );

    return (
      result.Items?.find((i) => i.attribute_id === attribute_id) || null
    );
  },
};

module.exports = TypeAttributeModel;
