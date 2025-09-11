const { v4: uuidv4 } = require("uuid");
const {
  PutCommand,
  ScanCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const { dynamodb } = require("../utils/aws-helper");

const tableName = "Vendor"; // Tên DynamoDB table

const VendorModel = {
  // Thêm vendor mới
  createVendor: async (vendorData) => {
    const vendorId = uuidv4();
    const item = {
      id: vendorId,
      name: vendorData.name,
      origin: vendorData.origin || "VIETNAM",
      description: vendorData.description,
    };

    try {
      await dynamodb.send(new PutCommand({
        TableName: tableName,
        Item: item,
      }));
      return item;
    } catch (error) {
      console.error("Error creating vendor:", error);
      throw error;
    }
  },

  // Lấy tất cả vendor
  getVendors: async () => {
    try {
      const result = await dynamodb.send(new ScanCommand({ TableName: tableName }));
      return result.Items || [];
    } catch (error) {
      console.error("Error getting vendors:", error);
      throw error;
    }
  },

  // Lấy 1 vendor theo id
  getOneVendor: async (vendorId) => {
    try {
      const data = await dynamodb.send(new GetCommand({
        TableName: tableName,
        Key: { id: vendorId },
      }));
      return data.Item;
    } catch (error) {
      console.error("Error getting vendor:", error);
      throw error;
    }
  },

  // Cập nhật vendor
  updateVendor: async (vendorId, vendorData) => {
    try {
      const result = await dynamodb.send(new UpdateCommand({
        TableName: tableName,
        Key: { id: vendorId },
        UpdateExpression: "set #n = :name, #o = :origin, #d = :description",
        ExpressionAttributeNames: {
          "#n": "name",
          "#o": "origin",
          "#d": "description",
        },
        ExpressionAttributeValues: {
          ":name": vendorData.name,
          ":origin": vendorData.origin,
          ":description": vendorData.description,
        },
        ReturnValues: "ALL_NEW",
      }));
      return result.Attributes;
    } catch (error) {
      console.error("Error updating vendor:", error);
      throw error;
    }
  },

  // Xóa vendor
  deleteVendor: async (vendorId) => {
    try {
      await dynamodb.send(new DeleteCommand({
        TableName: tableName,
        Key: { id: vendorId },
      }));
      return { id: vendorId };
    } catch (error) {
      console.error("Error deleting vendor:", error);
      throw error;
    }
  },
};

module.exports = VendorModel;
