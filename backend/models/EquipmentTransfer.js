const {
  PutCommand,
  ScanCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const { dynamodb } = require("../utils/aws-helper");
const { v4: uuidv4 } = require("uuid"); 

const tableName = "Equipment_transfer";

const EquipmentTransferModel = {
  // CREATE
  createTransfer: async (data) => {
    const item = {
      id: uuidv4(),
      equipment_unit_id: data.equipment_unit_id,
      from_branch_id: data.from_branch_id,
      to_branch_id: data.to_branch_id,
      approved_by: data.approved_by,
      description: data.description,
      status: "Pending",
      move_start_date: data.move_start_date || new Date().toISOString(),
      move_receive_date: null,
    };

    await dynamodb.send(new PutCommand({
      TableName: tableName,
      Item: item,
    }));

    return item;
  },

  // READ ALL
  getTransfers: async () => {
    const result = await dynamodb.send(new ScanCommand({ TableName: tableName }));
    return result.Items || [];
  },

  // READ ONE
  getOneTransfer: async (id) => {
    const result = await dynamodb.send(new GetCommand({
      TableName: tableName,
      Key: { id },
    }));
    return result.Item;
  },

  // COMPLETE TRANSFER (only update receive date + status)
  completeTransfer: async (id, move_receive_date) => {
    const result = await dynamodb.send(new UpdateCommand({
      TableName: tableName,
      Key: { id },
      UpdateExpression: "set #r = :receive, #s = :status",
      ExpressionAttributeNames: {
        "#r": "move_receive_date",
        "#s": "status",
      },
      ExpressionAttributeValues: {
        ":receive": move_receive_date || new Date().toISOString(),
        ":status": "Completed",
      },
      ReturnValues: "ALL_NEW",
    }));
    return result.Attributes;
  },

  // DELETE
  deleteTransfer: async (id) => {
    await dynamodb.send(new DeleteCommand({
      TableName: tableName,
      Key: { id },
    }));
    return { id };
  },
};

module.exports = EquipmentTransferModel;
