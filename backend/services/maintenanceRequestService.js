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
 * Lấy thêm thông tin cho 1 yêu cầu bảo trì — bản tối ưu có cache tạm
 */
// 🧠 Cache tạm tại runtime (Map để tránh query trùng)
const vendorCache = new Map();
const branchCache = new Map();
const userCache = new Map();
const equipmentCache = new Map();

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
  const userIds = [
    request.assigned_by,
    request.confirmed_by,
    request.candidate_tech_id,
  ].filter(Boolean);

  // =========================
  // ⚡ Helper: lấy cache hoặc query mới
  // =========================
  async function getCached(repo, cache, ids, findByIdFn = "findById") {
    const results = [];
    const toFetch = [];

    for (const id of ids) {
      if (cache.has(id)) results.push(cache.get(id));
      else toFetch.push(id);
    }

    if (toFetch.length) {
      const fetched = await Promise.all(
        toFetch.map((id) => repo[findByIdFn](id))
      );
      for (let i = 0; i < toFetch.length; i++) {
        const id = toFetch[i];
        cache.set(id, fetched[i]);
        results.push(fetched[i]);
      }
    }

    return results;
  }

  // =========================
  // ⚡ Chạy song song với cache
  // =========================
  const [equipments, vendors, branches, users] = await Promise.all([
    getCached(equipmentRepository, equipmentCache, equipmentIds, "findById"),
    getCached(vendorRepository, vendorCache, vendorIds, "findById"),
    getCached(branchRepository, branchCache, branchIds, "findById"),
    getCached(userRepository, userCache, userIds, "getUserBySub"),
  ]);

  // =========================
  // ⚙️ Map hóa để join nhanh
  // =========================
  const equipmentMap = Object.fromEntries(
    equipments.filter(Boolean).map((e) => [e.id, e])
  );
  const vendorMap = Object.fromEntries(
    vendors.filter(Boolean).map((v) => [v.id, v])
  );
  const branchMap = Object.fromEntries(
    branches.filter(Boolean).map((b) => [b.id, b])
  );
  const userMap = Object.fromEntries(userIds.map((id, i) => [id, users[i]]));

  // =========================
  // 🧩 Gộp dữ liệu thiết bị
  // =========================
  const enrichedUnits = units.map((u) => ({
    ...u,
    equipment_name: equipmentMap[u.equipment_id]?.name || null,
    equipment_image: equipmentMap[u.equipment_id]?.image || null,
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

function generateScheduleRequestId(equipmentId) {
  const now = new Date();

  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const ms = String(now.getMilliseconds()).padStart(3, "0");

  const timestamp = `${yyyy}${mm}${dd}${hh}${min}${ss}${ms}`;

  return `${equipmentId}-SCH-${timestamp}`;
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
    const realEquipmentId = firstUnit.equipment_id;

    // Generate ID dạng <equipmentId>-SCH-...
    const newRequestId = generateScheduleRequestId(realEquipmentId);

    const reqItem = await maintenanceRequestRepository.create({
      ...data,
      id: newRequestId,
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

    // 🧠 Kiểm tra quyền cập nhật
    if (!isAdminOrSuperAdmin && reqItem.assigned_by !== userSub) {
      throw new Error("Bạn không có quyền chỉnh sửa yêu cầu này");
    }

    // 1️⃣ Nếu có thay đổi thời gian → XÓA schedule cũ (nếu tồn tại)
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
      data.auto_start_schedule_arn = null;
    }

    // 2️⃣ Xử lý unit: unlock removed + lock added
    const oldIds = Array.isArray(reqItem.equipment_unit_id)
      ? reqItem.equipment_unit_id
      : JSON.parse(reqItem.equipment_unit_id || "[]");
    const newIds = Array.isArray(data.equipment_unit_id)
      ? data.equipment_unit_id
      : oldIds;

    // 🔓 unlock các unit bị bỏ
    const removed = oldIds.filter((id) => !newIds.includes(id));
    for (const unitId of removed) {
      await equipmentUnitRepository.update(unitId, { isScheduleLocked: false });
      console.log(`🔓 Unlocked removed unit ${unitId} from request ${id}`);
    }

    // 🔒 lock các unit mới thêm
    const added = newIds.filter((id) => !oldIds.includes(id));
    for (const unitId of added) {
      await equipmentUnitRepository.update(unitId, { isScheduleLocked: true });
      console.log(`🔒 Locked added unit ${unitId} to request ${id}`);
    }

    // 3️⃣ Lưu thay đổi vào DB
    const updated = await maintenanceRequestRepository.update(id, data);

    // 4️⃣ TH chỉ định kỹ thuật viên → tạo schedule NGAY TẠI ĐÂY
    if (data.candidate_tech_id) {
      try {
        // Cập nhật trạng thái "confirmed" nếu trước đó đang pending
        if (!reqItem.confirmed_by) {
          await maintenanceRequestRepository.update(id, {
            confirmed_by: data.candidate_tech_id,
            status: "confirmed",
          });
        }

        // 🟦 Tạo AWS schedule (vì bây giờ đã có người đảm nhận)
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

          await maintenanceRequestRepository.update(id, {
            auto_start_schedule_arn: result.ScheduleArn,
          });

          console.log(`🗓️ Scheduler CREATED for updated request ${id}`);
        }
      } catch (e) {
        console.warn("⚠️ Failed to create schedule on assigned update:", e);
      }
    }

    // 5️⃣ Gửi thông báo
    try {
      const admins = await userService.getUsersByRoles([
        "admin",
        "super-admin",
      ]);
      const allTechs = await userService.getUsersByRoles(["technician"]);

      if (data.candidate_tech_id) {
        const assignedTech =
          allTechs.find((t) => t.sub === data.candidate_tech_id) || null;

        const recipients = [
          ...admins,
          ...allTechs.filter((t) => !admins.some((a) => a.sub === t.sub)),
        ];

        await notificationService.notifyMaintenanceRequestAssigned(
          { ...updated, candidate_tech: assignedTech },
          recipients,
          userSub
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
    console.time("⚡ getAll Maintenance Requests");

    const list = branchFilter
      ? await maintenanceRequestRepository.findByBranchId(branchFilter)
      : await maintenanceRequestRepository.findAll();

    if (!list?.length) return [];

    // 1️⃣ Gom tất cả unitIds
    const allUnitIds = [
      ...new Set(list.flatMap((r) => r.equipment_unit_id || [])),
    ];

    // 2️⃣ Lấy toàn bộ unit một lượt
    const allUnits = await equipmentUnitRepository.batchFindByIds(allUnitIds);

    // Map nhanh
    const unitMap = Object.fromEntries(allUnits.map((u) => [u.id, u]));

    // 3️⃣ Gom tất cả ID cần join
    const equipmentIds = [...new Set(allUnits.map((u) => u.equipment_id))];
    const vendorIds = [
      ...new Set(allUnits.map((u) => u.vendor_id).filter(Boolean)),
    ];
    const branchIds = [...new Set(allUnits.map((u) => u.branch_id))];
    const userIds = [
      ...new Set(
        list.flatMap((r) =>
          [r.assigned_by, r.confirmed_by, r.candidate_tech_id].filter(Boolean)
        )
      ),
    ];

    // 4️⃣ Query song song
    const [equipments, vendors, branches, users] = await Promise.all([
      equipmentRepository.batchFindByIds(equipmentIds),
      Promise.all(vendorIds.map((id) => vendorRepository.findById(id))),
      Promise.all(branchIds.map((id) => branchRepository.findById(id))),
      Promise.all(userIds.map((id) => userRepository.getUserBySub(id))),
    ]);

    // Tạo map lookup
    const equipmentMap = Object.fromEntries(equipments.map((e) => [e.id, e]));
    const vendorMap = Object.fromEntries(
      vendorIds.map((id, i) => [id, vendors[i]])
    );
    const branchMap = Object.fromEntries(
      branchIds.map((id, i) => [id, branches[i]])
    );
    const userMap = Object.fromEntries(userIds.map((id, i) => [id, users[i]]));

    // 5️⃣ Gộp nhanh
    const extractName = (u) =>
      u?.attributes?.name ||
      u?.UserAttributes?.find(
        (a) => a.Name === "name" || a.Name === "custom:name"
      )?.Value ||
      u?.username ||
      u?.Username ||
      "Chưa có thông tin";

    const result = list.map((r) => {
      const units = (r.equipment_unit_id || [])
        .map((id) => {
          const u = unitMap[id];
          if (!u) return null;
          return {
            ...u,
            equipment_name: equipmentMap[u.equipment_id]?.name || null,
            equipment_image: equipmentMap[u.equipment_id]?.image || null,
            vendor_name: vendorMap[u.vendor_id]?.name || null,
            branch_name: branchMap[u.branch_id]?.name || null,
            isScheduleLocked: u.isScheduleLocked ?? false,
            status: u.status || "Chưa xác định",
          };
        })
        .filter(Boolean);

      return {
        ...r,
        units,
        assigned_by_name: extractName(userMap[r.assigned_by]),
        confirmed_by_name: extractName(userMap[r.confirmed_by]),
        candidate_tech_name: extractName(userMap[r.candidate_tech_id]),
      };
    });

    console.timeEnd("⚡ getAll Maintenance Requests");
    return result;
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
