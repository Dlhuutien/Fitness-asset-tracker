const InvoiceModel = require("../models/Invoice");

const invoiceRepository = {
  create: async (data) => InvoiceModel.createInvoice(data),
  findAll: async () => InvoiceModel.getInvoices(),
  findById: async (id) => InvoiceModel.getInvoiceById(id),
  update: async (id, data) => InvoiceModel.updateInvoice(id, data),
  delete: async (id) => InvoiceModel.deleteInvoice(id),
};

module.exports = invoiceRepository;
