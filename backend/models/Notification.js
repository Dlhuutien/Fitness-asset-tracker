const {
  PutCommand,
  ScanCommand,
  GetCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const crypto = require("crypto");
const { dynamodb } = require("../utils/aws-helper");

const tableName = "Notification";

const NotificationModel = {
  // ========================
  // CREATE
  // ========================
  createNotification: async (data) => {
    const item = {
      id: data.id || crypto.randomUUID(),
      type: data.type,
      title: data.title,
      message: data.message,
      receiver_role: Array.isArray(data.receiver_role)
        ? data.receiver_role
        : [data.receiver_role],
      receiver_id: Array.isArray(data.receiver_id)
        ? data.receiver_id
        : [data.receiver_id],
      created_by: data.created_by,
      created_at: new Date().toISOString(),
    };

    // 🎯 Thêm attribute tùy theo type
    switch (data.type) {
      case "invoice":
        if (data.invoice_id) item.invoice_id = data.invoice_id;
        break;

      case "maintenance":
        if (data.maintenance_id) item.maintenance_id = data.maintenance_id;
        if (data.unit_id) item.unit_id = data.unit_id;
        break;

      case "transfer":
        if (data.transfer_id) item.transfer_id = data.transfer_id;
        if (data.unit_id) item.unit_id = data.unit_id;
        break;

      default:
        break;
    }

    await dynamodb.send(
      new PutCommand({
        TableName: tableName,
        Item: item,
      })
    );

    return item;
  },

  // ========================
  // READ ALL
  // ========================
  getNotifications: async () => {
    const result = await dynamodb.send(
      new ScanCommand({ TableName: tableName })
    );
    return result.Items || [];
  },

  // ========================
  // READ ONE
  // ========================
  getNotificationById: async (id) => {
    const result = await dynamodb.send(
      new GetCommand({
        TableName: tableName,
        Key: { id },
      })
    );
    return result.Item;
  },

  // ========================
  // DELETE
  // ========================
  deleteNotification: async (id) => {
    await dynamodb.send(
      new DeleteCommand({
        TableName: tableName,
        Key: { id },
      })
    );
    return { id };
  },
};

module.exports = NotificationModel;
