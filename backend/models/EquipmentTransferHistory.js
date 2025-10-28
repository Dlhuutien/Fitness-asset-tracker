const {
  PutCommand,
  QueryCommand,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");
const { dynamodb } = require("../utils/aws-helper");

const tableName = "Equipment_transfer_history";

const EquipmentTransferHistoryModel = {
  create: async (data) => {
    await dynamodb.send(
      new PutCommand({
        TableName: tableName,
        Item: data,
      })
    );
    return data;
  },

  // Lấy lịch sử theo unit_id
  getByUnitId: async (equipment_unit_id) => {
    const result = await dynamodb.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: "equipment_unit_id-index",
        KeyConditionExpression: "equipment_unit_id = :id",
        ExpressionAttributeValues: { ":id": equipment_unit_id },
      })
    );
    return result.Items || [];
  },

  findByBranch: async (branchId) => {
    const result = await dynamodb.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression: "from_branch_id = :b OR to_branch_id = :b",
        ExpressionAttributeValues: { ":b": branchId },
      })
    );
    return result.Items || [];
  },

  // Nếu muốn admin xem tất cả
  getAll: async () => {
    const result = await dynamodb.send(
      new ScanCommand({ TableName: tableName })
    );
    return result.Items || [];
  },
};

module.exports = EquipmentTransferHistoryModel;
