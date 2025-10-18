const express = require("express");
const equipmentTransferController = require("../controllers/equipmentTransferController");
const {
  verifyAccessToken,
  requireRole,
} = require("../middlewares/authMiddleware");
const branchFilterMiddleware = require("../middlewares/branchFilterMiddleware");

const router = express.Router();

// CREATE transfer
router.post("/", verifyAccessToken, equipmentTransferController.createTransfer);

// READ ALL
router.get(
  "/",
  verifyAccessToken,
  branchFilterMiddleware,
  equipmentTransferController.getTransfers
);

// GET transfers by status (e.g., Completed)
router.get(
  "/status/:status",
  verifyAccessToken,
  branchFilterMiddleware,
  equipmentTransferController.getTransfersByStatus
);

// READ ONE
router.get("/:id", equipmentTransferController.getTransferById);

// COMPLETE transfer (chỉ update receive date + status)
router.put(
  "/:id/complete",
  verifyAccessToken,
  equipmentTransferController.completeTransfer
);

// DELETE
router.delete(
  "/:id",
  verifyAccessToken,
  equipmentTransferController.deleteTransfer
);

module.exports = router;
