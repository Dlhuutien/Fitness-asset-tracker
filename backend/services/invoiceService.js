const invoiceRepository = require("../repositories/invoiceRepository");
const equipmentUnitRepository = require("../repositories/equipmentUnitRepository");
const invoiceDetailRepository = require("../repositories/invoiceDetailRepository");
const { v4: uuidv4 } = require("uuid");

const invoiceService = {
  createInvoice: async (data) => {
    if (!data.user_id || !data.items) {
      throw new Error("user_id and items are required");
    }

    // 1. Tạo invoice trước (chưa có total)
    const invoice = await invoiceRepository.create({
      user_id: data.user_id,
      total: 0,
    });

    let total = 0;
    const details = [];

    // 2. Loop qua items
    for (const item of data.items) {
      const { equipment_id, branch_id, quantity, cost, warranty_duration } = item;

      for (let i = 0; i < quantity; i++) {
        // 2.1 Tạo equipment_unit
        const unitId = uuidv4();
        const unit = await equipmentUnitRepository.create({
          id: unitId,
          equipment_id,
          branch_id,
          sku: `${equipment_id}-${unitId.slice(0, 6)}`,
          cost,
          description: "Imported via invoice",
          status: "In Stock",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          warranty_start_date: new Date().toISOString(),
          warranty_end_date: new Date(
            new Date().setFullYear(new Date().getFullYear() + warranty_duration)
          ).toISOString(),
        });

        // 2.2 Tạo invoice_detail
        const detail = await invoiceDetailRepository.create({
          invoice_id: invoice.id,
          equipment_unit_id: unit.id,
          cost,
        });

        details.push(detail);
        total += cost;
      }
    }

    // 3. Update total vào invoice
    const updatedInvoice = await invoiceRepository.update(invoice.id, { total });

    return {
      invoice: updatedInvoice,
      details,
    };
  },

  getInvoices: async () => {
    return await invoiceRepository.findAll();
  },

  getInvoiceById: async (id) => {
    const invoice = await invoiceRepository.findById(id);
    if (!invoice) throw new Error("Invoice not found");
    return invoice;
  },

  updateInvoice: async (id, data) => {
    const existing = await invoiceRepository.findById(id);
    if (!existing) throw new Error("Invoice not found");
    return await invoiceRepository.update(id, data);
  },

  deleteInvoice: async (id) => {
    const existing = await invoiceRepository.findById(id);
    if (!existing) throw new Error("Invoice not found");
    return await invoiceRepository.delete(id);
  },
};

module.exports = invoiceService;
