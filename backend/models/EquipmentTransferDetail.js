const {
  PutCommand,
  GetCommand,
  QueryCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const { dynamodb } = require("../utils/aws-helper");
const { v4: uuidv4 } = require("uuid");

const tableName = "Equipment_transfer_detail";

const EquipmentTransferDetailModel = {
  // CREATE
  createDetail: async (data) => {
    const item = {
      id: uuidv4(),
      transfer_id: data.transfer_id,
      equipment_unit_id: data.equipment_unit_id,
      created_at: new Date().toISOString(),
    };
    await dynamodb.send(new PutCommand({ TableName: tableName, Item: item }));
    return item;
  },

  // Lấy tất cả detail theo transfer_id
  getByTransferId: async (transfer_id) => {
    const result = await dynamodb.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: "transfer_id-index",
        KeyConditionExpression: "transfer_id = :tid",
        ExpressionAttributeValues: { ":tid": transfer_id },
      })
    );
    return result.Items || [];
  },

  // Xóa 1 detail
  deleteDetail: async (id) => {
    await dynamodb.send(
      new DeleteCommand({
        TableName: tableName,
        Key: { id },
      })
    );
    return { id };
  },
};

module.exports = EquipmentTransferDetailModel;
