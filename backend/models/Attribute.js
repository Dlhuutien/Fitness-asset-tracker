const {
  PutCommand,
  ScanCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const { dynamodb } = require("../utils/aws-helper");
const { v4: uuidv4 } = require("uuid");

const tableName = "Attribute";

const AttributeModel = {
  // CREATE
  createAttribute: async (data) => {
    const item = {
      id: uuidv4(),
      name: data.name,
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
  getAttributes: async () => {
    const result = await dynamodb.send(new ScanCommand({ TableName: tableName }));
    return result.Items || [];
  },

  // READ ONE
  getOneAttribute: async (id) => {
    const result = await dynamodb.send(
      new GetCommand({
        TableName: tableName,
        Key: { id },
      })
    );
    return result.Item;
  },

  // UPDATE
  updateAttribute: async (id, data) => {
    const result = await dynamodb.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { id },
        UpdateExpression: "set #n = :name",
        ExpressionAttributeNames: {
          "#n": "name",
        },
        ExpressionAttributeValues: {
          ":name": data.name,
        },
        ReturnValues: "ALL_NEW",
      })
    );
    return result.Attributes;
  },

  // DELETE
  deleteAttribute: async (id) => {
    await dynamodb.send(
      new DeleteCommand({
        TableName: tableName,
        Key: { id },
      })
    );
    return { id };
  },
};

module.exports = AttributeModel;
