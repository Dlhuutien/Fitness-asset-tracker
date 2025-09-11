const VendorModel = require("../models/Vendor");

const vendorRepository = {
  // Thêm vendor mới
  create: async (vendorData) => {
    return await VendorModel.createVendor(vendorData);
  },

  // Lấy tất cả vendor
  findAll: async () => {
    return await VendorModel.getVendors();
  },

  // Lấy vendor theo id
  findById: async (vendorId) => {
    return await VendorModel.getOneVendor(vendorId);
  },

  // Cập nhật vendor
  update: async (vendorId, vendorData) => {
    return await VendorModel.updateVendor(vendorId, vendorData);
  },

  // Xóa vendor
  delete: async (vendorId) => {
    return await VendorModel.deleteVendor(vendorId);
  },
};

module.exports = vendorRepository;
