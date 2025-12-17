const floorRepository = require("../repositories/floorRepository");
const branchRepository = require("../repositories/branchRepository");
const areaRepository = require("../repositories/areaRepository");

module.exports = {
  createFloor: async (data) => {
    if (!data.branch_id) {
      throw new Error("branch_id is required");
    }

    // Check branch tồn tại
    const branch = await branchRepository.findById(data.branch_id);
    if (!branch) {
      throw new Error(`Branch with id ${data.branch_id} does not exist`);
    }

    // Lấy toàn bộ floor → lọc theo branch
    const allFloors = await floorRepository.findAll();
    const floorsOfBranch = allFloors.filter(
      (f) => f.branch_id === data.branch_id
    );

    // Lấy số tầng lớn nhất (F1, F2, F3...)
    const floorNumbers = floorsOfBranch
      .map((f) => {
        const match = /^F(\d+)$/.exec(f.name);
        return match ? Number(match[1]) : null;
      })
      .filter((n) => n !== null);

    const nextFloorNumber =
      floorNumbers.length > 0 ? Math.max(...floorNumbers) + 1 : 1;

    const floorName = `F${nextFloorNumber}`;

    return floorRepository.create({
      branch_id: data.branch_id,
      name: floorName,
      description: data.description || "",
    });
  },

  getFloors: () => floorRepository.findAll(),

  getFloorById: async (id) => {
    const floor = await floorRepository.findById(id);
    if (!floor) throw new Error("Floor not found");
    return floor;
  },

  updateFloor: async (id, data) => {
    const existing = await floorRepository.findById(id);
    if (!existing) throw new Error("Floor not found");

    if (data.branch_id && data.branch_id !== existing.branch_id) {
      throw new Error("Changing branch of a floor is not allowed");
    }

    return floorRepository.update(id, data);
  },

  deleteFloor: async (id) => {
    const existing = await floorRepository.findById(id);
    if (!existing) throw new Error("Floor not found");

    // CHẶN XÓA NẾU CÒN AREA
    const allAreas = await areaRepository.findAll();
    const areasInFloor = allAreas.filter((a) => a.floor_id === id);

    if (areasInFloor.length > 0) {
      throw new Error(
        `Cannot delete floor: ${areasInFloor.length} area(s) still assigned to this floor`
      );
    }

    return floorRepository.delete(id);
  },
};
