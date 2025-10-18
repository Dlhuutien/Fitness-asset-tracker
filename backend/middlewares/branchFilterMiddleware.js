function branchFilterMiddleware(req, res, next) {
  try {
    const user = req.user;
    let branchFilter = null;

    if (user && user.role !== "super-admin") {
      branchFilter =
        user.branch_id ||
        user["custom:branch_id"] ||
        user?.attributes?.["custom:branch_id"] ||
        null;
    }

    req.branchFilter = branchFilter;
    next();
  } catch (err) {
    return res.status(400).json({
      error: "Failed to resolve branch filter",
      message: err.message,
    });
  }
}

module.exports = branchFilterMiddleware;
