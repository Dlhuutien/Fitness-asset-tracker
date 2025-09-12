const {
  PutCommand,
  ScanCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const { dynamodb } = require("../utils/aws-helper");

const tableName = "Category_main";

const CategoryModel = {
  // CREATE
  createCategory: async (categoryData) => {
    const item = {
      id: categoryData.id,
      name: categoryData.name,
      image: categoryData.image || null,
      description: categoryData.description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await dynamodb.send(new PutCommand({
        TableName: tableName,
        Item: item,
      }));
      return item;
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  },

  // READ ALL
  getCategories: async () => {
    try {
      const result = await dynamodb.send(new ScanCommand({ TableName: tableName }));
      return result.Items || [];
    } catch (error) {
      console.error("Error getting categories:", error);
      throw error;
    }
  },

  // READ ONE
  getOneCategory: async (id) => {
    try {
      const result = await dynamodb.send(new GetCommand({
        TableName: tableName,
        Key: { id },
      }));
      return result.Item;
    } catch (error) {
      console.error("Error getting category:", error);
      throw error;
    }
  },

  // UPDATE
  updateCategory: async (id, categoryData) => {
    try {
      const result = await dynamodb.send(new UpdateCommand({
        TableName: tableName,
        Key: { id },
        UpdateExpression: "set #n = :name, #i = :image, #d = :desc, #u = :updatedAt",
        ExpressionAttributeNames: {
          "#n": "name",
          "#i": "image",
          "#d": "description",
          "#u": "updated_at",
        },
        ExpressionAttributeValues: {
          ":name": categoryData.name,
          ":image": categoryData.image,
          ":desc": categoryData.description,
          ":updatedAt": new Date().toISOString(),
        },
        ReturnValues: "ALL_NEW",
      }));
      return result.Attributes;
    } catch (error) {
      console.error("Error updating category:", error);
      throw error;
    }
  },

  // DELETE
  deleteCategory: async (id) => {
    try {
      await dynamodb.send(new DeleteCommand({
        TableName: tableName,
        Key: { id },
      }));
      return { id };
    } catch (error) {
      console.error("Error deleting category:", error);
      throw error;
    }
  },
};

module.exports = CategoryModel;
