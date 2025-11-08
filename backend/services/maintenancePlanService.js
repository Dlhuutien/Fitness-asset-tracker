const {
  SchedulerClient,
  CreateScheduleCommand,
  DeleteScheduleCommand,
} = require("@aws-sdk/client-scheduler");
const maintenancePlanRepository = require("../repositories/maintenancePlanRepository");
const equipmentRepository = require("../repositories/equipmentRepository");
const userService = require("./userService");
const notificationService = require("./notificationService");
const {
  parseFrequencyToRate,
  nextDateByFrequency,
} = require("../utils/frequencyParser");

const scheduler = new SchedulerClient({ region: process.env.AWS_REGION });

// ==============================
// 🕒 Tạo AWS EventBridge Scheduler (Recurring theo frequency)
// ==============================
async function createReminderSchedule(plan) {
  // 🇹🇭 Lấy thời gian nhắc chính xác
  let reminderDate = new Date(plan.next_maintenance_date);

  // Nếu nhỏ hơn hoặc bằng hiện tại => dùng luôn thời điểm hiện tại
  if (reminderDate <= new Date()) {
    reminderDate = new Date();
    console.log(
      "⚠️ Reminder date đã qua, dùng luôn thời điểm hiện tại:",
      reminderDate.toISOString()
    );
  }

  // 🔹 Map frequency → AWS rate()
  const scheduleExpression = parseFrequencyToRate(plan.frequency);

  const input = {
    Name: `remind-${plan.id}-${Date.now()}`,
    ScheduleExpression: scheduleExpression,
    ScheduleExpressionTimezone: "Asia/Bangkok",
    StartDate: new Date(
      new Date(plan.next_maintenance_date).getTime() - 7 * 60 * 60 * 1000
    ),
    FlexibleTimeWindow: { Mode: "OFF" },
    Target: {
      Arn: process.env.TARGET_LAMBDA_ARN,
      RoleArn: process.env.SCHEDULER_ROLE_ARN,
      Input: JSON.stringify({
        type: "REMINDER_MAINTENANCE",
        plan_id: plan.id,
        equipment_id: plan.equipment_id,
        next_maintenance_date: plan.next_maintenance_date,
        frequency: plan.frequency,
      }),
    },
  };

  const command = new CreateScheduleCommand(input);
  await scheduler.send(command);
  console.log(
    `📅 Recurring schedule created (${scheduleExpression}) for plan ${plan.id}`
  );
  return input.Name;
}

async function recreateReminderSchedule(plan) {
  // Xóa schedule cũ (nếu có)
  if (plan.reminder_schedule_arn) {
    try {
      await scheduler.send(
        new DeleteScheduleCommand({ Name: plan.reminder_schedule_arn })
      );
    } catch (e) {
      console.warn("⚠️ Delete old schedule failed (ignore):", e?.message || e);
    }
  }
  // Tạo schedule mới theo plan hiện tại
  const name = await createReminderSchedule(plan);
  await maintenancePlanRepository.update(plan.id, {
    reminder_schedule_arn: name,
  });
  return name;
}

function mustBeFuture(dateIso) {
  return new Date(dateIso).getTime() > Date.now();
}

function diffMs(a, b) {
  return new Date(a).getTime() - new Date(b).getTime();
}

/**
 * Tự động cập nhật ngày bảo trì kế tiếp và reschedule lại AWS Scheduler
 * @param {Object} plan - bản ghi maintenance_plan
 */
