const { cip, secretHash, CLIENT_ID, USER_POOL_ID, CLIENT_SECRET } = require('../utils/aws-helper');
const {
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  GetUserCommand,
  AdminAddUserToGroupCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  RespondToAuthChallengeCommand,
  ChangePasswordCommand,
  UpdateUserAttributesCommand,
  ListUsersCommand,
  AdminUpdateUserAttributesCommand,
  AdminGetUserCommand,
  AdminEnableUserCommand,
  AdminDisableUserCommand,
  AdminListGroupsForUserCommand 
} = require('@aws-sdk/client-cognito-identity-provider');

const now = new Date().toISOString();
exports.signUp = async (username, password, email, role, extra) => {
  const params = {
    ClientId: CLIENT_ID,
    Username: username,
    Password: password,
    SecretHash: secretHash(username),
    UserAttributes: [
      { Name: 'email', Value: email },
      { Name: 'name', Value: extra.name },
      { Name: 'gender', Value: extra.gender },
      { Name: 'phone_number', Value: extra.phone_number }, // định dạng +84...
      { Name: 'birthdate', Value: extra.birthdate },       // yyyy-mm-dd
      { Name: 'address', Value: extra.address },
      { Name: 'custom:branch_id', Value: extra.branch_id || '' },
      { Name: 'custom:created_at', Value: now },
      { Name: 'custom:updated_at', Value: now },
    ],
  };

  const out = await cip.send(new SignUpCommand(params));

  if (role) {
    await cip.send(new AdminAddUserToGroupCommand({
      GroupName: role,
      Username: username,
      UserPoolId: USER_POOL_ID,
    }));
  }

  return { message: 'signed up', userConfirmed: out.UserConfirmed };
};

/**
 * User xác nhận email (chỉ dùng cho đăng ký)
 */
exports.confirmSignUp = async ({ username, code, role }) => {
  await cip.send(new ConfirmSignUpCommand({
    ClientId: CLIENT_ID,
    Username: username,
    ConfirmationCode: code,
    SecretHash: secretHash(username),
  }));

  if (role) {
    await cip.send(new AdminAddUserToGroupCommand({
      GroupName: role,
      Username: username,
      UserPoolId: USER_POOL_ID,
    }));
  }

  return { message: 'account confirmed' };
};

/**
 * User đăng nhập
 */
exports.signIn = async ({ username, password }) => {
  const params = {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: CLIENT_ID,
    AuthParameters: { USERNAME: username, PASSWORD: password },
  };
  const sh = secretHash(username);
  if (sh) params.AuthParameters.SECRET_HASH = sh;

  const out = await cip.send(new InitiateAuthCommand(params));

  // Nếu là user cũ (login bình thường)
  if (out.AuthenticationResult) {
    const tokens = out.AuthenticationResult;
    return {
      mode: "normal", // login thành công bình thường
      idToken: tokens.IdToken,
      accessToken: tokens.AccessToken,
      refreshToken: tokens.RefreshToken,
      expiresIn: tokens.ExpiresIn,
      tokenType: tokens.TokenType,
    };
  }

  // Nếu là user mới (chưa đổi mật khẩu, Cognito bắt đổi)
  if (out.ChallengeName === "NEW_PASSWORD_REQUIRED") {
    return {
      mode: "new_password_required",
      session: out.Session,  // cần session này để gọi RespondToAuthChallenge
      username,
      message: "Password change required on first login"
    };
  }

  throw new Error("Unsupported authentication challenge");
};

/**
 * Lấy access token mới
 */
exports.refreshToken = async ({ refreshToken, username }) => {
  const params = {
    AuthFlow: 'REFRESH_TOKEN_AUTH',
    ClientId: CLIENT_ID,
    AuthParameters: { REFRESH_TOKEN: refreshToken },
  };
  const sh = username ? secretHash(username) : undefined;
  if (sh) params.AuthParameters.SECRET_HASH = sh;

  const out = await cip.send(new InitiateAuthCommand(params));
  const tokens = out.AuthenticationResult;
  return {
    idToken: tokens.IdToken,
    accessToken: tokens.AccessToken,
    expiresIn: tokens.ExpiresIn,
    tokenType: tokens.TokenType,
  };
};

