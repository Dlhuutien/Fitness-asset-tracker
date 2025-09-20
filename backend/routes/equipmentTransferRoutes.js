const express = require("express");
const equipmentTransferController = require("../controllers/equipmentTransferController");
const { verifyAccessToken } = require("../middlewares/authMiddleware");

const router = express.Router();

// CREATE transfer (chỉ admin+)
router.post("/", verifyAccessToken, equipmentTransferController.createTransfer);

// READ ALL
router.get("/", equipmentTransferController.getTransfers);

// READ ONE
router.get("/:id", equipmentTransferController.getTransferById);

// COMPLETE transfer (chỉ update receive date + status)
router.put("/:id/complete", verifyAccessToken, equipmentTransferController.completeTransfer);

// DELETE
router.delete("/:id", verifyAccessToken, equipmentTransferController.deleteTransfer);

module.exports = router;
