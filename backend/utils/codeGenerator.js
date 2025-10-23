/**
 * =============================
 * Mã phát sinh tự động (Type Code)
 * =============================
 * Sinh mã code 2–3 ký tự chỉ gồm chữ, tránh trùng với các mã đã tồn tại.
 *
 * Ví dụ:
 *   - Cardio → CA
 *   - Strength → ST
 *   - Benches → BC
 *   - Strength Training → STT
 *   - Nếu trùng thì tự đổi sang mã khác (chỉ dùng chữ)
 */

function generateTypeCode(name, existingCodes = []) {
  if (!name) return "UNK";

  // Chuẩn hóa tên
  const cleaned = name.trim().toUpperCase().replace(/[^A-Z\s]/g, "");
  const words = cleaned.split(/\s+/);
  let baseCode = "";

  if (words.length > 1) {
    // Nếu có nhiều từ → lấy chữ cái đầu của mỗi từ
    baseCode = words.map((w) => w[0]).join("").slice(0, 3);
  } else {
    // Nếu chỉ có 1 từ → lấy 2 hoặc 3 ký tự đầu
    baseCode = cleaned.slice(0, 3);
  }

  // Nếu vẫn trùng, thử tạo biến thể
  let code = baseCode;
  const variations = [];

  // Thử lấy chữ đầu + giữa + cuối
  if (cleaned.length >= 3)
    variations.push(
      cleaned[0] +
        cleaned[Math.floor(cleaned.length / 2)] +
        cleaned[cleaned.length - 1]
    );

  // Đảo thứ tự chữ trong base
  variations.push(baseCode.split("").reverse().join(""));

  // Ghép chữ cái từ từ thứ 2 (nếu có)
  if (words.length > 1 && words[1].length > 1) {
    variations.push(words[0][0] + words[1].slice(0, 2));
    variations.push(words[0].slice(0, 2) + words[1][0]);
  }

  // Nếu vẫn trùng → random 1 chữ cái cuối
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let ch of alphabet) {
    variations.push(baseCode.slice(0, 2) + ch);
  }

  // Trả kết quả đầu tiên chưa tồn tại
  for (let variant of [baseCode, ...variations]) {
    if (!existingCodes.includes(variant)) {
      return variant;
    }
  }

  // Fallback cuối cùng nếu không còn mã nào
  return baseCode + String.fromCharCode(65 + Math.floor(Math.random() * 26));
}

/**
 * =============================
 * Tạo mã code thiết bị (Equipment ID)
 * =============================
 * Cấu trúc: $main$type-$nameCode
 * nameCode được sinh tự động theo tên (2–3 ký tự)
 */
function generateEquipmentCode({ mainId, typeId, name }, existingIds = []) {
  if ( !mainId || !typeId || !name) return "UNK";

  // 🔹 Sinh nameCode từ tên thiết bị
  const cleaned = name.trim().toUpperCase().replace(/[^A-Z0-9\s]/g, "");
  const words = cleaned.split(/\s+/);
  let nameCode = "";

  if (words.length > 1) {
    nameCode = words.map((w) => w[0]).join("").slice(0, 3);
  } else {
    nameCode = cleaned.slice(0, 3);
  }

  // 🔹 Ghép ID tổng thể
  let baseId = `${mainId}${typeId}-${nameCode}`;

  // 🔹 Nếu bị trùng → sinh biến thể
  if (existingIds.includes(baseId)) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let ch of alphabet) {
      const variant = `${mainId}${typeId}-${nameCode}${ch}`;
      if (!existingIds.includes(variant)) {
        return variant;
      }
    }
  }

  return baseId;
}

module.exports = { generateTypeCode, generateEquipmentCode };