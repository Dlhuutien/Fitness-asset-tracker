const CountModel = require("../models/Count");

const countRepository = {
  create: async (equipment_id) => CountModel.createCount(equipment_id),
  findAll: async () => CountModel.getCounts(),
  findById: async (id) => CountModel.getCountById(id),
  increment: async (id, step = 1) => CountModel.incrementCount(id, step),
  delete: async (id) => CountModel.deleteCount(id),
};

module.exports = countRepository;
