const {
  PutCommand,
  ScanCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");
const { dynamodb } = require("../utils/aws-helper");

const tableName = "Category_type";

const CategoryTypeModel = {
  // CREATE
  createCategoryType: async (data) => {
    const item = {
      id: data.id,
      category_main_id: data.category_main_id,
      name: data.name,
      description: data.description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await dynamodb.send(new PutCommand({
      TableName: tableName,
      Item: item,
    }));

    return item;
  },

  // READ ALL
  getCategoryTypes: async () => {
    const result = await dynamodb.send(new ScanCommand({ TableName: tableName }));
    return result.Items || [];
  },

  // READ ONE
  getOneCategoryType: async (id) => {
    const result = await dynamodb.send(new GetCommand({
      TableName: tableName,
      Key: { id },
    }));
    return result.Item;
  },

  //  READ ALL BY category_main_id
  getCategoryTypesByMainId: async (category_main_id) => {
    const result = await dynamodb.send(new QueryCommand({
      TableName: tableName,
      IndexName: "category_main_id-index",
      KeyConditionExpression: "category_main_id = :id",
      ExpressionAttributeValues: {
        ":id": category_main_id,
      },
    }));
    return result.Items || [];
  },

  // UPDATE
  updateCategoryType: async (id, data) => {
    const result = await dynamodb.send(new UpdateCommand({
      TableName: tableName,
      Key: { id },
      UpdateExpression: "set #n = :name, #d = :desc, #u = :updatedAt, #cm = :cmid",
      ExpressionAttributeNames: {
        "#n": "name",
        "#d": "description",
        "#u": "updated_at",
        "#cm": "category_main_id",
      },
      ExpressionAttributeValues: {
        ":name": data.name,
        ":desc": data.description,
        ":updatedAt": new Date().toISOString(),
        ":cmid": data.category_main_id,
      },
      ReturnValues: "ALL_NEW",
    }));
    return result.Attributes;
  },

  // DELETE
  deleteCategoryType: async (id) => {
    await dynamodb.send(new DeleteCommand({
      TableName: tableName,
      Key: { id },
    }));
    return { id };
  },
};

module.exports = CategoryTypeModel;
