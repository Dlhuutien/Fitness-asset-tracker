const {
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");
const { dynamodb } = require("../utils/aws-helper");

const tableName = "Equipment_unit";

const EquipmentUnitModel = {
  createUnit: async (data) => {
    await dynamodb.send(new PutCommand({
      TableName: tableName,
      Item: data,
    }));
    return data;
  },

  getUnitById: async (id) => {
    const result = await dynamodb.send(new GetCommand({
      TableName: tableName,
      Key: { id },
    }));
    return result.Item;
  },

  getAllUnits: async () => {
    const result = await dynamodb.send(new ScanCommand({ TableName: tableName }));
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

  updateUnit: async (id, data) => {
    const result = await dynamodb.send(new UpdateCommand({
      TableName: tableName,
      Key: { id },
      UpdateExpression: "set #s = :status, #u = :updatedAt",
      ExpressionAttributeNames: {
        "#s": "status",
        "#u": "updated_at",
      },
      ExpressionAttributeValues: {
        ":status": data.status,
        ":updatedAt": new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW",
    }));
    return result.Attributes;
  },

  deleteUnit: async (id) => {
    await dynamodb.send(new DeleteCommand({
      TableName: tableName,
      Key: { id },
    }));
    return { id };
  },
};

module.exports = EquipmentUnitModel;
