const express = require("express");
const floorController = require("../controllers/floorController");
const { verifyAccessToken } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", verifyAccessToken, floorController.createFloor);
router.get("/", floorController.getFloors);
router.get("/:id", floorController.getFloorById);
router.put("/:id", verifyAccessToken, floorController.updateFloor);
router.delete("/:id", verifyAccessToken, floorController.deleteFloor);

module.exports = router;
