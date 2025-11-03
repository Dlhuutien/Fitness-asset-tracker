/**
 * 🕒 Chuyển đổi frequency (ví dụ: "3_days", "2_weeks", "1_month") → AWS EventBridge rate()
 * @param {string} frequency - Chuỗi tần suất (ví dụ: "3_days", "5_minutes", "1_months")
 * @returns {string} ScheduleExpression hợp lệ cho AWS (ví dụ: "rate(3 days)")
 */
function parseFrequencyToRate(frequency) {
  if (!frequency || typeof frequency !== "string") return "rate(7 days)";

  let freq = frequency.trim().toLowerCase();

  // Regex: tách số và đơn vị (minutes, hours, days, weeks, months, years)
  const match = freq.match(
    /(\d+)\s*(_|\s)*(minute|minutes|hour|hours|day|days|week|weeks|month|months|year|years)/
  );
  if (match) {
    const num = match[1];
    let unit = match[3];

    // AWS không hỗ trợ "month"/"year" → fallback
    if (unit.startsWith("month")) return `rate(${num * 30} days)`;
    if (unit.startsWith("year")) return `rate(${num * 365} days)`;

    // ⚙️ Fix: nếu số > 1 mà chưa có 's', thêm vào để AWS hiểu đúng cú pháp
    if (parseInt(num) > 1 && !unit.endsWith("s")) {
      unit = unit + "s";
    }

    const result = `rate(${num} ${unit})`;
    console.log(`⏱️ [Scheduler] Frequency '${frequency}' → ${result}`);
    return result;
  }

  // Alias phổ biến
  if (["daily", "day"].includes(freq)) return "rate(1 day)";
  if (["weekly", "week"].includes(freq)) return "rate(7 days)";
  if (["monthly", "month"].includes(freq)) return "rate(30 days)";
  if (["yearly", "year"].includes(freq)) return "rate(365 days)";

  // Special test mode
  if (freq.includes("3m")) return "rate(3 minutes)";

  // Fallback mặc định
  console.log(
    `⚠️ [Scheduler] Frequency '${frequency}' không hợp lệ → fallback rate(7 days)`
  );
  return "rate(7 days)";
}

/**
 * 🔁 Tính ngày kế tiếp dựa trên tần suất (frequency)
 * @param {string} iso - ISO date (vd: "2025-11-03T17:30:00Z")
 * @param {string} frequency - Chuỗi frequency (vd: "3_days", "2_weeks", "1_month", "daily")
 * @returns {string} ISO string của ngày kế tiếp
 */
function nextDateByFrequency(iso, frequency) {
  if (!iso) throw new Error("Missing ISO date input");
  const d = new Date(iso);
  if (!frequency || typeof frequency !== "string") {
    d.setMonth(d.getMonth() + 3);
    return d.toISOString();
  }

  const freq = frequency.trim().toLowerCase();

  // 🧩 Tự động parse dạng "3_days", "2_weeks", "1_months", "5_minutes"
  const match = freq.match(
    /(\d+)\s*(_|\s)*(minute|minutes|hour|hours|day|days|week|weeks|month|months|year|years)/
  );

  if (match) {
    const num = parseInt(match[1], 10);
    const unit = match[3];

    switch (true) {
      case unit.startsWith("minute"):
        d.setMinutes(d.getMinutes() + num);
        break;
      case unit.startsWith("hour"):
        d.setHours(d.getHours() + num);
        break;
      case unit.startsWith("day"):
        d.setDate(d.getDate() + num);
        break;
      case unit.startsWith("week"):
        d.setDate(d.getDate() + num * 7);
        break;
      case unit.startsWith("month"):
        d.setMonth(d.getMonth() + num);
        break;
      case unit.startsWith("year"):
        d.setFullYear(d.getFullYear() + num);
        break;
    }

    return d.toISOString();
  }

  // 🧠 Alias thân thiện
  if (["daily", "day"].includes(freq)) {
    d.setDate(d.getDate() + 1);
  } else if (["weekly", "week"].includes(freq)) {
    d.setDate(d.getDate() + 7);
  } else if (["monthly", "month"].includes(freq)) {
    d.setMonth(d.getMonth() + 1);
  } else if (freq.includes("3m")) {
    d.setMinutes(d.getMinutes() + 3); // test mode
  } else {
    d.setMonth(d.getMonth() + 3); // fallback an toàn
  }

  return d.toISOString();
}

/**
 * 🧠 Định dạng frequency ra tiếng Việt thân thiện
 * @param {string} frequency - Chuỗi frequency (vd: "3_days", "2_weeks", "daily")
 * @returns {string} - Chuỗi tiếng Việt mô tả (vd: "3 ngày/lần", "2 tuần/lần", "hàng ngày")
 */
function formatFrequencyLabel(frequency) {
  if (!frequency) return "Không xác định";
  const freq = frequency.trim().toLowerCase();

  // Nếu có số + đơn vị
  const match = freq.match(
    /(\d+)\s*(_|\s)*(minute|minutes|hour|hours|day|days|week|weeks|month|months|year|years)/
  );
  if (match) {
    const num = match[1];
    let unit = match[3];
    const unitVN =
      {
        minute: "phút",
        minutes: "phút",
        hour: "giờ",
        hours: "giờ",
        day: "ngày",
        days: "ngày",
        week: "tuần",
        weeks: "tuần",
        month: "tháng",
        months: "tháng",
        year: "năm",
        years: "năm",
      }[unit] || unit;
    return `${num} ${unitVN}/lần`;
  }

  // Alias thân thiện
  if (["daily", "day"].includes(freq)) return "Hàng ngày";
  if (["weekly", "week"].includes(freq)) return "Hàng tuần";
  if (["monthly", "month"].includes(freq)) return "Hàng tháng";
  if (freq.includes("3m")) return "Mỗi 3 phút (test)";
  return "Không xác định";
}

module.exports = {
  parseFrequencyToRate,
  nextDateByFrequency,
  formatFrequencyLabel,
};
