const {
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  BatchGetCommand,
} = require("@aws-sdk/lib-dynamodb");
const { dynamodb } = require("../utils/aws-helper");

const tableName = "Equipment_unit";

const EquipmentUnitModel = {
  createUnit: async (data) => {
    await dynamodb.send(
      new PutCommand({
        TableName: tableName,
        Item: data,
      })
    );
    return data;
  },

  // Query theo chi nhánh (GSI)
  getByBranchId: async (branch_id) => {
    const result = await dynamodb.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: "branch_id-index",
        KeyConditionExpression: "branch_id = :b",
        ExpressionAttributeValues: {
          ":b": branch_id,
        },
      })
    );
    return result.Items || [];
  },

  getUnitById: async (id) => {
    const result = await dynamodb.send(
      new GetCommand({
        TableName: tableName,
        Key: { id },
      })
    );
    return result.Item;
  },

  getAllUnits: async () => {
    const result = await dynamodb.send(
      new ScanCommand({ TableName: tableName })
    );
    return result.Items || [];
  },

  getByEquipmentId: async (equipment_id) => {
    const result = await dynamodb.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: "equipment_id-index",
        KeyConditionExpression: "equipment_id = :eid",
        ExpressionAttributeValues: {
          ":eid": equipment_id,
        },
      })
    );
    return result.Items || [];
  },

  // ⚡️ BATCH GET NHIỀU UNIT CÙNG LÚC (tối đa 100/lần)
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

  updateUnit: async (id, data) => {
    const allowedFields = ["branch_id", "status", "description"];
    const updateExp = [];
    const expAttrNames = {};
    const expAttrValues = {};

    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        const placeholder = `#${key}`;
        const valueKey = `:${key}`;
        updateExp.push(`${placeholder} = ${valueKey}`);
        expAttrNames[placeholder] = key;
        expAttrValues[valueKey] = data[key];
      }
    }

    if (updateExp.length === 0) {
      throw new Error(
        "No valid fields to update (only branch_id, status, description allowed)"
      );
    }

    // luôn update updated_at
    updateExp.push("#updated_at = :updatedAt");
    expAttrNames["#updated_at"] = "updated_at";
    expAttrValues[":updatedAt"] = new Date().toISOString();

    const result = await dynamodb.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { id },
        UpdateExpression: "set " + updateExp.join(", "),
        ExpressionAttributeNames: expAttrNames,
        ExpressionAttributeValues: expAttrValues,
        ReturnValues: "ALL_NEW",
      })
    );

    return result.Attributes;
  },

  deleteUnit: async (id) => {
    await dynamodb.send(
      new DeleteCommand({
        TableName: tableName,
        Key: { id },
      })
    );
    return { id };
  },
};

module.exports = EquipmentUnitModel;
