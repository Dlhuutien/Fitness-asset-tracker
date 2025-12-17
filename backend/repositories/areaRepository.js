const AreaModel = require("../models/Area");

module.exports = {
  create: (data) => AreaModel.createArea(data),
  findAll: () => AreaModel.getAreas(),
  findById: (id) => AreaModel.getAreaById(id),
  update: (id, data) => AreaModel.updateArea(id, data),
  delete: (id) => AreaModel.deleteArea(id),
};
