const express = require("express");
const vendorController = require("../controllers/vendorController");
const { verifyAccessToken, requireRole } = require("../middlewares/authMiddleware");

const router = express.Router();

// Tạo vendor
router.post(
  "/",
  verifyAccessToken,
  requireRole("admin", "super-admin", "operator"),
  vendorController.createVendor
);

router.get("/", vendorController.getVendors);

router.get("/:id", vendorController.getVendorById);

// Update vendor
router.put(
  "/:id",
  verifyAccessToken,
  requireRole("admin", "super-admin", "operator"),
  vendorController.updateVendor
);

// Delete vendor (chỉ admin, super-admin, có check ràng buộc equipment)
router.delete(
  "/:id",
  verifyAccessToken,
  requireRole("admin", "super-admin"),
  vendorController.deleteVendor
);

module.exports = router;
