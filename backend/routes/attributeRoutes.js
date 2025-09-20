const express = require("express");
const router = express.Router();
const attributeController = require("../controllers/attributeController");

router.post("/", attributeController.createAttribute);
router.get("/", attributeController.getAttributes);
router.get("/:id", attributeController.getAttributeById);
router.put("/:id", attributeController.updateAttribute);
router.delete("/:id", attributeController.deleteAttribute);

module.exports = router;
