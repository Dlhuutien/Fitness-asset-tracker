const invoiceService = require("../services/invoiceService");

const invoiceController = {
  createInvoice: async (req, res) => {
    try {
      const userId = req.user.sub; // từ JWT middleware
      const { items } = req.body; // nhận danh sách items từ body

      const invoice = await invoiceService.createInvoice({
        user_id: userId,
        items, // truyền items sang service
      });

      res.status(201).json(invoice);
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
};

module.exports = invoiceController;
