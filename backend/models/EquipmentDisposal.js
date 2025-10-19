const {
  PutCommand,
  GetCommand,
  ScanCommand,
  QueryCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");
const { dynamodb } = require("../utils/aws-helper");
const { v4: uuidv4 } = require("uuid");

const tableName = "Equipment_disposal";

const EquipmentDisposalModel = {
  create: async (data) => {
    const item = {
      id: uuidv4(),
      user_id: data.user_id,
      branch_id: data.branch_id,
      total_value: 0,
      note: data.note || null,
      created_at: new Date().toISOString(),
    };
    await dynamodb.send(new PutCommand({ TableName: tableName, Item: item }));
    return item;
  },

  getAll: async () => {
    const res = await dynamodb.send(new ScanCommand({ TableName: tableName }));
    return res.Items || [];
  },

  updateTotal: async (id, total_value) => {
    const result = await dynamodb.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { id },
        UpdateExpression: "set #t = :t",
        ExpressionAttributeNames: { "#t": "total_value" },
        ExpressionAttributeValues: { ":t": total_value },
        ReturnValues: "ALL_NEW",
      })
    );
    return result.Attributes;
  },

  getByBranch: async (branch_id) => {
    const res = await dynamodb.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: "branch_id-index",
        KeyConditionExpression: "branch_id = :b",
        ExpressionAttributeValues: { ":b": branch_id },
      })
    );
    return res.Items || [];
  },

  getById: async (id) => {
    const res = await dynamodb.send(
      new GetCommand({ TableName: tableName, Key: { id } })
    );
    return res.Item;
  },
};

module.exports = EquipmentDisposalModel;
