const { sendNoReplyEmail } = require("../utils/smtpMailer");
const notificationRepository = require("../repositories/notificationRepository");
const equipmentUnitRepository = require("../repositories/equipmentUnitRepository");
const equipmentRepository = require("../repositories/equipmentRepository");
const branchRepository = require("../repositories/branchRepository");
const userRepository = require("../repositories/userRepository");
const { buildHeader, buildFooter } = require("../utils/emailTemplate");

const notificationService = {
  // =========================
  // Hóa đơn (Invoice)
  // =========================
  /***
   * Tạo hóa đơn
   */
  async notifyInvoiceCreated(invoice, details, admins) {
    const recipients = admins.map((u) => u.email);
    if (!recipients.length) return;

    const user = await userRepository.getUserBySub(invoice.user_id);
    const creatorName = user?.attributes?.name || user?.username || "Không rõ";

    const branchIds = [
      ...new Set(
        details.map((d) => d.equipment_unit?.branch_id).filter(Boolean)
      ),
    ];
    const branchNames = [];
    for (const id of branchIds) {
      const branch = await branchRepository.findById(id);
      branchNames.push(branch?.name || id);
    }

    let itemsHtml = "";
    for (const d of details) {
      const unit = d.equipment_unit || {};
      let equipmentName = "Không rõ";
      if (unit.equipment_id) {
        const eq = await equipmentRepository.findById(unit.equipment_id);
        equipmentName = eq?.name || unit.equipment_id;
      }
      itemsHtml += `
        <tr>
          <td style="border:1px solid #ddd; padding:8px;">${equipmentName}</td>
          <td style="border:1px solid #ddd; padding:8px;">${
            unit.id || d.equipment_unit_id
          }</td>
          <td style="border:1px solid #ddd; padding:8px; text-align:right;">
            ${(d.cost || 0).toLocaleString()} VND
          </td>
        </tr>`;
    }

    const subject = "Hóa đơn nhập thiết bị mới";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto;
                  border:1px solid #e0e0e0; border-radius:8px; overflow:hidden;">
        ${buildHeader("Hóa đơn mới được tạo")}
        <div style="padding:20px; color:#000;">
        <p style="color:#000;">Một hóa đơn mới vừa được tạo.</p>
        <p style="color:#000;"><b>Mã hóa đơn:</b> ${invoice.id}</p>
        <p style="color:#000;"><b>Tổng tiền:</b> ${invoice.total.toLocaleString()} VND</p>
        <p style="color:#000;"><b>Người tạo:</b> ${creatorName}</p>
        <p style="color:#000;"><b>Chi nhánh:</b> ${
          branchNames.join(", ") || "Không rõ chi nhánh"
        }</p>
          <div style="overflow-x:auto; margin-top:10px;">
            <table style="border-collapse:collapse; width:100%; min-width:500px;">
              <thead>
                <tr>
                  <th style="border:1px solid #ddd; padding:8px; background:#f5f5f5;">Thiết bị</th>
                  <th style="border:1px solid #ddd; padding:8px; background:#f5f5f5;">Mã Unit</th>
                  <th style="border:1px solid #ddd; padding:8px; background:#f5f5f5;">Giá</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>
          </div>
        </div>
        ${buildFooter()}
      </div>
    `;

    await sendNoReplyEmail(recipients, subject, html);

    const receiverRoles = [...new Set(admins.flatMap((u) => u.roles))];
    const receiverIds = admins.map((u) => u.sub).filter(Boolean);

    return await notificationRepository.create({
      type: "invoice",
      title: "Hóa đơn nhập thiết bị mới",
      message: `Hóa đơn ${
        invoice.id
      } được tạo bởi ${creatorName}, tổng tiền: ${invoice.total.toLocaleString()} VND`,
      receiver_role: receiverRoles,
      receiver_id: receiverIds,
      created_by: invoice.user_id,
    });
  },

  // =========================
  // Bảo trì (Maintenance)
  // =========================
  /***
   * Tạo yêu cầu bảo trì
   */
  async notifyMaintenanceCreated(maintenance, admins, createdBy) {
    const unit = await equipmentUnitRepository.findById(
      maintenance.equipment_unit_id
    );
    if (!unit) return;

    const equipment = unit.equipment_id
      ? await equipmentRepository.findById(unit.equipment_id)
      : null;
    const branch = await branchRepository.findById(unit.branch_id);
    const assigner = maintenance.assigned_by
      ? await userRepository.getUserBySub(maintenance.assigned_by)
      : null;

    const unitName = equipment?.name || "Không rõ tên";
    const unitCode = unit.id;
    const branchName = branch?.name || "Không rõ chi nhánh";
    const assignerName =
      assigner?.attributes?.name || assigner?.username || "Không rõ";
    const reason = maintenance.maintenance_reason || "Không rõ";

    // Email
    const recipients = admins.map((u) => u.email);
    const subject = "Yêu cầu bảo trì mới";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto;">
        ${buildHeader("Yêu cầu bảo trì mới")}
        <div style="padding:20px; color:#333;">
          <p>Một yêu cầu bảo trì mới cho thiết bị <b>${unitName}</b> (mã: ${unitCode})</p>
          <p><b>Chi nhánh:</b> ${branchName}<br/>
             <b>Người tạo:</b> ${assignerName}</p>
          <p><b>Lý do:</b><br/>${reason}</p>
        </div>
        ${buildFooter()}
      </div>`;
    if (recipients.length) await sendNoReplyEmail(recipients, subject, html);

    // DB Notification
    const receiverRoles = [...new Set(admins.flatMap((u) => u.roles))];
    const receiverIds = admins.map((u) => u.sub).filter(Boolean);

    return await notificationRepository.create({
      type: "maintenance",
      title: "Tạo yêu cầu bảo trì",
      message: `Một yêu cầu bảo trì mới cho thiết bị ${unitName} (mã: ${unitCode})\nChi nhánh: ${branchName}\nNgười tạo: ${assignerName}\nLý do: ${reason}`,
      receiver_role: receiverRoles,
      receiver_id: receiverIds,
      created_by: createdBy,
    });
  },

  /***
   * Chuyển sang bảo trì thiết bị
   */
  async notifyMaintenanceInProgress(maintenance, admins, createdBy) {
    const unit = await equipmentUnitRepository.findById(
      maintenance.equipment_unit_id
    );
    if (!unit) return;

    const equipment = unit.equipment_id
      ? await equipmentRepository.findById(unit.equipment_id)
      : null;
    const branch = await branchRepository.findById(unit.branch_id);
    const technician = maintenance.user_id
      ? await userRepository.getUserBySub(maintenance.user_id)
      : null;

    const unitName = equipment?.name || "Không rõ tên";
    const unitCode = unit.id;
    const branchName = branch?.name || "Không rõ chi nhánh";
    const technicianName =
      technician?.attributes?.name || technician?.username || "Không rõ";
    const reason = maintenance.maintenance_reason || "Không rõ";

    // Email
    const recipients = admins.map((u) => u.email);
    const subject = "Đang tiến hành bảo trì";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto;">
        ${buildHeader("Đang tiến hành bảo trì")}
        <div style="padding:20px; color:#333;">
          <p>Thiết bị <b>${unitName}</b> (mã: ${unitCode}) đang được tiến hành bảo trì.</p>
          <p><b>Chi nhánh:</b> ${branchName}<br/>
             <b>Kỹ thuật viên:</b> ${technicianName}</p>
          <p><b>Lý do:</b><br/>${reason}</p>
        </div>
        ${buildFooter()}
      </div>`;
    if (recipients.length) await sendNoReplyEmail(recipients, subject, html);

    // DB Notification
    const receiverRoles = [...new Set(admins.flatMap((u) => u.roles))];
    const receiverIds = admins.map((u) => u.sub).filter(Boolean);

    return await notificationRepository.create({
      type: "maintenance",
      title: "Đang tiến hành bảo trì",
      message: `Thiết bị ${unitName} (mã: ${unitCode}) đang được bảo trì\nChi nhánh: ${branchName}\nKỹ thuật viên: ${technicianName}\nLý do: ${reason}`,
      receiver_role: receiverRoles,
      receiver_id: receiverIds,
      created_by: createdBy,
    });
  },

  /***
   * Hoàn thành bảo trì
   */
  async notifyMaintenanceCompleted(maintenance, admins, createdBy) {
    const unit = await equipmentUnitRepository.findById(
      maintenance.equipment_unit_id
    );
    if (!unit) return;

    const equipment = unit.equipment_id
      ? await equipmentRepository.findById(unit.equipment_id)
      : null;
    const branch = await branchRepository.findById(unit.branch_id);
    const technician = maintenance.user_id
      ? await userRepository.getUserBySub(maintenance.user_id)
      : null;

    const unitName = equipment?.name || "Không rõ tên";
    const unitCode = unit.id;
    const branchName = branch?.name || "Không rõ chi nhánh";
    const technicianName =
      technician?.attributes?.name || technician?.username || "Không rõ";
    const status = maintenance.status || unit.status;

    // Email
    const recipients = admins.map((u) => u.email);
    const subject = "Hoàn tất bảo trì";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto;">
        ${buildHeader("Hoàn tất bảo trì")}
        <div style="padding:20px; color:#333;">
          <p>Yêu cầu bảo trì cho thiết bị <b>${unitName}</b> (mã: ${unitCode})</p>
          <p><b>Chi nhánh:</b> ${branchName}<br/>
             <b>Nhân viên:</b> ${technicianName}</p>
          <p><b>Trạng thái:</b> ${status}</p>
        </div>
        ${buildFooter()}
      </div>`;
    if (recipients.length) await sendNoReplyEmail(recipients, subject, html);

    // DB Notification
    const receiverRoles = [...new Set(admins.flatMap((u) => u.roles))];
    const receiverIds = admins.map((u) => u.sub).filter(Boolean);

    return await notificationRepository.create({
      type: "maintenance",
      title: "Hoàn tất bảo trì",
      message: `Thiết bị ${unitName} (mã: ${unitCode}) đã bảo trì xong\nChi nhánh: ${branchName}\nNhân viên: ${technicianName}\nTrạng thái: ${status}`,
      receiver_role: receiverRoles,
      receiver_id: receiverIds,
      created_by: createdBy,
    });
  },

  // =========================
  // Chuyển thiết bị (Transfer)
  // =========================
  /***
   * Chuyển thiết bị sang chi nhánh khác
   */
  async notifyTransferCreated(transfer, admins, createdBy) {
    const unit = await equipmentUnitRepository.findById(
      transfer.equipment_unit_id
    );
    if (!unit) return;

    const equipment = unit.equipment_id
      ? await equipmentRepository.findById(unit.equipment_id)
      : null;

    const fromBranch = await branchRepository.findById(transfer.from_branch_id);
    const toBranch = await branchRepository.findById(transfer.to_branch_id);
    const assigner = createdBy
      ? await userRepository.getUserBySub(createdBy)
      : null;

    const unitName = equipment?.name || "Không rõ tên";
    const unitCode = unit.id;
    const fromBranchName = fromBranch?.name || transfer.from_branch_id;
    const toBranchName = toBranch?.name || transfer.to_branch_id;
    const assignerName =
      assigner?.attributes?.name || assigner?.username || "Không rõ";

    // Email
    const recipients = admins.map((u) => u.email);
    const subject = "Vận chuyển thiết bị sang chi nhánh khác";
    const html = `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto;">
      ${buildHeader("Vận chuyển thiết bị")}
      <div style="padding:20px; color:#333;">
        <p>Thiết bị <b>${unitName}</b> (mã: ${unitCode}) đã được vận chuyển.</p>
        <p><b>Từ chi nhánh:</b> ${fromBranchName}<br/>
           <b>Đến chi nhánh:</b> ${toBranchName}</p>
        <p><b>Người duyệt:</b> ${assignerName}</p>
        <p><b>Ngày bắt đầu:</b> ${transfer.move_start_date || "Chưa có"}</p>
      </div>
      ${buildFooter()}
    </div>`;
    if (recipients.length) await sendNoReplyEmail(recipients, subject, html);

    // DB Notification
    const receiverRoles = [...new Set(admins.flatMap((u) => u.roles))];
    const receiverIds = admins.map((u) => u.sub).filter(Boolean);

    return await notificationRepository.create({
      type: "transfer",
      title: "Vận chuyển thiết bị",
      message: `Thiết bị ${unitName} (${unitCode}) được vận chuyển chuyển từ ${fromBranchName} sang ${toBranchName} bởi ${assignerName}`,
      receiver_role: receiverRoles,
      receiver_id: receiverIds,
      created_by: createdBy,
    });
  },

  /***
   * Chuyển thiết bị thành công
   */
  async notifyTransferCompleted(transfer, admins, createdBy) {
    const unit = await equipmentUnitRepository.findById(
      transfer.equipment_unit_id
    );
    if (!unit) return;

    const equipment = unit.equipment_id
      ? await equipmentRepository.findById(unit.equipment_id)
      : null;

    const fromBranch = await branchRepository.findById(transfer.from_branch_id);
    const toBranch = await branchRepository.findById(transfer.to_branch_id);
    const receiver = createdBy
      ? await userRepository.getUserBySub(createdBy)
      : null;

    const unitName = equipment?.name || "Không rõ tên";
    const unitCode = unit.id;
    const fromBranchName = fromBranch?.name || transfer.from_branch_id;
    const toBranchName = toBranch?.name || transfer.to_branch_id;
    const receiverName =
      receiver?.attributes?.name || receiver?.username || "Không rõ";

    // Email
    const recipients = admins.map((u) => u.email);
    const subject = "Hoàn tất chuyển thiết bị";
    const html = `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto;">
      ${buildHeader("Hoàn tất chuyển thiết bị")}
      <div style="padding:20px; color:#333;">
        <p style="color:#000;">Thiết bị <b>${unitName}</b> (mã: ${unitCode}) đã hoàn tất quá trình vận chuyển.</p>
        <p><b>Từ chi nhánh:</b> ${fromBranchName}<br/>
           <b>Đến chi nhánh:</b> ${toBranchName}</p>
        <p><b>Người duyệt:</b> ${receiverName}</p>
        <p><b>Ngày bắt đầu:</b> ${transfer.move_start_date || "Chưa có"}</p>
        <p><b>Ngày nhận:</b> ${transfer.move_receive_date || "Chưa có"}</p>
      </div>
      ${buildFooter()}
    </div>`;
    if (recipients.length) await sendNoReplyEmail(recipients, subject, html);

    // DB Notification
    const receiverRoles = [...new Set(admins.flatMap((u) => u.roles))];
    const receiverIds = admins.map((u) => u.sub).filter(Boolean);

    return await notificationRepository.create({
      type: "transfer",
      title: "Hoàn tất chuyển thiết bị",
      message: `Thiết bị ${unitName} (${unitCode}) đã hoàn tất vận chuyển từ ${fromBranchName} sang ${toBranchName} bởi ${receiverName}`,
      receiver_role: receiverRoles,
      receiver_id: receiverIds,
      created_by: createdBy,
    });
  },

  getNotifications: async () => {
    return await notificationRepository.findAll();
  },

  getNotificationById: async (id) => {
    const noti = await notificationRepository.findById(id);
    if (!noti) throw new Error("Notification not found");
    return noti;
  },

  deleteNotification: async (id) => {
    const noti = await notificationRepository.findById(id);
    if (!noti) throw new Error("Notification not found");
    return await notificationRepository.delete(id);
  },
};

module.exports = notificationService;
