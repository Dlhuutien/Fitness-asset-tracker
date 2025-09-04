const userRepository = require('../repositories/userRepository');

exports.createUser = async (data) => {
  return await userRepository.adminCreateUser(data);
};
