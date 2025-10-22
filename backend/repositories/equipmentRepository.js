const EquipmentModel = require("../models/Equipment");

const equipmentRepository = {
  create: async (data) => await EquipmentModel.createEquipment(data),
  findAll: async () => await EquipmentModel.getEquipments(),
  findById: async (id) => await EquipmentModel.getOneEquipment(id),
  update: async (id, data) => await EquipmentModel.updateEquipment(id, data),
  delete: async (id) => await EquipmentModel.deleteEquipment(id),
  findByCategoryTypeId: async (category_type_id) =>
    EquipmentModel.getByCategoryTypeId(category_type_id),
  findByVendorId: async (vendor_id) =>
    EquipmentModel.getByVendorId(vendor_id),
  findAllIds: async () => await EquipmentModel.getAllIds(),
  batchFindByIds: async (ids) => await EquipmentModel.batchFindByIds(ids),
};

module.exports = equipmentRepository;
