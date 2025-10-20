const {
  PutCommand,
  QueryCommand,
  ScanCommand,
  GetCommand,
} = require("@aws-sdk/lib-dynamodb");
const { dynamodb } = require("../utils/aws-helper");
const { v4: uuidv4 } = require("uuid");

const tableName = "Equipment_disposal_detail";

const EquipmentDisposalDetailModel = {
  create: async (data) => {
    const item = {
      id: uuidv4(),
      disposal_id: data.disposal_id,
      equipment_unit_id: data.equipment_unit_id,
      value_recovered: data.value_recovered || 0,
      created_at: new Date().toISOString(),
    };
    await dynamodb.send(new PutCommand({ TableName: tableName, Item: item }));
    return item;
  },

  getAll: async () => {
    const res = await dynamodb.send(new ScanCommand({ TableName: tableName }));
    return res.Items || [];
  },

  getByDisposalId: async (disposal_id) => {
    const res = await dynamodb.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: "disposal_id-index",
        KeyConditionExpression: "disposal_id = :d",
        ExpressionAttributeValues: { ":d": disposal_id },
      })
    );
    return res.Items || [];
  },
};

module.exports = EquipmentDisposalDetailModel;
