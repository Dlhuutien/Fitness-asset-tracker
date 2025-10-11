const InvoiceDetailModel = require("../models/InvoiceDetail");

const invoiceDetailRepository = {
  create: async (data) => InvoiceDetailModel.createDetail(data),
  findById: async (id) => InvoiceDetailModel.getDetailById(id),
  findAll: async () => InvoiceDetailModel.getAllDetails(),
  findByInvoiceId: async (invoice_id) => InvoiceDetailModel.getByInvoiceId(invoice_id),
  delete: async (id) => InvoiceDetailModel.deleteDetail(id),
};

module.exports = invoiceDetailRepository;
