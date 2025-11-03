const app = require("./app");
const serverless = require("serverless-http");

// 🧱 Repositories
const equipmentUnitRepository = require("./repositories/equipmentUnitRepository");
const maintenanceRepository = require("./repositories/maintenanceRepository");
const equipmentRepository = require("./repositories/equipmentRepository");
const maintenancePlanRepository = require("./repositories/maintenancePlanRepository");

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
      event?.type === "AUTO_MAINTENANCE" ||
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

      // ⚙️ 2️⃣ Xử lý AUTO_MAINTENANCE
      if (data?.type === "AUTO_MAINTENANCE") {
        console.log(
          `🛠️ Auto maintenance started for equipment unit: ${data.equipment_unit_id}`
        );

        // 🔹 Cập nhật trạng thái thiết bị
        await equipmentUnitRepository.update(data.equipment_unit_id, {
          status: "In Progress",
        });

        // 🔹 Ghi start_date vào record maintenance tương ứng
        await maintenanceRepository.update(data.maintenance_id, {
          start_date: new Date().toISOString(),
        });

        console.log(
          `✅ Equipment ${data.equipment_unit_id} set to 'in progress'`
        );
        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            message: "Maintenance auto-started successfully",
          }),
        };
      }

      // ⚙️ 3️⃣ Xử lý REMINDER_MAINTENANCE
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
