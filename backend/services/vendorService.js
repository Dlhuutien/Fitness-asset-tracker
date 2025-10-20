const vendorRepository = require("../repositories/vendorRepository");
const equipmentRepository = require("../repositories/equipmentRepository");
const { generateTypeCode } = require("../utils/codeGenerator");

const vendorService = {
  /**
   * Tạo vendor mới, tự sinh mã ID (VD: Technogym → TEC)
   */
  createVendor: async (vendorData) => {
    if (!vendorData.name) {
      throw new Error("Vendor name is required");
    }

    // Lấy tất cả vendor hiện có để kiểm tra trùng tên và mã
    const existingVendors = await vendorRepository.findAll();

    // Kiểm tra trùng tên (không phân biệt hoa thường)
    const nameExists = existingVendors.some(
      (v) =>
        v.name.trim().toLowerCase() === vendorData.name.trim().toLowerCase()
    );
    if (nameExists) {
      throw new Error(`Vendor name "${vendorData.name}" already exists`);
    }

    // Sinh mã vendor ID tự động
    const existingCodes = existingVendors.map((v) => v.id);
    const newId = generateTypeCode(vendorData.name, existingCodes);

    // Tạo vendor mới
    const newVendor = await vendorRepository.create({
      id: newId,
      name: vendorData.name.trim(),
      description: vendorData.description || null,
      contact: vendorData.contact || null,
      address: vendorData.address || null,
      email: vendorData.email || null,
      phone: vendorData.phone || null,
      created_at: new Date().toISOString(),
    });

    return newVendor;
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
