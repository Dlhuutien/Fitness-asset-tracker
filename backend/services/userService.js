const userRepository = require("../repositories/userRepository");

const userService = {
  getUserInfo: async (accessToken) => {
    if (!accessToken) throw new Error("accessToken is required");
    return await userRepository.getUserInfo({ accessToken });
  },

  createUser: async (data, creatorRole) => {
    if (!creatorRole) throw new Error("creatorRole required");
    // phân quyền validate
    return await userRepository.adminCreateUser({
      ...data,
      createdByRole: creatorRole,
    });
  },

  // ===========================
  // User actions
  // ===========================
  changePassword: async (data) => {
    if (!data.accessToken || !data.oldPassword || !data.newPassword) {
      throw new Error("accessToken, oldPassword, newPassword are required");
    }
    return await userRepository.changePassword(data);
  },

  updateUserAttributes: async (data) => {
    if (
      !data.accessToken ||
      !data.attributes ||
      typeof data.attributes !== "object"
    ) {
      throw new Error("accessToken and attributes object are required");
    }
    return await userRepository.updateUserAttributes(data);
  },

  // ===========================
  // Admin / Super-admin actions
  // ===========================
  updateUserStatus: async (data) => {
    if (
      !data.username ||
      typeof data.enabled !== "boolean" ||
      !data.updatedByRole
    ) {
      throw new Error(
        "username, enabled (boolean), and updatedByRole are required"
      );
    }
    return await userRepository.updateUserStatus(data);
  },

  adminUpdateUserAttributes: async (data) => {
    if (
      !data.username ||
      !data.attributes ||
      typeof data.attributes !== "object" ||
      !data.updatedByRole
    ) {
      throw new Error(
        "username, attributes object and updatedByRole are required"
      );
    }
    return await userRepository.adminUpdateUserAttributes(data);
  },

  listUsers: async (role) => {
    if (!role) throw new Error("role is required");
    return await userRepository.listUsers({ role });
  },

  setUserRole: async (data) => {
    if (!data.username || !data.newRole || !data.updatedByRole) {
      throw new Error("username, newRole and updatedByRole are required");
    }
    return await userRepository.setUserRole(data);
  },

  // =================
  // Lấy Email 
  // =================
  getUsersByRoles: async (roles) => {
    if (!roles || (Array.isArray(roles) && roles.length === 0)) {
      throw new Error("roles is required");
    }
    return await userRepository.getUsersByRoles(roles);
  },
};

module.exports = userService;
