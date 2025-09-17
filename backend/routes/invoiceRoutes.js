const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");
const { verifyAccessToken } = require("../middlewares/authMiddleware");

// CREATE
router.post("/", verifyAccessToken, invoiceController.createInvoice);

// READ ALL
router.get("/", invoiceController.getInvoices);

// READ ONE
router.get("/:id", invoiceController.getInvoiceById);

// UPDATE
router.put("/:id", verifyAccessToken, invoiceController.updateInvoice);

// DELETE
router.delete("/:id", verifyAccessToken, invoiceController.deleteInvoice);

module.exports = router;
