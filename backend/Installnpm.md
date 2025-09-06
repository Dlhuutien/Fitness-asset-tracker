# npm nodejs
npm init -y
npm install express aws-jwt-verify
npm install --save-dev nodemon

# Xac thuc
npm install amazon-cognito-identity-js
npm install aws-sdk
npm install body-parser
npm install @aws-sdk/client-cognito-identity-provider
npm install cors
npm install dotenv


### =============== Test nhanh bằng Postman ===============

1. **Tạo các nhóm Cognito**:

   * `super-admin`, `admin`, `operator`, `technician`
   * Trong AWS Console > Cognito > User pools > Groups.

2. **Signup (Đăng ký) (POST [http://localhost:3000/auth/signup](http://localhost:3000/auth/signup))**
   JSON body:

   ```json
   {
     "username": "tien",
     "password": "Huutien@000",
     "email": "Dangleuutien000@gmail.com",
     "role": "admin"
   }
   ```

   * Nếu App client của bạn có secret: API sẽ tự gửi `SECRET_HASH`, bạn sẽ không gặp lỗi **"configured with secret but SECRET\_HASH was not received"**.

3. **Confirm (Xác nhận) (POST [http://localhost:3000/auth/confirm](http://localhost:3000/auth/confirm))**
   JSON body:

   ```json
   { "username": "tien", "code": "123456" }
   ```

   * Dùng mã xác nhận bạn nhận được qua email/SMS.
   * Sau này dùng `/admin/create-user` để tạo user.

4. **Signin (Đăng nhập) (POST [http://localhost:3000/auth/signin](http://localhost:3000/auth/signin))**
   JSON body:

   ```json
   { "username": "tien", "password": "Huutien@000" }
   ```

   * Response sẽ chứa `accessToken`, `idToken`, `refreshToken`.

5. **Gọi API bảo vệ (Protected route)**

   * Header: `Authorization: Bearer <accessToken>`
   * Ví dụ:

     * `GET http://localhost:3000/me`
     * `GET http://localhost:3000/admin-only` → yêu cầu user là `admin` hoặc `super-admin`
     * `GET http://localhost:3000/super-admin-only` → yêu cầu user là `super-admin`
     * `GET http://localhost:3000/tech-or-operator` → yêu cầu user là `technician`, `operator`, `admin` hoặc `super-admin`.

6. **Refresh token (POST [http://localhost:3000/auth/refresh](http://localhost:3000/auth/refresh))**
   JSON body:

   ```json
   { "refreshToken": "<refreshToken>", "username": "tien" }
   ```

---

### Ghi chú

* App client bật **USER\_PASSWORD\_AUTH flow**.