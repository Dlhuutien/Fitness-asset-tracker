# Fitness Asset Tracker – FitX Gym (EN)

The system aims to **digitalize the entire lifecycle of gym equipment**, including equipment import, status tracking, scheduled and emergency maintenance, inter-branch transfer, and equipment disposal.
The solution is built on a **Serverless Architecture on AWS**, ensuring high scalability, performance efficiency, and optimized operational costs.

---

## System Objectives

* Centrally manage all gym equipment throughout its **complete lifecycle**
* Standardize workflows for **equipment import, maintenance, transfer, and disposal**
* Support **multi-branch operations**
* Enhance transparency and reduce human errors compared to manual management by **recording the full history of system actions and data changes**

---

## Overall System Architecture

The FitX Gym system is designed based on a **Layered Architecture**, combined with **Serverless Architecture** on AWS.

### Main Layers

1. **Presentation Layer**

   * User interface
   * Handles user requests and authentication
   * Communicates with the backend via RESTful APIs (HTTPS)

2. **Business Logic Layer**

   * Core business processing:

     * Equipment management
     * Scheduled and emergency maintenance
     * Equipment transfer
     * Equipment disposal
     * User role management
   * Orchestrates workflows and triggers automated events

3. **Persistence Layer**

   * Repository layer
   * Performs CRUD operations
   * Optimizes queries for DynamoDB
   * Contains no business logic

4. **Data Access Layer**

   * Defines data models
   * Manages schema, primary keys (PK/SK), and GSIs
   * Ensures data integrity before persistence

---

## Deployment Architecture (Cloud Architecture)

The system is fully deployed on **AWS Cloud** following a **Serverless** model:

* **Frontend**

  * Web-based Single Page Application (SPA)
  * Communicates with backend services via HTTPS
  * Does not depend on traditional server infrastructure

* **Backend**

  * Node.js + ExpressJS
  * Deployed using **AWS Lambda**
    *(AWS Lambda is a serverless service that allows backend execution without managing servers. Costs are incurred only when functions are executed (on requests), with no charges when idle, enabling cost optimization and scalability.)*

* **Database & Services**

  * **Amazon DynamoDB**: stores equipment, maintenance, and transfer data
  * **Amazon S3**: stores equipment images
  * **AWS Cognito**: authentication and authorization
  * **AWS EventBridge Scheduler**: automated maintenance reminders
  * **Amazon CloudWatch**: logging and performance monitoring

---

## Technologies Used

### Frontend

* ReactJS
* Tailwind CSS
* Shadcn UI
* Single Page Application (SPA)

### Backend

* Node.js
* ExpressJS
* RESTful API
* Serverless Architecture

### Cloud & Infrastructure

* AWS Lambda
* Amazon DynamoDB (NoSQL)
* Amazon S3
* AWS Cognito
* AWS EventBridge Scheduler
* Amazon CloudWatch

### Supporting Tools

* Git & GitHub
* Visual Studio Code
* Postman
* Figma (UI/UX Design)

---

## Security & Authorization

* User authentication via **AWS Cognito**
* Role-based access control:

  * Super Admin
  * Admin (Branch Manager)
  * Technician
  * Operator
* Token-based Authentication (JWT)
* All business actions and data changes are **fully logged for traceability**

---

# Fitness Asset Tracker – FitX Gym (VN)

Hệ thống hướng đến việc **số hóa toàn bộ vòng đời thiết bị phòng gym**, bao gồm: nhập thiết bị, theo dõi trạng thái, bảo trì định kỳ – ngừng khẩn cấp, điều chuyển giữa các chi nhánh và thanh lý thiết bị. Giải pháp được xây dựng theo kiến trúc **Serverless trên nền tảng AWS**, đảm bảo khả năng mở rộng, hiệu năng cao và chi phí vận hành tối ưu.

---

## Mục tiêu hệ thống

- Quản lý tập trung toàn bộ thiết bị phòng gym theo **vòng đời đầy đủ**
- Chuẩn hóa quy trình **nhập thiết bị - bảo trì - điều chuyển - thanh lý**
- Hỗ trợ vận hành **đa chi nhánh**
- Tăng tính minh bạch, giảm sai sót so với quản lý thủ công nhờ vào việc mọi thao tác và thay đổi dữ liệu đều được hệ thống ghi nhận lịch sử.

---

## Kiến trúc tổng thể hệ thống

Hệ thống FitX Gym được thiết kế theo mô hình **Layered Architecture (Kiến trúc phân tầng)**, kết hợp với mô hình **Serverless Architecture** trên AWS.

### Các tầng chính

1. **Presentation Layer**
   - Giao diện người dùng
   - Tiếp nhận request, xác thực người dùng
   - Giao tiếp với backend thông qua RESTful API (HTTPS)