async function advanceAndReschedule(plan) {
  if (!plan || !plan.frequency || !plan.next_maintenance_date) {
    console.warn("⚠️ Invalid plan data, skip advanceAndReschedule");
    return;
  }
  const nextIso = nextDateByFrequency(
    plan.next_maintenance_date,
    plan.frequency
  );

  // Xóa schedule cũ (nếu có)
  if (plan.reminder_schedule_arn) {
    try {
      await scheduler.send(
        new DeleteScheduleCommand({ Name: plan.reminder_schedule_arn })
      );
      console.log(`🗑️ Deleted old schedule: ${plan.reminder_schedule_arn}`);
    } catch (e) {
      console.warn("⚠️ Delete old schedule failed:", e?.message || e);
    }
  }

  // Cập nhật next_maintenance_date
  const updated = await maintenancePlanRepository.update(plan.id, {
    next_maintenance_date: nextIso,
  });

  // Tạo schedule mới
  //   const arn = await createReminderSchedule(updated);
  const arn = await createReminderSchedule({
    ...updated,
    next_maintenance_date: nextIso,
  });
  await maintenancePlanRepository.update(plan.id, {
    reminder_schedule_arn: arn,
  });

  console.log(
    `🔁 [MaintenancePlan] Updated next_maintenance_date → ${nextIso}, new schedule: ${arn}`
  );

  return updated;
}

// Hàm xóa schedule cũ an toàn
async function deleteReminderSchedule(name) {
  try {
    await scheduler.send(new DeleteScheduleCommand({ Name: name }));
    console.log(`🗑️ Deleted old schedule safely: ${name}`);
  } catch (err) {
    console.warn("⚠️ Failed to delete schedule:", err.message || err);
  }
}

