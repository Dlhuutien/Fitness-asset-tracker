const { sendNoReplyEmail } = require("../utils/smtpMailer");
const notificationRepository = require("../repositories/notificationRepository");
const equipmentUnitRepository = require("../repositories/equipmentUnitRepository");
const equipmentRepository = require("../repositories/equipmentRepository");
const branchRepository = require("../repositories/branchRepository");
const userRepository = require("../repositories/userRepository");
const { buildHeader, buildFooter } = require("../utils/emailTemplate");
const { formatFrequencyLabel } = require("../utils/frequencyParser");

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
    const creatorName =
      user?.attributes?.name || user?.username || "Chưa có thông tin";

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
      let equipmentName = "Chưa có thông tin";
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
          branchNames.join(", ") || "Chưa có thông tin chi nhánh"
        }</p>
          <div style="overflow-x:auto; margin-top:10px;">
            <table style="border-collapse:collapse; width:100%; min-width:500px;">
              <thead>
                <tr>
                  <th style="border:1px solid #ddd; padding:8px; background:#f5f5f5;">Thiết bị</th>
                  <th style="border:1px solid #ddd; padding:8px; background:#f5f5f5;">Mã định danh thiết bị</th>
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
      invoice_id: invoice.id,
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

    const unitName = equipment?.name || "Chưa có thông tin tên";
    const unitCode = unit.id;
    const branchName = branch?.name || "Chưa có thông tin chi nhánh";
    const assignerName =
      assigner?.attributes?.name || assigner?.username || "Chưa có thông tin";
    const reason = maintenance.maintenance_reason || "Chưa có thông tin";

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
      maintenance_id: maintenance.id,
      unit_id: maintenance.equipment_unit_id,
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

    const unitName = equipment?.name || "Chưa có thông tin tên";
    const unitCode = unit.id;
    const branchName = branch?.name || "Chưa có thông tin chi nhánh";
    const technicianName =
      technician?.attributes?.name ||
      technician?.username ||
      "Chưa có thông tin";
    const reason = maintenance.maintenance_reason || "Chưa có thông tin";

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
      maintenance_id: maintenance.id,
      unit_id: maintenance.equipment_unit_id,
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

    const unitName = equipment?.name || "Chưa có thông tin tên";
    const unitCode = unit.id;
    const branchName = branch?.name || "Chưa có thông tin chi nhánh";
    const technicianName =
      technician?.attributes?.name ||
      technician?.username ||
      "Chưa có thông tin";
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
      maintenance_id: maintenance.id,
      unit_id: maintenance.equipment_unit_id,
      receiver_role: receiverRoles,
      receiver_id: receiverIds,
      created_by: createdBy,
    });
  },

  // =========================
  // Chuyển thiết bị (Transfer)
  // =========================
  /***
   * Gửi email & notification khi tạo yêu cầu chuyển thiết bị
   */
  async notifyTransferCreated(transfer, details, admins, createdBy) {
    const recipients = admins.map((u) => u.email);
    if (!recipients.length) return;

    const fromBranch = await branchRepository.findById(transfer.from_branch_id);
    const toBranch = await branchRepository.findById(transfer.to_branch_id);
    const assigner = createdBy
      ? await userRepository.getUserBySub(createdBy)
      : null;

    const fromBranchName = fromBranch?.name || transfer.from_branch_id;
    const toBranchName = toBranch?.name || transfer.to_branch_id;
    const assignerName =
      assigner?.attributes?.name || assigner?.username || "Chưa có thông tin";

    const moveStart = transfer.move_start_date
      ? new Date(transfer.move_start_date).toLocaleString("vi-VN")
      : "Chưa có";

    // 🧩 Tạo bảng danh sách thiết bị
    let itemsHtml = "";
    for (const d of details) {
      const unit = await equipmentUnitRepository.findById(d.equipment_unit_id);
      if (!unit) continue;

      const equipment = unit.equipment_id
        ? await equipmentRepository.findById(unit.equipment_id)
        : null;

      const equipmentName = equipment?.name || "Chưa có thông tin";
      const unitCode = unit.id;

      // ✅ Ưu tiên hiển thị trạng thái cũ (old_status)
      const status = d.old_status || unit.status || "Chưa có thông tin";

      itemsHtml += `
      <tr>
        <td style="border:1px solid #ddd; padding:8px;">${equipmentName}</td>
        <td style="border:1px solid #ddd; padding:8px;">${unitCode}</td>
        <td style="border:1px solid #ddd; padding:8px;">${status}</td>
      </tr>`;
    }

    const subject = "Vận chuyển thiết bị sang chi nhánh khác";
    const html = `
  <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto;
              border:1px solid #e0e0e0; border-radius:8px; overflow:hidden;">
    ${buildHeader("Vận chuyển thiết bị")}
    <div style="padding:20px; color:#333;">
      <p>Hệ thống vừa ghi nhận <b>${
        details.length
      }</b> thiết bị được vận chuyển.</p>
      <p><b>Từ chi nhánh:</b> ${fromBranchName}<br/>
         <b>Đến chi nhánh:</b> ${toBranchName}</p>
      <p><b>Người duyệt:</b> ${assignerName}</p>
      <p><b>Ngày chuyển:</b> ${moveStart}</p>
      <div style="overflow-x:auto; margin-top:10px;">
        <table style="border-collapse:collapse; width:100%; min-width:500px;">
          <thead>
            <tr>
              <th style="border:1px solid #ddd; padding:8px; background:#f5f5f5;">Thiết bị</th>
              <th style="border:1px solid #ddd; padding:8px; background:#f5f5f5;">Mã định danh thiết bị</th>
              <th style="border:1px solid #ddd; padding:8px; background:#f5f5f5;">Trạng thái</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
      </div>
    </div>
    ${buildFooter()}
  </div>`;

    await sendNoReplyEmail(recipients, subject, html);

    // 🔔 DB Notification
    const receiverRoles = [...new Set(admins.flatMap((u) => u.roles))];
    const receiverIds = admins.map((u) => u.sub).filter(Boolean);

    return await notificationRepository.create({
      type: "transfer",
      title: "Vận chuyển thiết bị",
      message: `Đã tạo yêu cầu chuyển ${details.length} thiết bị từ ${fromBranchName} sang ${toBranchName} bởi ${assignerName} (Ngày chuyển: ${moveStart})`,
      transfer_id: transfer.id,
      receiver_role: receiverRoles,
      receiver_id: receiverIds,
      created_by: createdBy,
    });
  },

  /***
   * Hoàn tất chuyển thiết bị
   */
  async notifyTransferCompleted(transfer, details, admins, createdBy) {
    const recipients = admins.map((u) => u.email);
    if (!recipients.length) return;

    // 🏢 Lấy thông tin chi nhánh
    const fromBranch = await branchRepository.findById(transfer.from_branch_id);
    const toBranch = await branchRepository.findById(transfer.to_branch_id);

    // 👤 Lấy người phê duyệt (approve) và người nhận (receiver)
    const approver = transfer.approved_by
      ? await userRepository.getUserBySub(transfer.approved_by)
      : null;

    const receiver = transfer.receiver_id
      ? await userRepository.getUserBySub(transfer.receiver_id)
      : createdBy
      ? await userRepository.getUserBySub(createdBy)
      : null;

    const fromBranchName = fromBranch?.name || transfer.from_branch_id;
    const toBranchName = toBranch?.name || transfer.to_branch_id;
    const approverName =
      approver?.attributes?.name || approver?.username || "Chưa có thông tin";
    const receiverName =
      receiver?.attributes?.name || receiver?.username || "Chưa có thông tin";

    const moveStart = transfer.move_start_date
      ? new Date(transfer.move_start_date).toLocaleString("vi-VN")
      : "Chưa có";
    const moveReceive = transfer.move_receive_date
      ? new Date(transfer.move_receive_date).toLocaleString("vi-VN")
      : "Chưa có";

    // 🧩 Tạo bảng danh sách thiết bị hoàn tất
    let itemsHtml = "";
    for (const d of details) {
      const unit = await equipmentUnitRepository.findById(d.equipment_unit_id);
      if (!unit) continue;

      const equipment = unit.equipment_id
        ? await equipmentRepository.findById(unit.equipment_id)
        : null;

      const equipmentName = equipment?.name || "Chưa có thông tin";
      const unitCode = unit.id;

      itemsHtml += `
      <tr>
        <td style="border:1px solid #ddd; padding:8px;">${equipmentName}</td>
        <td style="border:1px solid #ddd; padding:8px;">${unitCode}</td>
      </tr>`;
    }

    const subject = "Hoàn tất chuyển thiết bị";
    const html = `
  <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto;
              border:1px solid #e0e0e0; border-radius:8px; overflow:hidden;">
    ${buildHeader("Hoàn tất chuyển thiết bị")}
    <div style="padding:20px; color:#333;">
      <p>Đã hoàn tất chuyển <b>${
        details.length
      }</b> thiết bị từ <b>${fromBranchName}</b> sang <b>${toBranchName}</b>.</p>
      <p><b>Người phê duyệt:</b> ${approverName}<br/>
         <b>Người nhận:</b> ${receiverName}</p>
      <p><b>Ngày chuyển:</b> ${moveStart}<br/>
         <b>Ngày nhận:</b> ${moveReceive}</p>
      <div style="overflow-x:auto; margin-top:10px;">
        <table style="border-collapse:collapse; width:100%; min-width:500px;">
          <thead>
            <tr>
              <th style="border:1px solid #ddd; padding:8px; background:#f5f5f5;">Thiết bị</th>
              <th style="border:1px solid #ddd; padding:8px; background:#f5f5f5;">Mã định danh thiết bị</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
      </div>
    </div>
    ${buildFooter()}
  </div>`;

    await sendNoReplyEmail(recipients, subject, html);

    // 🔔 DB Notification
    const receiverRoles = [...new Set(admins.flatMap((u) => u.roles))];
    const receiverIds = admins.map((u) => u.sub).filter(Boolean);

    return await notificationRepository.create({
      type: "transfer",
      title: "Hoàn tất chuyển thiết bị",
      message: `Đã hoàn tất chuyển ${details.length} thiết bị từ ${fromBranchName} sang ${toBranchName}.
Người phê duyệt: ${approverName}, Người nhận: ${receiverName}
(Ngày chuyển: ${moveStart}, Ngày nhận: ${moveReceive})`,
      transfer_id: transfer.id,
      receiver_role: receiverRoles,
      receiver_id: receiverIds,
      created_by: createdBy,
    });
  },

  // =========================
  // Thanh lý thiết bị (Disposal)
  // =========================
  /**
   * Gửi thông báo khi có Phiếu thanh lý mới
   */
  async notifyDisposalCreated(disposal, details, admins) {
    const recipients = admins.map((u) => u.email);
    if (!recipients.length) return;

    const user = await userRepository.getUserBySub(disposal.user_id);
    const creatorName =
      user?.attributes?.name || user?.username || "Chưa có thông tin";

    // Lấy tên chi nhánh
    const branch = await branchRepository.findById(disposal.branch_id);
    const branchName = branch?.name || disposal.branch_id;

    // Tạo HTML bảng chi tiết thiết bị
    let itemsHtml = "";
    for (const d of details) {
      let equipmentName = "Chưa có thông tin";
      let costOriginal = 0;

      // Lấy thông tin unit + thiết bị
      const unit = await equipmentUnitRepository.findById(d.equipment_unit_id);
      if (unit?.equipment_id) {
        const eq = await equipmentRepository.findById(unit.equipment_id);
        equipmentName = eq?.name || unit.equipment_id;
        costOriginal = eq?.cost || unit?.cost || 0;
      }

      itemsHtml += `
        <tr>
          <td style="border:1px solid #ddd; padding:8px;">${equipmentName}</td>
          <td style="border:1px solid #ddd; padding:8px;">${
            d.equipment_unit_id
          }</td>
          <td style="border:1px solid #ddd; padding:8px; text-align:right;">
            ${(costOriginal || 0).toLocaleString()} VND
          </td>
          <td style="border:1px solid #ddd; padding:8px; text-align:right;">
            ${(d.value_recovered || 0).toLocaleString()} VND
          </td>
        </tr>`;
    }

    const subject = "Phiếu thanh lý thiết bị mới";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto;
                  border:1px solid #e0e0e0; border-radius:8px; overflow:hidden;">
        ${buildHeader("Phiếu thanh lý thiết bị mới")}
        <div style="padding:20px; color:#000;">
          <p style="color:#000;">Một Phiếu thanh lý thiết bị vừa được tạo.</p>
          <p style="color:#000;"><b>Mã thanh lý:</b> ${disposal.id}</p>
          <p style="color:#000;"><b>Chi nhánh:</b> ${branchName}</p>
          <p style="color:#000;"><b>Người thực hiện:</b> ${creatorName}</p>
          <p style="color:#000;"><b>Tổng giá trị thu hồi:</b> ${disposal.total_value.toLocaleString()} VND</p>
          ${
            disposal.note
              ? `<p style="color:#000;"><b>Ghi chú:</b> ${disposal.note}</p>`
              : ""
          }
          <div style="overflow-x:auto; margin-top:10px;">
            <table style="border-collapse:collapse; width:100%; min-width:500px;">
              <thead>
                <tr>
                  <th style="border:1px solid #ddd; padding:8px; background:#f5f5f5;">Thiết bị</th>
                  <th style="border:1px solid #ddd; padding:8px; background:#f5f5f5;">Mã định danh</th>
                  <th style="border:1px solid #ddd; padding:8px; background:#f5f5f5;">Giá gốc</th>
                  <th style="border:1px solid #ddd; padding:8px; background:#f5f5f5;">Giá trị thu hồi</th>
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
      type: "disposal",
      title: "Phiếu thanh lý thiết bị mới",
      message: `Phiếu thanh lý ${
        disposal.id
      } được tạo bởi ${creatorName}, tổng giá trị thu hồi: ${disposal.total_value.toLocaleString()} VND`,
      disposal_id: disposal.id,
      receiver_role: receiverRoles,
      receiver_id: receiverIds,
      created_by: disposal.user_id,
    });
  },

