const branchRepository = require("../repositories/branchRepository");

const branchService = {
  createBranch: async (data) => {
    if (!data.id || !data.name) {
      throw new Error("Branch id and name are required");
    }

    const existing = await branchRepository.findById(data.id);
    if (existing) {
      throw new Error(`Branch with id ${data.id} already exists`);
    }

    return await branchRepository.create(data);
  },

  getBranches: async () => {
    return await branchRepository.findAll();
  },

  getBranchById: async (id) => {
    const branch = await branchRepository.findById(id);
    if (!branch) throw new Error("Branch not found");
    return branch;
  },

  updateBranch: async (id, data) => {
    const existing = await branchRepository.findById(id);
    if (!existing) throw new Error("Branch not found");
    return await branchRepository.update(id, data);
  },

  deleteBranch: async (id) => {
    const existing = await branchRepository.findById(id);
    if (!existing) throw new Error("Branch not found");
    return await branchRepository.delete(id);
  },
};

module.exports = branchService;
