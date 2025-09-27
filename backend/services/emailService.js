const { sendNoReplyEmail } = require("../utils/smtpMailer");
const equipmentUnitRepository = require("../repositories/equipmentUnitRepository");
const equipmentRepository = require("../repositories/equipmentRepository");
const branchRepository = require("../repositories/branchRepository");
const userRepository = require("../repositories/userRepository");

const sendEmail = {
  /**
   * Gửi mail khi bảo trì xong thiết bị
   */
  async sendMaintenanceCompletedEmail(recipients, maintenance) {
    if (!recipients || recipients.length === 0) return;

    // Unit
    const unit = await equipmentUnitRepository.findById(
      maintenance.equipment_unit_id
    );
    if (!unit) {
      console.warn(
        `Equipment unit ${maintenance.equipment_unit_id} not found, skip email.`
      );
      return;
    }

    // Equipment
    let equipmentName = "";
    if (unit.equipment_id) {
      const equipment = await equipmentRepository.findById(unit.equipment_id);
      equipmentName = equipment?.name || "";
    }

    // Branch
    const branch = await branchRepository.findById(unit.branch_id);

    // User
    let technicianName = "";
    if (maintenance.user_id) {
      const user = await userRepository.getUserBySub(maintenance.user_id);
      technicianName = user?.attributes?.name || user?.username || "";
    }

    const subject = "Hoàn tất bảo trì";
    const unitName = equipmentName || "Không rõ tên";
    const unitCode = unit.id;
    const unitStatus = unit.status;
    const branchName = branch?.name || "Không rõ chi nhánh";

    const text = `Yêu cầu bảo trì cho thiết bị ${unitName} (mã: ${unitCode}) ở chi nhánh ${branchName}, nhân viên ${technicianName} phụ trách bảo trì đã hoàn tất với trạng thái ${unitStatus}.`;

    return await sendNoReplyEmail(recipients, subject, text);
  },
};

module.exports = sendEmail;
