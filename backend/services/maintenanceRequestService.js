const maintenanceRequestRepository = require("../repositories/maintenanceRequestRepository");
const equipmentUnitRepository = require("../repositories/equipmentUnitRepository");
const branchRepository = require("../repositories/branchRepository");
const userService = require("./userService");
const notificationService = require("./notificationService");
const maintenanceService = require("./maintenanceService");
const {
  SchedulerClient,
  CreateScheduleCommand,
  DeleteScheduleCommand,
} = require("@aws-sdk/client-scheduler");
// 🧠 Thêm AWS scheduler helper ngay dưới phần import
const scheduler = new SchedulerClient({ region: process.env.AWS_REGION });

async function createOneTimeSchedule({ scheduleName, runAtIsoUtc, payload }) {
  const now = new Date();

  // ✅ Không cần trừ 7 tiếng — FE gửi giờ local theo Asia/Bangkok
  const runTime = new Date(runAtIsoUtc);

  // ✅ Nếu thời gian đã qua → delay 1 phút để tránh AWS error
  if (runTime <= now) {
    runTime.setMinutes(runTime.getMinutes() + 1);
  }

  // ✅ Giữ nguyên format ISO và timezone chính xác
  const finalTime = runTime.toISOString().replace(/\.\d{3}Z$/, "");

  const input = {
    Name: scheduleName,
    ScheduleExpression: `at(${finalTime})`,
    ScheduleExpressionTimezone: "Asia/Bangkok", // để AWS hiểu giờ VN
    FlexibleTimeWindow: { Mode: "OFF" },
    Target: {
      Arn: process.env.TARGET_LAMBDA_ARN,
      RoleArn: process.env.SCHEDULER_ROLE_ARN,
      Input: JSON.stringify(payload),
    },
  };

  try {
    const command = new CreateScheduleCommand(input);
    const result = await scheduler.send(command);

    console.log(
      "✅ Created AWS Schedule:",
      scheduleName,
      "| Sẽ chạy lúc:",
      runTime.toLocaleString("vi-VN", { timeZone: "Asia/Bangkok" })
    );
    return result;
  } catch (err) {
    console.error("❌ Failed to create schedule:", err);
    throw err;
  }
}

