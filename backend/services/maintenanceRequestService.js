const maintenanceRequestRepository = require("../repositories/maintenanceRequestRepository");
const equipmentUnitRepository = require("../repositories/equipmentUnitRepository");
const branchRepository = require("../repositories/branchRepository");
const userService = require("./userService");
const notificationService = require("./notificationService");
const equipmentRepository = require("../repositories/equipmentRepository");
const vendorRepository = require("../repositories/vendorRepository");
const userRepository = require("../repositories/userRepository");

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

/**
 * Lấy thêm thông tin cho 1 yêu cầu bảo trì
 */
async function enrichRequestData(request) {
  if (!request || !request.equipment_unit_id) return request;

  let unitIds = [];
  try {
    unitIds = Array.isArray(request.equipment_unit_id)
      ? request.equipment_unit_id
      : JSON.parse(request.equipment_unit_id || "[]");
  } catch {
    unitIds = [request.equipment_unit_id];
  }

  // ⚡ Lấy tất cả unit liên quan
  const units = await equipmentUnitRepository.batchFindByIds(unitIds);
  if (!units?.length) return { ...request, units: [] };

  // Gom các ID cần join
  const equipmentIds = [...new Set(units.map((u) => u.equipment_id))];
  const vendorIds = [...new Set(units.map((u) => u.vendor_id).filter(Boolean))];
  const branchIds = [...new Set(units.map((u) => u.branch_id))];

  // 🧩 Gom ID user cần lấy
  const userIds = [
    request.assigned_by,
    request.confirmed_by,
    request.candidate_tech_id,
  ].filter(Boolean);

  // Lấy toàn bộ thông tin join song song
  const [equipments, vendors, branches, users] = await Promise.all([
    equipmentRepository.batchFindByIds(equipmentIds),
    Promise.all(vendorIds.map((id) => vendorRepository.findById(id))),
    Promise.all(branchIds.map((id) => branchRepository.findById(id))),
    Promise.all(userIds.map((id) => userRepository.getUserBySub(id))),
  ]);

  const equipmentMap = Object.fromEntries(equipments.map((e) => [e.id, e]));
  const vendorMap = Object.fromEntries(
    vendorIds.map((id, i) => [id, vendors[i]])
  );
  const branchMap = Object.fromEntries(
    branchIds.map((id, i) => [id, branches[i]])
  );
  const userMap = Object.fromEntries(userIds.map((id, i) => [id, users[i]]));

  // Gộp chi tiết thiết bị
  const enrichedUnits = units.map((u) => ({
    ...u,
    equipment_name: equipmentMap[u.equipment_id]?.name || null,
    vendor_name: vendorMap[u.vendor_id]?.name || null,
    branch_name: branchMap[u.branch_id]?.name || null,
    isScheduleLocked: u.isScheduleLocked ?? false,
    status: u.status || "Chưa xác định",
  }));

  // 🧠 Helper lấy tên người dùng
  const extractName = (u) =>
    u?.attributes?.name ||
    u?.UserAttributes?.find(
      (a) => a.Name === "name" || a.Name === "custom:name"
    )?.Value ||
    u?.username ||
    u?.Username ||
    "Chưa có thông tin";

  return {
    ...request,
    units: enrichedUnits,
    assigned_by_name: extractName(userMap[request.assigned_by]),
    confirmed_by_name: extractName(userMap[request.confirmed_by]),
    candidate_tech_name: extractName(userMap[request.candidate_tech_id]),
  };
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

    // 🔒 Khóa các thiết bị trong request khi trạng thái là pending hoặc confirmed
    try {
      const unitIds = Array.isArray(data.equipment_unit_id)
        ? data.equipment_unit_id
        : [data.equipment_unit_id];
      for (const unitId of unitIds) {
        await equipmentUnitRepository.update(unitId, {
          isScheduleLocked: true,
        });
      }
      console.log(
        `🔒 Locked ${unitIds.length} units for maintenance request ${reqItem.id}`
      );
    } catch (e) {
      console.warn("⚠️ Failed to lock units:", e?.message || e);
    }

    try {
      // 🧩 Lấy danh sách admin & technician ngay từ đầu
      const admins = await userService.getUsersByRoles([
        "admin",
        "super-admin",
      ]);
      const allTechs = await userService.getUsersByRoles(["technician"]);

      // 🟢 Nếu admin đã chỉ định kỹ thuật viên cụ thể
      if (data.candidate_tech_id) {
        const assignedTech =
          allTechs.find((t) => t.sub === data.candidate_tech_id) || null;

        // ✅ Cập nhật trạng thái thành confirmed + confirmed_by
        const updatedReq = await maintenanceRequestRepository.update(
          reqItem.id,
          {
            confirmed_by: data.candidate_tech_id,
            status: "confirmed",
          }
        );

        // ✅ Tạo AWS Schedule tự động (nếu có thời gian)
        if (data.scheduled_at) {
          try {
            const scheduleName = `auto-maintenance-${updatedReq.id}`;
            const result = await createOneTimeSchedule({
              scheduleName,
              runAtIsoUtc: data.scheduled_at,
              payload: {
                type: "AUTO_MAINTENANCE_FROM_REQUEST",
                request_id: updatedReq.id,
              },
            });

            await maintenanceRequestRepository.update(updatedReq.id, {
              auto_start_schedule_arn: result.ScheduleArn,
            });

            console.log(
              `🗓️ AWS schedule created for confirmed request ${updatedReq.id}`
            );
          } catch (err) {
            console.warn(
              "⚠️ Failed to create AWS schedule for confirmed request:",
              err?.message || err
            );
          }
        }

        // 🟢 Gửi thông báo cho toàn bộ admin + tất cả kỹ thuật viên
        try {
          const recipients = [
            ...admins,
            ...allTechs.filter((t) => !admins.some((a) => a.sub === t.sub)),
          ];

          await notificationService.notifyMaintenanceRequestAssigned(
            {
              ...updatedReq,
              candidate_tech: assignedTech, // truyền thêm để show trong email
            },
            recipients,
            userSub
          );

          console.log(
            `📩 Sent maintenance assignment notify to ${
              recipients.length
            } recipients (assigned to ${
              assignedTech?.attributes?.name ||
              assignedTech?.username ||
              "Không rõ"
            })`
          );
        } catch (e) {
          console.warn(
            "⚠️ notifyMaintenanceRequestAssigned failed:",
            e?.message || e
          );
        }

        return updatedReq;
      }

      // 🟡 Nếu chưa chỉ định kỹ thuật viên, gửi cho tất cả tech như cũ
      await notificationService.notifyMaintenanceRequestCreated(
        [reqItem],
        allTechs,
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

  // Cập nhật lịch bảo trì đã tạo (chưa tới giờ chạy)
  updateRequest: async (id, data, userSub, isAdminOrSuperAdmin) => {
    const reqItem = await maintenanceRequestRepository.findById(id);
    if (!reqItem) throw new Error("Maintenance request not found");
    if (reqItem.status !== "pending" && reqItem.status !== "confirmed") {
      throw new Error("Chỉ được chỉnh sửa khi yêu cầu chưa được thực hiện");
    }

    // 🧠 Kiểm tra quyền (admin hoặc người tạo)
    if (!isAdminOrSuperAdmin && reqItem.assigned_by !== userSub) {
      throw new Error("Bạn không có quyền chỉnh sửa yêu cầu này");
    }

    // ✅ Nếu có thay đổi thời gian — xóa schedule cũ và tạo mới
    if (data.scheduled_at && reqItem.auto_start_schedule_arn) {
      try {
        const delCmd = new DeleteScheduleCommand({
          Name: reqItem.auto_start_schedule_arn.split("/").pop(),
        });
        await scheduler.send(delCmd);
        console.log(`🗑️ Deleted old schedule for ${id}`);
      } catch (e) {
        console.warn("⚠️ Failed to delete old schedule:", e?.message);
      }
    }

    // ✅ Nếu có thời gian mới → tạo lại AWS schedule
    if (data.scheduled_at) {
      const scheduleName = `auto-maintenance-${id}`;
      const result = await createOneTimeSchedule({
        scheduleName,
        runAtIsoUtc: data.scheduled_at,
        payload: {
          type: "AUTO_MAINTENANCE_FROM_REQUEST",
          request_id: id,
        },
      });
      data.auto_start_schedule_arn = result.ScheduleArn;
    }

    // 🧮 So sánh danh sách unit cũ và mới để cập nhật lock
    const oldIds = Array.isArray(reqItem.equipment_unit_id)
      ? reqItem.equipment_unit_id
      : JSON.parse(reqItem.equipment_unit_id || "[]");
    const newIds = Array.isArray(data.equipment_unit_id)
      ? data.equipment_unit_id
      : oldIds;

    // 🔓 Mở khóa những unit bị loại bỏ
    const removed = oldIds.filter((id) => !newIds.includes(id));
    for (const unitId of removed) {
      await equipmentUnitRepository.update(unitId, { isScheduleLocked: false });
      console.log(`🔓 Unlocked removed unit ${unitId} from request ${id}`);
    }

    // 🔒 Khóa những unit mới thêm
    const added = newIds.filter((id) => !oldIds.includes(id));
    for (const unitId of added) {
      await equipmentUnitRepository.update(unitId, { isScheduleLocked: true });
      console.log(`🔒 Locked added unit ${unitId} to request ${id}`);
    }

    // ✅ Cập nhật vào DynamoDB
    const updated = await maintenanceRequestRepository.update(id, data);

    // ✅ Gửi thông báo
    try {
      const admins = await userService.getUsersByRoles([
        "admin",
        "super-admin",
      ]);
      const allTechs = await userService.getUsersByRoles(["technician"]);

      // 🔹 Nếu update có candidate_tech_id mới → Gửi thông báo Assigned
      if (data.candidate_tech_id) {
        const assignedTech =
          allTechs.find((t) => t.sub === data.candidate_tech_id) || null;

        if (!reqItem.confirmed_by) {
          await maintenanceRequestRepository.update(id, {
            confirmed_by: data.candidate_tech_id,
            status: "confirmed",
          });
        }

        const recipients = [
          ...admins,
          ...allTechs.filter((t) => !admins.some((a) => a.sub === t.sub)),
        ];

        await notificationService.notifyMaintenanceRequestAssigned(
          {
            ...updated,
            candidate_tech: assignedTech,
          },
          recipients,
          userSub
        );

        console.log(
          `📩 Assigned notification sent to ${
            recipients.length
          } recipients (assigned to ${
            assignedTech?.attributes?.name ||
            assignedTech?.username ||
            "Không rõ"
          })`
        );
      } else {
        await notificationService.notifyMaintenanceRequestUpdated(
          updated,
          admins,
          userSub
        );
      }
    } catch (e) {
      console.warn(
        "⚠️ notifyMaintenanceRequestUpdated/Assigned failed:",
        e?.message
      );
    }

    return updated;
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

    // 🔓 Mở khóa tất cả thiết bị trong yêu cầu bị hủy
    try {
      const unitIds = Array.isArray(reqItem.equipment_unit_id)
        ? reqItem.equipment_unit_id
        : JSON.parse(reqItem.equipment_unit_id || "[]");
      for (const unitId of unitIds) {
        await equipmentUnitRepository.update(unitId, {
          isScheduleLocked: false,
        });
      }
      console.log(
        `🔓 Unlocked ${unitIds.length} units after cancelling request ${id}`
      );
    } catch (e) {
      console.warn("⚠️ Failed to unlock units after cancel:", e?.message || e);
    }

    try {
      const admins = await userService.getUsersByRoles([
        "admin",
        "super-admin",
      ]);

      if (notificationService.notifyMaintenanceRequestCancelled) {
        await notificationService.notifyMaintenanceRequestCancelled(
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
    const list = branchFilter
      ? await maintenanceRequestRepository.findByBranchId(branchFilter)
      : await maintenanceRequestRepository.findAll();

    if (!list?.length) return [];
    return await Promise.all(list.map((r) => enrichRequestData(r)));
  },

  getById: async (id) => {
    const item = await maintenanceRequestRepository.findById(id);
    if (!item) throw new Error("Maintenance request not found");
    return await enrichRequestData(item);
  },

  getByUnitId: async (unitId) => {
    const list = await maintenanceRequestRepository.findByUnitId(unitId);
    if (!list?.length) return [];
    return await Promise.all(list.map((r) => enrichRequestData(r)));
  },
};
module.exports = maintenanceRequestService;
