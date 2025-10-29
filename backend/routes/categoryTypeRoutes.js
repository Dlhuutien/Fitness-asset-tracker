const express = require("express");
const categoryTypeController = require("../controllers/categoryTypeController");
const { verifyAccessToken, requireRole } = require("../middlewares/authMiddleware");

const router = express.Router();

// Create
router.post(
  "/",
  verifyAccessToken,
  requireRole("admin", "super-admin", "operator"),
  categoryTypeController.createCategoryType
);

// Read all
router.get("/", categoryTypeController.getCategoryTypes);

// Read one
router.get("/:id", categoryTypeController.getCategoryTypeById);

// Read id category_main
router.get("/main/:category_main_id", categoryTypeController.getCategoryTypesByMainId);

// Update
router.put(
  "/:id",
  verifyAccessToken,
  requireRole("admin", "super-admin", "operator"),
  categoryTypeController.updateCategoryType
);

// Delete (admin only)
router.delete(
  "/:id",
  verifyAccessToken,
  requireRole("admin", "super-admin"),
  categoryTypeController.deleteCategoryType
);

module.exports = router;
