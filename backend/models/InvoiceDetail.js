const {
  PutCommand,
  GetCommand,
  ScanCommand,
  DeleteCommand,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");
const { dynamodb } = require("../utils/aws-helper");
const { v4: uuidv4 } = require("uuid");

const tableName = "Invoices_detail";

const InvoiceDetailModel = {
  createDetail: async (data) => {
    const item = {
      id: uuidv4(),
      invoice_id: data.invoice_id,
      equipment_unit_id: data.equipment_unit_id,
      cost: data.cost,
      created_at: new Date().toISOString(),
    };
    await dynamodb.send(new PutCommand({
      TableName: tableName,
      Item: item,
    }));
    return item;
  },

  getByInvoiceId: async (invoice_id) => {
    const result = await dynamodb.send(new QueryCommand({
      TableName: tableName,
      IndexName: "invoice_id-index",
      KeyConditionExpression: "invoice_id = :id",
      ExpressionAttributeValues: {
        ":id": invoice_id,
      },
    }));
    return result.Items || [];
  },

  getDetailById: async (id) => {
    const result = await dynamodb.send(new GetCommand({
      TableName: tableName,
      Key: { id },
    }));
    return result.Item;
  },

  deleteDetail: async (id) => {
    await dynamodb.send(new DeleteCommand({
      TableName: tableName,
      Key: { id },
    }));
    return { id };
  },
};

module.exports = InvoiceDetailModel;
