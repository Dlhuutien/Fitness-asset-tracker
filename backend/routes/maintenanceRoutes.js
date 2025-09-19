const express = require("express");
const router = express.Router();
const maintenanceController = require("../controllers/maintenanceController");
const { verifyAccessToken } = require("../middlewares/authMiddleware");

// CREATE (operator/admin/super-admin, hoặc technician khi In Progress)
router.post("/", verifyAccessToken, maintenanceController.create);

// GET
router.get("/", maintenanceController.getAll);
router.get("/:id", maintenanceController.getById);

// UPDATE status
router.put("/:id/progress", verifyAccessToken, maintenanceController.progress);
router.put("/:id/complete", verifyAccessToken, maintenanceController.complete);

// DELETE
router.delete("/:id", verifyAccessToken, maintenanceController.delete);

module.exports = router;