2. **Business Logic Layer**
   - Xử lý nghiệp vụ cốt lõi:
     - Quản lý thiết bị
     - Bảo trì định kỳ & khẩn cấp
     - Điều chuyển thiết bị
     - Thanh lý
     - Phân quyền người dùng
   - Điều phối luồng nghiệp vụ và kích hoạt các sự kiện tự động

3. **Persistence Layer**
   - Repository layer
   - Thực hiện các thao tác CRUD
   - Tối ưu truy vấn DynamoDB
   - Không chứa logic nghiệp vụ

4. **Data Access Layer**
   - Định nghĩa mô hình dữ liệu
   - Kiểm soát schema, khóa chính (PK/SK), GSI
   - Đảm bảo toàn vẹn dữ liệu trước khi ghi xuống CSDL

---

## Kiến trúc triển khai (Cloud Architecture)

Hệ thống được triển khai hoàn toàn trên **AWS Cloud** theo mô hình **Serverless**:

- **Frontend**
  - Ứng dụng Web SPA
  - Giao tiếp backend qua HTTPS
  - Không phụ thuộc hạ tầng máy chủ truyền thống

- **Backend**
  - Node.js + ExpressJS
  - Triển khai bằng **AWS Lambda**
  *(AWS Lambda là dịch vụ serverless cho phép chạy backend mà không cần quản lý máy chủ. Hệ thống chỉ tốn chi phí khi hàm được thực thi (có request), không phát sinh chi phí khi không sử dụng, giúp tối ưu chi phí và dễ mở rộng theo nhu cầu.)*

- **Database & Services**
  - **Amazon DynamoDB**: lưu trữ dữ liệu thiết bị, bảo trì, điều chuyển
  - **Amazon S3**: lưu trữ hình ảnh thiết bị
  - **AWS Cognito**: xác thực và phân quyền người dùng
  - **AWS EventBridge Scheduler**: tự động nhắc lịch bảo trì định kỳ
  - **Amazon CloudWatch**: giám sát log và hiệu năng

---

## Công nghệ sử dụng

### Frontend
- ReactJS
- Tailwind CSS
- Shadcn UI
- SPA (Single Page Application)

### Backend
- Node.js
- ExpressJS
- RESTful API
- Serverless Architecture

### Cloud & Infrastructure
- AWS Lambda
- Amazon DynamoDB (NoSQL)
- Amazon S3
- AWS Cognito
- AWS EventBridge Scheduler
- Amazon CloudWatch

### Công cụ hỗ trợ
- Git & GitHub
- Visual Studio Code
- Postman
- Figma (UI/UX Design)

---

## Bảo mật & phân quyền

- Xác thực người dùng thông qua **AWS Cognito**
- Phân quyền theo vai trò:
  - Super Admin
  - Admin (Quản lý chi nhánh)
  - Technician (Kỹ thuật viên)
  - Operator (Nhân viên trực phòng)
- Token-based Authentication (JWT)
- Mọi thao tác nghiệp vụ đều được ghi nhận lịch sử
- 
---

## Các màn hình chính *(Main Screens)*

### Giao diện tổng quan *(Dashboard Overview)*

<img src="https://github.com/user-attachments/assets/39c43a49-a17b-4aa6-8835-f52b94934158" />
<img src="https://github.com/user-attachments/assets/0967f9b1-df91-4f5e-b44b-d0f946699a8c" />

---

### Giao diện danh sách thiết bị *(Equipment List Interface)*

<img src="https://github.com/user-attachments/assets/a2e0a452-52f3-4c45-8bbc-ca4a1e6f38f2" />

---

### Giao diện thông tin thiết bị *(Equipment Detail Interface)*

<img src="https://github.com/user-attachments/assets/9762cee0-18b0-4ca1-b6d4-0f32cbab7955" />

---

### Giao diện điều chuyển thiết bị *(Equipment Transfer Interface)*

<img src="https://github.com/user-attachments/assets/233ca110-c674-46af-8e2a-399d3e91eba4" />

---

### Giao diện xếp lịch bảo trì thiết bị *(Maintenance Scheduling Interface)*

<img src="https://github.com/user-attachments/assets/c683ea0f-d648-40ef-8dc6-b2775d497a2d" />

---

### Giao diện xem lịch bảo trì *(Maintenance Calendar View)*

<img src="https://github.com/user-attachments/assets/b39b51e5-938b-4d46-81d8-a164516885bd" />

---

### Giao diện thanh lý thiết bị *(Equipment Disposal Interface)*

<img src="https://github.com/user-attachments/assets/77d0a628-658d-4b20-91a3-cdf9d2b6e37c" />
