const UserModel = require("../models/User");

const userRepository = {
  // ===========================
  // User actions
  // ===========================
  signUp: async (data) => UserModel.signUp(data),
  confirmSignUp: async (data) => UserModel.confirmSignUp(data),
  signIn: async (data) => UserModel.signIn(data),
  refreshToken: async (data) => UserModel.refreshToken(data),
  getUserInfo: async (data) => UserModel.getUserInfo(data),
  firstLoginChangePassword: async (data) =>
    UserModel.firstLoginChangePassword(data),
  changePassword: async (data) => UserModel.changePassword(data),
  forgotPassword: async (data) => UserModel.forgotPassword(data),
  confirmForgotPassword: async (data) => UserModel.confirmForgotPassword(data),
  updateUserAttributes: async (data) => UserModel.updateUserAttributes(data),

  // ===========================
  // Admin / Super-admin actions
  // ===========================
  adminCreateUser: async (data) => UserModel.adminCreateUser(data),
  setUserRole: async (data) => UserModel.adminSetUserRole(data),
  updateUserStatus: async (data) => UserModel.updateUserStatus(data),
  adminUpdateUserAttributes: async (data) =>
    UserModel.adminUpdateUserAttributes(data),
  listUsers: async (data) => UserModel.listUsers(data),

  // ===========================
  // Lấy email
  // ===========================
  getUsersByRoles: async (roles) => UserModel.getUsersByRoles(roles),
  getUserBySub: async (sub) => UserModel.getUserBySub(sub),
};

module.exports = userRepository;
