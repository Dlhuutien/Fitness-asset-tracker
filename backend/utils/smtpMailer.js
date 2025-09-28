const nodemailer = require("nodemailer");
const { htmlToText } = require("html-to-text");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Gửi email No-Reply
 * @param {string|string[]} to - Người nhận
 * @param {string} subject - Tiêu đề
 * @param {string} html - Nội dung HTML
 */
async function sendNoReplyEmail(to, subject, html) {
  // auto convert html -> plain text fallback
  const info = await transporter.sendMail({
    from: `"FitX Gym" <${process.env.SMTP_USER}>`,
    to: Array.isArray(to) ? to.join(", ") : to,
    subject,
    html,
  });

  console.log("Message sent: %s", info.messageId);
  return info;
}

module.exports = { sendNoReplyEmail };
