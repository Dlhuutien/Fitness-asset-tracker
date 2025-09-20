const userRepository = require('../repositories/userRepository');

exports.getUserInfo = async (accessToken) => {
  return await userRepository.getUserInfo({ accessToken });
};

exports.createUser = async (data, creatorRole) => {
  return await userRepository.adminCreateUser({
    ...data,
    createdByRole: creatorRole,
  });
};

exports.changePassword = async (accessToken, oldPassword, newPassword) => {
  return await userRepository.changePassword({ accessToken, oldPassword, newPassword });
};

exports.updateUserAttributes = async (accessToken, attributes) => {
  return await userRepository.updateUserAttributes({ accessToken, attributes });
};

exports.updateUserStatus = async ({ username, enabled, updatedByRole }) => {
  return await userRepository.updateUserStatus({ username, enabled, updatedByRole });
};

exports.listUsers = async (role) => {
  return await userRepository.listUsers({ role });
};

exports.adminUpdateUserAttributes = async ({ username, attributes, updatedByRole }) => {
  return await userRepository.adminUpdateUserAttributes({ username, attributes, updatedByRole });
};