/**
 * User lấy thông tin cá nhân
 */
exports.getUserInfo = async ({ accessToken }) => {
  const out = await cip.send(new GetUserCommand({
    AccessToken: accessToken,
  }));

  return {
    username: out.Username,
    userAttributes: out.UserAttributes.reduce((acc, attr) => {
      acc[attr.Name] = attr.Value;
      return acc;
    }, {}),
  };
};

/**
 * Admin/Super-admin tạo tài khoản nhân viên
 */
exports.adminCreateUser = async ({ username, email, role, extra, createdByRole }) => {
  if (!username || !email || !role) {
    throw new Error("username, email, and role are required");
  }

  // Rule phân quyền: ai được phép tạo ai
  const allowedRoles = {
    "super-admin": ["admin", "operator", "technician"],
    "admin": ["operator", "technician"],
  };

  if (!allowedRoles[createdByRole] || !allowedRoles[createdByRole].includes(role)) {
    throw new Error(`${createdByRole} is not allowed to create a user with role ${role}`);
  }

  // Tạo user trong Cognito (với mật khẩu tạm thời và gửi email)
  await cip.send(new AdminCreateUserCommand({
    UserPoolId: USER_POOL_ID,
    Username: username,
    // TemporaryPassword: "FitXGym", // mật khẩu mặc định
    UserAttributes: [
      { Name: "email", Value: email },
      { Name: "email_verified", Value: "false" },
      { Name: "name", Value: extra?.name || "" },
      { Name: "gender", Value: extra?.gender || "" },
      { Name: "phone_number", Value: extra?.phone_number || "" },
      { Name: "birthdate", Value: extra?.birthdate || "" },
      { Name: "address", Value: extra?.address || "" },
      { Name: "custom:branch_id", Value: extra?.branch_id || "" },
      { Name: "custom:created_at", Value: new Date().toISOString() },
      { Name: "custom:updated_at", Value: new Date().toISOString() },
    ],
    DesiredDeliveryMediums: ["EMAIL"], // Cognito gửi email
    ForceAliasCreation: false,
  }));

  // Thêm user vào group (role)
  await cip.send(new AdminAddUserToGroupCommand({
    GroupName: role,
    Username: username,
    UserPoolId: USER_POOL_ID,
  }));

  return { message: "Admin created user", username, role };
};

/**
 * User lầm đầu đăng nhập -> sang thay đổi mk
 */
exports.firstLoginChangePassword = async ({ username, newPassword, session }) => {
  const resp = await cip.send(new RespondToAuthChallengeCommand({
    ClientId: CLIENT_ID,
    ChallengeName: "NEW_PASSWORD_REQUIRED",
    Session: session,
    ChallengeResponses: {
      USERNAME: username,
      NEW_PASSWORD: newPassword,
      SECRET_HASH: secretHash(username), 
    },
  }));

  const tokens = resp.AuthenticationResult;
  return {
    message: "Password updated successfully",
    idToken: tokens.IdToken,
    accessToken: tokens.AccessToken,
    refreshToken: tokens.RefreshToken,
    expiresIn: tokens.ExpiresIn,
    tokenType: tokens.TokenType,
  };
};

/**
 * User thay đổi mật khẩu
 */
exports.changePassword = async ({ accessToken, oldPassword, newPassword }) => {
  const resp = await cip.send(new ChangePasswordCommand({
    AccessToken: accessToken,
    PreviousPassword: oldPassword,
    ProposedPassword: newPassword,
  }));

  return { message: "Password changed successfully", resp };
};

/**
 * User cập nhật thông tin
 */
