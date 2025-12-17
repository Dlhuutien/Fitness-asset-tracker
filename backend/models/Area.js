const {
  PutCommand,
  ScanCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const { dynamodb } = require("../utils/aws-helper");
const { v4: uuidv4 } = require("uuid");

const tableName = "Area";

const AreaModel = {
  createArea: async (data) => {
    const item = {
      id: uuidv4(),
      floor_id: data.floor_id,
      name: data.name,
      description: data.description || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await dynamodb.send(
      new PutCommand({
        TableName: tableName,
        Item: item,
      })
    );

    return item;
  },

  getAreas: async () => {
    const result = await dynamodb.send(
      new ScanCommand({ TableName: tableName })
    );
    return result.Items || [];
  },

  getAreaById: async (id) => {
    const result = await dynamodb.send(
      new GetCommand({
        TableName: tableName,
        Key: { id },
      })
    );
    return result.Item;
  },

  updateArea: async (id, data) => {
    const result = await dynamodb.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { id },
        UpdateExpression:
          "set #n = :name, #d = :desc, #u = :updatedAt",
        ExpressionAttributeNames: {
          "#n": "name",
          "#d": "description",
          "#u": "updated_at",
        },
        ExpressionAttributeValues: {
          ":name": data.name,
          ":desc": data.description || "",
          ":updatedAt": new Date().toISOString(),
        },
        ReturnValues: "ALL_NEW",
      })
    );

    return result.Attributes;
  },

  deleteArea: async (id) => {
    await dynamodb.send(
      new DeleteCommand({
        TableName: tableName,
        Key: { id },
      })
    );
    return { id };
  },
};

module.exports = AreaModel;
