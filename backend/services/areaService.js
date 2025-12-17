const areaRepository = require("../repositories/areaRepository");
const floorRepository = require("../repositories/floorRepository");
const equipmentUnitRepository = require("../repositories/equipmentUnitRepository");

module.exports = {
  createArea: async (data) => {
    if (!data.floor_id || !data.name) {
      throw new Error("Floor_id and name are required");
    }

    // CHECK FLOOR TỒN TẠI
    const floor = await floorRepository.findById(data.floor_id);
    if (!floor) {
      throw new Error(`Floor with id ${data.floor_id} does not exist`);
    }

    return areaRepository.create(data);
  },

  getAreas: () => areaRepository.findAll(),

  getAreaById: async (id) => {
    const area = await areaRepository.findById(id);
    if (!area) throw new Error("Area not found");
    return area;
  },

  updateArea: async (id, data) => {
    const existing = await areaRepository.findById(id);
    if (!existing) throw new Error("Area not found");

    if (data.floor_id && data.floor_id !== existing.floor_id) {
      throw new Error("Changing floor_id of an area is not allowed");
    }

    return areaRepository.update(id, data);
  },

  deleteArea: async (id) => {
    const existing = await areaRepository.findById(id);
    if (!existing) throw new Error("Area not found");

    // CHẶN XÓA NẾU CÒN UNIT
    const allUnits = await equipmentUnitRepository.findAll();
    const unitsInArea = allUnits.filter((u) => u.area_id === id);

    if (unitsInArea.length > 0) {
      throw new Error(
        `Cannot delete area: ${unitsInArea.length} equipment unit(s) still assigned to this area`
      );
    }

    return areaRepository.delete(id);
  },
};
