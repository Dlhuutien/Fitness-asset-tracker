const {
  PutCommand,
  ScanCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");
const { dynamodb } = require("../utils/aws-helper");
const { v4: uuidv4 } = require("uuid");

const tableName = "Equipment_transfer";

const EquipmentTransferModel = {
  // CREATE
  createTransfer: async (data) => {
    const item = {
      id: uuidv4(),
      from_branch_id: data.from_branch_id,
      to_branch_id: data.to_branch_id,
      branch_index_key: `${data.from_branch_id}#${data.to_branch_id}`,
      approved_by: data.approved_by,
      receiver_id: null,
      description: data.description,
      status: "Pending",
      move_start_date: data.move_start_date || new Date().toISOString(),
      move_receive_date: null,
    };

    await dynamodb.send(
      new PutCommand({
        TableName: tableName,
        Item: item,
      })
    );

    return item;
  },

  getTransfersByBranch: async (branch_id) => {
    const result = await dynamodb.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression: "from_branch_id = :b OR to_branch_id = :b",
        ExpressionAttributeValues: {
          ":b": branch_id,
        },
      })
    );
    return result.Items || [];
  },

  // READ ALL
  getTransfers: async () => {
    const result = await dynamodb.send(
      new ScanCommand({ TableName: tableName })
    );
    return result.Items || [];
  },

  // READ ALL by STATUS
  getTransfersByStatus: async (status) => {
    const params = {
      TableName: tableName,
      FilterExpression: "#s = :statusVal",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: { ":statusVal": status },
    };

    const result = await dynamodb.send(new ScanCommand(params));
    return result.Items || [];
  },

  // READ ONE
  getOneTransfer: async (id) => {
    const result = await dynamodb.send(
      new GetCommand({
        TableName: tableName,
        Key: { id },
      })
    );
    return result.Item;
  },

  // COMPLETE TRANSFER (only update receive date + status)
  completeTransfer: async (id, move_receive_date, receiver_id) => {
    const result = await dynamodb.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { id },
        UpdateExpression: "set #r = :receive, #s = :status, #recv = :receiver",
        ExpressionAttributeNames: {
          "#r": "move_receive_date",
          "#s": "status",
          "#recv": "receiver_id",
        },
        ExpressionAttributeValues: {
          ":receive": move_receive_date || new Date().toISOString(),
          ":status": "Completed",
          ":receiver": receiver_id,
        },
        ReturnValues: "ALL_NEW",
      })
    );
    return result.Attributes;
  },

  cancelTransfer: async (id, description_cancelled, receiverId) => {
    const result = await dynamodb.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { id },
        UpdateExpression:
          "set #s = :status, #dc = :desc_cancel, #cancel_at = :cancelAt, #recv = :receiver",
        ExpressionAttributeNames: {
          "#s": "status",
          "#dc": "description_cancelled",
          "#cancel_at": "cancel_requested_at",
          "#recv": "receiver_id",
        },
        ExpressionAttributeValues: {
          ":status": "CancelRequested",
          ":desc_cancel": description_cancelled || null,
          ":cancelAt": new Date().toISOString(),
          ":receiver": receiverId,
        },
        ReturnValues: "ALL_NEW",
      })
    );

    return result.Attributes;
  },

  confirmCancelTransfer: async (id, userSub) => {
    const result = await dynamodb.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { id },
        UpdateExpression:
          "set #s = :status, #cancelBy = :cancelBy, #cancelAt = :cancelAt",
        ExpressionAttributeNames: {
          "#s": "status",
          "#cancelBy": "cancelled_by",
          "#cancelAt": "cancelled_at",
        },
        ExpressionAttributeValues: {
          ":status": "Cancelled",
          ":cancelBy": userSub,
          ":cancelAt": new Date().toISOString(),
        },
        ReturnValues: "ALL_NEW",
      })
    );

    return result.Attributes;
  },

  // DELETE
  deleteTransfer: async (id) => {
    await dynamodb.send(
      new DeleteCommand({
        TableName: tableName,
        Key: { id },
      })
    );
    return { id };
  },
};

module.exports = EquipmentTransferModel;
