const app = require("./app");
const serverless = require("serverless-http");

// AWS Lambda handler
module.exports.handler = serverless(app);
