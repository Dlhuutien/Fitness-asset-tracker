const express = require("express");
const router = express.Router();
const maintenanceController = require("../controllers/maintenanceController");
const { verifyAccessToken, requireRole } = require("../middlewares/authMiddleware");

// CREATE
router.post(
  "/",
  verifyAccessToken,
  requireRole("super-admin", "admin", "operator", "technician"),
  maintenanceController.create
);

// GET
router.get("/", maintenanceController.getAll);
router.get("/:id", maintenanceController.getById);

// UPDATE status
router.put(
  "/:id/progress",
  verifyAccessToken,
  requireRole("super-admin", "admin", "technician"),
  maintenanceController.progress
);

router.put(
  "/:id/complete",
  verifyAccessToken,
  requireRole("super-admin", "admin", "technician"),
  maintenanceController.complete
);

// DELETE
router.delete(
  "/:id",
  verifyAccessToken,
  requireRole("super-admin", "admin"),
  maintenanceController.delete
);

module.exports = router;