const maintenanceRequestService = {
  createRequest: async (data, userSub) => {
    // ✅ Mặc định equipment_unit_id là mảng
    const unitIds = data.equipment_unit_id;
    if (!Array.isArray(unitIds) || unitIds.length === 0)
      throw new Error("equipment_unit_id must be a non-empty array");

    // ✅ Kiểm tra branch từ 1 thiết bị đầu tiên
    const firstUnit = await equipmentUnitRepository.findById(unitIds[0]);
    if (!firstUnit) throw new Error(`Equipment unit ${unitIds[0]} not found`);
    const branch = await branchRepository.findById(firstUnit.branch_id);
    if (!branch) throw new Error(`Branch ${firstUnit.branch_id} not found`);

    // ✅ Tạo duy nhất 1 record request (equipment_unit_id là mảng)
    const reqItem = await maintenanceRequestRepository.create({
      ...data,
      branch_id: firstUnit.branch_id,
      assigned_by: userSub,
    });

    // ✅ Gửi thông báo cho technician
    try {
      let technicians = [];
      if (
        Array.isArray(data.candidate_tech_ids) &&
        data.candidate_tech_ids.length
      ) {
        technicians = await Promise.all(
          data.candidate_tech_ids.map((sub) => userService.getUserBySub(sub))
        );
      } else {
        technicians = await userService.getUsersByRoles(["technician"]);
      }

      await notificationService.notifyMaintenanceRequestCreated(
        [reqItem],
        technicians,
        userSub
      );
    } catch (err) {
      console.warn(
        "⚠️ notifyMaintenanceRequestCreated failed:",
        err?.message || err
      );
    }

    return reqItem;
  },

  // Kỹ thuật viên xác nhận nhận việc
  confirmRequest: async (id, confirmerSub) => {
    const reqItem = await maintenanceRequestRepository.findById(id);
    if (!reqItem) throw new Error("Maintenance request not found");
    if (reqItem.status !== "pending") {
      throw new Error(`Cannot confirm a request in status: ${reqItem.status}`);
    }

    // ✅ 1. Cập nhật trạng thái xác nhận
    const updated = await maintenanceRequestRepository.update(id, {
      confirmed_by: confirmerSub,
      status: "confirmed",
    });

    // ✅ 2. Tạo lịch AWS Scheduler cho giờ thực hiện (không tạo Maintenance liền)
    if (reqItem.scheduled_at) {
      try {
        const scheduleName = `auto-maintenance-${id}`;
        const result = await createOneTimeSchedule({
          scheduleName,
          runAtIsoUtc: reqItem.scheduled_at,
          payload: {
            type: "AUTO_MAINTENANCE_FROM_REQUEST",
            request_id: id,
          },
        });

        await maintenanceRequestRepository.update(id, {
          auto_start_schedule_arn: result.ScheduleArn,
        });

        console.log(`🗓️ Scheduled maintenance trigger for request ${id}`);
      } catch (err) {
        console.error("❌ Failed to create AWS schedule for maintenance:", err);
        throw new Error("Failed to schedule auto maintenance trigger");
      }
    }

    // ✅ 3. Gửi thông báo
    try {
      const admins = await userService.getUsersByRoles([
        "admin",
        "super-admin",
      ]);
      const technicians = await userService.getUsersByRoles(["technician"]);

      // Gộp danh sách người nhận (tránh trùng)
      const allRecipients = [
        ...admins,
        ...technicians.filter((t) => !admins.some((a) => a.sub === t.sub)),
      ];

      if (notificationService.notifyMaintenanceRequestConfirmed) {
        await notificationService.notifyMaintenanceRequestConfirmed(
          {
            ...updated,
            message: "Yêu cầu bảo trì đã được xác nhận và hẹn giờ thực hiện.",
          },
          allRecipients,
          confirmerSub
        );
      }
    } catch (e) {
      console.warn("⚠️ notify confirmRequest failed:", e?.message || e);
    }

    return { request: updated };
  },

  // Hủy yêu cầu (chỉ khi pending)
  cancelRequest: async (id, userSub, isAdminOrSuperAdmin) => {
    const reqItem = await maintenanceRequestRepository.findById(id);
    if (!reqItem) throw new Error("Maintenance request not found");
    if (reqItem.status !== "pending") {
      throw new Error(
        `Only pending request can be cancelled (current: ${reqItem.status})`
      );
    }

    // Bảo vệ: chỉ admin/super-admin hoặc chính người tạo mới được hủy
    if (!isAdminOrSuperAdmin && reqItem.assigned_by !== userSub) {
      throw new Error("You are not allowed to cancel this request");
    }

    const updated = await maintenanceRequestRepository.update(id, {
      status: "cancelled",
    });

    try {
      const admins = await userService.getUsersByRoles([
        "admin",
        "super-admin",
      ]);
      if (notificationService.notifyMaintenanceCompleted) {
        await notificationService.notifyMaintenanceCompleted(
          {
            ...updated,
            message: "Yêu cầu bảo trì đã bị hủy.",
          },
          admins,
          userSub
        );
      }
    } catch (e) {
      console.warn("⚠️ notify cancelRequest failed:", e?.message || e);
    }

    return updated;
  },

  getAll: async (branchFilter = null) => {
    if (branchFilter)
      return maintenanceRequestRepository.findByBranchId(branchFilter);
    return maintenanceRequestRepository.findAll();
  },

  getById: async (id) => {
    const item = await maintenanceRequestRepository.findById(id);
    if (!item) throw new Error("Maintenance request not found");
    return item;
  },

  getByUnitId: async (unitId) => {
    return maintenanceRequestRepository.findByUnitId(unitId);
  },
};
module.exports = maintenanceRequestService;
