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
    const disposals = branchFilter
      ? await equipmentDisposalRepository.findByBranch(branchFilter)
      : await equipmentDisposalRepository.findAll();

    const result = [];

    for (const d of disposals) {
      // 1️⃣ Lấy tên người thực hiện
      let userName = "Chưa có thông tin";
      try {
        const user = await userRepository.getUserBySub(d.user_id);
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
      const branch = await branchRepository.findById(d.branch_id);
      const branchName = branch?.name || d.branch_id;

      // 3️⃣ Lấy danh sách thiết bị chi tiết
      const details = await equipmentDisposalDetailRepository.findByDisposalId(
        d.id
      );
      const detailsWithInfo = [];

      for (const det of details) {
        const unit = await equipmentUnitRepository.findById(
          det.equipment_unit_id
        );
        let equipmentName = "Chưa có thông tin";
        let costOriginal = 0;

        if (unit?.equipment_id) {
          const eq = await equipmentRepository.findById(unit.equipment_id);
          equipmentName = eq?.name || "Chưa có thông tin";
          costOriginal = eq?.cost || unit?.cost || 0;
        }

        detailsWithInfo.push({
          ...det,
          equipment_name: equipmentName,
          cost_original: costOriginal,
        });
      }

      result.push({
        ...d,
        user_name: userName,
        branch_name: branchName,
        details: detailsWithInfo,
      });
    }

    // 🔄 Sort theo ngày mới nhất
    result.sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    );

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
