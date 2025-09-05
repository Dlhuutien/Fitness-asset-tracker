const userRepository = require('../repositories/userRepository');

exports.getUserInfo = async (accessToken) => {
  return await userRepository.getUserInfo({ accessToken });
};