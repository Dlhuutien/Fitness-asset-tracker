const express = require("express");
const branchController = require("../controllers/branchController");
const { verifyAccessToken } = require("../middlewares/authMiddleware");

const router = express.Router();

// CREATE
router.post("/", verifyAccessToken, branchController.createBranch);

// READ ALL
router.get("/", branchController.getBranches);

// READ ONE
router.get("/:id", branchController.getBranchById);

// UPDATE
router.put("/:id", verifyAccessToken, branchController.updateBranch);

// DELETE
router.delete("/:id", verifyAccessToken, branchController.deleteBranch);

module.exports = router;
