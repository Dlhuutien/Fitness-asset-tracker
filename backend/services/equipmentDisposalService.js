const equipmentDisposalRepository = require("../repositories/equipmentDisposalRepository");
const equipmentDisposalDetailRepository = require("../repositories/equipmentDisposalDetailRepository");
const equipmentUnitRepository = require("../repositories/equipmentUnitRepository");
const equipmentRepository = require("../repositories/equipmentRepository");
const branchRepository = require("../repositories/branchRepository");
const userRepository = require("../repositories/userRepository");

const equipmentDisposalService = {
  createDisposal: async (data) => {
    const { user_id, branch_id, note, items } = data;
    if (!items?.length)
      throw new Error("Danh sách thiết bị không được để trống");

    const branch = await branchRepository.findById(branch_id);
    if (!branch) throw new Error("Chi nhánh không tồn tại");

    // 1️⃣ Tạo disposal chính
    const disposal = await equipmentDisposalRepository.create({
      user_id,
      branch_id,
      note,
    });

    let total = 0;
    const details = [];

    // 2️⃣ Tạo chi tiết
    for (const item of items) {
      const unit = await equipmentUnitRepository.findById(
        item.equipment_unit_id
      );
      if (!unit)
        throw new Error(`Thiết bị ${item.equipment_unit_id} không tồn tại`);

      const equipment = await equipmentRepository.findById(unit.equipment_id);
      const costOriginal = equipment?.cost || unit?.cost || 0;

      // Update trạng thái thiết bị
      await equipmentUnitRepository.update(item.equipment_unit_id, {
        status: "Disposed",
        description: `Đã thanh lý (${note || ""})`,
      });

      const detail = await equipmentDisposalDetailRepository.create({
        disposal_id: disposal.id,
        equipment_unit_id: item.equipment_unit_id,
        value_recovered: item.value_recovered || 0,
      });

      details.push({
        ...detail,
        equipment_name: equipment?.name || "Chưa có thông tin",
        cost_original: costOriginal,
      });

      total += Number(item.value_recovered || 0);
    }

    // 3️⃣ Cập nhật tổng tiền
    const updated = await equipmentDisposalRepository.updateTotal(
      disposal.id,
      total
    );

    return { ...updated, details };
  },

  // 🧩 Lấy tất cả đợt thanh lý (kèm chi tiết)
  getAll: async (branchFilter = null) => {
    console.time("⚡ getAll disposals total");

    // 1️⃣ Lấy tất cả disposal và chi tiết song song
    const [disposals, allDetails] = await Promise.all([
      branchFilter
        ? equipmentDisposalRepository.findByBranch(branchFilter)
        : equipmentDisposalRepository.findAll(),
      equipmentDisposalDetailRepository.findAll(),
    ]);

    if (!disposals.length) return [];

    // 2️⃣ Gom ID cần thiết
    const userIds = [
      ...new Set(disposals.map((d) => d.user_id).filter(Boolean)),
    ];
    const branchIds = [
      ...new Set(disposals.map((d) => d.branch_id).filter(Boolean)),
    ];

    // Gom tất cả unit_id từ detail
    const disposalIds = new Set(disposals.map((d) => d.id));
    const relatedDetails = allDetails.filter((det) =>
      disposalIds.has(det.disposal_id)
    );

    const unitIds = [
      ...new Set(relatedDetails.map((d) => d.equipment_unit_id)),
    ];

    // 3️⃣ Lấy user, branch, unit song song
    const [users, branches, units] = await Promise.all([
      Promise.all(userIds.map((id) => userRepository.getUserBySub(id))),
      Promise.all(branchIds.map((id) => branchRepository.findById(id))),
      unitIds.length ? equipmentUnitRepository.batchFindByIds(unitIds) : [],
    ]);

    // Map hóa
    const userMap = Object.fromEntries(userIds.map((id, i) => [id, users[i]]));
    const branchMap = Object.fromEntries(branches.map((b) => [b.id, b]));
    const unitMap = Object.fromEntries(units.map((u) => [u.id, u]));

    // Gom tất cả equipment_id
    const equipmentIds = [...new Set(units.map((u) => u.equipment_id))];
    const equipments = equipmentIds.length
      ? await equipmentRepository.batchFindByIds(equipmentIds)
      : [];
    const equipmentMap = Object.fromEntries(equipments.map((e) => [e.id, e]));

    // Gom detail theo disposal_id
    const detailMap = {};
    for (const det of relatedDetails) {
      if (!detailMap[det.disposal_id]) detailMap[det.disposal_id] = [];
      const unit = unitMap[det.equipment_unit_id];
      const eq = unit ? equipmentMap[unit.equipment_id] : null;

      detailMap[det.disposal_id].push({
        ...det,
        equipment_name: eq?.name || "Chưa có thông tin",
        cost_original: eq?.cost || unit?.cost || 0,
      });
    }

    // 4️⃣ Tạo result
    const result = disposals.map((d) => {
      const user = userMap[d.user_id];
      const branch = branchMap[d.branch_id];

      const userName =
        user?.attributes?.name ||
        user?.UserAttributes?.find(
          (a) => a.Name === "name" || a.Name === "custom:name"
        )?.Value ||
        user?.username ||
        user?.Username ||
        "Chưa có thông tin";

      return {
        ...d,
        user_name: userName,
        branch_name: branch?.name || d.branch_id,
        details: detailMap[d.id] || [],
      };
    });

    // 5️⃣ Sort theo ngày mới nhất
    result.sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    );

    console.timeEnd("⚡ getAll disposals total");
    return result;
  },

  // 🧰 Lấy chi tiết 1 đợt thanh lý
  getById: async (id) => {
    const disposal = await equipmentDisposalRepository.findById(id);
    if (!disposal) throw new Error("Không tìm thấy đợt thanh lý");

    // 1️⃣ Lấy tên người thực hiện
    let userName = "Chưa có thông tin";
    try {
      const user = await userRepository.getUserBySub(disposal.user_id);
      userName =
        user?.attributes?.name ||
        user?.UserAttributes?.find(
          (a) => a.Name === "name" || a.Name === "custom:name"
        )?.Value ||
        user?.username ||
        user?.Username ||
        "Chưa có thông tin";
    } catch {}

    // 2️⃣ Lấy tên chi nhánh
    const branch = await branchRepository.findById(disposal.branch_id);
    const branchName = branch?.name || disposal.branch_id;

    // 3️⃣ Lấy chi tiết thiết bị
    const details = await equipmentDisposalDetailRepository.findByDisposalId(
      id
    );
    const detailsWithInfo = [];

    for (const d of details) {
      const unit = await equipmentUnitRepository.findById(d.equipment_unit_id);
      let equipmentName = "Chưa có thông tin";
      let costOriginal = 0;

      if (unit?.equipment_id) {
        const eq = await equipmentRepository.findById(unit.equipment_id);
        equipmentName = eq?.name || "Chưa có thông tin";
        costOriginal = eq?.cost || unit?.cost || 0;
      }

      detailsWithInfo.push({
        ...d,
        equipment_name: equipmentName,
        cost_original: costOriginal,
      });
    }

    return {
      ...disposal,
      user_name: userName,
      branch_name: branchName,
      details: detailsWithInfo,
    };
  },
};

module.exports = equipmentDisposalService;
