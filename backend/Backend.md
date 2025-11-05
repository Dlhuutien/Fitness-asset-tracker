### Fitness-asset-tracker

> Ngôn ngữ: **Tiếng Việt**.
> Xác thực: **Cognito** (JWT accessToken) — header `Authorization: Bearer <accessToken>`.
> Roles (Cognito Groups): `super-admin`, `admin`, `operator`, `technician`.

---

# Mục lục

1. [Thiết lập ban đầu](#thiết-lập-ban-đầu)

2. [Auth APIs (`/auth`)](#auth-apis-auth)

   - `POST /auth/signup` — Signup
   - `POST /auth/confirm` — Confirm sign up
   - `POST /auth/signin` — Sign in
   - `POST /auth/refresh` — Refresh token
   - `POST /auth/firstLogin` — NEW_PASSWORD_REQUIRED (first login change password)
   - `POST /auth/forgotPassword` — Gửi mã xác nhận quên mật khẩu
   - `POST /auth/confirmForgotPassword` — Xác nhận mã và đặt lại mật khẩu mới

3. [User APIs (`/user`)](#user-apis-user)

   - `GET /user/me` — Lấy thông tin user hiện tại (token + attributes)
   - `POST /user/create` — Admin/Super-admin tạo user mới
   - `POST /user/change-password` — Đổi mật khẩu
   - `PUT /user/update-info` — Cập nhật thông tin cá nhân
   - `PUT /user/change-status` — Admin/Super-admin bật/tắt user
   - `PUT /user/admin-update-user` — Admin/Super-admin cập nhật thông tin user khác
   - `PUT /user/set-role` — Admin/Super-admin thay đổi role của user
   - `GET /user/list-user` — Admin/Super-admin lấy danh sách user kèm role
   - `GET /user/admin-only` — Test API chỉ admin/super-admin truy cập
   - `GET /user/super-admin-only` — Test API chỉ super-admin truy cập
   - `GET /user/tech-or-operator` — Test API cho technician/operator/admin/super-admin

4. [Lỗi thường gặp](#lỗi-thường-gặp)

5. [Vendor APIs (`/vendor`)](#vendor-apis-vendor)

   - `POST /vendor` — Tạo vendor
   - `GET /vendor` — Lấy danh sách vendor
   - `GET /vendor/:id` — Lấy chi tiết vendor
   - `PUT /vendor/:id` — Cập nhật vendor
   - `DELETE /vendor/:id` — Xóa vendor

6. [Branch APIs (`/branch`)](#branch-apis-branch)

   - `POST /branch` — Tạo branch
   - `GET /branch` — Lấy danh sách branch
   - `GET /branch/:id` — Lấy chi tiết branch
   - `PUT /branch/:id` — Cập nhật branch
   - `DELETE /branch/:id` — Xóa branch

7. [Category Main APIs (`/categoryMain`)](#category-main-apis-categorymain)

   - `POST /categoryMain` — Tạo category main
   - `GET /categoryMain` — Lấy danh sách category main
   - `GET /categoryMain/:id` — Lấy chi tiết category main
   - `PUT /categoryMain/:id` — Cập nhật category main
   - `DELETE /categoryMain/:id` — Xóa category main

8. [Category Type APIs (`/categoryType`)](#category-type-apis-categorytype)

   - `POST /categoryType` — Tạo category type
   - `GET /categoryType` — Lấy danh sách category type
   - `GET /categoryType/:id` — Lấy chi tiết category type
   - `GET /categoryType/main/:category_main_id` — Lấy category type theo category main
   - `PUT /categoryType/:id` — Cập nhật category type
   - `DELETE /categoryType/:id` — Xóa category type

9. [Attribute APIs (`/attribute`)](#attribute-apis-attribute)

   - `POST /attribute` — Tạo attribute
   - `GET /attribute` — Lấy danh sách attribute
   - `GET /attribute/:id` — Lấy chi tiết attribute
   - `PUT /attribute/:id` — Cập nhật attribute
   - `DELETE /attribute/:id` — Xóa attribute

10. [Attribute Value APIs (`/attributeValue`)](#attribute-value-apis-attributevalue)

    - `POST /attributeValue` — Tạo attribute value
    - `GET /attributeValue` — Lấy danh sách attribute value
    - `GET /attributeValue/:id` — Lấy chi tiết attribute value
    - `GET /attributeValue/equipment/:equipment_id` — Lấy attribute value theo equipment
    - `GET /attributeValue/attribute/:attribute_id` — Lấy attribute value theo attribute
    - `PUT /attributeValue/:id` — Cập nhật attribute value
    - `DELETE /attributeValue/:id` — Xóa attribute value

11. [Equipment APIs (`/equipment`)](#equipment-apis-equipment)

    - `POST /equipment` — Tạo equipment
    - `GET /equipment` — Lấy danh sách equipment
    - `GET /equipment/:id` — Lấy chi tiết equipment
    - `GET /equipment/categoryType/:category_type_id` — Lấy equipment theo category_type_id
    - `GET /equipment/vendor/:vendor_id` — Lấy equipment theo vendor_id
    - `PUT /equipment/:id` — Cập nhật equipment
    - `DELETE /equipment/:id` — Xóa equipment

12. [Invoice APIs (`/invoice`)](#invoice-apis-invoice)

    - `POST /invoice` — Tạo invoice
    - `GET /invoice` — Lấy danh sách invoice
    - `GET /invoice/:id` — Lấy chi tiết invoice
    - `GET /invoice/:id/details` — Lấy invoice kèm chi tiết
    - `PUT /invoice/:id` — Cập nhật invoice
    - `DELETE /invoice/:id` — Xóa invoice

13. [Equipment Unit APIs (`/equipmentUnit`)](#equipment-unit-apis-equipmentunit)

    - `GET /equipmentUnit` — Lấy danh sách equipment units
    - `GET /equipmentUnit/:id` — Lấy chi tiết equipment unit
    - `GET /equipmentUnit/equipment/:equipment_id` — Lấy tất cả unit theo equipment_id
    - `GET /equipmentUnit/status/:status` — Lấy tất cả thiết bị có 1 trạng thái cụ thể
    - `GET /equipmentUnit/status-group?statuses=Ready,Failed` — Lấy thiết bị có nhiều trạng thái
    - `PUT /equipmentUnit/:id` — Cập nhật equipment unit
    - `DELETE /equipmentUnit/:id` — Xóa equipment unit

14. [Equipment Transfer APIs (`/equipmentTransfer`)](#equipment-transfer-apis-equipmenttransfer)

    - `POST /equipmentTransfer` — Tạo yêu cầu chuyển thiết bị
    - `GET /equipmentTransfer` — Lấy danh sách yêu cầu chuyển thiết bị
    - `GET /equipmentTransfer/:id` — Lấy chi tiết một yêu cầu chuyển thiết bị
    - `PUT /equipmentTransfer/:id/complete` — Hoàn tất chuyển thiết bị (cập nhật trạng thái + ngày nhận)
    - `DELETE /equipmentTransfer/:id` — Xóa yêu cầu chuyển thiết bị

15. [Maintenance APIs (`/maintenance`)](#maintenance-apis-maintenance)

    - `POST /maintenance` — Tạo yêu cầu bảo trì thiết bị
    - `GET /maintenance` — Lấy danh sách yêu cầu bảo trì
    - `GET /maintenance/results` — Lấy danh sách kết quả bảo trì
    - `GET /maintenance/:id` — Lấy chi tiết một yêu cầu bảo trì
    - `GET /maintenance/by-unit/:unitId` — Lấy maintenance đang bảo trì theo equipment_unit_id
    - `GET /maintenance/history/:unitId` — Lấy lịch sử bảo trì theo equipment_unit_id
    - `GET /maintenance/history/:unitId/latest` — Lấy lịch sử bảo trì gần nhất theo equipment_unit_id
    - `PUT /maintenance/:id/progress` — Bắt đầu bảo trì (In Progress)
    - `PUT /maintenance/:id/complete` — Hoàn tất bảo trì (Ready / Failed)
    - `DELETE /maintenance/:id` — Xóa yêu cầu bảo trì

16. [Maintenance Plan APIs (`/maintenance-plan`)](#maintenance-plan-apis-maintenance-plan)

    - `POST /maintenance-plan` — Tạo kế hoạch bảo trì định kỳ
    - `GET /maintenance-plan` — Lấy danh sách kế hoạch bảo trì
    - `GET /maintenance-plan/:id` — Lấy chi tiết kế hoạch bảo trì
    - `GET /maintenance-plan/equipment/:equipmentId` — Lấy kế hoạch theo thiết bị
    - `PUT /maintenance-plan/:id` — Cập nhật kế hoạch bảo trì
    - `DELETE /maintenance-plan/:id` — Xóa kế hoạch bảo trì

17. [Maintenance Request APIs (`/maintenance-requests`)](#maintenance-request-apis-maintenance-requests)

    - `POST /maintenance-requests` — Tạo yêu cầu bảo trì theo lô thiết bị
    - `PUT /maintenance-requests/:id` — Cập nhật yêu cầu bảo trì
    - `PUT /maintenance-requests/:id/confirm` — Kỹ thuật viên xác nhận nhận việc
    - `PUT /maintenance-requests/:id/cancel` — Hủy yêu cầu bảo trì
    - `GET /maintenance-requests` — Lấy danh sách yêu cầu bảo trì
    - `GET /maintenance-requests/:id` — Lấy chi tiết yêu cầu bảo trì
    - `GET /maintenance-requests/by-unit/:unitId` — Lấy yêu cầu bảo trì theo unit
    - `DELETE /maintenance-requests/:id` — Xóa yêu cầu bảo trì

18. [Equipment Disposal APIs (`/disposal`)](#equipment-disposal-apis-disposal)

    - `POST /disposal` — Tạo đợt thanh lý thiết bị
    - `GET /disposal` — Lấy danh sách đợt thanh lý (kèm chi tiết)
    - `GET /disposal/:id` — Lấy chi tiết một đợt thanh lý

19. [Dashboard APIs (`/dashboard`)](#dashboard-apis-dashboard)

    - `GET /dashboard/statistics` — Thống kê tổng hợp (theo tháng / quý / năm)
    - `GET /dashboard/equipment-hierarchy` — Cấu trúc phân cấp nhóm thiết bị
    - `GET /dashboard/statistics/trend` — Biểu đồ xu hướng (theo tháng / quý / tuần)

---

## Thiết lập ban đầu

- Tạo User Pool và **Groups** trong Cognito: `super-admin`, `admin`, `operator`, `technician`.
- Biến môi trường cần có (theo `utils/aws-helper`): `CLIENT_ID`, `USER_POOL_ID` và `secretHash`...
- API server chạy (ví dụ) `http://localhost:3000`.

---

## Auth APIs (`/auth`)

### POST `/auth/signup`

Đăng ký user (Cognito SignUp).
Yêu cầu body (JSON):

```json
{
  "username": "Username123",
  "password": "Username@123",
  "email": "examp@gmail.com",
  "role": "super-admin",
  "extra": {
    "name": "Họ và tên",
    "gender": "male",
    "phone_number": "+849xxxxxxxx",
    "birthdate": "2003-08-29",
    "address": "123 Nguyễn Văn Bảo, Gò Vấp, HCM",
    "branch_id": "GV"
  }
}
```

Response (200):

```json
{
  "message": "signed up",
  "userConfirmed": false
}
```

---

### POST `/auth/confirm`

Xác nhận mã (confirmation code).
Request body:

```json
{ "username": "Username123", "code": "123456" }
```

Response (200):

```json
{ "message": "account confirmed" }
```

---

### POST `/auth/signin`

Đăng nhập (USER_PASSWORD_AUTH).
Request body:

```json
{ "username": "Username123", "password": "Username@123" }
```

Response (200) — trường hợp bình thường:

```json
{
  "mode": "normal",
  "idToken": "<idToken>",
  "accessToken": "<accessToken>",
  "refreshToken": "<refreshToken>",
  "expiresIn": 3600,
  "tokenType": "Bearer"
}
```

Trường hợp challenge `NEW_PASSWORD_REQUIRED`:

```json
{
  "mode": "new_password_required",
  "session": "<CognitoSessionString>",
  "username": "Username123",
  "message": "Password change required on first login"
}
```

Lưu ý:

- Khi challenge trả `NEW_PASSWORD_REQUIRED`, client cần gọi `/auth/firstLogin` với `username`, `newPassword`, `session`.

---

### POST `/auth/refresh`

Refresh token (REFRESH_TOKEN_AUTH).
Request body:

```json
{
  "refreshToken": "<refreshToken>",
  "username": "Username123"
}
```

Response (200):

```json
{
  "idToken": "<idToken>",
  "accessToken": "<accessToken>",
  "expiresIn": 3600,
  "tokenType": "Bearer"
}
```

---

### POST `/auth/firstLogin`

Dùng để trả lời challenge NEW_PASSWORD_REQUIRED.
Request body:

```json
{
  "username": "Username123",
  "newPassword": "NewPass@123",
  "session": "<SessionFromSignIn>"
}
```

Response (200):

```json
{
  "message": "Password updated successfully",
  "idToken": "<idToken>",
  "accessToken": "<accessToken>",
  "refreshToken": "<refreshToken>",
  "expiresIn": 3600,
  "tokenType": "Bearer"
}
```

---

### POST `/auth/forgotPassword`

Gửi mã xác nhận đặt lại mật khẩu (Cognito ForgotPassword).
Chỉ gửi được nếu **username và email khớp** với dữ liệu trong Cognito.

**Request body (JSON):**

```json
{
  "username": "Username123",
  "email": "examp@gmail.com"
}
```

**Response (200):**

```json
{
  "message": "Password reset code sent to your email",
  "delivery": {
    "Destination": "ex***@gmail.com",
    "DeliveryMedium": "EMAIL",
    "AttributeName": "email"
  }
}
```

### POST `/auth/confirmForgotPassword`

Xác nhận mã quên mật khẩu và đặt lại mật khẩu mới.
Dùng sau khi đã nhận được mã trong email từ `/auth/forgotPassword`.

**Request body (JSON):**

```json
{
  "username": "Username123",
  "code": "123456",
  "newPassword": "NewPass@2025"
}
```

**Response (200):**

```json
{
  "message": "Password reset successfully"
}
```

---

## User APIs (`/user`)

> **Authentication**: tất cả request dưới đây yêu cầu header `Authorization: Bearer <accessToken>`.

### GET `/user/me`

Lấy thông tin user hiện tại.
Header:

```
Authorization: Bearer <accessToken>
```

Response (200):

```json
{
  "sub": "...",
  "scope": "...",
  "groups": ["admin"],
  "token_use": "access",
  "exp": 169xxx,
  "iat": 169xxx,
  "username": "Username123",
  "userAttributes": {
    "email": "examp@gmail.com",
    "name": "Họ và tên",
    "gender": "male",
    ...
  }
}
```

---

### GET `/user/admin-only`

Protected route ví dụ — chỉ `admin` hoặc `super-admin`.
Response (200):

```json
{ "message": "Welcome admin(s)!" }
```

### GET `/user/super-admin-only`

Chỉ `super-admin`.
Response (200):

```json
{ "message": "Welcome super admin!" }
```

### GET `/user/tech-or-operator`

Roles: `technician`, `operator`, `admin`, `super-admin`.
Response (200):

```json
{ "message": "Hello technician/operator/admin/super-admin" }
```

---

### POST `/user/create`

**Admin tạo user** (Admin API).
Header: `Authorization: Bearer <accessToken>` (admin or super-admin).
Body: giống với `adminCreateUser` trong `UserModel` (username, email, role, extra). Ví dụ:

```json
{
  "username": "tech001",
  "email": "tech001@example.com",
  "role": "technician",
  "extra": {
    "name": "Họ và tên",
    "phone_number": "+849xxxx",
    "branch_id": "GV"
  }
}
```

Response (200):

```json
{ "message": "Admin created user", "username": "tech001", "role": "technician" }
```

Lưu ý: Admin API sẽ gửi email invite (EMAIL chứa usename và pass tạm thời).

---

### POST `/user/change-password`

User tự đổi mật khẩu.
Header: `Authorization: Bearer <accessToken>`
Body:

```json
{ "oldPassword": "Old@123", "newPassword": "New@123" }
```

Response (200):

```json
{ "message": "Password changed successfully", "resp": {...} }
```

Lỗi phổ biến: `accessToken, oldPassword, newPassword are required` — server sẽ trả 400 nếu thiếu.

---

### PUT `/user/update-info`

User cập nhật attributes (self).
Header: `Authorization: Bearer <accessToken>`
Body (JSON): key-value của attributes Cognito. Ví dụ:

```json
{ "name": "Tên Mới", "phone_number": "+849xxx", "address": "Địa chỉ mới" }
```

Response (200):

```json
{ "message": "User information updated successfully" }
```

---

### PUT `/user/set-role`

Admin hoặc Super-admin thay đổi role (nhóm Cognito) của user.

**Header**:
`Authorization: Bearer <accessToken>`

**Body (JSON)**:

```json
{
  "username": "user123",
  "role": "technician"
}
```

- `username`: Username trong Cognito cần đổi role
- `role`: Role mới cần set (`super-admin`, `admin`, `operator`, `technician`)

**Response (200):**

```json
{
  "message": "User user123 role updated to technician successfully"
}
```

**Quy tắc phân quyền:**

- `super-admin`: có thể set role cho mọi user (kể cả admin).
- `admin`: chỉ được set role cho `technician` và `operator`, **không được set cho admin/super-admin**.

**Response lỗi ví dụ (403):**

```json
{
  "error": "Forbidden",
  "message": "admin is not allowed to change role of super-admin"
}
```

---

### PUT `/user/change-status`

Admin / Super-admin enable/disable user (thay đổi `enabled` state).
Header: `Authorization: Bearer <accessToken>` (role phải là `admin` hoặc `super-admin`).
Body:

```json
{ "username": "someone", "enabled": true }
```

Response (200):

```json
{ "message": "User someone enabled successfully" }
```

Validation & rules:

- `updatedByRole` (lấy từ token) phải là `admin` hoặc `super-admin`.
- Nếu `updatedByRole === 'admin'` thì **không** được thay đổi status của user có role `admin` hoặc `super-admin` (quy tắc bảo vệ).

---

### PUT `/user/admin-update-user`

Admin / Super-admin cập nhật attributes của user khác.
Header: `Authorization: Bearer <accessToken>` (admin hoặc super-admin).
Body:

```json
{
  "username": "tech001",
  "attributes": { "name": "Tên mới", "custom:branch_id": "BR-02" }
}
```

Response (200):

```json
{
  "message": "User tech001 attributes updated successfully",
  "updatedAttributes": {
    "name": "Tên mới",
    "custom:branch_id": "BR-02",
    "custom:updated_at": "2025-09-21T...Z"
  }
}
```

Validation & rules:

- Server kiểm tra role target user và cho phép update chỉ theo `allowedUpdate`:

  - `admin` có thể update users có role `technician`, `operator`.
  - `super-admin` có thể update `admin`, `technician`, `operator`.

- Nếu user không thuộc group nào => lỗi.

---

### GET `/user/list-user`

Admin / Super-admin lấy danh sách users.
Header: `Authorization: Bearer <accessToken>` (role phải là `admin` hoặc `super-admin`).
Response (200):

```json
{
  "users": [
    {
      "username": "tech001",
      "status": "CONFIRMED",
      "enabled": true,
      "createdAt": "2025-08-01T...",
      "updatedAt": "2025-09-01T...",
      "attributes": { "email": "tech001@example.com", "name": "..." }
    },
    ...
  ]
}
```

Lưu ý:

- Hiện code sử dụng `ListUsersCommand` với `Limit: 20`.

---

## Lỗi thường gặp & xử lý

- `accessToken missing` / `Unauthorized` — thiếu header hoặc token hết hạn -> trả 401.
- `ValidationError` (400) — body không đúng cấu trúc (ví dụ `enabled` không phải boolean).
- `User role is missing` — token không chứa `cognito:groups` -> kiểm tra middleware decode token để gắn groups.
- `Admin cannot change status of another admin or super-admin` — rule bảo vệ trong `updateUserStatus`.
- `User ... does not belong to any group` — khi admin cập nhật user nhưng user chưa có group.

---

## Vendor APIs (`/vendor`)

> **Authentication**: Thêm, xóa, sửa yêu cầu header
> `Authorization: Bearer <accessToken>`.
>
> **Roles**:
>
> - `admin`, `super-admin`: có thể **create / update / delete** vendor.
> - Mọi role (`operator`, `technician`, `admin`, `super-admin`) đều có thể **xem danh sách / chi tiết** vendor.

---

### POST `/vendor`

Tạo vendor mới (chỉ `admin`, `super-admin`).

**Request body**:

```json
{
  "id": "JS",
  "name": "Johnson Fitness",
  "origin": "VIETNAM",
  "description": "GYM technology"
}
```

**Response (201):**

```json
{
  "id": "JS",
  "name": "Johnson Fitness",
  "origin": "VIETNAM",
  "description": "GYM technology"
}
```

---

### GET `/vendor`

Lấy danh sách vendors (mọi user đăng nhập).

**Response (200):**

```json
[
  {
    "origin": "VIETNAM",
    "description": "GYM technology",
    "id": "MT",
    "name": "Matrix Fitness"
  },
  {
    "origin": "VIETNAM",
    "description": "GYM technology",
    "id": "JS",
    "name": "Johnson Fitness"
  }
]
```

---

### GET `/vendor/:id`

Lấy chi tiết vendor theo `id`.

**Response (200):**

```json
{
  "id": "JS",
  "name": "Johnson Fitness",
  "origin": "VIETNAM",
  "description": "GYM technology"
}
```

**Lỗi (404):**

```json
{ "error": "Vendor not found" }
```

---

### PUT `/vendor/:id`

Cập nhật vendor (chỉ `admin`, `super-admin`).

**Request body:**

```json
{
  "name": "Johnson Fitness",
  "origin": "VIETNAM",
  "description": "Nhà cung cấp thiết bị Treadmill"
}
```

**Response (200):**

```json
{
  "id": "JS",
  "name": "Johnson Fitness",
  "origin": "VIETNAM",
  "description": "Nhà cung cấp thiết bị Treadmill"
}
```

---

### DELETE `/vendor/:id`

Xóa vendor (chỉ `admin`, `super-admin`).
Có ràng buộc: nếu vendor đã được gắn vào `Equipment`, không thể xóa.

**Response (200):**

```json
{ "message": "Vendor deleted successfully" }
```

**Lỗi (404):**

```json
{ "error": "Vendor not found" }
```

**Lỗi (400 - khi có ràng buộc equipment):**

```json
{ "error": "Cannot delete vendor because it is linked to equipment" }
```

---

## Branch APIs (`/branch`)

> **Authentication**:
>
> - Tạo / sửa: yêu cầu header `Authorization: Bearer <accessToken>`.
> - Roles: chỉ `admin`, `super-admin` được phép **create / update**.
> - Mọi role (`operator`, `technician`, `admin`, `super-admin`) đều có thể **xem danh sách / chi tiết** branch.

---

### POST `/branch`

Tạo branch mới (chỉ `admin`, `super-admin`).

**Request body**:

```json
{
  "id": "GV",
  "name": "Gò Vấp Branch",
  "address": "123 Nguyễn Văn Bảo, Gò Vấp, HCM"
}
```

**Response (201):**

```json
{
  "id": "GV",
  "name": "Gò Vấp Branch",
  "address": "123 Nguyễn Văn Bảo, Gò Vấp, HCM",
  "created_at": "2025-09-21T10:00:00.000Z",
  "updated_at": "2025-09-21T10:00:00.000Z"
}
```

**Lỗi (400 - thiếu id/name):**

```json
{ "error": "Branch id and name are required" }
```

**Lỗi (400 - branch đã tồn tại):**

```json
{ "error": "Branch with id GV already exists" }
```

---

### GET `/branch`

Lấy danh sách tất cả branches (mọi user đăng nhập).

**Response (200):**

```json
[
  {
    "id": "GV",
    "name": "Gò Vấp Branch",
    "address": "123 Nguyễn Văn Bảo, Gò Vấp, HCM",
    "created_at": "2025-09-21T10:00:00.000Z",
    "updated_at": "2025-09-21T10:00:00.000Z"
  },
  {
    "id": "TD",
    "name": "Thủ Đức Branch",
    "address": "456 Kha Vạn Cân, Thủ Đức, HCM",
    "created_at": "2025-09-21T11:00:00.000Z",
    "updated_at": "2025-09-21T11:00:00.000Z"
  }
]
```

---

### GET `/branch/:id`

Lấy chi tiết branch theo `id`.

**Response (200):**

```json
{
  "id": "GV",
  "name": "Gò Vấp Branch",
  "address": "123 Nguyễn Văn Bảo, Gò Vấp, HCM",
  "created_at": "2025-09-21T10:00:00.000Z",
  "updated_at": "2025-09-21T10:00:00.000Z"
}
```

**Lỗi (404):**

```json
{ "error": "Branch not found" }
```

---

### PUT `/branch/:id`

Cập nhật branch (chỉ `admin`, `super-admin`).

**Request body:**

```json
{
  "name": "Gò Vấp Branch Updated",
  "address": "789 Phạm Văn Đồng, Gò Vấp, HCM"
}
```

**Response (200):**

```json
{
  "id": "GV",
  "name": "Gò Vấp Branch Updated",
  "address": "789 Phạm Văn Đồng, Gò Vấp, HCM",
  "created_at": "2025-09-21T10:00:00.000Z",
  "updated_at": "2025-09-21T12:30:00.000Z"
}
```

**Lỗi (404):**

```json
{ "error": "Branch not found" }
```

---

## Category Main APIs (`/categoryMain`)

> **Authentication**:
>
> - Tạo / sửa / xóa: yêu cầu header `Authorization: Bearer <accessToken>`.
> - Roles: chỉ `admin`, `super-admin` được phép **create / update / delete**.
> - Mọi role (`operator`, `technician`, `admin`, `super-admin`) đều có thể **xem danh sách / chi tiết** category.
>
> **Upload file**: dùng middleware `upload` (S3). Nếu có file kèm theo (`multipart/form-data`), server sẽ upload và gán vào field `image`.

---

### POST `/categoryMain`

Tạo category mới (chỉ `admin`, `super-admin`).

**Request body (form-data):**

```json
{
  "id": "CAO",
  "name": "Cardio",
  "image": "https://d1j4a12qc2fk50.cloudfront.net/image 15.png",
  "description": "Bài tập tim mạch"
}
```

**Response (201):**

```json
{
  "updated_at": "2025-09-12T15:17:43.240Z",
  "created_at": "2025-09-12T15:17:43.240Z",
  "description": "Bài tập tim mạch",
  "id": "CAO",
  "image": "https://d1j4a12qc2fk50.cloudfront.net/image 15.png",
  "name": "Cardio"
}
```

---

### GET `/categoryMain`

Lấy danh sách tất cả categories (mọi user đăng nhập).

**Response (200):**

```json
[
  {
    "updated_at": "2025-09-12T15:17:43.240Z",
    "created_at": "2025-09-12T15:17:43.240Z",
    "description": "Bài tập tim mạch",
    "id": "CAO",
    "image": "https://d1j4a12qc2fk50.cloudfront.net/image 15.png",
    "name": "Cardio"
  },
  ...
]
```

---

### GET `/categoryMain/:id`

Lấy chi tiết category theo `id`.

**Response (200):**

```json
{
  "updated_at": "2025-09-12T15:17:43.240Z",
  "created_at": "2025-09-12T15:17:43.240Z",
  "description": "Bài tập tim mạch",
  "id": "CAO",
  "image": "https://d1j4a12qc2fk50.cloudfront.net/image 15.png",
  "name": "Cardio"
}
```

**Lỗi (404):**

```json
{ "error": "Category not found" }
```

---

### PUT `/categoryMain/:id`

Cập nhật category (chỉ `admin`, `super-admin`).

**Request body (form-data):**

```json
{
  "description": "Bài tập tim mạch",
  "image": "https://d1j4a12qc2fk50.cloudfront.net/image 15.png",
  "name": "Cardio"
}
```

**Response (200):**

```json
{
  "updated_at": "2025-09-12T15:17:43.240Z",
  "created_at": "2025-09-12T15:17:43.240Z",
  "description": "Bài tập tim mạch",
  "id": "CAO",
  "image": "https://d1j4a12qc2fk50.cloudfront.net/image 15.png",
  "name": "Cardio"
}
```

**Lỗi (404):**

```json
{ "error": "Category not found" }
```

---

### DELETE `/categoryMain/:id`

Xóa category (chỉ `admin`, `super-admin`).
Có ràng buộc: **nếu vẫn còn CategoryType tham chiếu tới category này thì không thể xóa**.

**Response (200):**

```json
{ "message": "Category deleted successfully" }
```

**Lỗi (404):**

```json
{ "error": "Category not found" }
```

**Lỗi (400 - khi có ràng buộc CategoryType):**

```json
{
  "error": "Cannot delete CategoryMain CARDIO because 3 CategoryType(s) still reference it"
}
```

---

## Category Type APIs (`/categoryType`)

> **Authentication**:
>
> - Tạo / sửa / xóa: yêu cầu header `Authorization: Bearer <accessToken>`.
> - Roles: chỉ `admin`, `super-admin` được phép **create / update / delete**.
> - Mọi role (`operator`, `technician`, `admin`, `super-admin`) đều có thể **xem danh sách / chi tiết** category type.

---

### POST `/categoryType`

Tạo Category Type mới (chỉ `admin`, `super-admin`).

**Request body (JSON):**

```json
{
  "id": "TM",
  "category_main_id": "CAO",
  "name": "Treadmill",
  "description": "Máy chạy bộ"
}
```

**Response (201):**

```json
{
  "id": "TM",
  "category_main_id": "CAO",
  "name": "Treadmill",
  "description": "Máy chạy bộ",
  "created_at": "2025-09-21T10:00:00.000Z",
  "updated_at": "2025-09-21T10:00:00.000Z"
}
```

**Lỗi (400 - thiếu dữ liệu):**

```json
{ "error": "CategoryType id, name and category_main_id are required" }
```

**Lỗi (400 - id đã tồn tại):**

```json
{ "error": "CategoryType with id TREADMILL already exists" }
```

**Lỗi (400 - category_main_id không tồn tại):**

```json
{ "error": "Category_main with id CARDIO not exist" }
```

---

### GET `/categoryType`

Lấy danh sách tất cả Category Types (mọi user đăng nhập).

**Response (200):**

```json
[
  {
    "id": "TM",
    "category_main_id": "CAO",
    "name": "Treadmill",
    "description": "Máy chạy bộ",
    "created_at": "2025-09-21T10:00:00.000Z",
    "updated_at": "2025-09-21T10:00:00.000Z"
  },
  ...
]
```

---

### GET `/categoryType/:id`

Lấy chi tiết Category Type theo `id`.

**Response (200):**

```json
{
  "id": "TM",
  "category_main_id": "CAO",
  "name": "Treadmill",
  "description": "Máy chạy bộ",
  "created_at": "2025-09-21T10:00:00.000Z",
  "updated_at": "2025-09-21T10:00:00.000Z"
}
```

**Lỗi (404):**

```json
{ "error": "CategoryType not found" }
```

---

### GET `/categoryType/main/:category_main_id`

Lấy danh sách Category Types theo `category_main_id`.

**Response (200):**

```json
[
  {
    "id": "TM",
    "category_main_id": "CAO",
    "name": "Treadmill",
    "description": "Máy chạy bộ",
    "created_at": "2025-09-21T10:00:00.000Z",
    "updated_at": "2025-09-21T10:00:00.000Z"
  },
  ...
]
```

---

### PUT `/categoryType/:id`

Cập nhật Category Type (chỉ `admin`, `super-admin`).

**Request body:**

```json
{
  "category_main_id": "CAO",
  "name": "Treadmill",
  "description": "Máy chạy bộ"
}
```

**Response (200):**

```json
{
  "id": "TM",
  "category_main_id": "CAO",
  "name": "Treadmill",
  "description": "Máy chạy bộ",
  "created_at": "2025-09-21T10:00:00.000Z",
  "updated_at": "2025-09-21T10:00:00.000Z"
}
```

**Lỗi (404):**

```json
{ "error": "CategoryType not found" }
```

---

### DELETE `/categoryType/:id`

Xóa Category Type (chỉ `admin`, `super-admin`).

**Response (200):**

```json
{ "message": "CategoryType deleted successfully" }
```

**Lỗi (404):**

```json
{ "error": "CategoryType not found" }
```

---

## Attribute APIs (`/attribute`)

> **Authentication**:
>
> - Tạo / sửa / xóa: yêu cầu header `Authorization: Bearer <accessToken>`.
> - Roles: chỉ `admin`, `super-admin` được phép **create / update / delete**.
> - Mọi role (`operator`, `technician`, `admin`, `super-admin`) đều có thể **xem danh sách / chi tiết** attribute.

---

### POST `/attribute`

Tạo attribute mới (chỉ `admin`, `super-admin`).

**Request body (JSON):**

```json
{
  "name": "khối lượng"
}
```

**Response (201):**

```json
{
  "id": "5fdf9e7a-2c4e-4d6c-bc3c-1c2d2e1a9f42",
  "name": "khối lượng"
}
```

**Lỗi (400 - thiếu dữ liệu):**

```json
{ "error": "Attribute name is required" }
```

---

### GET `/attribute`

Lấy danh sách tất cả attributes (mọi user đăng nhập).

**Response (200):**

```json
[
  {
    "id": "5fdf9e7a-2c4e-4d6c-bc3c-1c2d2e1a9f42",
    "name": "khối lượng"
  },
  {
    "id": "77a3e6c2-1e5c-44cc-8b9b-32a2a6e98e11",
    "name": "màu sắc"
  }
]
```

---

### GET `/attribute/:id`

Lấy chi tiết attribute theo `id`.

**Response (200):**

```json
{
  "id": "5fdf9e7a-2c4e-4d6c-bc3c-1c2d2e1a9f42",
  "name": "khối lượng"
}
```

**Lỗi (404):**

```json
{ "error": "Attribute not found" }
```

---

### PUT `/attribute/:id`

Cập nhật attribute (chỉ `admin`, `super-admin`).

**Request body:**

```json
{
  "name": "khối lượng tối đa"
}
```

**Response (200):**

```json
{
  "id": "5fdf9e7a-2c4e-4d6c-bc3c-1c2d2e1a9f42",
  "name": "khối lượng tối đa"
}
```

**Lỗi (404):**

```json
{ "error": "Attribute not found" }
```

---

### DELETE `/attribute/:id`

Xóa attribute (chỉ `admin`, `super-admin`).

**Response (200):**

```json
{ "message": "Attribute deleted successfully" }
```

**Lỗi (404):**

```json
{ "error": "Attribute not found" }
```

---

## **Type Attribute APIs (`/type-attribute`)**

> **Authentication**:
>
> - Các API thêm / xóa yêu cầu header `Authorization: Bearer <accessToken>`

---

### **GET `/type-attribute/:typeId`**

Lấy danh sách tất cả **attributes** đang gắn với một **Category Type**.

**Response (200):**

```json
[
  { "id": "5fdf9e7a-2c4e-4d6c-bc3c-1c2d2e1a9f42", "name": "Trọng lượng" },
  { "id": "77a3e6c2-1e5c-44cc-8b9b-32a2a6e98e11", "name": "Công suất" }
]
```

**Lỗi (404):**

```json
{ "error": "No attributes found for this type" }
```

---

### **POST `/type-attribute/:typeId`**

Thêm một attribute vào **Category Type**.

- Nếu `attribute_id` chưa tồn tại → báo lỗi.
- Nếu đã tồn tại trong type → báo lỗi trùng.

**Request body (JSON):**

```json
{ "attribute_id": "5fdf9e7a-2c4e-4d6c-bc3c-1c2d2e1a9f42" }
```

**Response (201):**

```json
{
  "category_type_id": "TM",
  "attribute_id": "5fdf9e7a-2c4e-4d6c-bc3c-1c2d2e1a9f42",
  "attribute": {
    "id": "5fdf9e7a-2c4e-4d6c-bc3c-1c2d2e1a9f42",
    "name": "Trọng lượng"
  }
}
```

**Lỗi (400):**

```json
{ "error": "Attribute already linked with this type" }
```

---

### **POST `/type-attribute/:typeId/bulk`**

> **Bulk Add — Thêm nhiều attribute cùng lúc cho Category Type**

- Tự động **tạo attribute mới** nếu chưa tồn tại trong bảng `Attribute`.
- Tự động **bỏ qua các attribute đã được liên kết**.
- Trả về danh sách attribute thực tế được thêm (mới + đã có).

**Request body (JSON):**

```json
{
  "attributes": [
    { "name": "Chiều cao" },
    { "id": "77a3e6c2-1e5c-44cc-8b9b-32a2a6e98e11", "name": "Công suất" }
  ]
}
```

**Response (201):**

```json
[
  {
    "category_type_id": "TM",
    "attribute_id": "91a2e7c2-99b0-45ff-8c9b-12fd32a0ff11",
    "attribute": {
      "id": "91a2e7c2-99b0-45ff-8c9b-12fd32a0ff11",
      "name": "Chiều cao"
    }
  },
  {
    "category_type_id": "TM",
    "attribute_id": "77a3e6c2-1e5c-44cc-8b9b-32a2a6e98e11",
    "attribute": {
      "id": "77a3e6c2-1e5c-44cc-8b9b-32a2a6e98e11",
      "name": "Công suất"
    }
  }
]
```

**Lỗi (400 - thiếu dữ liệu):**

```json
{ "error": "attributes array is required" }
```

---

### **DELETE `/type-attribute/:typeId/:attrId`**

Xóa liên kết attribute khỏi Category Type (không xóa khỏi bảng `Attribute`).

**Response (200):**

```json
{ "deleted": "8b23e7a0-9ddc-4c3b-9d1a-6d1a8f0d0e3f" }
```

**Lỗi (400):**

```json
{ "error": "This attribute is not linked to the specified type." }
```

---

## Attribute Value APIs (`/attributeValue`)

> **Authentication**:
>
> - Tạo / sửa / xóa: yêu cầu header `Authorization: Bearer <accessToken>`.
> - Roles: chỉ `admin`, `super-admin` được phép **create / update / delete**.
> - Mọi role (`operator`, `technician`, `admin`, `super-admin`) đều có thể **xem danh sách / chi tiết** attribute value.

---

### POST `/attributeValue`

Tạo attribute value mới (chỉ `admin`, `super-admin`).

**Request body (JSON):**

```json
{
  "equipment_id": "CAOTMMT",
  "attribute_id": "81a0b2c3-9d3a-41bb-b227-12fd32a08dce",
  "value": "đỏ"
}
```

**Response (201):**

```json
{
  "id": "7c4b2f1a-9811-4c2b-a8d9-223eabc43d55",
  "equipment_id": "CAOTMMT",
  "attribute_id": "81a0b2c3-9d3a-41bb-b227-12fd32a08dce",
  "value": "đỏ"
}
```

**Lỗi (400 - thiếu dữ liệu):**

```json
{ "error": "attribute_id, equipment_id, and value are required" }
```

**Lỗi (400 - attribute không tồn tại):**

```json
{ "error": "Attribute with id 81a0b2c3... does not exist" }
```

**Lỗi (400 - equipment không tồn tại):**

```json
{ "error": "Equipment with id CAOTMMT does not exist" }
```

**Lỗi (400 - đã tồn tại attribute_id + equipment_id):**

```json
{
  "error": "AttributeValue with equipment_id CAOTMMT and attribute_id 81a0b2c3... already exists"
}
```

---

### GET `/attributeValue`

Lấy danh sách tất cả attribute values.

**Response (200):**

```json
[
  {
    "id": "7c4b2f1a-9811-4c2b-a8d9-223eabc43d55",
    "equipment_id": "CAOTMMT",
    "attribute_id": "81a0b2c3-9d3a-41bb-b227-12fd32a08dce",
    "value": "đỏ"
  },
  {
    "id": "9e8f1c2d-12ab-47de-bb33-98a7aa2a71e5",
    "equipment_id": "CAOTMMT",
    "attribute_id": "77a0f9c3-1a2b-4b2e-b227-12fd32a08aaa",
    "value": "20kg"
  }
]
```

---

### GET `/attributeValue/:id`

Lấy chi tiết attribute value theo `id`.

**Response (200):**

```json
{
  "id": "7c4b2f1a-9811-4c2b-a8d9-223eabc43d55",
  "equipment_id": "CAOTMMT",
  "attribute_id": "81a0b2c3-9d3a-41bb-b227-12fd32a08dce",
  "value": "đỏ"
}
```

**Lỗi (404):**

```json
{ "error": "AttributeValue not found" }
```

---

### GET `/attributeValue/equipment/:equipment_id`

Lấy tất cả attribute values theo `equipment_id`.

**Response (200):**

```json
[
  {
    "id": "7c4b2f1a-9811-4c2b-a8d9-223eabc43d55",
    "equipment_id": "CAOTMMT",
    "attribute_id": "81a0b2c3-9d3a-41bb-b227-12fd32a08dce",
    "value": "đỏ"
  },
  {
    "id": "9e8f1c2d-12ab-47de-bb33-98a7aa2a71e5",
    "equipment_id": "CAOTMMT",
    "attribute_id": "77a0f9c3-1a2b-4b2e-b227-12fd32a08aaa",
    "value": "20kg"
  }
]
```

---

### GET `/attributeValue/attribute/:attribute_id`

Lấy tất cả attribute values theo `attribute_id`.

**Response (200):**

```json
[
  {
    "id": "7c4b2f1a-9811-4c2b-a8d9-223eabc43d55",
    "equipment_id": "CAOTMMT",
    "attribute_id": "81a0b2c3-9d3a-41bb-b227-12fd32a08dce",
    "value": "đỏ"
  },
  {
    "id": "9e8f1c2d-12ab-47de-bb33-98a7aa2a71e5",
    "equipment_id": "OTHER123",
    "attribute_id": "81a0b2c3-9d3a-41bb-b227-12fd32a08dce",
    "value": "xanh"
  }
]
```

---

### PUT `/attributeValue/:id`

Cập nhật attribute value (chỉ `admin`, `super-admin`).

**Request body:**

```json
{
  "equipment_id": "CAOTMMT",
  "attribute_id": "81a0b2c3-9d3a-41bb-b227-12fd32a08dce",
  "value": "xanh"
}
```

**Response (200):**

```json
{
  "id": "7c4b2f1a-9811-4c2b-a8d9-223eabc43d55",
  "equipment_id": "CAOTMMT",
  "attribute_id": "81a0b2c3-9d3a-41bb-b227-12fd32a08dce",
  "value": "xanh"
}
```

**Lỗi (404):**

```json
{ "error": "AttributeValue not found" }
```

---

### DELETE `/attributeValue/:id`

Xóa attribute value (chỉ `admin`, `super-admin`).

**Response (200):**

```json
{ "message": "AttributeValue deleted successfully" }
```

**Lỗi (404):**

```json
{ "error": "AttributeValue not found" }
```

---

## Equipment APIs (`/equipment`)

> **Authentication**:
>
> - Tạo / sửa / xóa: yêu cầu header `Authorization: Bearer <accessToken>`.
> - Roles: chỉ `admin`, `super-admin` được phép **create / update / delete**.
> - Mọi role (`operator`, `technician`, `admin`, `super-admin`) đều có thể **xem danh sách / chi tiết** equipment.

---

### POST `/equipment`

Tạo equipment mới (chỉ `admin`, `super-admin`).

- `attribute_id` là id của bảng Attribute, `value` của AttributeValue
  **Request body (JSON):**

```json
{
  "name": "Tạ đơn bubble",
  "vendor_id": "JS",
  "category_type_id": "TD",
  "description": "",
  "image": "https://example.com/treadmill.png",
  "warranty_duration": 2,
  "attributes": [
    { "attribute_id": "81a0b2c3-9d3a-41bb-b227-12fd32a08dce", "value": "Đen" }
  ]
}
```

> 📌 `id` sẽ được sinh tự động theo format: `category_main_id + category_type_id + vendor_id`.

**Response (201):**

```json
{
  "name": "Tạ đơn bubble",
  "vendor_id": "JS",
  "category_type_id": "TD",
  "description": "",
  "image": "https://example.com/treadmill.png",
  "warranty_duration": 2,
  "attributes": [
    {
      "attribute": "color",
      "value": "Đen"
    }
  ],
  "id": "CAOTDJS"
}
```

**Lỗi (400 - thiếu dữ liệu):**

```json
{ "error": "Equipment name, vendor_id, category_type_id are required" }
```

**Lỗi (400 - vendor không tồn tại):**

```json
{ "error": "Vendor with id MT does not exist" }
```

**Lỗi (400 - category_type không tồn tại):**

```json
{ "error": "CategoryType with id TM does not exist" }
```

---

### GET `/equipment`

Lấy danh sách tất cả equipments.

**Response (200):**

```json
[
  {
    "updated_at": "2025-09-26T04:31:17.249Z",
    "created_at": "2025-09-26T04:31:17.249Z",
    "image": "https://example.com/treadmill.png",
    "warranty_duration": 2,
    "description": "",
    "id": "CAOTDJS",
    "name": "Tạ đơn bubble",
    "category_type_id": "TD",
    "vendor_id": "JS",
    "attributes": [
      {
        "attribute": "color",
        "value": "Đen"
      }
    ]
  },
  ...
]
```

---

### GET `/equipment/:id`

Lấy chi tiết equipment theo `id`.

**Response (200):**

```json
{
  "updated_at": "2025-09-26T04:31:17.249Z",
  "created_at": "2025-09-26T04:31:17.249Z",
  "image": "https://example.com/treadmill.png",
  "warranty_duration": 2,
  "description": "",
  "id": "CAOTDJS",
  "name": "Tạ đơn bubble",
  "category_type_id": "TD",
  "vendor_id": "JS",
  "attributes": [
    {
      "attribute": "color",
      "value": "Đen"
    }
  ]
}
```

**Lỗi (404):**

```json
{ "error": "Equipment not found" }
```

---

### GET `/equipment/categoryType/:category_type_id`

Lấy tất cả equipments theo `category_type_id`.

**Response (200):**

```json
[
  {
    "updated_at": "2025-09-21T08:59:26.737Z",
    "created_at": "2025-09-21T08:59:26.737Z",
    "image": "https://example.com/treadmill.png",
    "warranty_duration": 2,
    "description": "Máy chạy bộ cao cấp",
    "id": "CAOTMMT",
    "category_type_id": "TM",
    "name": "Treadmill Pro",
    "vendor_id": "MT",
    "attributes": [
      {
        "attribute": "color",
        "value": "đỏ"
      }
    ]
  },
  ...
]
```

---

### GET `/equipment/vendor/:vendor_id`

Lấy tất cả equipments theo `vendor_id`.

**Response (200):**

```json
[
  {
    "updated_at": "2025-09-21T08:59:26.737Z",
    "created_at": "2025-09-21T08:59:26.737Z",
    "image": "https://example.com/treadmill.png",
    "warranty_duration": 2,
    "description": "Máy chạy bộ cao cấp",
    "id": "CAOTMMT",
    "category_type_id": "TM",
    "name": "Treadmill Pro",
    "vendor_id": "MT",
    "attributes": [
      {
        "attribute": "color",
        "value": "đỏ"
      }
    ]
  },
  ...
]
```

---

### PUT `/equipment/:id`

Cập nhật equipment (chỉ `admin`, `super-admin`).

**Request body (JSON):**

```json
{
  "name": "Treadmill Pro 2025",
  "vendor_id": "MT",
  "category_type_id": "TM",
  "description": "Máy chạy bộ cao cấp phiên bản mới",
  "image": "https://example.com/treadmill-v2.png",
  "warranty_duration": 3
}
```

**Response (200):**

```json
{
  "id": "CAOTMMT",
  "vendor_id": "MT",
  "category_type_id": "TM",
  "category_main_id": "CAO",
  "name": "Treadmill Pro 2025",
  "image": "https://example.com/treadmill-v2.png",
  "description": "Máy chạy bộ cao cấp phiên bản mới",
  "warranty_duration": 3,
  "created_at": "2025-09-21T10:00:00.000Z",
  "updated_at": "2025-09-21T12:30:00.000Z"
}
```

**Lỗi (404):**

```json
{ "error": "Equipment not found" }
```

---

### DELETE `/equipment/:id`

Xóa equipment (chỉ `admin`, `super-admin`).

**Response (200):**

```json
{ "message": "Equipment deleted" }
```

**Lỗi (404):**

```json
{ "error": "Equipment not found" }
```

---

# Invoice APIs (`/invoice`)

> **Authentication**:
>
> - Tạo / sửa / xóa: yêu cầu header `Authorization: Bearer <accessToken>`.
> - Các role (`operator`, `technician`, `admin`, `super-admin`) đều có thể xem danh sách & chi tiết invoice.

---

### POST `/invoice`

Tạo invoice mới với danh sách thiết bị.
**Request body (JSON):**

Mỗi **Equipment Unit** được sinh ra từ `items` trong Invoice sẽ có `id` (và cũng là `sku`) theo công thức:

```
EQUIPMENT_ID-COUNT
```

Trong đó:

- `EQUIPMENT_ID` = Mã của thiết bị (ví dụ: `CAOTMJS`)
- `COUNT` = số thứ tự của thiết bị trong lô nhập (bắt đầu từ `1` đến `quantity` trong invoice item)

---

```json
{
  "items": [
    {
      "equipment_id": "eq123",
      "branch_id": "b001",
      "quantity": 2,
      "cost": 100
    },
    {
      "equipment_id": "eq456",
      "branch_id": "b001",
      "quantity": 1,
      "cost": 250
    }
  ]
}
```

**Response (201):**

```json
{
  "invoice": {
    "id": "8fd1fba7-b78b-4ae4-80f0-f9919a01548a",
    "user_id": "a98a551c-e041-70f3-8c2b-5f53a6b54e1c",
    "total": 450,
    "created_at": "2025-09-17T14:45:46.675Z",
    "updated_at": "2025-09-17T14:45:47.135Z"
  },
  "details": [
    {
      "id": "7e678fb3-5432-4cbe-98e8-88beebd2fe9b",
      "invoice_id": "8fd1fba7-b78b-4ae4-80f0-f9919a01548a",
      "equipment_unit_id": "CAOTMJS-2509251",
      "cost": 100,
      "created_at": "2025-09-17T14:45:46.991Z"
    },
    ...
  ]
}
```

---

### GET `/invoice`

Lấy danh sách invoices.
**Response (200):**

```json
[
  {
    "id": "de3dbbef-3716-4091-af13-19cf4a9b0ac9",
    "user_id": "a98a551c-e041-70f3-8c2b-5f53a6b54e1c",
    "total": 450,
    "created_at": "2025-09-17T14:44:09.412Z",
    "updated_at": "2025-09-17T14:44:09.953Z"
  },
  {
    "id": "21350ea9-f923-423d-b80c-d8a38474a3d9",
    "user_id": "a98a551c-e041-70f3-8c2b-5f53a6b54e1c",
    "total": 1500000,
    "created_at": "2025-09-16T15:06:31.919Z",
    "updated_at": "2025-09-16T15:06:31.919Z"
  }
]
```

---

### GET `/invoice/:id`

Lấy chi tiết invoice theo `id`.
**Response (200):**

```json
{
  "id": "8fd1fba7-b78b-4ae4-80f0-f9919a01548a",
  "user_id": "a98a551c-e041-70f3-8c2b-5f53a6b54e1c",
  "total": 450,
  "created_at": "2025-09-17T14:45:46.675Z",
  "updated_at": "2025-09-17T14:45:47.135Z"
}
```

**Lỗi (404):**

```json
{ "error": "Invoice not found" }
```

---

### GET `/invoice/:id/details`

Lấy invoice kèm theo chi tiết (join sang `equipment_unit`).
**Response (200):**

```json
{
  "invoice": {
    "id": "8fd1fba7-b78b-4ae4-80f0-f9919a01548a",
    "user_id": "a98a551c-e041-70f3-8c2b-5f53a6b54e1c",
    "total": 450,
    "created_at": "2025-09-17T14:45:46.675Z",
    "updated_at": "2025-09-17T14:45:47.135Z"
  },
  "details": [
    {
      "id": "7e678fb3-5432-4cbe-98e8-88beebd2fe9b",
      "invoice_id": "8fd1fba7-b78b-4ae4-80f0-f9919a01548a",
      "equipment_unit_id": "CAOTMJS-2509251",
      "cost": 100,
      "created_at": "2025-09-17T14:45:46.991Z",
      "equipment_unit": {
        "id": "CAOTMJS-2509251",
        "equipment_id": "eq123",
        "branch_id": "b001",
        "status": "In Stock",
        "cost": 100,
        "warranty_start_date": "2025-09-17T14:45:46.945Z",
        "warranty_end_date": "2026-09-17T14:45:46.945Z"
      }
    }
  ]
}
```

---

### PUT `/invoice/:id`

Cập nhật invoice (chỉ cho phép cập nhật `total`).
**Request body:**

```json
{ "total": 500 }
```

**Response (200):**

```json
{
  "id": "8fd1fba7-b78b-4ae4-80f0-f9919a01548a",
  "user_id": "a98a551c-e041-70f3-8c2b-5f53a6b54e1c",
  "total": 500,
  "created_at": "2025-09-17T14:45:46.675Z",
  "updated_at": "2025-09-17T14:50:10.000Z"
}
```

---

### DELETE `/invoice/:id`

Xóa invoice.

**Response (200):**

```json
{ "message": "Invoice deleted successfully" }
```

**Lỗi (404):**

```json
{ "error": "Invoice not found" }
```

---

## Equipment Unit APIs (`/equipmentUnit`)

> **Authentication**:
>
> - `GET`: Mọi role (`operator`, `technician`, `admin`, `super-admin`) đều có thể gọi.
> - `PUT` & `DELETE`: yêu cầu header `Authorization: Bearer <accessToken>`.

---

### GET `/equipmentUnit`

Lấy danh sách tất cả equipment units.

**Response (200):**

```json
[
  {
    "id": "CAOTMJS-2509251",
    "equipment_id": "eq123",
    "branch_id": "b001",
    "cost": 100,
    "description": "Imported via invoice",
    "status": "In Stock",
    "warranty_start_date": "2025-09-17T14:45:46.945Z",
    "warranty_end_date": "2026-09-17T14:45:46.945Z",
    "created_at": "2025-09-17T14:45:46.945Z",
    "updated_at": "2025-09-17T14:45:46.945Z"
  },
  {
    "id": "2d56f592-a160-4700-b8dd-7a59bc43a63a",
    "equipment_id": "eq456",
    "branch_id": "b001",
    "cost": 250,
    "description": "Imported via invoice",
    "status": "In Stock",
    "warranty_start_date": "2025-09-17T14:45:47.038Z",
    "warranty_end_date": "2027-09-17T14:45:47.038Z",
    "created_at": "2025-09-17T14:45:47.038Z",
    "updated_at": "2025-09-17T14:45:47.038Z"
  }
]
```

---

### GET `/equipmentUnit/:id`

Lấy chi tiết equipment unit theo `id`.

**Response (200):**

```json
{
  "id": "CAOTMJS-2509251",
  "equipment_id": "eq123",
  "branch_id": "b001",
  "cost": 100,
  "description": "Imported via invoice",
  "status": "In Stock",
  "warranty_start_date": "2025-09-17T14:45:46.945Z",
  "warranty_end_date": "2026-09-17T14:45:46.945Z",
  "created_at": "2025-09-17T14:45:46.945Z",
  "updated_at": "2025-09-17T14:45:46.945Z"
}
```

**Lỗi (404):**

```json
{ "error": "Equipment Unit not found" }
```

---

### 12. Equipment Unit APIs (`/equipmentUnit`)

#### `GET /equipmentUnit`

Lấy danh sách tất cả equipment unit.
Response (200):

```json
[
  {
    "id": "unit001",
    "equipment_id": "eq123",
    "branch_id": "b001",
    "status": "In Stock",
    "created_at": "2025-09-20T12:00:00.000Z"
  }
]
```

---

#### `GET /equipmentUnit/:id`

Lấy chi tiết 1 equipment unit theo `id`.
Response (200):

```json
{
  "id": "unit001",
  "equipment_id": "eq123",
  "branch_id": "b001",
  "status": "In Stock",
  "created_at": "2025-09-20T12:00:00.000Z"
}
```

---

#### `GET /equipmentUnit/equipment/:equipment_id`

Lấy tất cả unit theo 1 `equipment_id`.
Response (200):

```json
[
  {
    "id": "unit001",
    "equipment_id": "eq123",
    "branch_id": "b001",
    "status": "In Stock"
  },
  {
    "id": "unit002",
    "equipment_id": "eq123",
    "branch_id": "b002",
    "status": "Ready"
  }
]
```

---

### ### GET `/equipmentUnit/status/:status`

Lọc danh sách **equipment units** theo **trạng thái duy nhất**.

**Ví dụ:**

```bash
GET /equipmentUnit/status/In%20Progress
```

**Response (200):**

```json
[
  {
    "id": "CAOTMJS-2",
    "equipment_id": "CAOTMJS",
    "branch_id": "GV",
    "status": "In Progress",
    "description": "Imported via invoice",
    "updated_at": "2025-09-28T10:58:26.931Z",
    "equipment": {
      "id": "CAOTMJS",
      "name": "Treadmill Pro",
      "main_name": "Cardio",
      "vendor_name": "Johnson Fitness",
      "type_name": "Treadmill"
    }
  }
]
```

**Lỗi (404):**

```json
{ "error": "Equipment Unit not found" }
```

---

### ### GET `/equipmentUnit/status-group?statuses=Ready,Failed`

Lọc danh sách **equipment units** theo **nhiều trạng thái** cùng lúc.

**Query params:**

- `statuses`: Danh sách trạng thái, cách nhau bằng dấu phẩy (`,`)

**Ví dụ:**

```bash
GET /equipmentUnit/status-group?statuses=Ready,Failed
```

**Response (200):**

```json
[
  {
    "id": "CAOTMJS-3",
    "equipment_id": "CAOTMJS",
    "branch_id": "GV",
    "status": "Ready",
    "description": "Bảo trì hoàn tất - chờ duyệt",
    "equipment": {
      "id": "CAOTMJS",
      "name": "Treadmill Pro",
      "main_name": "Cardio",
      "vendor_name": "Johnson Fitness"
    }
  },
  {
    "id": "CAOBIKE-5",
    "equipment_id": "CAOBIKE",
    "branch_id": "G3",
    "status": "Failed",
    "description": "Lỗi bo mạch chính",
    "equipment": {
      "id": "CAOBIKE",
      "name": "Matrix Bike S300",
      "main_name": "Cardio",
      "vendor_name": "Matrix Fitness"
    }
  }
]
```

**Lỗi (404):**

```json
{ "error": "Equipment Unit not found" }
```

---

### PUT `/equipmentUnit/:id`

Cập nhật equipment unit (ví dụ thay đổi `status`).

**Request body:**

```json
{
  "status": "Active"
}
```

**Response (200):**

```json
{
  "id": "CAOTMJS-2509251",
  "equipment_id": "eq123",
  "branch_id": "b001",
  "cost": 100,
  "description": "Imported via invoice",
  "status": "In Use",
  "warranty_start_date": "2025-09-17T14:45:46.945Z",
  "warranty_end_date": "2026-09-17T14:45:46.945Z",
  "created_at": "2025-09-17T14:45:46.945Z",
  "updated_at": "2025-09-18T09:30:00.000Z"
}
```

**Lỗi (404):**

```json
{ "error": "Equipment Unit not found" }
```

---

### DELETE `/equipmentUnit/:id`

Xóa equipment unit.

**Response (200):**

```json
{ "message": "Equipment Unit deleted successfully" }
```

**Lỗi (404):**

```json
{ "error": "Equipment Unit not found" }
```

---

## Equipment Transfer APIs (`/equipmentTransfer`)

> **Authentication**:
>
> - `POST`, `PUT`, `DELETE`: yêu cầu header `Authorization: Bearer <accessToken>` (admin/super-admin).
> - `GET`: ai cũng có thể gọi.

---

### POST `/equipmentTransfer`

Tạo một yêu cầu chuyển thiết bị giữa các chi nhánh.

- Nếu Equipment unit đang ở trạng thái `Inactive, Temporary Urgent, In Progress, Ready, Failed, Deleted, Moving` thì không thể chuyển chi nhánh

**Request body:**

```json
{
  "unit_ids": ["CAOTGMT-1", "CAOTDJS-4"],
  "to_branch_id": "Q3"
}
```

**Response (201):**

```json
{
  "id": "7168f980-ca98-47f6-8b6a-891a8c0a0fb0",
  "equipment_unit_id": "f5b7fa4a-3f62-400d-a004-0aebc11b9b0f",
  "from_branch_id": "GV",
  "to_branch_id": "Q3",
  "approved_by": "ADMIN001",
  "description": "Chuyển máy chạy bộ từ BR-01 sang BR-02",
  "status": "Pending",
  "move_start_date": "2025-09-23T13:55:33.954Z",
  "move_receive_date": null
}
```

---

### GET `/equipmentTransfer`

Lấy danh sách các yêu cầu chuyển thiết bị.

**Response (200):**

```json
[
  {
    "id": "7168f980-ca98-47f6-8b6a-891a8c0a0fb0",
    "equipment_unit_id": "f5b7fa4a-3f62-400d-a004-0aebc11b9b0f",
    "from_branch_id": "GV",
    "to_branch_id": "Q3",
    "approved_by": "ADMIN001",
    "description": "Chuyển máy chạy bộ từ BR-01 sang BR-02",
    "status": "Pending",
    "move_start_date": "2025-09-23T13:55:33.954Z",
    "move_receive_date": null
  }
]
```

---

### GET `/equipmentTransfer/:id`

Lấy chi tiết một yêu cầu chuyển thiết bị theo `id`.

**Response (200):**

```json
{
  "id": "7168f980-ca98-47f6-8b6a-891a8c0a0fb0",
  "equipment_unit_id": "f5b7fa4a-3f62-400d-a004-0aebc11b9b0f",
  "from_branch_id": "GV",
  "to_branch_id": "Q3",
  "approved_by": "ADMIN001",
  "description": "Chuyển máy chạy bộ từ BR-01 sang BR-02",
  "status": "Pending",
  "move_start_date": "2025-09-23T13:55:33.954Z",
  "move_receive_date": null
}
```

**Lỗi (404):**

```json
{ "error": "EquipmentTransfer not found" }
```

---

### PUT `/equipmentTransfer/:id/complete`

Hoàn tất một yêu cầu chuyển thiết bị (chỉ cập nhật `status = Completed` + `move_receive_date`).

**Request body:**

```json
{
  "move_receive_date": "2025-09-19T14:00:00.000Z"
}
```

**Response (200):**

```json
{
  "id": "7168f980-ca98-47f6-8b6a-891a8c0a0fb0",
  "equipment_unit_id": "f5b7fa4a-3f62-400d-a004-0aebc11b9b0f",
  "from_branch_id": "GV",
  "to_branch_id": "Q3",
  "approved_by": "ADMIN001",
  "description": "Chuyển máy chạy bộ từ BR-01 sang BR-02",
  "status": "Completed",
  "move_start_date": "2025-09-23T13:55:33.954Z",
  "move_receive_date": "2025-09-19T14:00:00.000Z"
}
```

---

### DELETE `/equipmentTransfer/:id`

Xóa một yêu cầu chuyển thiết bị.

**Response (200):**

```json
{ "message": "EquipmentTransfer deleted successfully" }
```

**Lỗi (404):**

```json
{ "error": "EquipmentTransfer not found" }
```

---

## Maintenance APIs (`/maintenance`)

> **Authentication**:
>
> - Các API `POST`, `PUT`, `DELETE` yêu cầu header `Authorization: Bearer <accessToken>`.
> - `GET` có thể được gọi bởi tất cả các user.
>
> **Roles**:
>
> - `operator`, `admin`, `super-admin`: tạo yêu cầu bảo trì.
> - `technician`: nhận xử lý (progress) hoặc hoàn tất (complete).

---

### POST `/maintenance`

Tạo một yêu cầu bảo trì mới.

**Role cho phép**: `super-admin`, `admin`, `operator`, `technician`
**Rule**:

- Nếu **equipment_unit** đang ở trạng thái:
  `Inactive, Temporary Urgent, In Progress, Ready, Failed, Deleted, Moving` -> **không được phép** tạo maintenance.
- **warranty** sẽ được tự động tính theo `warranty_end_date` của unit (không nhập trong body).
- **assigned_by** được set theo `req.user.sub`.
- **branch_id** được set theo branch_id của equipment Unit
- Nếu role = `operator` -> auto gán `user_id = sub`.
- Nếu role = `technician` -> unit được set ngay sang **In Progress**.
- Role khác -> unit được set sang **Temporary Urgent**.

**Body (JSON):**

```json
{
  "equipment_unit_id": "fb29c3e8-a214-45ee-af21-7cfe2ffd78de",
  "maintenance_reason": "Máy chạy phát ra tiếng ồn"
}
```

**Response (201):**

```json
{
  "id": "05779ead-00fb-4994-9d3f-674baffde459",
  "equipment_unit_id": "fb29c3e8-a214-45ee-af21-7cfe2ffd78de",
  "branch_id": "BR-01",
  "user_id": null,
  "assigned_by": "OPERATOR001",
  "maintenance_reason": "Máy chạy phát ra tiếng ồn",
  "maintenance_detail": null,
  "start_date": "2025-09-23T14:02:46.411Z",
  "end_date": null,
  "warranty": true
}
```

---

### GET `/maintenance`

Lấy danh sách các yêu cầu bảo trì.

**Response (200):**

```json
[
  {
    "id": "8625d86c-98f0-4ac9-b129-266f52cbf6a1",
    "equipment_unit_id": "fb29c3e8-a214-45ee-af21-7cfe2ffd78de",
    "branch_id": "BR-01",
    "user_id": "TECH001",
    "assigned_by": "TECH001",
    "maintenance_reason": "Máy chạy phát ra tiếng ồn",
    "maintenance_detail": null,
    "start_date": "2025-09-23T14:03:31.187Z",
    "end_date": null,
    "warranty": true
  }
]
```

---

### GET `/maintenance/:id`

Lấy chi tiết một yêu cầu bảo trì.

**Response (200):**

```json
{
  "id": "8625d86c-98f0-4ac9-b129-266f52cbf6a1",
  "equipment_unit_id": "fb29c3e8-a214-45ee-af21-7cfe2ffd78de",
  "branch_id": "BR-01",
  "user_id": "TECH001",
  "assigned_by": "TECH001",
  "maintenance_reason": "Máy chạy phát ra tiếng ồn",
  "maintenance_detail": null,
  "start_date": "2025-09-23T14:03:31.187Z",
  "end_date": null,
  "warranty": true
}
```

**Lỗi (404):**

```json
{ "error": "Maintenance not found" }
```

---

### ### GET `/maintenance/by-unit/:unitId`

Lấy **yêu cầu bảo trì** của một `equipment_unit_id`.

**Ví dụ:**

```bash
GET /maintenance/by-unit/CAOTGMT-2
```

**Response (200):**

```json
{
  "id": "e3c7a23b-1f1c-4a6a-b4ee-8a3517fbd43c",
  "equipment_unit_id": "CAOTGMT-2",
  "branch_id": "GV",
  "user_id": "TECH001",
  "assigned_by": "ADMIN001",
  "maintenance_reason": "Lỗi cảm biến tốc độ",
  "maintenance_detail": null,
  "start_date": "2025-09-29T07:31:12.713Z",
  "end_date": null,
  "warranty": true
}
```

**Lỗi (404):**

```json
{ "error": "No active maintenance" }
```

---

### PUT `/maintenance/:id/progress`

Chuyển yêu cầu sang trạng thái **In Progress**.

**Role cho phép**: `super-admin`, `admin`, `technician`

- Không nhập body.
- Unit được update sang trạng thái **In Progress**.

**Response (200):**

```json
{
  "id": "8625d86c-98f0-4ac9-b129-266f52cbf6a1",
  "equipment_unit_id": "fb29c3e8-a214-45ee-af21-7cfe2ffd78de",
  "branch_id": "BR-01",
  "user_id": "TECH001",
  "assigned_by": "ADMIN001",
  "maintenance_reason": "Máy chạy phát ra tiếng ồn",
  "maintenance_detail": null,
  "start_date": "2025-09-23T14:03:31.187Z",
  "end_date": null,
  "warranty": true
}
```

---

### PUT `/maintenance/:id/complete`

Hoàn tất maintenance (thành công hoặc thất bại).

**Authorization**: `Bearer <accessToken>`
**Role cho phép**: `super-admin`, `admin`, `technician`

**Body (JSON):**

```json
{
  "maintenance_detail": "Đã thay ổ bi mới, hoạt động ổn định",
  "status": "Ready",
  "cost": 0
}
```

**Rule**:

- `status` có thể là `Ready` hoặc `Failed`.
- Nếu `Ready` -> tạo thêm `maintenance_invoice` (cost = 0 nếu còn bảo hành).
- Unit chuyển trạng thái theo `status`.

**Response (200):**

```json
{
  "id": "8625d86c-98f0-4ac9-b129-266f52cbf6a1",
  "equipment_unit_id": "fb29c3e8-a214-45ee-af21-7cfe2ffd78de",
  "branch_id": "BR-01",
  "user_id": "TECH003",
  "assigned_by": "ADMIN001",
  "maintenance_reason": "Máy chạy phát ra tiếng ồn",
  "maintenance_detail": "Đã thay ổ bi mới, hoạt động ổn định",
  "start_date": "2025-09-23T14:03:31.187Z",
  "end_date": "2025-09-23T14:06:31.216Z",
  "warranty": true
}
```

---

### DELETE `/maintenance/:id`

Xóa một yêu cầu bảo trì.

**Response (200):**

```json
{ "message": "Maintenance deleted successfully" }
```

**Lỗi (404):**

```json
{ "error": "Maintenance not found" }
```

---

## Equipment Disposal APIs (`/disposal`)

> **Authentication**
>
> - Tất cả request yêu cầu header
>   `Authorization: Bearer <accessToken>`
> - Role cho phép: `admin`, `super-admin`, `operator`
> - `technician` chỉ được **xem**, không được tạo/sửa/xóa.

---

# **Maintenance Plan APIs (`/maintenance-plan`)**

> **Authentication**:
>
> - Tất cả request yêu cầu header `Authorization: Bearer <accessToken>`.
> - Role cho phép:
>
>   - `admin`, `super-admin`: có thể **tạo / cập nhật / xóa** kế hoạch bảo trì.
>   - `technician`, `operator`, `admin`, `super-admin`: có thể **xem danh sách / chi tiết**.

---

### POST `/maintenance-plan`

Tạo **kế hoạch bảo trì định kỳ** cho 1 **dòng thiết bị (`equipment_id`)**.

**Rule:**

- Mỗi `equipment_id` chỉ có **1 plan duy nhất**.
- `next_maintenance_date` phải **lớn hơn thời gian hiện tại**.
- Khi tạo, hệ thống sẽ **tự động tạo AWS Scheduler (EventBridge)** nhắc nhở định kỳ theo `frequency`.

**Request body (JSON):**

```json
{
  "equipment_id": "CAOTMJS",
  "frequency": "3_months",
  "next_maintenance_date": "2025-12-01T08:00:00.000Z"
}
```

**Response (201):**

```json
{
  "message": "Maintenance plan created successfully",
  "plan": {
    "id": "3bfb7462-b04f-4418-bad2-09183a8a23b3",
    "equipment_id": "CAOTMJS",
    "frequency": "3_months",
    "next_maintenance_date": "2025-12-01T08:00:00.000Z",
    "reminder_schedule_arn": "remind-3bfb7462-b04f-...-1730768400000",
    "active": true,
    "created_at": "2025-11-05T07:31:45.000Z",
    "updated_at": "2025-11-05T07:31:45.000Z"
  }
}
```

**Lỗi (400):**

```json
{ "error": "next_maintenance_date must be in the future" }
```

**Lỗi (400 - trùng thiết bị):**

```json
{
  "error": "Đã tồn tại lịch nhắc nhở bảo trì cho dòng thiết bị Treadmill Pro (CAOTMJS)"
}
```

Rất hay — mình đã đọc xong file `frequencyParser.js` của bạn, và có thể tạo bảng tóm tắt toàn bộ **frequency** hợp lệ, kèm:

* Chuỗi nhập (`frequency`),
* Kết quả AWS `rate()` (theo `parseFrequencyToRate()`),
* Thời gian lặp lại thực tế,
* Nhãn tiếng Việt (theo `formatFrequencyLabel()`).

---

## **Bảng tần suất hỗ trợ (Frequency Table)**

| Frequency (chuỗi) | Mô tả tiếng Việt           | Biểu thức AWS Scheduler | Khoảng thời gian thực tế           |
| ----------------- | -------------------------- | ----------------------- | ---------------------------------- |
| `3_minutes`       | 3 phút/lần *(chế độ test)* | `rate(3 minutes)`       | Mỗi 3 phút                         |
| `5_minutes`       | 5 phút/lần                 | `rate(5 minutes)`       | Mỗi 5 phút                         |
| `10_minutes`      | 10 phút/lần                | `rate(10 minutes)`      | Mỗi 10 phút                        |
| `1_hour`          | 1 giờ/lần                  | `rate(1 hour)`          | Mỗi giờ                            |
| `6_hours`         | 6 giờ/lần                  | `rate(6 hours)`         | Mỗi 6 giờ                          |
| `12_hours`        | 12 giờ/lần                 | `rate(12 hours)`        | Mỗi 12 giờ                         |
| `1_day`           | 1 ngày/lần *(hàng ngày)*   | `rate(1 day)`           | Mỗi 24 giờ                         |
| `2_days`          | 2 ngày/lần                 | `rate(2 days)`          | Mỗi 48 giờ                         |
| `3_days`          | 3 ngày/lần                 | `rate(3 days)`          | Mỗi 3 ngày                         |
| `4_days`          | 4 ngày/lần                 | `rate(4 days)`          | Mỗi 4 ngày                         |
| `5_days`          | 5 ngày/lần                 | `rate(5 days)`          | Mỗi 5 ngày                         |
| `6_days`          | 6 ngày/lần                 | `rate(6 days)`          | Mỗi 6 ngày                         |
| `1_week`          | 1 tuần/lần *(hàng tuần)*   | `rate(7 days)`          | Mỗi 7 ngày                         |
| `2_weeks`         | 2 tuần/lần                 | `rate(14 days)`         | Mỗi 14 ngày                        |
| `3_weeks`         | 3 tuần/lần                 | `rate(21 days)`         | Mỗi 21 ngày                        |
| `1_month`         | 1 tháng/lần *(hàng tháng)* | `rate(30 days)`         | Khoảng 30 ngày                     |
| `2_months`        | 2 tháng/lần                | `rate(60 days)`         | Khoảng 60 ngày                     |
| `3_months`        | 3 tháng/lần                | `rate(90 days)`         | Khoảng 90 ngày                     |
| `4_months`        | 4 tháng/lần                | `rate(120 days)`        | Khoảng 120 ngày                    |
| `6_months`        | 6 tháng/lần                | `rate(180 days)`        | Khoảng 180 ngày                    |
| `1_year`          | 1 năm/lần *(hàng năm)*     | `rate(365 days)`        | Khoảng 12 tháng                    |
| `2_years`         | 2 năm/lần                  | `rate(730 days)`        | Khoảng 24 tháng                    |
| `daily`           | Hàng ngày                  | `rate(1 day)`           | Mỗi ngày                           |
| `weekly`          | Hàng tuần                  | `rate(7 days)`          | Mỗi tuần                           |
| `monthly`         | Hàng tháng                 | `rate(30 days)`         | Mỗi tháng                          |
| `yearly`          | Hàng năm                   | `rate(365 days)`        | Mỗi năm                            |
| `3m`              | Mỗi 3 phút (test)          | `rate(3 minutes)`       | Mỗi 3 phút *(dùng test scheduler)* |


---

### GET `/maintenance-plan`

Lấy danh sách tất cả kế hoạch bảo trì hiện có.

**Response (200):**

```json
[
  {
    "id": "3bfb7462-b04f-4418-bad2-09183a8a23b3",
    "equipment_id": "CAOTMJS",
    "frequency": "3_months",
    "next_maintenance_date": "2025-12-01T08:00:00.000Z",
    "reminder_schedule_arn": "remind-3bfb7462-b04f-...",
    "active": true,
    "created_at": "2025-11-05T07:31:45.000Z",
    "updated_at": "2025-11-05T07:31:45.000Z"
  }
]
```

---

### GET `/maintenance-plan/:id`

Lấy chi tiết 1 kế hoạch bảo trì.

**Response (200):**

```json
{
  "id": "3bfb7462-b04f-4418-bad2-09183a8a23b3",
  "equipment_id": "CAOTMJS",
  "frequency": "3_months",
  "next_maintenance_date": "2025-12-01T08:00:00.000Z",
  "reminder_schedule_arn": "remind-3bfb7462-b04f-...",
  "active": true
}
```

**Lỗi (404):**

```json
{ "error": "Maintenance plan not found" }
```

---

### GET `/maintenance-plan/equipment/:equipmentId`

Lấy danh sách kế hoạch bảo trì theo `equipment_id`.

**Response (200):**

```json
[
  {
    "id": "3bfb7462-b04f-4418-bad2-09183a8a23b3",
    "equipment_id": "CAOTMJS",
    "frequency": "3_months",
    "next_maintenance_date": "2025-12-01T08:00:00.000Z"
  }
]
```

---

### PUT `/maintenance-plan/:id`

Cập nhật kế hoạch bảo trì.

**Rule:**

- Không thể thay đổi `equipment_id` của plan đã tồn tại.
- Nếu thay đổi `frequency` hoặc `next_maintenance_date` → hệ thống **xóa schedule cũ** và **tạo lại schedule mới** trên AWS.

**Request body (JSON):**

```json
{
  "frequency": "6_months",
  "next_maintenance_date": "2026-01-01T08:00:00.000Z"
}
```

**Response (200):**

```json
{
  "id": "3bfb7462-b04f-4418-bad2-09183a8a23b3",
  "equipment_id": "CAOTMJS",
  "frequency": "6_months",
  "next_maintenance_date": "2026-01-01T08:00:00.000Z",
  "reminder_schedule_arn": "remind-3bfb7462-b04f-...-1735808400000",
  "active": true
}
```

**Lỗi (400):**

```json
{ "error": "next_maintenance_date phải lớn hơn thời gian hiện tại" }
```

---

### DELETE `/maintenance-plan/:id`

Xóa kế hoạch bảo trì (và schedule AWS tương ứng).

**Response (200):**

```json
{ "message": "Plan deleted successfully" }
```

---

# **Maintenance Request APIs (`/maintenance-requests`)**

> **Authentication**:
>
> - Tất cả request yêu cầu header `Authorization: Bearer <accessToken>`.
>
> **Roles:**
>
> - `admin`, `super-admin`: tạo, cập nhật, hủy yêu cầu.
> - `technician`: xác nhận nhận việc.

---

### POST `/maintenance-requests`

* `equipment_unit_id` là **mảng** gồm ít nhất 1 phần tử.
* Hệ thống **tự động gán `branch_id`** dựa trên thiết bị đầu tiên trong mảng.
* Khi tạo request:

  * Nếu **có `candidate_tech_id`** → hệ thống coi như **đã chỉ định kỹ thuật viên**,
    → gán `status = "confirmed"`,
    → đồng thời **tự động tạo AWS Schedule** (EventBridge) để đến thời điểm `scheduled_at` sẽ bắt đầu bảo trì.
  * Nếu **không có `candidate_tech_id`** → gán `status = "pending"`,
    → hệ thống **gửi thông báo** tới **toàn bộ kỹ thuật viên** để họ nhận việc.

---

### **Request body (JSON)**

#### 🔹 **Trường hợp 1 — Có `candidate_tech_id` (Đã chỉ định kỹ thuật viên)**

Thiết bị sẽ được gán cho kỹ thuật viên chỉ định và tạo lịch bảo trì tự động.

```json
{
  "equipment_unit_id": ["CAOTMJS-1", "CAOTMJS-2"],
  "maintenance_reason": "Lịch bảo trì quý IV",
  "scheduled_at": "2025-11-05T15:50:00",
  "candidate_tech_id": "tech-12345"
}
```

**Kết quả:**

* `status`: `"confirmed"`
* `auto_start_schedule_arn`: tạo trên AWS EventBridge
* Gửi thông báo email đến quản lý và kỹ thuật viên
* Các thiết bị trong `equipment_unit_id` được **đánh dấu khóa lịch (`isScheduleLocked = true`)** nhằm chặn không thực hiện điều chuyển và thanh lý

---

#### 🔹 **Trường hợp 2 — Không có `candidate_tech_id` (Chưa chỉ định kỹ thuật viên)**

```json
{
  "equipment_unit_id": ["CAOTMJS-3"],
  "maintenance_reason": "Lịch bảo trì quý IV",
  "scheduled_at": "2025-11-05T15:50:00",
}
```

**Kết quả:**

* `status`: `"pending"`
* Không tạo AWS Schedule
* Gửi thông báo đến **tất cả kỹ thuật viên trong cùng chi nhánh** để họ xem và nhận việc
* Các thiết bị trong `equipment_unit_id` cũng được **đánh dấu `isScheduleLocked = true`** để chặn chuyển/ thanh lý trước khi bảo trì

---

### **Response (201)**

```json
{
  "id": "1f9b4c55-62d3-4b33-9ee9-02164cd1329e",
  "equipment_unit_id": ["CAOTMJS-1", "CAOTMJS-2"],
  "branch_id": "GV",
  "assigned_by": "admin-xyz",
  "maintenance_reason": "Lịch bảo trì quý IV",
  "scheduled_at": "2025-11-05T15:50:00",
  "status": "confirmed",
  "candidate_tech_id": "tech-12345",
  "auto_start_schedule_arn": "arn:aws:scheduler:ap-southeast-1:....",
  "created_at": "2025-11-05T07:35:00.000Z"
}
```

---

### **Response lỗi**

```json
{ "error": "equipment_unit_id must be a non-empty array" }
```

Hoặc nếu một trong các thiết bị không tồn tại / bị khóa lịch:

```json
{ "error": "Equipment unit CAOTMJS-1 is locked for scheduling" }
```

---

### **Ghi chú thêm **

| Trường                    | Ý nghĩa                                                                                             |
| ------------------------- | --------------------------------------------------------------------------------------------------- |
| `auto_start_schedule_arn` | ARN của lịch tự động tạo trên AWS để bắt đầu bảo trì đúng giờ                                       |
| `isScheduleLocked`        | Flag trong bảng `equipment_unit` — bị đặt `true` khi có lịch bảo trì, `false` khi hủy hoặc bảo trì hoàn tất (ready, failed) |
| `candidate_tech_id`       | ID của kỹ thuật viên được giao việc (nếu có)                                                        |
| `status`                  | `"pending"` hoặc `"confirmed"` tùy theo trường hợp                                                  |
| `scheduled_at`            | Thời gian dự kiến bắt đầu bảo trì                                                                   |

---

### PUT `/maintenance-requests/:id`

Cập nhật thông tin yêu cầu bảo trì (khi chưa thực hiện).

**Rule:**

- Chỉ cho phép chỉnh sửa khi `status = pending` hoặc `confirmed`.
- Nếu thay đổi `scheduled_at`, hệ thống sẽ **xóa schedule cũ và tạo lại mới**.
- Nếu thêm mới `candidate_tech_id` → gửi thông báo “Assigned”.

**Request body (JSON):**

```json
{
  "scheduled_at": "2025-11-05T15:50:00",
  "candidate_tech_id": "tech-002"
}
```

**Response (200):**

```json
{
  "message": "Request updated successfully",
  "request": {
    "id": "1f9b4c55-62d3-4b33-9ee9-02164cd1329e",
    "scheduled_at": "2025-11-05T15:50:00",
    "candidate_tech_id": "tech-002",
    "status": "confirmed"
  }
}
```

---

### PUT `/maintenance-requests/:id/confirm`

Kỹ thuật viên xác nhận **nhận việc**.

**Response (200):**

```json
{
  "message": "Request confirmed and Maintenance created",
  "request": {
    "id": "1f9b4c55-62d3-4b33-9ee9-02164cd1329e",
    "confirmed_by": "tech-002",
    "status": "confirmed"
  }
}
```

**Lỗi (400):**

```json
{ "error": "Cannot confirm a request in status: cancelled" }
```

---

### PUT `/maintenance-requests/:id/cancel`

Admin hoặc người tạo hủy yêu cầu khi còn `pending`.

**Response (200):**

```json
{
  "message": "Request cancelled",
  "request": {
    "id": "1f9b4c55-62d3-4b33-9ee9-02164cd1329e",
    "status": "cancelled"
  }
}
```

**Lỗi (400):**

```json
{ "error": "Only pending request can be cancelled (current: confirmed)" }
```

---

### GET `/maintenance-requests`

Lấy danh sách tất cả yêu cầu bảo trì (có thể lọc theo branch tự động qua middleware).

**Response (200):**

```json
[
  {
    "id": "1f9b4c55-62d3-4b33-9ee9-02164cd1329e",
    "equipment_unit_id": ["CAOTMJS-1", "CAOTMJS-2"],
    "branch_id": "GV",
    "status": "confirmed",
    "maintenance_reason": "Lịch bảo trì quý IV",
    "scheduled_at": "2025-11-05T15:50:00",
    "units": [
      {
        "id": "CAOTMJS-1",
        "equipment_name": "Treadmill Pro",
        "vendor_name": "Johnson Fitness",
        "branch_name": "FitX Gym Gò Vấp"
      }
    ]
  }
]
```

---

### GET `/maintenance-requests/:id`

Lấy chi tiết 1 yêu cầu bảo trì (kèm thông tin thiết bị, chi nhánh, vendor).

**Response (200):**

```json
{
  "id": "1f9b4c55-62d3-4b33-9ee9-02164cd1329e",
  "branch_id": "GV",
  "status": "confirmed",
  "maintenance_reason": "Lịch bảo trì quý IV",
  "units": [
    {
      "id": "CAOTMJS-1",
      "equipment_name": "Treadmill Pro",
      "vendor_name": "Johnson Fitness",
      "branch_name": "FitX Gym Gò Vấp"
    }
  ]
}
```

---

### GET `/maintenance-requests/by-unit/:unitId`

Lấy tất cả yêu cầu bảo trì theo `equipment_unit_id`.

**Response (200):**

```json
[
  {
    "id": "req-001",
    "status": "pending",
    "maintenance_reason": "Lịch bảo trì quý IV",
    "scheduled_at": "2025-11-05T15:50:00",
  }
]
```

---

### DELETE `/maintenance-requests/:id`

Xóa yêu cầu (ít dùng — chỉ cho phép super-admin hoặc khi test).

**Response (200):**

```json
{ "message": "Maintenance request deleted" }
```

---

### POST `/disposal`

Tạo **đợt thanh lý thiết bị** (nhiều unit cùng lúc).

**Rule**

- Mỗi `equipment_unit` phải tồn tại và **chưa bị thanh lý** (`status !== "Disposed"`).
- Sau khi tạo thành công → các unit trong danh sách sẽ được cập nhật trạng thái `Disposed`.
- Hệ thống tự động tính **tổng giá trị thu hồi (`total_value`)**.

**Request body (JSON):**

```json
{
  "branch_id": "GV",
  "note": "Thanh lý thiết bị hư 19/10",
  "items": [
    {
      "equipment_unit_id": "CAOTMJS-8",
      "value_recovered": 10000000
    }
  ]
}
```

**Response (201):**

```json
{
  "id": "33de8359-d77d-4550-987d-e00f9b4dc669",
  "branch_id": "GV",
  "note": "Thanh lý thiết bị hư 19/10",
  "user_id": "b9daf50c-1081-7027-d089-42f33412e8f0",
  "user_name": "Đinh Quốc Khánh",
  "branch_name": "FitX Gym Gò Vấp",
  "created_at": "2025-10-19T09:32:16.445Z",
  "total_value": 10000000,
  "details": [
    {
      "id": "86d520de-728e-42f8-b3c4-5aa8860a12f9",
      "disposal_id": "33de8359-d77d-4550-987d-e00f9b4dc669",
      "equipment_unit_id": "CAOTMJS-8",
      "value_recovered": 10000000,
      "equipment_name": "Endurance Treadmill",
      "cost_original": 120000000,
      "created_at": "2025-10-19T09:32:16.744Z"
    }
  ]
}
```

**Lỗi (400):**

```json
{ "error": "Danh sách thiết bị không được trống" }
```

---

### GET `/disposal`

Lấy **tất cả đợt thanh lý**, kèm chi tiết từng thiết bị trong mỗi đợt.

**Response (200):**

```json
[
  {
    "id": "33de8359-d77d-4550-987d-e00f9b4dc669",
    "branch_id": "GV",
    "branch_name": "FitX Gym Gò Vấp",
    "note": "Thanh lý thiết bị hư 19/10",
    "user_id": "b9daf50c-1081-7027-d089-42f33412e8f0",
    "user_name": "Đinh Quốc Khánh",
    "created_at": "2025-10-19T09:32:16.445Z",
    "total_value": 10000000,
    "details": [
      {
        "id": "86d520de-728e-42f8-b3c4-5aa8860a12f9",
        "disposal_id": "33de8359-d77d-4550-987d-e00f9b4dc669",
        "equipment_unit_id": "CAOTMJS-8",
        "value_recovered": 10000000,
        "equipment_name": "Endurance Treadmill",
        "cost_original": 120000000,
        "created_at": "2025-10-19T09:32:16.744Z"
      }
    ]
  }
]
```

---

### GET `/disposal/:id`

Lấy **chi tiết một đợt thanh lý**, gồm danh sách thiết bị và giá trị thu hồi.

**Response (200):**

```json
{
  "id": "33de8359-d77d-4550-987d-e00f9b4dc669",
  "branch_id": "GV",
  "branch_name": "FitX Gym Gò Vấp",
  "note": "Thanh lý thiết bị hư 19/10",
  "user_id": "b9daf50c-1081-7027-d089-42f33412e8f0",
  "user_name": "Đinh Quốc Khánh",
  "created_at": "2025-10-19T09:32:16.445Z",
  "total_value": 10000000,
  "details": [
    {
      "id": "86d520de-728e-42f8-b3c4-5aa8860a12f9",
      "disposal_id": "33de8359-d77d-4550-987d-e00f9b4dc669",
      "equipment_unit_id": "CAOTMJS-8",
      "value_recovered": 10000000,
      "equipment_name": "Endurance Treadmill",
      "cost_original": 120000000,
      "created_at": "2025-10-19T09:32:16.744Z"
    }
  ]
}
```

**Lỗi (404):**

```json
{ "error": "Không tìm thấy đợt thanh lý" }
```

---

# **Dashboard API**

### **Giải thích chi tiết các trường**

| Trường                  | Mô tả                                      |
| ----------------------- | ------------------------------------------ |
| `label`                 | Tên kỳ thống kê (Tháng X / Quý X / Tuần X) |
| `totalEquipments`       | Tổng thiết bị còn hoạt động đến cuối kỳ    |
| `newEquipmentUnits`     | Thiết bị mới nhập trong kỳ                 |
| `disposedUnits`         | Thiết bị đã thanh lý trong kỳ              |
| `maintenanceInProgress` | Số bảo trì đang thực hiện                  |
| `maintenanceSuccess`    | Số bảo trì hoàn thành                      |
| `maintenanceFailed`     | Số bảo trì thất bại                        |
| `totalStaff`            | Tổng nhân viên hệ thống                    |
| `totalVendors`          | Tổng nhà cung cấp                          |
| `importCost`            | Tổng chi phí nhập hàng trong kỳ            |
| `maintenanceCost`       | Tổng chi phí bảo trì trong kỳ              |
| `disposalCost`          | Tổng giá trị thanh lý thiết bị trong kỳ    |
| `equipmentStatusCount`  | Đếm thiết bị theo từng trạng thái          |
| `warrantyValid`         | Số thiết bị còn trong thời gian bảo hành   |
| `warrantyExpired`       | Số thiết bị đã hết bảo hành                |

---

## Base URL

---

## `GET /dashboard/statistics`

Trả về **thống kê tổng hợp** cho Dashboard (dạng tổng quát)
gồm số lượng thiết bị, bảo trì, thanh lý, nhân viên, chi phí, trạng thái và bảo hành.

---

### **Query Params**

`type`: Kiểu thời gian thống kê: `"month"`, `"quarter"`, `"year"`
`year`: Năm muốn thống kê (VD: `2025`)
`month`: Nếu `type="month"` thì phải có tháng (VD: `10`)
`quarter`: Nếu `type="quarter"` thì phải có quý (VD: `3`)
`branch_id`: Lọc theo chi nhánh cụ thể (chỉ dành cho super-admin)

---

### **Các trường hợp gọi API**

### 1. Super-admin xem **toàn hệ thống** trong tháng 10/2025 Không giới hạn chi nhánh

```
/dashboard/statistics?type=month&year=2025&month=10
```

### 2. Super-admin xem **chi nhánh Gò Vấp** theo quý 3/2025

```
/dashboard/statistics?type=quarter&year=2025&quarter=3&branch_id=GV
```

### 3. Admin chi nhánh G3 xem thống kê tháng 10 (`branchFilterMiddleware` tự động giới hạn theo chi nhánh G3)

```
/dashboard/statistics?type=month&year=2025&month=10
```

### 4. Super-admin xem theo năm (Tổng hợp cả năm)

```
/dashboard/statistics?type=year&year=2025
```

---

**Response Example**

```json
{
  "period": {
    "type": "month",
    "year": 2025,
    "month": 10,
    "branchFilter": "G3"
  },
  "summary": {
    "totalEquipments": 51,
    "newEquipmentUnits": 52,
    "disposedUnits": 3,
    "maintenanceInProgress": 1,
    "maintenanceSuccess": 4,
    "maintenanceFailed": 0,
    "totalStaff": 13,
    "totalVendors": 2,
    "importCost": 2231000000,
    "maintenanceCost": 0,
    "disposalCost": 110000000,
    "equipmentStatusCount": {
      "Active": 12,
      "Inactive": 5,
      "Temporary Urgent": 2,
      "In Progress": 1,
      "In Stock": 20,
      "Moving": 11
    },
    "warrantyValid": 47,
    "warrantyExpired": 4
  }
}
```

---

## `GET /dashboard/equipment-hierarchy`

Trả về **cấu trúc phân cấp nhóm thiết bị (Category hierarchy)**
gồm: **Nhóm chính → Loại → Dòng thiết bị → Số lượng unit hiện có**

---

### **Query Params**

`branch_id`: Lọc theo chi nhánh cụ thể (super-admin có thể chọn). Nếu admin → tự động lấy chi nhánh.

---

`super-admin`: Xem tất cả chi nhánh hoặc chi nhánh cụ thể qua query param
`admin`: Chỉ xem chi nhánh của mình

---

### **Các trường hợp gọi API**

### 1. Super-admin xem **toàn hệ thống** Gộp tất cả chi nhánh

```
/dashboard/equipment-hierarchy
```

### 2. Super-admin xem **chi nhánh G3** Lọc branch_id = "G3"

```
/dashboard/equipment-hierarchy?branch_id=G3
```

### 3. Admin chi nhánh G3 xem riêng của mình (Middleware tự động lọc branch_id = G3)

```
/dashboard/equipment-hierarchy
```

---

### 📤 **Response Example**

```json
[
  {
    "main_id": "CARDIO",
    "main_name": "Thiết bị Cardio",
    "types": [
      {
        "type_id": "RUNNING",
        "type_name": "Máy chạy bộ",
        "equipments": [
          {
            "equipment_id": "TMX200",
            "equipment_name": "Treadmill X200",
            "unit_count": 8
          },
          {
            "equipment_id": "TMX300",
            "equipment_name": "Treadmill X300",
            "unit_count": 5
          }
        ]
      },
      {
        "type_id": "BIKE",
        "type_name": "Xe đạp tĩnh",
        "equipments": [
          {
            "equipment_id": "BIKE100",
            "equipment_name": "Bike 100",
            "unit_count": 7
          }
        ]
      }
    ]
  },
  {
    "main_id": "STRENGTH",
    "main_name": "Máy tập sức mạnh",
    "types": [
      {
        "type_id": "CHEST",
        "type_name": "Ngực",
        "equipments": [
          {
            "equipment_id": "CHESTPRESS100",
            "equipment_name": "Chest Press 100",
            "unit_count": 4
          }
        ]
      }
    ]
  }
]
```

---

# **Dashboard API**

## `GET /dashboard/statistics/trend`

Trả về **biểu đồ xu hướng (Trend chart)** của các chỉ số Dashboard,
chia theo **tháng / quý / hoặc tuần trong tháng**.
Với tháng hiện hành, các tuần **chưa tới** sẽ **tự động ẩn**.

---

### **Query Params**

`type` = `"month"` | `"quarter"` | `"week"`: Kiểu thống kê theo thời gian
`branch_id`:Lọc theo chi nhánh cụ thể (chỉ dành cho super-admin)

---

### **Các trường hợp gọi API**

#### 1. Super-admin xem xu hướng theo **tháng** của năm 2025

```
/dashboard/statistics/trend?type=month&year=2025
```

#### 2. Super-admin xem xu hướng theo **quý** của năm 2025

```
/dashboard/statistics/trend?type=quarter&year=2025
```

#### 3. Super-admin xem xu hướng **theo tuần trong tháng 10/2025**

```
/dashboard/statistics/trend?type=week&year=2025&month=10
```

#### 4. Super-admin xem xu hướng theo **chi nhánh G3** (tháng)

```
/dashboard/statistics/trend?type=month&year=2025&branch_id=G3
```

#### 5. Admin chi nhánh G3 (middleware tự động lọc)

```
/dashboard/statistics/trend?type=week&year=2025&month=10
```

---

### **Response Example (theo tháng)**

```json
[
  {
    "label": "Tháng 1",
    "totalEquipments": 20,
    "newEquipmentUnits": 5,
    "disposedUnits": 0,
    "maintenanceInProgress": 1,
    "maintenanceSuccess": 0,
    "maintenanceFailed": 0,
    "totalStaff": 4,
    "totalVendors": 2,
    "importCost": 50000000,
    "maintenanceCost": 0,
    "disposalCost": 0,
    "equipmentStatusCount": {
      "Active": 12,
      "Inactive": 5,
      "Temporary Urgent": 1,
      "In Progress": 0,
      "In Stock": 2,
      "Moving": 0,
      "Ready": 0,
      "Failed": 0
    },
    "warrantyValid": 18,
    "warrantyExpired": 2
  },
  {
    "label": "Tháng 2",
    "totalEquipments": 25,
    "newEquipmentUnits": 7,
    "disposedUnits": 2,
    "maintenanceInProgress": 0,
    "maintenanceSuccess": 3,
    "maintenanceFailed": 0,
    "totalStaff": 4,
    "totalVendors": 2,
    "importCost": 85000000,
    "maintenanceCost": 10000000,
    "disposalCost": 2000000,
    "equipmentStatusCount": {
      "Active": 14,
      "Inactive": 4,
      "Temporary Urgent": 2,
      "In Progress": 0,
      "In Stock": 3,
      "Moving": 0,
      "Ready": 0,
      "Failed": 0
    },
    "warrantyValid": 23,
    "warrantyExpired": 2
  }
]
```

---

### **Response Example (theo tuần)**

```json
[
  {
    "label": "Tuần 1",
    "totalEquipments": 0,
    "newEquipmentUnits": 0,
    "disposedUnits": 0,
    "maintenanceInProgress": 0,
    "maintenanceSuccess": 0,
    "maintenanceFailed": 0,
    "totalStaff": 4,
    "totalVendors": 2,
    "importCost": 0,
    "maintenanceCost": 0,
    "disposalCost": 0,
    "equipmentStatusCount": {
      "Active": 0,
      "Inactive": 0,
      "Temporary Urgent": 0,
      "In Progress": 0,
      "In Stock": 0,
      "Moving": 0,
      "Ready": 0,
      "Failed": 0
    },
    "warrantyValid": 0,
    "warrantyExpired": 0
  },
  {
    "label": "Tuần 2",
    "totalEquipments": 48,
    "newEquipmentUnits": 49,
    "disposedUnits": 3,
    "maintenanceInProgress": 0,
    "maintenanceSuccess": 2,
    "maintenanceFailed": 0,
    "totalStaff": 4,
    "totalVendors": 2,
    "importCost": 2219000000,
    "maintenanceCost": 0,
    "disposalCost": 110000000,
    "equipmentStatusCount": {
      "Active": 30,
      "Inactive": 5,
      "Temporary Urgent": 2,
      "In Progress": 0,
      "In Stock": 8,
      "Moving": 2,
      "Ready": 1,
      "Failed": 0
    },
    "warrantyValid": 48,
    "warrantyExpired": 0
  }
]
```

---
