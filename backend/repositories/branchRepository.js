const BranchModel = require("../models/Branch");

const branchRepository = {
  create: async (data) => BranchModel.createBranch(data),
  findAll: async () => BranchModel.getBranches(),
  findById: async (id) => BranchModel.getOneBranch(id),
  update: async (id, data) => BranchModel.updateBranch(id, data),
  delete: async (id) => BranchModel.deleteBranch(id),
};

module.exports = branchRepository;
