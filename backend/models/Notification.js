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
      receiver_role: data.receiver_role,
      receiver_id: data.receiver_id || null,
      created_by: data.created_by,
      status: "unread",
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

  // UPDATE (mark as read)
  markAsRead: async (id) => {
    const result = await dynamodb.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { id },
        UpdateExpression: "set #s = :status",
        ExpressionAttributeNames: {
          "#s": "status",
        },
        ExpressionAttributeValues: {
          ":status": "read",
        },
        ReturnValues: "ALL_NEW",
      })
    );
    return result.Attributes;
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
