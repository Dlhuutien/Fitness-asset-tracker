const invoiceRepository = require("../repositories/invoiceRepository");
const equipmentUnitRepository = require("../repositories/equipmentUnitRepository");
const invoiceDetailRepository = require("../repositories/invoiceDetailRepository");
const branchRepository = require("../repositories/branchRepository");
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

    // Ngày nhập hàng (format ddMMyy)
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear()).slice(-2);
    const datePrefix = `${day}${month}${year}`;

    // 2. Loop qua items
    for (const item of data.items) {
      const { equipment_id, branch_id, quantity, cost, warranty_duration } = item;

      // Check branch tồn tại
      const branch = await branchRepository.findById(branch_id);
      if (!branch) {
        throw new Error(`Branch ${branch_id} not found`);
      }

      // --- Lấy count hiện tại từ DB ---
      const existingUnits = await equipmentUnitRepository.findAll();
      const prefix = `${equipment_id}-${datePrefix}`;
      const sameDayUnits = existingUnits.filter((u) =>
        u.id.startsWith(prefix)
      );

      let count = sameDayUnits.length; // số hiện tại đã có

      for (let i = 0; i < quantity; i++) {
        count++;
        const unitId = `${equipment_id}-${datePrefix}-${count}`;

        // 2.1 Tạo equipment_unit
        const unit = await equipmentUnitRepository.create({
          id: unitId,
          equipment_id,
          branch_id,
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

  getInvoiceDetails: async (invoiceId) => {
    // 1. Lấy invoice
    const invoice = await invoiceRepository.findById(invoiceId);
    if (!invoice) throw new Error("Invoice not found");

    // 2. Lấy danh sách chi tiết
    const details = await invoiceDetailRepository.findByInvoiceId(invoiceId);

    // 3. Join với equipment_unit
    const detailsWithUnits = [];
    for (const d of details) {
      const unit = await equipmentUnitRepository.findById(d.equipment_unit_id);
      detailsWithUnits.push({
        ...d,
        equipment_unit: unit,
      });
    }

    return {
      invoice,
      details: detailsWithUnits,
    };
  },
};

module.exports = invoiceService;
