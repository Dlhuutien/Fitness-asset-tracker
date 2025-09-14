class User {
  constructor({ username, attributes = {} }) {
    this.username = username;
    this.email = attributes.email;
    this.name = attributes.name;
    this.gender = attributes.gender;
    this.phoneNumber = attributes.phone_number;
    this.birthdate = attributes.birthdate;
    this.address = attributes.address;
  }

  // helper để convert từ Cognito response
  static fromCognito(out) {
    const attributes = out.UserAttributes?.reduce((acc, attr) => {
      acc[attr.Name] = attr.Value;
      return acc;
    }, {}) || {};

    return new User({
      username: out.Username,
      attributes,
    });
  }
}

module.exports = User;
