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
  firstLoginChangePassword: async (data) => UserModel.firstLoginChangePassword(data),
  changePassword: async (data) => UserModel.changePassword(data),
  updateUserAttributes: async (data) => UserModel.updateUserAttributes(data),

  // ===========================
  // Admin / Super-admin actions
  // ===========================
  adminCreateUser: async (data) => UserModel.adminCreateUser(data),
  updateUserStatus: async (data) => UserModel.updateUserStatus(data),
  adminUpdateUserAttributes: async (data) => UserModel.adminUpdateUserAttributes(data),
  listUsers: async (data) => UserModel.listUsers(data),
};

module.exports = userRepository;
