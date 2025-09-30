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
    - `GET /maintenance/:id` — Lấy chi tiết một yêu cầu bảo trì
    - `PUT /maintenance/:id/progress` — Bắt đầu bảo trì (In Progress)
    - `PUT /maintenance/:id/complete` — Hoàn tất bảo trì (Ready / Failed)
    - `DELETE /maintenance/:id` — Xóa yêu cầu bảo trì

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
  "equipment_unit_id": "f5b7fa4a-3f62-400d-a004-0aebc11b9b0f",
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