/**
 * Nhắc lịch bảo trì định kỳ (theo dòng thiết bị)
 * @param {Object} payload
 * @param {string} payload.equipment_id   - ID dòng thiết bị
 * @param {string} [payload.equipment_name] - Tên dòng thiết bị (nếu có)
 * @param {string} [payload.next_maintenance_date] - Ngày bảo trì kế tiếp (ISO, optional)
 * @param {string} [payload.frequency] - Tần suất (vd: "3_days", "1_week", "monthly")
 * @param {Array<{id:string}>} [payload.units] - Danh sách unit để liệt kê (optional)
 * @param {Array} admins - danh sách user { email, roles, sub } sẽ nhận mail
 */
async notifyMaintenanceReminder(payload, admins) {
  const {
    equipment_id,
    equipment_name,
    next_maintenance_date,
    frequency,
    units = [],
  } = payload || {};

  const recipients = (admins || []).map((u) => u.email).filter(Boolean);
  if (!recipients.length) return;

  const titleText = "Nhắc lịch bảo trì định kỳ";
  const equipName = equipment_name || equipment_id || "Dòng thiết bị";
  const nextDateText = next_maintenance_date
    ? new Date(next_maintenance_date).toLocaleString("vi-VN")
    : null;

  // 🧠 Lấy label tần suất (ví dụ: "3 ngày/lần", "Hàng tuần", ...)
  const freqText = formatFrequencyLabel(frequency);

  // Bảng liệt kê nhanh (nếu có unit)
  let itemsHtml = "";
  if (Array.isArray(units) && units.length) {
    const limited = units.slice(0, 10); // show tối đa 10 cái cho gọn mail
    for (const u of limited) {
      itemsHtml += `
        <tr>
          <td style="border:1px solid #ddd; padding:8px;">${u.id}</td>
        </tr>`;
    }
  }

  // 🧩 Tạo nội dung email
  const subject = `${titleText} – ${equipName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; border:1px solid #e0e0e0; border-radius:8px; overflow:hidden;">
      ${buildHeader(titleText)}
      <div style="padding:20px; color:#000;">
        <p style="color:#000;">Đã đến hạn kiểm tra định kỳ cho <b>${equipName}</b>.</p>
        <p style="color:#000;"><b>Thời gian định kỳ:</b> ${freqText}</p>
        ${
          nextDateText
            ? `<p style="color:#000;"><b>Thời điểm dự kiến:</b> ${nextDateText}</p>`
            : ""
        }
        ${
          itemsHtml
            ? `<div style="overflow-x:auto; margin-top:10px;">
                 <table style="border-collapse:collapse; width:100%; min-width:300px;">
                   <thead>
                     <tr>
                       <th style="border:1px solid #ddd; padding:8px; background:#f5f5f5; text-align:left;">Mã định danh thiết bị (Unit)</th>
                     </tr>
                   </thead>
                   <tbody>${itemsHtml}</tbody>
                 </table>
                 ${
                   units.length > 10
                     ? `<p style="margin-top:8px; color:#555;">… và ${
                         units.length - 10
                       } thiết bị khác</p>`
                     : ""
                 }
               </div>`
            : ""
        }
        <p style="color:#000; margin-top:16px;">
          Vui lòng vào hệ thống để <b>xem & lên lịch từng thiết bị</b>, sau đó xác nhận để gửi tới kỹ thuật viên.
        </p>
      </div>
      ${buildFooter()}
    </div>
  `;

  // 📧 Gửi mail
  await sendNoReplyEmail(recipients, subject, html);

  // 💾 Lưu notification vào DB (UI hiển thị)
  const receiverRoles = [...new Set((admins || []).flatMap((u) => u.roles || []))];
  const receiverIds = (admins || []).map((u) => u.sub).filter(Boolean);

  return await notificationRepository.create({
    type: "maintenance",
    title: titleText,
    message:
      `Đã đến hạn kiểm tra định kỳ cho ${equipName}` +
      (freqText ? ` (${freqText})` : "") +
      (nextDateText ? ` – Dự kiến: ${nextDateText}` : ""),
    equipment_id,
    receiver_role: receiverRoles,
    receiver_id: receiverIds,
    created_by: null, // hệ thống
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
