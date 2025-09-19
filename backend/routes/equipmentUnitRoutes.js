const express = require("express");
const router = express.Router();
const equipmentUnitController = require("../controllers/equipmentUnitController");
const { verifyAccessToken } = require("../middlewares/authMiddleware");

// READ ALL
router.get("/", equipmentUnitController.getUnits);

// READ ONE
router.get("/:id", equipmentUnitController.getUnitById);

// UPDATE
router.put("/:id", verifyAccessToken, equipmentUnitController.updateUnit);

// DELETE
router.delete("/:id", verifyAccessToken, equipmentUnitController.deleteUnit);

module.exports = router;
