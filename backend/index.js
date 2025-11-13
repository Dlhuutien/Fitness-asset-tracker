const app = require("./app");
const serverless = require("serverless-http");

// 🧱 Repositories
const equipmentUnitRepository = require("./repositories/equipmentUnitRepository");
const maintenanceRepository = require("./repositories/maintenanceRepository");
const equipmentRepository = require("./repositories/equipmentRepository");
const maintenancePlanRepository = require("./repositories/maintenancePlanRepository");
const maintenanceRequestRepository = require("./repositories/maintenanceRequestRepository");

// 🧠 Services
const { advanceAndReschedule } = require("./services/maintenancePlanService");
const userService = require("./services/userService");
const notificationService = require("./services/notificationService");

// 🚀 Express handler (cho API Gateway hoặc Lambda Function URL)
const expressHandler = serverless(app);

// import để tạo schedule mới
const {
  SchedulerClient,
  CreateScheduleCommand,
  DeleteScheduleCommand,
} = require("@aws-sdk/client-scheduler");
const scheduler = new SchedulerClient({ region: process.env.AWS_REGION });

module.exports.handler = async (event, context) => {
  console.log("🚀 Lambda Invoked! RequestId:", context.awsRequestId);
  console.log("🔍 RAW EVENT:", JSON.stringify(event, null, 2));

  try {
    // 🧠 1️⃣ Nhận diện event từ EventBridge Scheduler
    const isSchedulerEvent =
      event?.source === "aws.scheduler" ||
      event?.type === "AUTO_MAINTENANCE_FROM_REQUEST";
    event?.type === "REMINDER_MAINTENANCE" ||
      event?.Input ||
      (typeof event === "object" &&
        !event.version &&
        !event.requestContext &&
        !event.routeKey);

    if (isSchedulerEvent) {
      console.log("🕒 [FitXGym] EventBridge Scheduler trigger detected");

      // 🧩 Parse payload linh hoạt
      let data;
      if (typeof event === "string") data = JSON.parse(event);
      else if (typeof event.Input === "string") data = JSON.parse(event.Input);
      else if (event.Input) data = event.Input;
      else data = event;

      console.log("📦 Parsed Payload:", data);

      // ⚙️ Xử lý AUTO_MAINTENANCE_FROM_REQUEST (tạo Maintenance thật từ Request)
      if (data?.type === "AUTO_MAINTENANCE_FROM_REQUEST") {
        console.log(
          "🕒 [FitXGym] Trigger AUTO_MAINTENANCE_FROM_REQUEST:",
          data
        );

        const request = await maintenanceRequestRepository.findById(
          data.request_id
        );
        if (!request) {
          console.error("❌ Maintenance request not found:", data.request_id);
          return {
            statusCode: 404,
            body: JSON.stringify({ error: "Maintenance request not found" }),
          };
        }

        // ✅ Parse mảng thiết bị
        let unitIds = [];
        try {
          unitIds = Array.isArray(request.equipment_unit_id)
            ? request.equipment_unit_id
            : JSON.parse(request.equipment_unit_id || "[]");
        } catch {
          unitIds = [request.equipment_unit_id];
        }

        console.log("🧩 Creating maintenance for units:", unitIds);

        const blockedStatuses = [
          "Inactive",
          "In Progress",
          "Ready",
          "Failed",
          "Disposed",
          "Moving",
        ];
        const createdMaintenances = [];
        for (const uid of unitIds) {
          // 🔍 Lấy thông tin thiết bị
          const unit = await equipmentUnitRepository.findById(uid);
          if (!unit) {
            console.warn(`⚠️ Unit ${uid} not found, skipping`);
            continue;
          }

          // 🚫 Nếu thiết bị đang ở trạng thái không hợp lệ → bỏ qua
          if (blockedStatuses.includes(unit.status)) {
            console.warn(
              `⏩ Skipping unit ${uid} - current status "${unit.status}" (already handled manually)`
            );
            continue;
          }

          const userId =
            request.confirmed_by || request.candidate_tech_id || null;

          // Tạo maintenance thật
          const newItem = await maintenanceRepository.create({
            equipment_unit_id: uid,
            branch_id: request.branch_id,
            user_id: userId,
            assigned_by: request.assigned_by,
            maintenance_reason: request.maintenance_reason,
            maintenance_request_id: request.id,
            start_date: new Date().toISOString(),
          });

          // Cập nhật trạng thái thiết bị
          await equipmentUnitRepository.update(uid, { status: "In Progress" });

          createdMaintenances.push(newItem);
        }

        // Nếu không có thiết bị nào được tạo → không chuyển request sang executed
        if (createdMaintenances.length === 0) {
          console.warn(
            `⚠️ AUTO_MAINTENANCE_FROM_REQUEST skipped all units (no eligible equipment)`
          );
          return {
            statusCode: 200,
            body: JSON.stringify({
              message:
                "No eligible equipment for AUTO_MAINTENANCE_FROM_REQUEST (all were handled already)",
              request_id: request.id,
            }),
          };
        }

        // Cập nhật lại request thành executed
        await maintenanceRequestRepository.update(request.id, {
          status: "executed",
          converted_maintenance_id: createdMaintenances.map((m) => m.id),
        });

        // Gửi thông báo
        try {
          const admins = await userService.getUsersByRoles([
            "admin",
            "super-admin",
          ]);
          const technicians = await userService.getUsersByRoles(["technician"]);
          const allRecipients = [
            ...admins,
            ...technicians.filter((t) => !admins.some((a) => a.sub === t.sub)),
          ];

          await notificationService.notifyMaintenanceRequestStarted(
            {
              ...request,
              message: `Các thiết bị hợp lệ trong yêu cầu này đã chuyển sang trạng thái bảo trì.`,
            },
            allRecipients,
            request.confirmed_by
          );
        } catch (e) {
          console.warn(
            "⚠️ notify AUTO_MAINTENANCE_FROM_REQUEST failed:",
            e?.message
          );
        }

        console.log(
          `✅ AUTO_MAINTENANCE_FROM_REQUEST completed: ${createdMaintenances.length} items created`
        );

        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            created_count: createdMaintenances.length,
            request_id: request.id,
          }),
        };
      }

      // ⚙️ Xử lý REMINDER_MAINTENANCE
      if (data?.type === "REMINDER_MAINTENANCE") {
        console.log("🔔 Reminder maintenance event received:", data);

        // Gửi mail
        const equipment = await equipmentRepository.findById(data.equipment_id);
        const admins = await userService.getUsersByRoles([
          "admin",
          "super-admin",
        ]);

        await notificationService.notifyMaintenanceReminder(
          {
            equipment_id: data.equipment_id,
            equipment_name: equipment?.name,
            next_maintenance_date: data.next_maintenance_date,
            frequency: data.frequency,
          },
          admins
        );

        // 🔁 Advance plan & reschedule
        const plan = await maintenancePlanRepository.findById(data.plan_id);
        if (plan) {
          await advanceAndReschedule(plan);
        }

        return {
          statusCode: 200,
          body: JSON.stringify({ message: "Reminder sent & rescheduled" }),
        };
      }

      console.log(
        "⚠️ Not an AUTO_MAINTENANCE or REMINDER_MAINTENANCE event:",
        data
      );
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "No maintenance action performed" }),
      };
    }

    // 🌐 4️⃣ Nếu không phải EventBridge → xử lý request API bình thường
    return await expressHandler(event, context);
  } catch (err) {
    console.error("❌ Lỗi trong Lambda handler:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
