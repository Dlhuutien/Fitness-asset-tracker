const express = require("express");
const vendorController = require("../controllers/vendorController");

const router = express.Router();

router.post("/", vendorController.createVendor);
router.get("/", vendorController.getVendors);
router.get("/:id", vendorController.getVendorById);
router.put("/:id", vendorController.updateVendor);
router.delete("/:id", vendorController.deleteVendor);

module.exports = router;
