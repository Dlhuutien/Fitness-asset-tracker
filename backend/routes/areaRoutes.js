const express = require("express");
const areaController = require("../controllers/areaController");
const { verifyAccessToken } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", verifyAccessToken, areaController.createArea);
router.get("/", areaController.getAreas);
router.get("/:id", areaController.getAreaById);
router.put("/:id", verifyAccessToken, areaController.updateArea);
router.delete("/:id", verifyAccessToken, areaController.deleteArea);

module.exports = router;
