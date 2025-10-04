require("dotenv").config();
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { s3 } = require("../utils/aws-helper");

const randomString = (numberCharacter) => {
  return `${Math.random().toString(36).substring(2, numberCharacter + 2)}`;
};

const FILE_TYPE_MATCH = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "video/mp3",
  "video/mp4",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.rar",
  "application/zip",
];

const uploadFile = async (file) => {
  const filePath = `${randomString(4)}-${Date.now()}-${file?.originalname}`;

  if (FILE_TYPE_MATCH.indexOf(file.mimetype) === -1) {
    throw new Error(`${file?.originalname} is invalid!`);
  }

  const uploadParams = {
    Bucket: process.env.BUCKET_NAME,
    Key: filePath,
    Body: file?.buffer,
    ContentType: file?.mimetype,
  };

  try {
    await s3.send(new PutObjectCommand(uploadParams));

    console.log(`File uploaded successfully: ${filePath}`);

    // Nếu bạn dùng CloudFront thì nên trả về link qua CF
    return `${process.env.CLOUDFRONT_URL}${filePath}`;
  } catch (err) {
    console.error("Error uploading file to AWS S3:", err);
    throw new Error("Upload file to AWS S3 failed");
  }
};

module.exports = { uploadFile };
