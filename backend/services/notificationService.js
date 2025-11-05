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
    const receiverRoles = [
      ...new Set((admins || []).flatMap((u) => u.roles || [])),
    ];
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

  /**
   * Gửi thông báo khi Admin tạo yêu cầu bảo trì (1 request chứa nhiều thiết bị)
   */
  async notifyMaintenanceRequestCreated(
    requestList = [],
    technicians,
    createdBy
  ) {
    if (!Array.isArray(requestList) || requestList.length === 0) return;

    const request = requestList[0]; // chỉ có 1 request duy nhất
    const scheduledAt = request.scheduled_at
      ? new Date(request.scheduled_at).toLocaleString("vi-VN")
      : "Chưa có";
    const maintenanceDetail = request.maintenance_reason || "Không ghi rõ";

    // 🏢 Lấy chi nhánh
    const branch = await branchRepository.findById(request.branch_id);
    const branchName = branch?.name || "Không xác định";

    // 📋 Tạo bảng HTML danh sách thiết bị
    let itemsHtml = "";
    let unitIds = [];
    try {
      unitIds = Array.isArray(request.equipment_unit_id)
        ? request.equipment_unit_id
        : JSON.parse(request.equipment_unit_id);
    } catch {
      unitIds = [request.equipment_unit_id];
    }

    for (const unitId of unitIds) {
      const unit = await equipmentUnitRepository.findById(unitId);
      const eq =
        unit?.equipment_id &&
        (await equipmentRepository.findById(unit.equipment_id));

      itemsHtml += `
      <tr>
        <td style="border:1px solid #ddd; padding:8px;">${
          eq?.name || "Thiết bị"
        }</td>
        <td style="border:1px solid #ddd; padding:8px;">${unit?.id || "-"}</td>
        <td style="border:1px solid #ddd; padding:8px;">${branchName}</td>
        <td style="border:1px solid #ddd; padding:8px;">${scheduledAt}</td>
      </tr>`;
    }

    // 👤 Người tạo
    const creator = createdBy && (await userRepository.getUserBySub(createdBy));
    const creatorName =
      creator?.attributes?.name || creator?.username || "Chưa có thông tin";

    const deviceCount = unitIds.length;
    const subject =
      deviceCount > 1
        ? `Yêu cầu bảo trì định kỳ cho ${deviceCount} thiết bị`
        : `Yêu cầu bảo trì mới – cần xác nhận`;

    // 🧾 Nội dung email
    const html = `
  <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto;
              border:1px solid #e0e0e0; border-radius:8px; overflow:hidden;">
    ${buildHeader("Yêu cầu bảo trì")}
    <div style="padding:20px; color:#000;">
      <p style="color:#000;">
        <b>${creatorName}</b> vừa tạo một yêu cầu bảo trì ${
      deviceCount > 1
        ? `định kỳ cho <b>${deviceCount}</b> thiết bị.`
        : "cần xác nhận."
    }
      </p>
      <p style="color:#000;"><b>Người tạo:</b> ${creatorName}</p>
      <p style="color:#000; margin-bottom:12px;"><b>Nội dung bảo trì:</b> ${maintenanceDetail}</p>

      <div style="overflow-x:auto; margin-top:10px;">
        <table style="border-collapse:collapse; width:100%; min-width:500px;">
          <thead>
            <tr>
              <th style="border:1px solid #ddd; padding:8px; background:#f5f5f5;">Thiết bị</th>
              <th style="border:1px solid #ddd; padding:8px; background:#f5f5f5;">Mã định danh</th>
              <th style="border:1px solid #ddd; padding:8px; background:#f5f5f5;">Chi nhánh</th>
              <th style="border:1px solid #ddd; padding:8px; background:#f5f5f5;">Thời gian dự kiến</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
      </div>

      <p style="color:#008080; margin-top:12px;">
        Vui lòng đăng nhập hệ thống và xác nhận nếu bạn nhận thực hiện bảo trì này.
      </p>
    </div>
    ${buildFooter()}
  </div>`;

    // 📧 Gửi email
    const recipients = technicians.map((u) => u.email).filter(Boolean);
    if (recipients.length) await sendNoReplyEmail(recipients, subject, html);

    // 💾 Ghi Notification DB
    const receiverRoles = [
      ...new Set(technicians.flatMap((u) => u.roles || [])),
    ];
    const receiverIds = technicians.map((u) => u.sub).filter(Boolean);

    return await notificationRepository.create({
      type: "maintenance",
      title:
        deviceCount > 1
          ? "Yêu cầu bảo trì định kỳ (chờ xác nhận)"
          : "Yêu cầu bảo trì mới (chờ xác nhận)",
      message:
        deviceCount > 1
          ? `Đã tạo yêu cầu bảo trì cho ${deviceCount} thiết bị (${scheduledAt}) – Nội dung: ${maintenanceDetail}`
          : `Thiết bị ${unitIds[0]} đã được lên lịch bảo trì (${scheduledAt}) – Nội dung: ${maintenanceDetail}`,
      maintenance_request_ids: [request.id],
      receiver_role: receiverRoles,
      receiver_id: receiverIds,
      created_by: createdBy,
    });
  },

  /**
   * Gửi thông báo khi một yêu cầu bảo trì được xác nhận (bởi admin hoặc kỹ thuật viên)
   */
  async notifyMaintenanceRequestConfirmed(
    request,
    recipientsList,
    confirmedBy
  ) {
    const confirmer =
      confirmedBy && (await userRepository.getUserBySub(confirmedBy));
    const confirmerName =
      confirmer?.attributes?.name || confirmer?.username || "Người xác nhận";

    const branch = await branchRepository.findById(request.branch_id);
    const branchName = branch?.name || "Không xác định";

    const scheduledAt = request.scheduled_at
      ? new Date(request.scheduled_at).toLocaleString("vi-VN")
      : "Chưa có";
    const maintenanceDetail = request.maintenance_reason || "Không ghi rõ";

    // ✅ Parse mảng thiết bị (vì có thể lưu dạng JSON string)
    let unitIds = [];
    try {
      unitIds = Array.isArray(request.equipment_unit_id)
        ? request.equipment_unit_id
        : JSON.parse(request.equipment_unit_id || "[]");
    } catch {
      unitIds = [request.equipment_unit_id];
    }

    let unitRows = "";
    for (const uid of unitIds) {
      const unit = await equipmentUnitRepository.findById(uid);
      const eq =
        unit?.equipment_id &&
        (await equipmentRepository.findById(unit.equipment_id));

      unitRows += `
      <tr>
        <td style="border:1px solid #ddd; padding:8px;">${
          eq?.name || "Thiết bị"
        }</td>
        <td style="border:1px solid #ddd; padding:8px;">${unit?.id || "-"}</td>
        <td style="border:1px solid #ddd; padding:8px;">${branchName}</td>
      </tr>`;
    }

    const subject = `Yêu cầu bảo trì đã được xác nhận`;
    const html = `
  <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto;
              border:1px solid #e0e0e0; border-radius:8px; overflow:hidden;">
    ${buildHeader("Xác nhận yêu cầu bảo trì")}
    <div style="padding:20px; color:#000;">
      <p><b>${confirmerName}</b> đã xác nhận yêu cầu bảo trì sau:</p>
      <p><b>Nội dung:</b> ${maintenanceDetail}</p>
      <p><b>Thời gian dự kiến:</b> ${scheduledAt}</p>

      <table style="border-collapse:collapse; width:100%; min-width:500px; margin-top:10px;">
        <thead>
          <tr>
            <th style="border:1px solid #ddd; padding:8px; background:#f5f5f5;">Thiết bị</th>
            <th style="border:1px solid #ddd; padding:8px; background:#f5f5f5;">Mã định danh</th>
            <th style="border:1px solid #ddd; padding:8px; background:#f5f5f5;">Chi nhánh</th>
          </tr>
        </thead>
        <tbody>${unitRows}</tbody>
      </table>

      <p style="color:#008080; margin-top:12px;">
        Lịch bảo trì chính thức đã được tạo trong hệ thống.
      </p>
    </div>
    ${buildFooter()}
  </div>`;

    // 📧 Gửi email
    const recipients = (recipientsList || [])
      .map(
        (t) =>
          t.email ||
          t?.attributes?.email ||
          t?.userAttributes?.email ||
          t?.Attributes?.email
      )
      .filter(Boolean);
    console.log("📧 Sending email to:", recipients);
    if (recipients.length) await sendNoReplyEmail(recipients, subject, html);

    const receiverRoles = [
      ...new Set(recipientsList.flatMap((u) => u.roles || [])),
    ];
    const receiverIds = recipientsList.map((u) => u.sub).filter(Boolean);

    return await notificationRepository.create({
      type: "maintenance",
      title: "Yêu cầu bảo trì đã được xác nhận",
      message: `Yêu cầu bảo trì đã được xác nhận bởi ${confirmerName} và lên lịch chính thức.`,
      maintenance_request_id: request.id,
      receiver_role: receiverRoles,
      receiver_id: receiverIds,
      created_by: confirmedBy,
    });
  },

  /**
   * Gửi thông báo khi admin chỉ định kỹ thuật viên cụ thể
   * → Gửi cho toàn bộ admin + toàn bộ kỹ thuật viên
   * → Highlight kỹ thuật viên được giao
   */
  async notifyMaintenanceRequestAssigned(request, recipientsList, createdBy) {
    if (!request) return;
    const unitIds = Array.isArray(request.equipment_unit_id)
      ? request.equipment_unit_id
      : JSON.parse(request.equipment_unit_id || "[]");

    // Lấy thông tin branch + người tạo
    const branch = await branchRepository.findById(request.branch_id);
    const branchName = branch?.name || "Không rõ chi nhánh";

    const creator = createdBy && (await userRepository.getUserBySub(createdBy));
    const creatorName =
      creator?.attributes?.name || creator?.username || "Không rõ người tạo";

    const scheduledAt = request.scheduled_at
      ? new Date(request.scheduled_at).toLocaleString("vi-VN")
      : "Chưa có thời gian";

    const tech =
      request.candidate_tech ||
      (request.confirmed_by &&
        (await userRepository.getUserBySub(request.confirmed_by)));
    const techName =
      tech?.attributes?.name || tech?.username || "Không rõ kỹ thuật viên";

    // === 📋 Tạo danh sách thiết bị ===
    let itemsHtml = "";
    for (const unitId of unitIds) {
      const unit = await equipmentUnitRepository.findById(unitId);
      const eq =
        unit?.equipment_id &&
        (await equipmentRepository.findById(unit.equipment_id));
      itemsHtml += `
      <tr>
        <td style="border:1px solid #ddd; padding:8px;">${
          eq?.name || "Thiết bị"
        }</td>
        <td style="border:1px solid #ddd; padding:8px;">${unit?.id || "-"}</td>
        <td style="border:1px solid #ddd; padding:8px;">${branchName}</td>
      </tr>`;
    }

    // === 📧 Gửi email ===
    const recipients = (recipientsList || [])
      .map(
        (u) =>
          u.email ||
          u?.attributes?.email ||
          u?.userAttributes?.email ||
          u?.Attributes?.email
      )
      .filter(Boolean);

    const subject = `Yêu cầu bảo trì đã được chỉ định – ${techName}`;
    const html = `
  <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto;
              border:1px solid #e0e0e0; border-radius:8px; overflow:hidden;">
    ${buildHeader("Yêu cầu bảo trì được chỉ định")}
    <div style="padding:20px; color:#000;">
      <p><b>${creatorName}</b> vừa tạo yêu cầu bảo trì và chỉ định <b style="color:#008080;">${techName}</b> thực hiện.</p>
      <p><b>Chi nhánh:</b> ${branchName}</p>
      <p><b>Thời gian dự kiến:</b> ${scheduledAt}</p>
      <div style="overflow-x:auto; margin-top:10px;">
        <table style="border-collapse:collapse; width:100%; min-width:500px;">
          <thead>
            <tr>
              <th style="border:1px solid #ddd; padding:8px; background:#f5f5f5;">Thiết bị</th>
              <th style="border:1px solid #ddd; padding:8px; background:#f5f5f5;">Mã định danh</th>
              <th style="border:1px solid #ddd; padding:8px; background:#f5f5f5;">Chi nhánh</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
      </div>
      <p style="margin-top:12px; color:#008080;">Vui lòng đăng nhập hệ thống để xem chi tiết yêu cầu bảo trì này.</p>
    </div>
    ${buildFooter()}
  </div>`;

    if (recipients.length) {
      console.log("📧 Sending maintenance assignment mail to:", recipients);
      await sendNoReplyEmail(recipients, subject, html);
    } else {
      console.warn("⚠️ No valid email recipients found");
    }

    // === 💾 Ghi Notification DB ===
    const receiverRoles = [
      ...new Set(recipientsList.flatMap((u) => u.roles || [])),
    ];
    const receiverIds = recipientsList.map((u) => u.sub).filter(Boolean);

    await notificationRepository.create({
      type: "maintenance",
      title: "Yêu cầu bảo trì được chỉ định",
      message: `Kỹ thuật viên ${techName} được giao xử lý yêu cầu bảo trì tại ${branchName} – thời gian: ${scheduledAt}`,
      maintenance_request_id: request.id,
      receiver_role: receiverRoles,
      receiver_id: receiverIds,
      created_by: createdBy,
    });

    console.log(`📩 Notification assignment created for ${techName}`);
  },

  /**
   * Gửi thông báo khi các thiết bị đã được chuyển sang trạng thái bảo trì thực tế
   */
  async notifyMaintenanceRequestStarted(request, recipientsList, confirmedBy) {
    const confirmer =
      confirmedBy && (await userRepository.getUserBySub(confirmedBy));
    const confirmerName =
      confirmer?.attributes?.name || confirmer?.username || "Hệ thống";

    const branch = await branchRepository.findById(request.branch_id);
    const branchName = branch?.name || "Không xác định";

    // ✅ Parse mảng thiết bị
    let unitIds = [];
    try {
      unitIds = Array.isArray(request.equipment_unit_id)
        ? request.equipment_unit_id
        : JSON.parse(request.equipment_unit_id || "[]");
    } catch {
      unitIds = [request.equipment_unit_id];
    }

    // 🧩 Duyệt qua danh sách thiết bị
    let unitRows = "";
    for (const uid of unitIds) {
      const unit = await equipmentUnitRepository.findById(uid);
      const eq =
        unit?.equipment_id &&
        (await equipmentRepository.findById(unit.equipment_id));

      unitRows += `
    <tr>
      <td style="border:1px solid #ddd; padding:8px;">${
        eq?.name || "Thiết bị"
      }</td>
      <td style="border:1px solid #ddd; padding:8px;">${unit?.id || "-"}</td>
      <td style="border:1px solid #ddd; padding:8px;">${branchName}</td>
    </tr>`;
    }

    const subject = "Các thiết bị đã được chuyển sang trạng thái bảo trì";
    const html = `
  <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto;
              border:1px solid #e0e0e0; border-radius:8px; overflow:hidden;">
    ${buildHeader("Thiết bị đã bắt đầu bảo trì")}
    <div style="padding:20px; color:#000;">
      <p>Các thiết bị trong yêu cầu bảo trì đã được chuyển sang trạng thái <b>Bảo trì</b>.</p>
      <p><b>Chi nhánh:</b> ${branchName}</p>
      <p><b>Thực hiện bởi:</b> ${confirmerName}</p>

      <table style="border-collapse:collapse; width:100%; min-width:500px; margin-top:10px;">
        <thead>
          <tr>
            <th style="border:1px solid #ddd; padding:8px; background:#f5f5f5;">Thiết bị</th>
            <th style="border:1px solid #ddd; padding:8px; background:#f5f5f5;">Mã định danh</th>
            <th style="border:1px solid #ddd; padding:8px; background:#f5f5f5;">Chi nhánh</th>
          </tr>
        </thead>
        <tbody>${unitRows}</tbody>
      </table>

      <p style="color:#008080; margin-top:12px;">
        Các thiết bị này hiện đang được tiến hành bảo trì.
      </p>
    </div>
    ${buildFooter()}
  </div>`;

    // 📧 Gửi email
    const recipients = recipientsList.map((t) => t.email).filter(Boolean);
    if (recipients.length) await sendNoReplyEmail(recipients, subject, html);

    const receiverRoles = [
      ...new Set(recipientsList.flatMap((u) => u.roles || [])),
    ];
    const receiverIds = recipientsList.map((u) => u.sub).filter(Boolean);

    return await notificationRepository.create({
      type: "maintenance",
      title: "Thiết bị đã chuyển sang trạng thái bảo trì",
      message: `Các thiết bị trong yêu cầu ${request.id} đã được chuyển sang trạng thái bảo trì (lịch bảo trì).`,
      maintenance_request_id: request.id,
      receiver_role: receiverRoles,
      receiver_id: receiverIds,
      created_by: confirmedBy,
    });
  },

  /**
   * Gửi thông báo khi admin chỉnh sửa yêu cầu bảo trì
   */
  async notifyMaintenanceRequestUpdated(request, recipients, updatedBy) {
    const updater = updatedBy && (await userRepository.getUserBySub(updatedBy));
    const updaterName =
      updater?.attributes?.name || updater?.username || "Người dùng";

    const scheduledAt = request.scheduled_at
      ? new Date(request.scheduled_at).toLocaleString("vi-VN")
      : "Chưa có";
    const reason = request.maintenance_reason || "Không ghi rõ";

    // 🏢 Lấy chi nhánh
    const branch = await branchRepository.findById(request.branch_id);
    const branchName = branch?.name || "Không xác định";

    // ✅ Parse danh sách thiết bị (vì có thể là JSON string)
    let unitIds = [];
    try {
      unitIds = Array.isArray(request.equipment_unit_id)
        ? request.equipment_unit_id
        : JSON.parse(request.equipment_unit_id || "[]");
    } catch {
      unitIds = [request.equipment_unit_id];
    }

    // 📋 Tạo bảng HTML danh sách thiết bị
    let itemsHtml = "";
    for (const uid of unitIds) {
      const unit = await equipmentUnitRepository.findById(uid);
      const eq =
        unit?.equipment_id &&
        (await equipmentRepository.findById(unit.equipment_id));

      itemsHtml += `
    <tr>
      <td style="border:1px solid #ddd; padding:8px;">${
        eq?.name || "Thiết bị"
      }</td>
      <td style="border:1px solid #ddd; padding:8px;">${unit?.id || "-"}</td>
      <td style="border:1px solid #ddd; padding:8px;">${branchName}</td>
      <td style="border:1px solid #ddd; padding:8px;">${scheduledAt}</td>
    </tr>`;
    }

    const subject = "Yêu cầu bảo trì đã được cập nhật";
    const html = `
  <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto;
              border:1px solid #e0e0e0; border-radius:8px; overflow:hidden;">
    ${buildHeader("Cập nhật yêu cầu bảo trì")}
    <div style="padding:20px; color:#000;">
      <p><b>${updaterName}</b> vừa chỉnh sửa yêu cầu bảo trì.</p>
      <p><b>Nội dung cập nhật:</b> ${reason}</p>
      <p><b>Thời gian dự kiến:</b> ${scheduledAt}</p>

      <div style="overflow-x:auto; margin-top:10px;">
        <table style="border-collapse:collapse; width:100%; min-width:500px;">
          <thead>
            <tr>
              <th style="border:1px solid #ddd; padding:8px; background:#f5f5f5;">Thiết bị</th>
              <th style="border:1px solid #ddd; padding:8px; background:#f5f5f5;">Mã định danh</th>
              <th style="border:1px solid #ddd; padding:8px; background:#f5f5f5;">Chi nhánh</th>
              <th style="border:1px solid #ddd; padding:8px; background:#f5f5f5;">Thời gian dự kiến</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
      </div>

      <p style="color:#008080; margin-top:12px;">
        Vui lòng kiểm tra lại thông tin yêu cầu trong hệ thống.
      </p>
    </div>
    ${buildFooter()}
  </div>`;

    // 📧 Gửi mail
    const emails = recipients.map((r) => r.email).filter(Boolean);
    if (emails.length) await sendNoReplyEmail(emails, subject, html);

    // 💾 Ghi Notification DB
    return await notificationRepository.create({
      type: "maintenance",
      title: "Yêu cầu bảo trì đã được cập nhật",
      message: `Yêu cầu bảo trì ${request.id} đã được chỉnh sửa (thời gian: ${scheduledAt}, nội dung: ${reason})`,
      maintenance_request_id: request.id,
      receiver_id: recipients.map((u) => u.sub),
      receiver_role: [...new Set(recipients.flatMap((u) => u.roles || []))],
      created_by: updatedBy,
    });
  },

  /**
   * Gửi thông báo khi một yêu cầu bảo trì bị hủy
   */
  async notifyMaintenanceRequestCancelled(request, recipients, cancelledBy) {
    const canceller =
      cancelledBy && (await userRepository.getUserBySub(cancelledBy));
    const cancellerName =
      canceller?.attributes?.name || canceller?.username || "Người dùng";

    const branch = await branchRepository.findById(request.branch_id);
    const branchName = branch?.name || "Không xác định";

    const reason = request.maintenance_reason || "Không ghi rõ";

    // ✅ Parse danh sách thiết bị (vì có thể là JSON string)
    let unitIds = [];
    try {
      unitIds = Array.isArray(request.equipment_unit_id)
        ? request.equipment_unit_id
        : JSON.parse(request.equipment_unit_id || "[]");
    } catch {
      unitIds = [request.equipment_unit_id];
    }

    // 📋 Bảng thiết bị
    let itemsHtml = "";
    for (const uid of unitIds) {
      const unit = await equipmentUnitRepository.findById(uid);
      const eq =
        unit?.equipment_id &&
        (await equipmentRepository.findById(unit.equipment_id));

      itemsHtml += `
    <tr>
      <td style="border:1px solid #ddd; padding:8px;">${
        eq?.name || "Thiết bị"
      }</td>
      <td style="border:1px solid #ddd; padding:8px;">${unit?.id || "-"}</td>
      <td style="border:1px solid #ddd; padding:8px;">${branchName}</td>
    </tr>`;
    }

    const subject = "Yêu cầu bảo trì đã bị hủy";
    const html = `
  <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto;
              border:1px solid #e0e0e0; border-radius:8px; overflow:hidden;">
    ${buildHeader("Yêu cầu bảo trì bị hủy")}
    <div style="padding:20px; color:#000;">
      <p><b>${cancellerName}</b> vừa hủy một yêu cầu bảo trì.</p>
      <p><b>Lý do:</b> ${reason}</p>
      <p><b>Chi nhánh:</b> ${branchName}</p>

      <div style="overflow-x:auto; margin-top:10px;">
        <table style="border-collapse:collapse; width:100%; min-width:500px;">
          <thead>
            <tr>
              <th style="border:1px solid #ddd; padding:8px; background:#f5f5f5;">Thiết bị</th>
              <th style="border:1px solid #ddd; padding:8px; background:#f5f5f5;">Mã định danh</th>
              <th style="border:1px solid #ddd; padding:8px; background:#f5f5f5;">Chi nhánh</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
      </div>

      <p style="color:#d32f2f; margin-top:12px;">
        Yêu cầu này đã được đánh dấu là <b>ĐÃ HỦY</b> trong hệ thống.
      </p>
    </div>
    ${buildFooter()}
  </div>`;

    // 📧 Gửi email
    const emails = recipients.map((r) => r.email).filter(Boolean);
    if (emails.length) await sendNoReplyEmail(emails, subject, html);

    // 💾 Ghi Notification
    return await notificationRepository.create({
      type: "maintenance",
      title: "Yêu cầu bảo trì đã bị hủy",
      message: `Yêu cầu bảo trì ${request.id} đã bị hủy bởi ${cancellerName}.`,
      maintenance_request_id: request.id,
      receiver_id: recipients.map((u) => u.sub),
      receiver_role: [...new Set(recipients.flatMap((u) => u.roles || []))],
      created_by: cancelledBy,
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
