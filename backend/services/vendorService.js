const vendorRepository = require("../repositories/vendorRepository");
const equipmentRepository = require("../repositories/equipmentRepository");

const vendorService = {
  createVendor: async (vendorData) => {
    if (!vendorData.name) {
      throw new Error("Vendor name is required");
    }
    const existing = await vendorRepository.findById(vendorData.id);
    if (existing) {
      throw new Error(`Vendor with id ${vendorData.id} already exists`);
    }
    return await vendorRepository.create(vendorData);
  },

  getVendors: async () => {
    return await vendorRepository.findAll();
  },

  getVendorById: async (vendorId) => {
    const vendor = await vendorRepository.findById(vendorId);
    if (!vendor) {
      throw new Error("Vendor not found");
    }
    return vendor;
  },

  updateVendor: async (vendorId, vendorData) => {
    const existing = await vendorRepository.findById(vendorId);
    if (!existing) {
      throw new Error("Vendor not found");
    }
    return await vendorRepository.update(vendorId, vendorData);
  },

  deleteVendor: async (vendorId) => {
    const existing = await vendorRepository.findById(vendorId);
    if (!existing) throw new Error("Vendor not found");

    // Check Equipment reference
    const equipments = await equipmentRepository.findByVendorId(vendorId);
    if (equipments.length > 0) {
      throw new Error(
        `Cannot delete Vendor ${vendorId} because ${equipments.length} equipment(s) still reference it`
      );
    }

    return await vendorRepository.delete(vendorId);
  },
};

module.exports = vendorService;
