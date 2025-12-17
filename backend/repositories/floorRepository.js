const FloorModel = require("../models/Floor");

module.exports = {
  create: (data) => FloorModel.createFloor(data),
  findAll: () => FloorModel.getFloors(),
  findById: (id) => FloorModel.getFloorById(id),
  update: (id, data) => FloorModel.updateFloor(id, data),
  delete: (id) => FloorModel.deleteFloor(id),
};