const maintenancePlanService = {
  createPlan: async (data, userSub) => {
    const equipment = await equipmentRepository.findById(data.equipment_id);
    if (!equipment) throw new Error("Equipment not found");

    // 🧠 Ràng buộc: không cho tạo trùng dòng thiết bị
    const existingPlans = await maintenancePlanRepository.findByEquipmentId(
      data.equipment_id
    );
    if (existingPlans && existingPlans.length > 0) {
      throw new Error(
        `Đã tồn tại lịch nhắc nhở bảo trì cho dòng thiết bị ${equipment.name} (${data.equipment_id})`
      );
    }

    // ✅ validate: next_maintenance_date phải lớn hơn hiện tại
    if (!mustBeFuture(data.next_maintenance_date)) {
      throw new Error("next_maintenance_date must be in the future");
    }

    // Tạo plan
    let plan = await maintenancePlanRepository.create({
      ...data,
      created_by: userSub,
    });
    plan = await maintenancePlanRepository.findById(plan.id);

    const admins = await userService.getUsersByRoles(["admin", "super-admin"]);

    // Khoảng thời gian tới lần bảo trì
    const msToNext = diffMs(
      plan.next_maintenance_date,
      new Date().toISOString()
    );
    const sevenDaysMs = 3 * 24 * 60 * 60 * 1000;

    if (msToNext < sevenDaysMs) {
      // 🔔 Gửi nhắc NGAY (vì còn < 7 ngày)
      await notificationService.notifyMaintenanceReminder(
        {
          equipment_id: plan.equipment_id,
          equipment_name: equipment.name,
          next_maintenance_date: plan.next_maintenance_date,
          frequency: plan.frequency,
        },
        admins
      );

      // 🔁 Nhảy kỳ tiếp theo và đặt lại schedule
      const nextIso = nextDateByFrequency(
        plan.next_maintenance_date,
        plan.frequency
      );
      plan = await maintenancePlanRepository.update(plan.id, {
        next_maintenance_date: nextIso,
      });

      const arn = await recreateReminderSchedule(plan);
      return { ...plan, reminder_schedule_arn: arn };
    }

    // 🔔 Nếu còn >= 7 ngày: chỉ tạo schedule lần này
    const arn = await createReminderSchedule(plan);
    plan = await maintenancePlanRepository.update(plan.id, {
      reminder_schedule_arn: arn,
    });

    return { ...plan, reminder_schedule_arn: arn };
  },

  getAll: async () => {
    const plans = await maintenancePlanRepository.findAll();
    if (!plans?.length) return [];

    // Lấy danh sách thiết bị tương ứng
    const equipmentIds = [...new Set(plans.map((p) => p.equipment_id))];
    const equipments = await equipmentRepository.batchFindByIds(equipmentIds);
    const equipmentMap = Object.fromEntries(
      equipments.map((eq) => [eq.id, eq])
    );

    return plans.map((p) => ({
      ...p,
      equipment_name: equipmentMap[p.equipment_id]?.name || null,
    }));
  },

  getById: async (id) => {
    const plan = await maintenancePlanRepository.findById(id);
    if (!plan) throw new Error("Maintenance plan not found");

    const eq = await equipmentRepository.findById(plan.equipment_id);
    return {
      ...plan,
      equipment_name: eq?.name || null,
    };
  },

  getByEquipmentId: async (eid) => {
    const plans = await maintenancePlanRepository.findByEquipmentId(eid);
    if (!plans?.length) return [];

    const eq = await equipmentRepository.findById(eid);
    return plans.map((p) => ({
      ...p,
      equipment_name: eq?.name || null,
    }));
  },

  updatePlan: async (id, data) => {
    // 🔍 Tìm plan hiện có
    const existing = await maintenancePlanRepository.findById(id);
    if (!existing) throw new Error("Maintenance plan not found");

    // 🧠 Validate: nếu thay đổi equipment_id thì chặn (vì 1 thiết bị chỉ có 1 plan)
    if (data.equipment_id && data.equipment_id !== existing.equipment_id) {
      throw new Error(
        "Không thể thay đổi thiết bị trong lịch bảo trì đã tồn tại"
      );
    }

    // 🧩 Validate ngày (nếu có thay đổi)
    if (
      data.next_maintenance_date &&
      !mustBeFuture(data.next_maintenance_date)
    ) {
      throw new Error("next_maintenance_date phải lớn hơn thời gian hiện tại");
    }

    // 🧠 Merge dữ liệu mới
    const updateData = {
      ...existing,
      ...data,
      updated_at: new Date().toISOString(),
    };

    // 🟢 Nếu có frequency hoặc next_maintenance_date => active true
    if (
      data.frequency ||
      data.next_maintenance_date ||
      data.reminder_schedule_arn
    ) {
      updateData.active = true;
    }

    // 🧮 Nếu thay đổi frequency hoặc ngày => cập nhật lại schedule
    let newArn = existing.reminder_schedule_arn;
    if (
      data.frequency ||
      data.next_maintenance_date !== existing.next_maintenance_date
    ) {
      try {
        // Xoá schedule cũ nếu có
        if (existing.reminder_schedule_arn) {
          await deleteReminderSchedule(existing.reminder_schedule_arn);
          console.log(
            "🗑️ Deleted old schedule:",
            existing.reminder_schedule_arn
          );
        }

        // Tạo schedule mới
        const newPlanData = {
          ...existing,
          ...data,
          id,
          active: true,
        };
        newArn = await createReminderSchedule(newPlanData);
        updateData.reminder_schedule_arn = newArn;
        console.log("📅 Created new schedule:", newArn);
      } catch (err) {
        console.warn("⚠️ Failed to recreate schedule:", err);
      }
    }

    // 🧾 Thực hiện cập nhật trong DB
    const result = await maintenancePlanRepository.update(id, updateData);
    console.log("✅ Updated maintenance plan:", {
      id: result.id,
      frequency: result.frequency,
      next_maintenance_date: result.next_maintenance_date,
      reminder_schedule_arn: result.reminder_schedule_arn,
      active: result.active,
    });

    return result;
  },

  deletePlan: async (id) => {
    const plan = await maintenancePlanRepository.findById(id);
    if (plan?.reminder_schedule_arn) {
      try {
        await scheduler.send(
          new DeleteScheduleCommand({ Name: plan.reminder_schedule_arn })
        );
      } catch (err) {
        console.warn("⚠️ Failed to delete reminder schedule:", err);
      }
    }
    return maintenancePlanRepository.delete(id);
  },
};

module.exports = {
  ...maintenancePlanService,
  nextDateByFrequency,
  advanceAndReschedule,
};
