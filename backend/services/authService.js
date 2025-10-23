const userRepository = require("../repositories/userRepository");

const authService = {
  signUp: async (data) => {
    if (!data.username || !data.password || !data.email) {
      throw new Error("username, password, email are required");
    }
    return await userRepository.signUp(data);
  },

  confirmSignUp: async (data) => {
    if (!data.username || !data.code)
      throw new Error("username and code required");
    return await userRepository.confirmSignUp(data);
  },

  signIn: async (data) => {
    if (!data.username || !data.password)
      throw new Error("username and password required");
    return await userRepository.signIn(data);
  },

  refreshToken: async (data) => {
    if (!data.refreshToken) throw new Error("refreshToken is required");
    return await userRepository.refreshToken(data);
  },

  firstLoginChangePassword: async (data) => {
    if (!data.username || !data.newPassword || !data.session) {
      throw new Error("username, newPassword, and session are required");
    }
    return await userRepository.firstLoginChangePassword(data);
  },

  forgotPassword: async (data) => {
    if (!data.username) throw new Error("username is required");
    return await userRepository.forgotPassword(data);
  },

  confirmForgotPassword: async (data) => {
    if (!data.username || !data.code || !data.newPassword)
      throw new Error("username, code, and newPassword are required");
    return await userRepository.confirmForgotPassword(data);
  },
};

module.exports = authService;
