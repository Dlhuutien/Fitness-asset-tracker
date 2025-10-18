const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");
const { verifyAccessToken } = require("../middlewares/authMiddleware");
const branchFilterMiddleware = require("../middlewares/branchFilterMiddleware");

// CREATE
router.post("/", verifyAccessToken, invoiceController.createInvoice);

// READ ALL
router.get(
  "/",
  verifyAccessToken,
  branchFilterMiddleware,
  invoiceController.getInvoices
);

//READE ALL INVOCIE DETAIL
router.get("/details", invoiceController.getAllInvoiceDetails);

// READ ONE
router.get("/:id", invoiceController.getInvoiceById);

//READE INVOCIE DETAIL
router.get("/:id/details", invoiceController.getInvoiceDetails);

// UPDATE
router.put("/:id", verifyAccessToken, invoiceController.updateInvoice);

// DELETE
router.delete("/:id", verifyAccessToken, invoiceController.deleteInvoice);

module.exports = router;
