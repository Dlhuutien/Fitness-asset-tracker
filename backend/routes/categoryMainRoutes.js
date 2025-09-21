const express = require("express");
const upload = require("../middlewares/upload");
const categoryController = require("../controllers/categoryMainController");
const { verifyAccessToken, requireRole } = require("../middlewares/authMiddleware");

const router = express.Router();

// Tạo category (chỉ admin, super-admin)
router.post(
  "/",
  verifyAccessToken,
  requireRole("admin", "super-admin"),
  upload,
  categoryController.createCategory
);

router.get("/", categoryController.getCategories);

router.get("/:id", categoryController.getCategoryById);

// Update category (chỉ admin, super-admin)
router.put(
  "/:id",
  verifyAccessToken,
  requireRole("admin", "super-admin"),
  upload,
  categoryController.updateCategory
);

// Xóa category (chỉ admin, super-admin)
router.delete(
  "/:id",
  verifyAccessToken,
  requireRole("admin", "super-admin"),
  categoryController.deleteCategory
);

module.exports = router;
