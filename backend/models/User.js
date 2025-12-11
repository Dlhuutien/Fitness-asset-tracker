const {
  cip,
  secretHash,
  CLIENT_ID,
  USER_POOL_ID,
} = require("../utils/aws-helper");

const {
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  GetUserCommand,
  AdminAddUserToGroupCommand,
  AdminCreateUserCommand,
  RespondToAuthChallengeCommand,
  ChangePasswordCommand,
  UpdateUserAttributesCommand,
  ListUsersCommand,
  AdminUpdateUserAttributesCommand,
  AdminGetUserCommand,
  AdminEnableUserCommand,
  AdminDisableUserCommand,
  AdminListGroupsForUserCommand,
  AdminRemoveUserFromGroupCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const now = () => new Date().toISOString();

const UserModel = {
  // ================================
  // User actions
  // ================================
  signUp: async ({ username, password, email, role, extra }) => {
    const params = {
      ClientId: CLIENT_ID,
      Username: username,
      Password: password,
      SecretHash: secretHash(username),
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "name", Value: extra.name },
        { Name: "gender", Value: extra.gender },
        { Name: "phone_number", Value: extra.phone_number },
        { Name: "birthdate", Value: extra.birthdate },
        { Name: "address", Value: extra.address },
        { Name: "custom:branch_id", Value: extra.branch_id || "" },
        { Name: "custom:created_at", Value: now() },
        { Name: "custom:updated_at", Value: now() },
      ],
    };

    const out = await cip.send(new SignUpCommand(params));

    if (role) {
      await cip.send(
        new AdminAddUserToGroupCommand({
          GroupName: role,
          Username: username,
          UserPoolId: USER_POOL_ID,
        })
      );
    }

    return { message: "signed up", userConfirmed: out.UserConfirmed };
  },

  confirmSignUp: async ({ username, code, role }) => {
    await cip.send(
      new ConfirmSignUpCommand({
        ClientId: CLIENT_ID,
        Username: username,
        ConfirmationCode: code,
        SecretHash: secretHash(username),
      })
    );

    if (role) {
      await cip.send(
        new AdminAddUserToGroupCommand({
          GroupName: role,
          Username: username,
          UserPoolId: USER_POOL_ID,
        })
      );
    }

    return { message: "account confirmed" };
  },

  signIn: async ({ username, password }) => {
    const params = {
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: CLIENT_ID,
      AuthParameters: { USERNAME: username, PASSWORD: password },
    };

    const sh = secretHash(username);
    if (sh) params.AuthParameters.SECRET_HASH = sh;

    const out = await cip.send(new InitiateAuthCommand(params));

    if (out.AuthenticationResult) {
      const tokens = out.AuthenticationResult;
      return {
        mode: "normal",
        idToken: tokens.IdToken,
        accessToken: tokens.AccessToken,
        refreshToken: tokens.RefreshToken,
        expiresIn: tokens.ExpiresIn,
        tokenType: tokens.TokenType,
      };
    }

    if (out.ChallengeName === "NEW_PASSWORD_REQUIRED") {
      return {
        mode: "new_password_required",
        session: out.Session,
        username,
        message: "Password change required on first login",
      };
    }

    throw new Error("Unsupported authentication challenge");
  },

  refreshToken: async ({ refreshToken, username }) => {
    const params = {
      AuthFlow: "REFRESH_TOKEN_AUTH",
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
  },

  getUserInfo: async ({ accessToken }) => {
    const out = await cip.send(
      new GetUserCommand({ AccessToken: accessToken })
    );
    return {
      username: out.Username,
      userAttributes: out.UserAttributes.reduce((acc, attr) => {
        acc[attr.Name] = attr.Value;
        return acc;
      }, {}),
    };
  },

  firstLoginChangePassword: async ({ username, newPassword, session }) => {
    if (!username || !newPassword || !session) {
      throw new Error("username, newPassword, and session are required");
    }

    const resp = await cip.send(
      new RespondToAuthChallengeCommand({
        ClientId: CLIENT_ID,
        ChallengeName: "NEW_PASSWORD_REQUIRED",
        Session: session,
        ChallengeResponses: {
          USERNAME: username,
          NEW_PASSWORD: newPassword,
          SECRET_HASH: secretHash(username),
        },
      })
    );

    const tokens = resp.AuthenticationResult;
    return {
      message: "Password updated successfully",
      idToken: tokens.IdToken,
      accessToken: tokens.AccessToken,
      refreshToken: tokens.RefreshToken,
      expiresIn: tokens.ExpiresIn,
      tokenType: tokens.TokenType,
    };
  },

  changePassword: async ({ accessToken, oldPassword, newPassword }) => {
    if (!accessToken || !oldPassword || !newPassword) {
      throw new Error("Bạn cần cung cấp accessToken, mật khẩu cũ và mật khẩu mới");
    }

    const resp = await cip.send(
      new ChangePasswordCommand({
        AccessToken: accessToken,
        PreviousPassword: oldPassword,
        ProposedPassword: newPassword,
      })
    );

    return { message: "Password changed successfully", resp };
  },

  forgotPassword: async ({ username, email }) => {
    if (!username || !email) {
      throw new Error("Bạn cần cung cấp username và email");
    }

    // ⚙️ Kiểm tra xem email của user có khớp trong Cognito không
    let userResp;
    try {
      userResp = await cip.send(
        new AdminGetUserCommand({
          UserPoolId: USER_POOL_ID,
          Username: username,
        })
      );
    } catch (err) {
      throw new Error("Không tìm thấy người dùng");
    }

    const emailAttr = userResp.UserAttributes.find((a) => a.Name === "email");
    if (!emailAttr || emailAttr.Value.toLowerCase() !== email.toLowerCase()) {
      throw new Error("Email không trùng khớp với tài khoản");
    }

    // ✅ Gửi mã đặt lại mật khẩu
    const params = {
      ClientId: CLIENT_ID,
      Username: username,
      SecretHash: secretHash(username),
    };

    const out = await cip.send(new ForgotPasswordCommand(params));

    return {
      message: "Password reset code sent to your email",
      delivery: out.CodeDeliveryDetails,
    };
  },

  confirmForgotPassword: async ({ username, code, newPassword }) => {
    if (!username || !code || !newPassword) {
      throw new Error("Bạn cần cung cấp username, mã xác nhận và mật khẩu mới");
    }
    const params = {
      ClientId: CLIENT_ID,
      Username: username,
      ConfirmationCode: code,
      Password: newPassword,
      SecretHash: secretHash(username),
    };
    await cip.send(new ConfirmForgotPasswordCommand(params));
    return { message: "Password reset successfully" };
  },

  updateUserAttributes: async ({ accessToken, attributes }) => {
    if (!accessToken || !attributes || typeof attributes !== "object") {
      throw new Error("accessToken and attributes object are required");
    }

    const formattedAttrs = Object.entries(attributes).map(([key, value]) => ({
      Name: key,
      Value: value,
    }));

    await cip.send(
      new UpdateUserAttributesCommand({
        AccessToken: accessToken,
        UserAttributes: formattedAttrs,
      })
    );

    return { message: "User information updated successfully" };
  },

  // ================================
  // Admin / Super-admin actions
  // ================================
  adminCreateUser: async ({ username, email, role, extra }) => {
    const out = await cip.send(
      new AdminCreateUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "email_verified", Value: "true" },
          { Name: "name", Value: extra.name || "" },
          { Name: "gender", Value: extra.gender || "" },
          { Name: "phone_number", Value: extra.phone_number || "" },
          { Name: "birthdate", Value: extra.birthdate || "" },
          { Name: "address", Value: extra.address || "" },
          { Name: "custom:branch_id", Value: extra.branch_id || "" },
          { Name: "custom:created_at", Value: now() },
          { Name: "custom:updated_at", Value: now() },
        ],
        DesiredDeliveryMediums: ["EMAIL"],
        ForceAliasCreation: false,
      })
    );

    await cip.send(
      new AdminAddUserToGroupCommand({
        GroupName: role,
        Username: username,
        UserPoolId: USER_POOL_ID,
      })
    );

    return { message: "Admin created user", username, role };
  },

  updateUserStatus: async ({ username, enabled, updatedByRole }) => {
    if (!username || typeof enabled !== "boolean" || !updatedByRole) {
      throw new Error(
        "username, enabled (boolean), and updatedByRole are required"
      );
    }

    const resp = await cip.send(
      new AdminGetUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
      })
    );

    const targetRole =
      resp.UserAttributes.find((attr) => attr.Name === "cognito:groups")
        ?.Value || null;

    if (!["admin", "super-admin"].includes(updatedByRole)) {
      throw new Error(`${updatedByRole} is not allowed to change user status`);
    }

    if (
      updatedByRole === "admin" &&
      ["admin", "super-admin"].includes(targetRole)
    ) {
      throw new Error(
        "Admin cannot change status of another admin or super-admin"
      );
    }

    if (enabled) {
      await cip.send(
        new AdminEnableUserCommand({
          UserPoolId: USER_POOL_ID,
          Username: username,
        })
      );
    } else {
      await cip.send(
        new AdminDisableUserCommand({
          UserPoolId: USER_POOL_ID,
          Username: username,
        })
      );
    }

    return {
      message: `User ${username} ${
        enabled ? "enabled" : "disabled"
      } successfully`,
    };
  },

  adminUpdateUserAttributes: async ({
    username,
    attributes,
    updatedByRole,
  }) => {
    if (
      !username ||
      !attributes ||
      typeof attributes !== "object" ||
      !updatedByRole
    ) {
      throw new Error(
        "username, attributes object and updatedByRole are required"
      );
    }

    const groupResp = await cip.send(
      new AdminListGroupsForUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
      })
    );

    const targetRole = groupResp.Groups?.[0]?.GroupName;
    if (!targetRole)
      throw new Error(`User ${username} does not belong to any group`);

    const allowedUpdate = {
      admin: ["technician", "operator"],
      "super-admin": ["admin", "technician", "operator"],
    };

    if (
      !allowedUpdate[updatedByRole] ||
      !allowedUpdate[updatedByRole].includes(targetRole)
    ) {
      throw new Error(
        `${updatedByRole} is not allowed to update a user with role ${targetRole}`
      );
    }

    const formattedAttrs = [
      ...Object.entries(attributes).map(([key, value]) => ({
        Name: key,
        Value: value,
      })),
      { Name: "custom:updated_at", Value: now() },
    ];

    await cip.send(
      new AdminUpdateUserAttributesCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
        UserAttributes: formattedAttrs,
      })
    );

    return {
      message: `User ${username} attributes updated successfully`,
      updatedAttributes: formattedAttrs.reduce((acc, attr) => {
        acc[attr.Name] = attr.Value;
        return acc;
      }, {}),
    };
  },

  listUsers: async ({ role }) => {
    if (!["admin", "super-admin"].includes(role)) {
      throw new Error(`${role} is not allowed to list users`);
    }

    // Lấy danh sách user
    const resp = await cip.send(
      new ListUsersCommand({
        UserPoolId: USER_POOL_ID,
        Limit: 20,
      })
    );

    const users = [];

    for (const user of resp.Users) {
      // Lấy nhóm (role) của user
      const groupResp = await cip.send(
        new AdminListGroupsForUserCommand({
          UserPoolId: USER_POOL_ID,
          Username: user.Username,
        })
      );

      const userRole = groupResp.Groups?.map((g) => g.GroupName) || [];

      users.push({
        username: user.Username,
        status: user.UserStatus,
        enabled: user.Enabled,
        createdAt: user.UserCreateDate,
        updatedAt: user.UserLastModifiedDate,
        attributes: user.Attributes.reduce((acc, attr) => {
          acc[attr.Name] = attr.Value;
          return acc;
        }, {}),
        roles: userRole,
      });
    }

    return { users };
  },

  adminSetUserRole: async ({ username, newRole, updatedByRole }) => {
    if (!["admin", "super-admin"].includes(updatedByRole)) {
      throw new Error(`${updatedByRole} is not allowed to set roles`);
    }

    // Với admin thì chỉ được gán role cho technician / operator
    if (
      updatedByRole === "admin" &&
      !["technician", "operator"].includes(newRole)
    ) {
      throw new Error("Admin can only set role to technician or operator");
    }

    // Xoá tất cả role cũ trước (Cognito user có thể thuộc nhiều group)
    const groupsResp = await cip.send(
      new AdminListGroupsForUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
      })
    );

    for (const g of groupsResp.Groups || []) {
      await cip.send(
        new AdminRemoveUserFromGroupCommand({
          UserPoolId: USER_POOL_ID,
          Username: username,
          GroupName: g.GroupName,
        })
      );
    }

    // Thêm role mới
    await cip.send(
      new AdminAddUserToGroupCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
        GroupName: newRole,
      })
    );

    return { message: `Role of ${username} set to ${newRole}` };
  },

  // =====================================
  // Lấy email của user
  // =====================================
  getUsersByRoles: async (roles) => {
    if (!Array.isArray(roles)) roles = [roles];

    // 1. Lấy toàn bộ users trong pool
    const resp = await cip.send(
      new ListUsersCommand({
        UserPoolId: USER_POOL_ID,
        Limit: 60,
      })
    );

    const emails = [];

    for (const user of resp.Users) {
      // 2. Lấy danh sách group (role) của user
      const groupResp = await cip.send(
        new AdminListGroupsForUserCommand({
          UserPoolId: USER_POOL_ID,
          Username: user.Username,
        })
      );

      const userRoles = groupResp.Groups?.map((g) => g.GroupName) || [];

      // 3. Nếu user có role nằm trong roles yêu cầu → lấy email
      if (userRoles.some((r) => roles.includes(r))) {
        const emailAttr = user.Attributes.find((a) => a.Name === "email");
        const subAttr = user.Attributes.find((a) => a.Name === "sub");

        if (emailAttr) {
          emails.push({
            username: user.Username,
            sub: subAttr?.Value,
            email: emailAttr.Value,
            roles: userRoles,
          });
        }
      }
    }

    return emails;
  },

  /***
   * Lấy user từ sub(id)
   */
  getUserBySub: async (sub) => {
    if (!sub) throw new Error("sub is required");

    const resp = await cip.send(
      new ListUsersCommand({
        UserPoolId: USER_POOL_ID,
        Filter: `sub = "${sub}"`,
        Limit: 1,
      })
    );

    const user = resp.Users?.[0];
    if (!user) return null;

    const attrs = user.Attributes.reduce((acc, attr) => {
      acc[attr.Name] = attr.Value;
      return acc;
    }, {});

    return {
      username: user.Username,
      attributes: attrs,
    };
  },
};

module.exports = UserModel;
