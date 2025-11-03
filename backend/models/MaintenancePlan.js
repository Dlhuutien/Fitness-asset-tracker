const {
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");
const { dynamodb } = require("../utils/aws-helper");
const { v4: uuidv4 } = require("uuid");

const tableName = "Maintenance_plan";

const MaintenancePlanModel = {
  createPlan: async (data) => {
    const item = {
      id: uuidv4(),
      equipment_id: data.equipment_id,
      created_by: data.created_by,
      frequency: data.frequency, // e.g., "3_months", "custom"
      next_maintenance_date: data.next_maintenance_date,
      reminder_schedule_arn: data.reminder_schedule_arn || null,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await dynamodb.send(new PutCommand({ TableName: tableName, Item: item }));
    return item;
  },

  findAll: async () => {
    const res = await dynamodb.send(new ScanCommand({ TableName: tableName }));
    return res.Items || [];
  },

  findById: async (id) => {
    const res = await dynamodb.send(
      new GetCommand({ TableName: tableName, Key: { id } })
    );
    return res.Item;
  },

  findByEquipmentId: async (equipment_id) => {
    const res = await dynamodb.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: "equipment_id-index",
        KeyConditionExpression: "equipment_id = :eid",
        ExpressionAttributeValues: { ":eid": equipment_id },
      })
    );
    return res.Items || [];
  },

  updatePlan: async (id, data) => {
    const ALLOWED = new Set([
      "frequency",
      "next_maintenance_date",
      "reminder_schedule_arn",
      "active",
    ]);

    // 🔒 Bỏ các field không cho phép + undefined/null
    const safeData = {};
    for (const [k, v] of Object.entries(data || {})) {
      if (!ALLOWED.has(k)) continue; // chặn id, created_at, updated_at, ...
      if (typeof v === "undefined") continue;
      safeData[k] = v;
    }

    if (Object.keys(safeData).length === 0) {
      throw new Error("No updatable fields provided");
    }

    const updateExp = [];
    const expAttrNames = {};
    const expAttrValues = {};

    for (const [key, value] of Object.entries(safeData)) {
      updateExp.push(`#${key} = :${key}`);
      expAttrNames[`#${key}`] = key;
      expAttrValues[`:${key}`] = value;
    }

    // ✅ chỉ tự set updated_at duy nhất 1 lần (không nhận từ body)
    updateExp.push("#updated_at = :updatedAt");
    expAttrNames["#updated_at"] = "updated_at";
    expAttrValues[":updatedAt"] = new Date().toISOString();

    const res = await dynamodb.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { id },
        UpdateExpression: "SET " + updateExp.join(", "),
        ExpressionAttributeNames: expAttrNames,
        ExpressionAttributeValues: expAttrValues,
        ReturnValues: "ALL_NEW",
      })
    );

    return res.Attributes;
  },

  deletePlan: async (id) => {
    await dynamodb.send(
      new DeleteCommand({ TableName: tableName, Key: { id } })
    );
    return { id };
  },
};

module.exports = MaintenancePlanModel;
