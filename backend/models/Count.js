const {
  PutCommand,
  ScanCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const { dynamodb } = require("../utils/aws-helper");

const tableName = "Count";

const CountModel = {
  // CREATE (nếu equipment_id chưa có thì tạo mới với count = 0)
  createCount: async (equipment_id) => {
    const item = {
      id: equipment_id,   // trùng equipment_id
      count: 0,
    };

    await dynamodb.send(
      new PutCommand({
        TableName: tableName,
        Item: item,
        ConditionExpression: "attribute_not_exists(id)", // tránh overwrite
      })
    );

    return item;
  },

  // READ ALL
  getCounts: async () => {
    const result = await dynamodb.send(
      new ScanCommand({ TableName: tableName })
    );
    return result.Items || [];
  },

  // READ ONE
  getCountById: async (id) => {
    const result = await dynamodb.send(
      new GetCommand({
        TableName: tableName,
        Key: { id },
      })
    );
    return result.Item;
  },

  // UPDATE (tăng count)
  incrementCount: async (id, step = 1) => {
    const result = await dynamodb.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { id },
        UpdateExpression: "SET #c = if_not_exists(#c, :zero) + :step",
        ExpressionAttributeNames: {
          "#c": "count",
        },
        ExpressionAttributeValues: {
          ":step": step,
          ":zero": 0,
        },
        ReturnValues: "ALL_NEW",
      })
    );
    return result.Attributes;
  },

  // DELETE
  deleteCount: async (id) => {
    await dynamodb.send(
      new DeleteCommand({
        TableName: tableName,
        Key: { id },
      })
    );
    return { id };
  },
};

module.exports = CountModel;
