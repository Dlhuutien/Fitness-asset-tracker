const {
  PutCommand,
  ScanCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const { dynamodb } = require("../utils/aws-helper");

const tableName = "Notification";

const NotificationModel = {
  // CREATE
  createNotification: async (data) => {
    const item = {
      id: data.id || crypto.randomUUID(),
      type: data.type,
      title: data.title,
      message: data.message,
      receiver_role: Array.isArray(data.receiver_role) ? data.receiver_role : [data.receiver_role],
      receiver_id: Array.isArray(data.receiver_id) ? data.receiver_id : [data.receiver_id],
      created_by: data.created_by,
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

  // READ ALL
  getNotifications: async () => {
    const result = await dynamodb.send(new ScanCommand({ TableName: tableName }));
    return result.Items || [];
  },

  // READ ONE
  getNotificationById: async (id) => {
    const result = await dynamodb.send(
      new GetCommand({
        TableName: tableName,
        Key: { id },
      })
    );
    return result.Item;
  },

  // DELETE
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
