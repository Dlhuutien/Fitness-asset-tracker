const { 
  PutCommand, 
  ScanCommand, 
  GetCommand, 
  UpdateCommand, 
  DeleteCommand, 
} = require("@aws-sdk/lib-dynamodb");
const { dynamodb } = require("../utils/aws-helper");

const tableName = "Branch";

const BranchModel = {
  // CREATE
  createBranch: async (data) => {
    const item = {
      id: data.id,
      name: data.name,
      address: data.address,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await dynamodb.send(new PutCommand({
      TableName: tableName,
      Item: item,
    }));

    return item;
  },

  // READ ALL
  getBranches: async () => {
    const result = await dynamodb.send(new ScanCommand({ TableName: tableName }));
    return result.Items || [];
  },

  // READ ONE
  getOneBranch: async (id) => {
    const result = await dynamodb.send(new GetCommand({
      TableName: tableName,
      Key: { id },
    }));
    return result.Item;
  },

  // UPDATE
  updateBranch: async (id, data) => {
    const result = await dynamodb.send(new UpdateCommand({
      TableName: tableName,
      Key: { id },
      UpdateExpression: "set #n = :name, #a = :address, #u = :updatedAt",
      ExpressionAttributeNames: {
        "#n": "name",
        "#a": "address",
        "#u": "updated_at",
      },
      ExpressionAttributeValues: {
        ":name": data.name,
        ":address": data.address,
        ":updatedAt": new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW",
    }));
    return result.Attributes;
  },

  // DELETE
  deleteBranch: async (id) => {
    await dynamodb.send(new DeleteCommand({
      TableName: tableName,
      Key: { id },
    }));
    return { id };
  },
};

module.exports = BranchModel;
