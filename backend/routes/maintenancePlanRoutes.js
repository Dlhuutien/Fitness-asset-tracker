const express = require("express");
const router = express.Router();
const maintenancePlanController = require("../controllers/maintenancePlanController");
const { verifyAccessToken, requireRole } = require("../middlewares/authMiddleware");

// CREATE
router.post(
  "/",
  verifyAccessToken,
  requireRole("admin", "super-admin"),
  maintenancePlanController.create
);

// GET all
router.get("/", verifyAccessToken, maintenancePlanController.getAll);

// GET by ID
router.get("/:id", verifyAccessToken, maintenancePlanController.getById);

// GET by Equipment ID
router.get(
  "/equipment/:equipmentId",
  verifyAccessToken,
  maintenancePlanController.getByEquipmentId
);

// UPDATE
router.put(
  "/:id",
  verifyAccessToken,
  requireRole("admin", "super-admin"),
  maintenancePlanController.update
);

// DELETE
router.delete(
  "/:id",
  verifyAccessToken,
  requireRole("admin", "super-admin"),
  maintenancePlanController.delete
);

module.exports = router;
