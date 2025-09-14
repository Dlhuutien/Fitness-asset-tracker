const vendorService = require("../services/vendorService");

const vendorController = {
  createVendor: async (req, res) => {
    try {
      const vendor = await vendorService.createVendor(req.body);
      res.status(201).json(vendor);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getVendors: async (req, res) => {
    try {
      const vendors = await vendorService.getVendors();
      res.json(vendors);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getVendorById: async (req, res) => {
    try {
      const vendor = await vendorService.getVendorById(req.params.id);
      res.json(vendor);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  updateVendor: async (req, res) => {
    try {
      const vendor = await vendorService.updateVendor(req.params.id, req.body);
      res.json(vendor);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  deleteVendor: async (req, res) => {
    try {
      await vendorService.deleteVendor(req.params.id);
      res.json({ message: "Vendor deleted successfully" });
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },
};

module.exports = vendorController;
