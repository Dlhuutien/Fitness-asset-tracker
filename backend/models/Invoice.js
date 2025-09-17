const {
  PutCommand,
  ScanCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const { dynamodb } = require("../utils/aws-helper");
const { v4: uuidv4 } = require("uuid");

const tableName = "Invoices";

const InvoiceModel = {
  // CREATE
  createInvoice: async (data) => {
    const item = {
      id: uuidv4(),
      user_id: data.user_id, // từ Cognito sub
      total: data.total,
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
  getInvoices: async () => {
    const result = await dynamodb.send(new ScanCommand({ TableName: tableName }));
    return result.Items || [];
  },

  // READ ONE
  getInvoiceById: async (id) => {
    const result = await dynamodb.send(new GetCommand({
      TableName: tableName,
      Key: { id },
    }));
    return result.Item;
  },

  // UPDATE (chỉ sửa total)
  updateInvoice: async (id, data) => {
    const result = await dynamodb.send(new UpdateCommand({
      TableName: tableName,
      Key: { id },
      UpdateExpression: "set #t = :total, #u = :updatedAt",
      ExpressionAttributeNames: {
        "#t": "total",
        "#u": "updated_at",
      },
      ExpressionAttributeValues: {
        ":total": data.total,
        ":updatedAt": new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW",
    }));
    return result.Attributes;
  },

  // DELETE
  deleteInvoice: async (id) => {
    await dynamodb.send(new DeleteCommand({
      TableName: tableName,
      Key: { id },
    }));
    return { id };
  },
};

module.exports = InvoiceModel;
