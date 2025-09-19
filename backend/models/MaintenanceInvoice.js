const {
  PutCommand,
  ScanCommand,
  GetCommand,
} = require("@aws-sdk/lib-dynamodb");
const { dynamodb } = require("../utils/aws-helper");
const { v4: uuidv4 } = require("uuid");

const tableName = "Maintenance_invoice";

const MaintenanceInvoiceModel = {
  create: async (maintenance_id, cost) => {
    const item = {
      id: uuidv4(),
      maintenance_id,
      cost,
      created_at: new Date().toISOString(),
    };

    await dynamodb.send(
      new PutCommand({
        TableName: tableName,
        Item: item,
      })
    );

    return item;
  },

  getAll: async () => {
    const result = await dynamodb.send(new ScanCommand({ TableName: tableName }));
    return result.Items || [];
  },

  getByMaintenanceId: async (maintenance_id) => {
    const result = await dynamodb.send(
      new GetCommand({
        TableName: tableName,
        Key: { maintenance_id },
      })
    );
    return result.Item;
  },
};

module.exports = MaintenanceInvoiceModel;
