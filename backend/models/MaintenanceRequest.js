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

const tableName = "Maintenance_request";

/**
 * Schema gợi ý (DynamoDB):
 * - id (PK)
 * - equipment_unit_id (JSON string) ← ✅ giờ lưu dạng chuỗi JSON
 * - branch_id (GSI: branch_id-index)
 * - assigned_by (admin sub)
 * - scheduled_at (ISO string)
 * - maintenance_reason
 * - candidate_tech_ids (array of sub)  // optional
 * - confirmed_by (tech sub)
 * - status: "pending" | "confirmed" | "cancelled" | "expired"
 * - created_at, updated_at
 * - converted_maintenance_id (nếu đã đẩy sang Maintenance)
 */
const MaintenanceRequestModel = {
  create: async (data) => {
    const item = {
      id: uuidv4(),
      // ✅ Convert mảng sang chuỗi JSON để tương thích GSI
      equipment_unit_id: Array.isArray(data.equipment_unit_id)
        ? JSON.stringify(data.equipment_unit_id)
        : data.equipment_unit_id,
      branch_id: data.branch_id,
      assigned_by: data.assigned_by,
      scheduled_at: data.scheduled_at,
      reminder_schedule_arn: data.reminder_schedule_arn || null,
      auto_start_schedule_arn: data.auto_start_schedule_arn || null,
      maintenance_reason: data.maintenance_reason || null,
      candidate_tech_ids: Array.isArray(data.candidate_tech_ids)
        ? data.candidate_tech_ids
        : null,
      confirmed_by: null,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      converted_maintenance_id: null,
    };

    await dynamodb.send(new PutCommand({ TableName: tableName, Item: item }));
    return item;
  },

  findAll: async () => {
    const res = await dynamodb.send(new ScanCommand({ TableName: tableName }));
    const items = res.Items || [];

    // ✅ Parse JSON -> array khi đọc
    for (const i of items) {
      if (typeof i.equipment_unit_id === "string") {
        try {
          i.equipment_unit_id = JSON.parse(i.equipment_unit_id);
        } catch {
          i.equipment_unit_id = [i.equipment_unit_id];
        }
      }
    }

    return items;
  },

  findById: async (id) => {
    const res = await dynamodb.send(
      new GetCommand({ TableName: tableName, Key: { id } })
    );
    const item = res.Item;

    // ✅ Parse JSON string -> array khi đọc
    if (item && typeof item.equipment_unit_id === "string") {
      try {
        item.equipment_unit_id = JSON.parse(item.equipment_unit_id);
      } catch {
        item.equipment_unit_id = [item.equipment_unit_id];
      }
    }

    return item;
  },

  findByUnitId: async (equipment_unit_id) => {
    const res = await dynamodb.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: "equipment_unit_id-index",
        KeyConditionExpression: "equipment_unit_id = :u",
        ExpressionAttributeValues: { ":u": equipment_unit_id },
      })
    );
    const items = res.Items || [];

    // ✅ Parse JSON -> array
    for (const i of items) {
      if (typeof i.equipment_unit_id === "string") {
        try {
          i.equipment_unit_id = JSON.parse(i.equipment_unit_id);
        } catch {
          i.equipment_unit_id = [i.equipment_unit_id];
        }
      }
    }

    return items;
  },

  findByBranchId: async (branch_id) => {
    const res = await dynamodb.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: "branch_id-index",
        KeyConditionExpression: "branch_id = :b",
        ExpressionAttributeValues: { ":b": branch_id },
      })
    );
    const items = res.Items || [];

    // ✅ Parse JSON -> array
    for (const i of items) {
      if (typeof i.equipment_unit_id === "string") {
        try {
          i.equipment_unit_id = JSON.parse(i.equipment_unit_id);
        } catch {
          i.equipment_unit_id = [i.equipment_unit_id];
        }
      }
    }

    return items;
  },

  update: async (id, data) => {
    const ALLOWED = new Set([
      "equipment_unit_id",
      "scheduled_at",
      "maintenance_reason",
      "candidate_tech_ids",
      "confirmed_by",
      "status",
      "converted_maintenance_id",
      "auto_start_schedule_arn",
    ]);

    const safe = {};
    for (const [k, v] of Object.entries(data || {})) {
      if (!ALLOWED.has(k)) continue;
      if (typeof v === "undefined") continue;
      safe[k] = v;
    }

    if (!Object.keys(safe).length) {
      throw new Error("No updatable fields provided");
    }

    const exp = [];
    const names = {};
    const values = {};

    for (const [k, v] of Object.entries(safe)) {
      let value = v;
      if (k === "equipment_unit_id" && Array.isArray(v)) {
        value = JSON.stringify(v);
      }
      exp.push(`#${k} = :${k}`);
      names[`#${k}`] = k;
      values[`:${k}`] = value;
    }

    exp.push("#updated_at = :_u");
    names["#updated_at"] = "updated_at";
    values[":_u"] = new Date().toISOString();

    const r = await dynamodb.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { id },
        UpdateExpression: "SET " + exp.join(", "),
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: "ALL_NEW",
      })
    );

    const updated = r.Attributes;
    // ✅ Parse lại nếu có field equipment_unit_id dạng string
    if (updated && typeof updated.equipment_unit_id === "string") {
      try {
        updated.equipment_unit_id = JSON.parse(updated.equipment_unit_id);
      } catch {
        updated.equipment_unit_id = [updated.equipment_unit_id];
      }
    }

    return updated;
  },

  delete: async (id) => {
    await dynamodb.send(
      new DeleteCommand({ TableName: tableName, Key: { id } })
    );
    return { id };
  },
};

module.exports = MaintenanceRequestModel;