exports.updateUserAttributes = async ({ accessToken, attributes }) => {
  const formattedAttrs = Object.entries(attributes).map(([key, value]) => ({
    Name: key,
    Value: value,
  }));

  await cip.send(new UpdateUserAttributesCommand({
    AccessToken: accessToken,
    UserAttributes: formattedAttrs,
  }));

  return { message: "User information updated successfully" };
};

/**
 * Admin/Super-admin thay đổi status (Active = enabled, Inactive = disabled)
 */
exports.updateUserStatus = async ({ username, enabled, updatedByRole }) => {
  if (typeof enabled !== "boolean") {
    throw new Error("enabled must be boolean (true/false)");
  }

  // Lấy role của user bị đổi (targetRole)
  const resp = await cip.send(new AdminGetUserCommand({
    UserPoolId: USER_POOL_ID,
    Username: username
  }));

  const targetRole = resp.UserAttributes.find(
    (attr) => attr.Name === "cognito:groups"
  )?.Value;

  // Chỉ có admin, super-admin mới set
  if (!["admin", "super-admin"].includes(updatedByRole)) {
    throw new Error(`${updatedByRole} is not allowed to change user status`);
  }

  // Rule phân quyền
  if (updatedByRole === "admin" && ["admin", "super-admin"].includes(targetRole)) {
    throw new Error("Admin cannot change status of another admin or super-admin");
  }

  if (enabled) {
    await cip.send(new AdminEnableUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
    }));
  } else {
    await cip.send(new AdminDisableUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
     UserAttributes: [
      { Name: "custom:updated_at", Value: new Date().toISOString() }
    ]
  }));
  }

  return { message: `User ${username} ${enabled ? "enabled" : "disabled"} successfully` };
};


/**
 * Admin/Super-admin cập nhật attribute của user khác
 */
exports.adminUpdateUserAttributes = async ({ username, attributes, updatedByRole }) => {
  if (!username || !attributes || typeof attributes !== "object") {
    throw new Error("username and attributes are required");
  }

  // Lấy groups của user target
  const groupResp = await cip.send(new AdminListGroupsForUserCommand({
    UserPoolId: USER_POOL_ID,
    Username: username,
  }));

  const targetRole = groupResp.Groups?.[0]?.GroupName; // lấy group đầu tiên

  if (!targetRole) {
    throw new Error(`User ${username} does not belong to any group`);
  }

  // Quy tắc phân quyền update
  const allowedUpdate = {
    "admin": ["technician", "operator"],
    "super-admin": ["admin", "technician", "operator"]
  };

  if (!allowedUpdate[updatedByRole] || !allowedUpdate[updatedByRole].includes(targetRole)) {
    throw new Error(`${updatedByRole} is not allowed to update a user with role ${targetRole}`);
  }

  // Thêm updated_at
  const formattedAttrs = [
    ...Object.entries(attributes).map(([key, value]) => ({ Name: key, Value: value })),
    { Name: "custom:updated_at", Value: new Date().toISOString() }
  ];

  await cip.send(new AdminUpdateUserAttributesCommand({
    UserPoolId: USER_POOL_ID,
    Username: username,
    UserAttributes: formattedAttrs
  }));

  return {
    message: `User ${username} attributes updated successfully`,
    updatedAttributes: formattedAttrs.reduce((acc, attr) => {
      acc[attr.Name] = attr.Value;
      return acc;
    }, {}),
  };
};

/**
 * Admin/Super-admin xem danh sách user
 */
exports.listUsers = async ({ role }) => {
  if (!["admin", "super-admin"].includes(role)) {
    throw new Error(`${role} is not allowed to list users`);
  }

  const resp = await cip.send(new ListUsersCommand({
    UserPoolId: USER_POOL_ID,
    Limit: 20, // phân trang
  }));

  const users = resp.Users.map(user => ({
    username: user.Username,
    status: user.UserStatus,
    enabled: user.Enabled,
    createdAt: user.UserCreateDate,
    updatedAt: user.UserLastModifiedDate,
    attributes: user.Attributes.reduce((acc, attr) => {
      acc[attr.Name] = attr.Value;
      return acc;
    }, {}),
  }));

  return { users };
};