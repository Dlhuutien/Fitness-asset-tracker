const {
  PutCommand,
  ScanCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");
const { dynamodb } = require("../utils/aws-helper");
const { v4: uuidv4 } = require("uuid");

const tableName = "Attribute_value";

const AttributeValueModel = {
  // CREATE
  createAttributeValue: async (data) => {
    const item = {
      id: uuidv4(),
      equipment_id: data.equipment_id,
      attribute_id: data.attribute_id,
      value: data.value,
    };

    await dynamodb.send(
      new PutCommand({
        TableName: tableName,
        Item: item,
      })
    );

    return item;
  },

  // READ ALL
  getAttributeValues: async () => {
    const result = await dynamodb.send(
      new ScanCommand({ TableName: tableName })
    );
    return result.Items || [];
  },

  // READ ONE
  getOneAttributeValue: async (id) => {
    const result = await dynamodb.send(
      new GetCommand({
        TableName: tableName,
        Key: { id },
      })
    );
    return result.Item;
  },

  // READ ALL BY equipment_id
  getAttributeValuesByEquipmentId: async (equipment_id) => {
    const result = await dynamodb.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: "equipment_id-index",
        KeyConditionExpression: "equipment_id = :id",
        ExpressionAttributeValues: {
          ":id": equipment_id,
        },
      })
    );
    return result.Items || [];
  },

  // READ ALL BY attribute_id
  getAttributeValuesByAttributeId: async (attribute_id) => {
    const result = await dynamodb.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: "attribute_id-index",
        KeyConditionExpression: "attribute_id = :id",
        ExpressionAttributeValues: {
          ":id": attribute_id,
        },
      })
    );
    return result.Items || [];
  },

  // UPDATE
  updateAttributeValue: async (id, data) => {
    const result = await dynamodb.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { id },
        UpdateExpression: "set #val = :val, #attr = :aid, #eq = :eid",
        ExpressionAttributeNames: {
          "#val": "value",
          "#attr": "attribute_id",
          "#eq": "equipment_id",
        },
        ExpressionAttributeValues: {
          ":val": data.value,
          ":aid": data.attribute_id,
          ":eid": data.equipment_id,
        },
        ReturnValues: "ALL_NEW",
      })
    );
    return result.Attributes;
  },

  // DELETE
  deleteAttributeValue: async (id) => {
    await dynamodb.send(
      new DeleteCommand({
        TableName: tableName,
        Key: { id },
      })
    );
    return { id };
  },

  // DELETE ALL BY equipment_id
  deleteAllByEquipmentId: async (equipment_id) => {
    // Lấy toàn bộ attribute value thuộc thiết bị
    const result = await dynamodb.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: "equipment_id-index",
        KeyConditionExpression: "equipment_id = :eid",
        ExpressionAttributeValues: { ":eid": equipment_id },
      })
    );

    // Xóa từng record
    if (result.Items && result.Items.length > 0) {
      for (const item of result.Items) {
        await dynamodb.send(
          new DeleteCommand({
            TableName: tableName,
            Key: { id: item.id },
          })
        );
      }
    }
    return { deleted: result.Items?.length || 0 };
  },

  // DELETE ONE BY equipment_id + attribute_id (optional, dùng sau này)
  deleteByEquipmentAndAttribute: async (equipment_id, attribute_id) => {
    // Truy vấn tìm attr cụ thể
    const result = await dynamodb.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: "equipment_id-index",
        KeyConditionExpression: "equipment_id = :eid",
        ExpressionAttributeValues: { ":eid": equipment_id },
      })
    );

    if (result.Items && result.Items.length > 0) {
      const target = result.Items.find(
        (item) => item.attribute_id === attribute_id
      );
      if (target) {
        await dynamodb.send(
          new DeleteCommand({
            TableName: tableName,
            Key: { id: target.id },
          })
        );
        return { deleted: target.id };
      }
    }
    return { deleted: null };
  },
};

module.exports = AttributeValueModel;
