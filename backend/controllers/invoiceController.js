const invoiceService = require("../services/invoiceService");
const userService = require("../services/userService");
// const sendEmail = require("../services/emailService");
const notificationService = require("../services/notificationService");

const invoiceController = {
  createInvoice: async (req, res) => {
    try {
      const userId = req.user.sub;
      const { items } = req.body;

      // 1. Tạo invoice
      const { invoice } = await invoiceService.createInvoice({
        user_id: userId,
        items,
      });

      // 2. Lấy invoice kèm chi tiết đầy đủ (join với equipment_unit)
      const { details } = await invoiceService.getInvoiceDetails(invoice.id);

      // 3. Lấy email admin + super-admin
      const admins = await userService.getUsersByRoles([
        "admin",
        "super-admin",
      ]);
      const recipients = admins.map((u) => u.email);

      // 4. Gửi email thông báo
      await notificationService.notifyInvoiceCreated(invoice, details, admins);

      // 5. Trả về response
      res.status(201).json({ invoice, details });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getInvoices: async (req, res) => {
    try {
      const invoices = await invoiceService.getInvoices();
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getInvoiceById: async (req, res) => {
    try {
      const invoice = await invoiceService.getInvoiceById(req.params.id);
      res.json(invoice);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  updateInvoice: async (req, res) => {
    try {
      const invoice = await invoiceService.updateInvoice(req.params.id, {
        total: req.body.total,
      });
      res.json(invoice);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  deleteInvoice: async (req, res) => {
    try {
      await invoiceService.deleteInvoice(req.params.id);
      res.json({ message: "Invoice deleted successfully" });
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  getInvoiceDetails: async (req, res) => {
    try {
      const result = await invoiceService.getInvoiceDetails(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },
};

module.exports = invoiceController;
