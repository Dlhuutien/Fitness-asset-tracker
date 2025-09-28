const { sendNoReplyEmail } = require("../utils/smtpMailer");
const equipmentUnitRepository = require("../repositories/equipmentUnitRepository");
const equipmentRepository = require("../repositories/equipmentRepository");
const branchRepository = require("../repositories/branchRepository");
const userRepository = require("../repositories/userRepository");
const { buildHeader, buildFooter } = require("../utils/emailTemplate");

const sendEmail = {
  /**
   * Gửi mail khi bảo trì xong thiết bị
   */
  async sendMaintenanceCompletedEmail(recipients, maintenance) {
    if (!recipients || recipients.length === 0) return;

    const unit = await equipmentUnitRepository.findById(
      maintenance.equipment_unit_id
    );
    if (!unit) return;

    const equipment = unit.equipment_id
      ? await equipmentRepository.findById(unit.equipment_id)
      : null;
    const branch = await branchRepository.findById(unit.branch_id);

    let technicianName = "";
    if (maintenance.user_id) {
      const user = await userRepository.getUserBySub(maintenance.user_id);
      technicianName = user?.attributes?.name || user?.username || "";
    }

    const subject = "Hoàn tất bảo trì";
    const unitName = equipment?.name || "Không rõ tên";
    const unitCode = unit.id;
    const unitStatus = unit.status;
    const branchName = branch?.name || "Không rõ chi nhánh";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; 
                  border:1px solid #e0e0e0; border-radius:8px; overflow:hidden;">
        ${buildHeader("Hoàn tất bảo trì")}
        <div style="padding:20px; color:#333;">
          <p>Yêu cầu bảo trì cho thiết bị <b>${unitName}</b> (mã: ${unitCode})</p>
          <p><b>Chi nhánh:</b> ${branchName}<br/>
             <b>Nhân viên:</b> ${technicianName}</p>
          <p><b>Trạng thái:</b> ${unitStatus}</p>
        </div>
        ${buildFooter()}
      </div>
    `;

    return await sendNoReplyEmail(recipients, subject, html);
  },

  /**
   * Gửi mail khi tạo yêu cầu bảo trì mới
   */
  async sendMaintenanceCreatedEmail(recipients, maintenance) {
    if (!recipients || recipients.length === 0) return;

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

    const subject = "Yêu cầu bảo trì mới";
    const unitName = equipment?.name || "Không rõ tên";
    const unitCode = unit.id;
    const branchName = branch?.name || "Không rõ chi nhánh";
    const assignerName =
      assigner?.attributes?.name || assigner?.username || "Không rõ";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; 
                  border:1px solid #e0e0e0; border-radius:8px; overflow:hidden;">
        ${buildHeader("Yêu cầu bảo trì mới")}
        <div style="padding:20px; color:#333;">
          <p>Một yêu cầu bảo trì mới cho thiết bị <b>${unitName}</b> (mã: ${unitCode})</p>
          <p><b>Chi nhánh:</b> ${branchName}<br/>
             <b>Người tạo:</b> ${assignerName}</p>
          <p><b>Lý do:</b><br/>${
            maintenance.maintenance_reason || "Không rõ"
          }</p>
        </div>
        ${buildFooter()}
      </div>
    `;

    return await sendNoReplyEmail(recipients, subject, html);
  },
};

module.exports = sendEmail;
