const userRepository = require('../repositories/userRepository');

exports.signup = async (data) => {
  const { username, password, email, role } = data;
  return await userRepository.signUp(username, password, email, role);
};

exports.confirm = async (data) => {
  return await userRepository.confirmSignUp(data);
};

exports.signin = async (data) => {
  return await userRepository.signIn(data);
};

exports.refresh = async (data) => {
  return await userRepository.refreshToken(data);
};
