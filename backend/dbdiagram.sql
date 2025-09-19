Table User {
  id varchar [primary key, note: 'FITX lấy 3 số cộng thêm']
  branch_id varchar
  full_name varchar
  date_of_birth date
  gender varchar [note: 'Nam, Nữ']
  phone_number varchar
  email varchar
  address varchar
  created_at datetime
  updated_at datetime [note: 'Ngày cập nhật (trạng thái, thông tin,...)']
  status varchar [note: 'Active, Inactive']
}

Table Roles {
  id varchar [primary key]
  name varchar [note: 'Super admin, Admin, Operator, Technician']
}

Table User_role {
  user_id varchar
  role_id varchar
  assigned_at datetime
}

Table Vendor {
  id varchar [primary key]
  name varchar
  origin varchar [note: 'xuất xứ: VIETNAM']
  description varchar
}

Table Category_main {
  id varchar [primary key, note: 'Tùy theo tên sẽ lấy id, vd: cardio = CAO']
  name varchar
  image varchar
  description varchar
  created_at datetime
  updated_at datetime
}

Table Category_type {
  id varchar [primary key, note: 'Tùy theo loại cụ thể sẽ lấy id, vd: Treadmill = TM']
  category_main_id varchar
  name varchar
  description varchar
  created_at datetime
  updated_at datetime
}

Table Equipment {
  id varchar [primary key, note: 'id = main_id + type_id + vendor_id, VD: CAOTMTC']
  vendor_id varchar
  category_type_id varchar
  name varchar
  image varchar
  description varchar
  warranty_duration int [note: 'Số năm bảo hành do vendor cung cấp']
  created_at datetime
  updated_at datetime
}

Table Equipment_unit {
  id int [primary key, note: 'id tăng tự động']
  equipment_id varchar
  branch_id varchar
  sku varchar [unique, note: 'Mã code duy nhất quản lý trong kho']
  cost double [note: 'giá niêm yết']
  description varchar
  status varchar [note: 'Active, Inactive, Temporary Urgent, In Progress, Ready, Failed, In Stock, Deleted, Moving']
  created_at datetime [note: 'Ngày nhập thiết bị']
  updated_at datetime
  warranty_start_date datetime [note: 'Ngày bắt đầu bảo hành tính từ ngày nhập hàng']
  warranty_end_date datetime [note: 'Ngày kết thúc bảo hành']
}

Table Branch {
  id varchar [primary key]
  name varchar [note: 'Tên chi nhánh']
  address varchar
  -- manager_id varchar [note: 'Người quản lý chi nhánh']
  created_at datetime
  updated_at datetime
}

Table Equipment_transfer {
  id int [primary key]
  equipment_unit_id varchar
  from_branch_id varchar [note: 'từ chi nhánh A']
  to_branch_id varchar [note: 'sang chi nhánh B']
  approved_by varchar [note: 'người yêu cầu vận chuyển']
  description varchar
  status varchar [note: 'Pending, Completed']
  move_start_date datetime [note: 'Ngày bắt đầu vận chuyển sang chi nhánh khác']
  move_receive_date datetime [note: 'Ngày tới chi nhánh']
}


Table Maintenance {
  id varchar [primary key]
  equipment_unit_id varchar
  branch_id varchar [note: 'thuộc chi nhánh nào']
  user_id varchar [note: 'Người thực hiện bảo trì (Technician)']
  assigned_by varchar [note: 'Người yêu cầu bảo trì (Operator/Admin)']
  description varchar
  start_date datetime [note: 'Thời điểm bắt đầu bảo trì']
  end_date datetime [note: 'Thời điểm kết thúc bảo trì']
  warranty boolean [note: 'True nếu còn hạn bảo hành, False nếu hết hạn']
}

Table Maintenance_invoice {
  id varchar [primary key]
  maintenance_id varchar
  cost double [note: 'Chi phí bảo trì (nếu còn bảo hành $0)']
  created_at datetime
}

// Sử dụng mô hình EAV để tự tạo các thuộc tính
// Entity: Bảng chứa thông tin cơ bản của đối tượng
// Attribute: Bảng chứa các thuộc tính có thể thêm vào
// ValueValue: Bảng chứa tổng hợp giá trị của cả Entity và Attribute với 2 khóa ngoại được tham chiếu đến
Table Attribute {
  id int [primary key, note:'tự động tăng']
  name varchar [note: 'VD: tên của attribute, vd: color, size']
}

Table Attribute_value {
  id int [primary key]
  equipment_id varchar
  attribute_id varchar
  value varchar [note: 'VD: màu đen']
}

Table Invoices {
  id varchar [primary key]
  user_id varchar [note: 'Người nhập hàng']
  total double [note: 'Tổng số tiền các thiết bị']
  created_at datetime [note: 'Ngày tạo hóa đơn']
}

Table Invoices_detail {
  id varchar [primary key]
  invoice_id varchar
  equipment_unit_id varchar
  cost double [note: 'Giá từng thiết bị']
}


Ref: User.id < User_role.user_id
Ref: Roles.id < User_role.role_id
Ref: Category_main.id < Category_type.category_main_id
Ref: Category_type.id < Equipment.category_type_id
Ref: Equipment.id < Equipment_unit.equipment_id
Ref: Equipment.id < Attribute_value.equipment_id
Ref: Attribute.id < Attribute_value.attribute_id
Ref: Vendor.id < Equipment.vendor_id
Ref: Equipment_unit.id < Invoices_detail.equipment_unit_id
Ref: Invoices.id < Invoices_detail.invoice_id
Ref: User.id < Invoices.user_id
Ref: Equipment_unit.id < Maintenance.equipment_unit_id
Ref: User.id < Maintenance.user_id
Ref: User.id < Maintenance.assigned_by
Ref: Maintenance.id < Maintenance_invoice.maintenance_id
Ref: Branch.id < User.branch_id
Ref: Branch.id < Equipment_unit.branch_id
Ref: Branch.id < Equipment_transfer.from_branch_id
Ref: Branch.id < Equipment_transfer.to_branch_id
Ref: Branch.id < Maintenance.branch_id
Ref: Equipment_unit.id < Equipment_transfer.equipment_unit_id
Ref: User.id < Equipment_transfer.approved_by