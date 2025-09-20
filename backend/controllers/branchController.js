const branchService = require("../services/branchService");

const branchController = {
  createBranch: async (req, res) => {
    try {
      const branch = await branchService.createBranch({
        id: req.body.id,
        name: req.body.name,
        address: req.body.address,
      });

      res.status(201).json(branch);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getBranches: async (req, res) => {
    try {
      const branches = await branchService.getBranches();
      res.json(branches);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getBranchById: async (req, res) => {
    try {
      const branch = await branchService.getBranchById(req.params.id);
      res.json(branch);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  updateBranch: async (req, res) => {
    try {
      const branch = await branchService.updateBranch(req.params.id, {
        name: req.body.name,
        address: req.body.address,
      });

      res.json(branch);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  deleteBranch: async (req, res) => {
    try {
      await branchService.deleteBranch(req.params.id);
      res.json({ message: "Branch deleted successfully" });
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },
};

module.exports = branchController;
