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

const tableName = "Maintenance";

const MaintenanceModel = {
  // CREATE
  createMaintenance: async (data) => {
    const item = {
      id: uuidv4(),
      equipment_unit_id: data.equipment_unit_id,
      branch_id: data.branch_id,
      user_id: data.user_id || null,
      assigned_by: data.assigned_by,
      maintenance_reason: data.maintenance_reason,
      maintenance_detail: data.maintenance_detail || null,
      start_date: new Date().toISOString(),
      end_date: null,
      warranty: data.warranty,
    };

    await dynamodb.send(
      new PutCommand({
        TableName: tableName,
        Item: item,
      })
    );

    return item;
  },

  // 🕒 Tạo bảo trì được lên lịch (chỉ có scheduled_at)
  createScheduledMaintenance: async (data) => {
    const item = {
      id: uuidv4(),
      equipment_unit_id: data.equipment_unit_id,
      branch_id: data.branch_id,
      assigned_by: data.assigned_by,
      maintenance_reason: data.maintenance_reason,
      maintenance_detail: data.maintenance_detail || null,
      scheduled_at: data.scheduled_at, // ✅ chỉ lưu thời gian
      end_date: null,
      warranty: data.warranty,
    };

    await dynamodb.send(new PutCommand({ TableName: tableName, Item: item }));
    return item;
  },

  getAll: async () => {
    const result = await dynamodb.send(
      new ScanCommand({ TableName: tableName })
    );
    return result.Items || [];
  },

  getById: async (id) => {
    const result = await dynamodb.send(
      new GetCommand({
        TableName: tableName,
        Key: { id },
      })
    );
    return result.Item;
  },

  // GSI query theo branch_id
  getByBranchId: async (branch_id) => {
    const result = await dynamodb.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: "branch_id-index",
        KeyConditionExpression: "branch_id = :b",
        ExpressionAttributeValues: { ":b": branch_id },
      })
    );
    return result.Items || [];
  },

  updateMaintenance: async (id, data) => {
    const updateExp = [];
    const expAttrNames = {};
    const expAttrValues = {};

    if (data.user_id !== undefined) {
      updateExp.push("#u = :user");
      expAttrNames["#u"] = "user_id";
      expAttrValues[":user"] = data.user_id;
    }
    if (data.maintenance_detail !== undefined) {
      updateExp.push("#md = :md");
      expAttrNames["#md"] = "maintenance_detail";
      expAttrValues[":md"] = data.maintenance_detail;
    }
    if (data.start_date !== undefined) {
      updateExp.push("#sd = :sd");
      expAttrNames["#sd"] = "start_date";
      expAttrValues[":sd"] = data.start_date;
    }

    if (data.end_date !== undefined) {
      updateExp.push("#ed = :ed");
      expAttrNames["#ed"] = "end_date";
      expAttrValues[":ed"] = data.end_date;
    }
    if (data.result !== undefined) {
      updateExp.push("#r = :r");
      expAttrNames["#r"] = "result";
      expAttrValues[":r"] = !!data.result;
    }

    const result = await dynamodb.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { id },
        UpdateExpression: "set " + updateExp.join(", "),
        ExpressionAttributeNames: expAttrNames,
        ExpressionAttributeValues: expAttrValues,
        ReturnValues: "ALL_NEW",
      })
    );
    return result.Attributes;
  },

  deleteMaintenance: async (id) => {
    await dynamodb.send(
      new DeleteCommand({
        TableName: tableName,
        Key: { id },
      })
    );
    return { id };
  },
};

module.exports = MaintenanceModel;
