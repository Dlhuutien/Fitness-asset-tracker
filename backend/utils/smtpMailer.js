const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendNoReplyEmail(to, subject, text) {
  const info = await transporter.sendMail({
    from: `"Fit X Gym" <${process.env.SMTP_USER}>`, // tên hiển thị
    to: Array.isArray(to) ? to.join(", ") : to,    // 1 hoặc nhiều người nhận
    subject,
    text,
  });

  console.log("Message sent: %s", info.messageId);
  return info;
}

module.exports = { sendNoReplyEmail };
