### Fitness-asset-tracker

> Ngôn ngữ: **Tiếng Việt**.
> Xác thực: **Cognito** (JWT accessToken) — header `Authorization: Bearer <accessToken>`.
> Roles (Cognito Groups): `super-admin`, `admin`, `operator`, `technician`.

---

# Mục lục

1. [Thiết lập ban đầu](#thiết-lập-ban-đầu)

2. [Auth APIs (`/auth`)](#auth-apis-auth)

   * `/auth/signup` — Signup
   * `/auth/confirm` — Confirm sign up
   * `/auth/signin` — Sign in
   * `/auth/refresh` — Refresh token
   * `/auth/firstLogin` — NEW\_PASSWORD\_REQUIRED (first login change password)

3. [User APIs (`/user`)](#user-apis-user)

   * `/user/me` — Lấy thông tin hiện tại
   * `/user/admin-only` — ví dụ protected
   * `/user/super-admin-only` — ví dụ protected
   * `/user/tech-or-operator` — ví dụ protected
   * `/user/create` — Admin tạo user (Admin API)
   * `/user/change-password` — Đổi password (user)
   * `/user/update-info` — Cập nhật thông tin user (user tự cập nhật)
   * `/user/change-status` — Admin/SA enable/disable user
   * `/user/admin-update-user` — Admin/SA cập nhật attributes người dùng
   * `/user/list-user` — Admin/SA lấy danh sách users

4. [Lỗi thường gặp](#lỗi-thường-gặp)

5. [Vendor APIs (`/vendor`)](#vendor-apis-vendor)

   * `POST /vendor` — Tạo vendor
   * `GET /vendor` — Lấy danh sách vendor
   * `GET /vendor/:id` — Lấy chi tiết vendor
   * `PUT /vendor/:id` — Cập nhật vendor
   * `DELETE /vendor/:id` — Xóa vendor

6. [Branch APIs (`/branch`)](#branch-apis-branch)

   * `POST /branch` — Tạo branch
   * `GET /branch` — Lấy danh sách branch
   * `GET /branch/:id` — Lấy chi tiết branch
   * `PUT /branch/:id` — Cập nhật branch
   * `DELETE /branch/:id` — Xóa branch

7. [Category Main APIs (`/categoryMain`)](#category-main-apis-categorymain)

   * `POST /categoryMain` — Tạo category main
   * `GET /categoryMain` — Lấy danh sách category main
   * `GET /categoryMain/:id` — Lấy chi tiết category main
   * `PUT /categoryMain/:id` — Cập nhật category main
   * `DELETE /categoryMain/:id` — Xóa category main

8. [Category Type APIs (`/categoryType`)](#category-type-apis-categorytype)

   * `POST /categoryType` — Tạo category type
   * `GET /categoryType` — Lấy danh sách category type
   * `GET /categoryType/:id` — Lấy chi tiết category type
   * `GET /categoryType/main/:category_main_id` — Lấy category type theo category main
   * `PUT /categoryType/:id` — Cập nhật category type
   * `DELETE /categoryType/:id` — Xóa category type

9. [Attribute APIs (`/attribute`)](#attribute-apis-attribute)

   * `POST /attribute` — Tạo attribute
   * `GET /attribute` — Lấy danh sách attribute
   * `GET /attribute/:id` — Lấy chi tiết attribute
   * `PUT /attribute/:id` — Cập nhật attribute
   * `DELETE /attribute/:id` — Xóa attribute

10. [Attribute Value APIs (`/attributeValue`)](#attribute-value-apis-attributevalue)

    * `POST /attributeValue` — Tạo attribute value
    * `GET /attributeValue` — Lấy danh sách attribute value
    * `GET /attributeValue/:id` — Lấy chi tiết attribute value
    * `GET /attributeValue/equipment/:equipment_id` — Lấy attribute value theo equipment
    * `GET /attributeValue/attribute/:attribute_id` — Lấy attribute value theo attribute
    * `PUT /attributeValue/:id` — Cập nhật attribute value
    * `DELETE /attributeValue/:id` — Xóa attribute value

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
  "name": "Treadmill Pro",
  "vendor_id": "MT",
  "category_type_id": "TM",
  "description": "Máy chạy bộ cao cấp",
  "image": "https://example.com/treadmill.png",
  "warranty_duration": 2
}
```

**Response (201):**

```json
{
  "updated_at": "2025-09-21T08:59:26.737Z",
  "created_at": "2025-09-21T08:59:26.737Z",
  "image": "https://example.com/treadmill.png",
  "warranty_duration": 2,
  "description": "Máy chạy bộ cao cấp",
  "id": "CAOTMMT",
  "name": "Treadmill Pro",
  "category_type_id": "TM",
  "vendor_id": "MT"
}
```

**Lỗi (400 - thiếu id/name):**

```json
{ "error": "Category id and name are required" }
```

**Lỗi (400 - id đã tồn tại):**

```json
{ "error": "CategoryMain with id CARDIO already exists" }
```

---

### GET `/categoryMain`

Lấy danh sách tất cả categories (mọi user đăng nhập).

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
    "name": "Treadmill Pro",
    "category_type_id": "TM",
    "vendor_id": "MT"
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
  "updated_at": "2025-09-21T08:59:26.737Z",
  "created_at": "2025-09-21T08:59:26.737Z",
  "image": "https://example.com/treadmill.png",
  "warranty_duration": 2,
  "description": "Máy chạy bộ cao cấp",
  "id": "CAOTMMT",
  "name": "Treadmill Pro",
  "category_type_id": "TM",
  "vendor_id": "MT"
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
  "name": "Treadmill Pro",
  "vendor_id": "MT",
  "category_type_id": "TM",
  "description": "Máy chạy bộ cao cấp",
  "image": "https://example.com/treadmill.png",
  "warranty_duration": 2
}
```

**Response (200):**

```json
{
  "updated_at": "2025-09-21T08:59:26.737Z",
  "created_at": "2025-09-21T08:59:26.737Z",
  "image": "https://example.com/treadmill.png",
  "warranty_duration": 2,
  "description": "Máy chạy bộ cao cấp",
  "id": "CAOTMMT",
  "name": "Treadmill Pro",
  "category_type_id": "TM",
  "vendor_id": "MT"
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
> * Tạo / sửa / xóa: yêu cầu header `Authorization: Bearer <accessToken>`.
> * Roles: chỉ `admin`, `super-admin` được phép **create / update / delete**.
> * Mọi role (`operator`, `technician`, `admin`, `super-admin`) đều có thể **xem danh sách / chi tiết** attribute.

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
> * Tạo / sửa / xóa: yêu cầu header `Authorization: Bearer <accessToken>`.
> * Roles: chỉ `admin`, `super-admin` được phép **create / update / delete**.
> * Mọi role (`operator`, `technician`, `admin`, `super-admin`) đều có thể **xem danh sách / chi tiết** attribute value.

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

**Lỗi (400 - đã tồn tại attribute\_id + equipment\_id):**

```json
{ "error": "AttributeValue with equipment_id CAOTMMT and attribute_id 81a0b2c3... already exists" }
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