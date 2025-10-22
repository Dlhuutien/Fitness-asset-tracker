const equipmentRepository = require("../repositories/equipmentRepository");
const invoiceRepository = require("../repositories/invoiceRepository");
const equipmentUnitRepository = require("../repositories/equipmentUnitRepository");
const invoiceDetailRepository = require("../repositories/invoiceDetailRepository");
const branchRepository = require("../repositories/branchRepository");
const countRepository = require("../repositories/countRepository");
const userRepository = require("../repositories/userRepository");

const invoiceService = {
  createInvoice: async (data) => {
    if (!data.user_id || !data.items) {
      throw new Error("user_id and items are required");
    }

    const branch_id = data.items[0]?.branch_id;
    if (!branch_id) {
      throw new Error("branch_id is required in at least one item");
    }

    // 1. Tạo invoice trước (chưa có total)
    const invoice = await invoiceRepository.create({
      user_id: data.user_id,
      branch_id,
      total: 0,
    });

    let total = 0;
    const details = [];

    // 2. Loop qua items
    for (const item of data.items) {
      const { equipment_id, branch_id, quantity, cost, warranty_duration } = item;

      // Check branch tồn tại
      const branch = await branchRepository.findById(branch_id);
      if (!branch) {
        throw new Error(`Branch ${branch_id} not found`);
      }

      // Check equipment tồn tại
      const equipment = await equipmentRepository.findById(equipment_id);
      if (!equipment) {
        throw new Error(`Equipment ${equipment_id} not found`);
      }

      // Lấy warranty_duration từ body (ưu tiên) hoặc default = 0
      const duration = Number(warranty_duration) || 0;

      // Đảm bảo Count record tồn tại cho equipment_id
      let countRecord = await countRepository.findById(equipment_id);
      if (!countRecord) {
        countRecord = await countRepository.create(equipment_id);
      }

      for (let i = 0; i < quantity; i++) {
        // Tăng count trong DB
        const updatedCount = await countRepository.increment(equipment_id, 1);

        // Sinh unitId mới theo count
        const unitId = `${equipment_id}-${updatedCount.count}`;

        // 2.1 Tạo equipment_unit
        const unit = await equipmentUnitRepository.create({
          id: unitId,
          equipment_id,
          branch_id,
          cost,
          warranty_duration: duration,
          description: "Imported via invoice",
          status: "In Stock",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          warranty_start_date: new Date().toISOString(),
          warranty_end_date: new Date(
            new Date().setFullYear(new Date().getFullYear() + duration)
          ).toISOString(),
        });

        // 2.2 Tạo invoice_detail
        const detail = await invoiceDetailRepository.create({
          invoice_id: invoice.id,
          equipment_unit_id: unit.id,
          cost,
        });

        details.push(detail);
        total += cost;
      }
    }

    // 3. Update total vào invoice
    const updatedInvoice = await invoiceRepository.update(invoice.id, {
      total,
    });

    return {
      invoice: updatedInvoice,
      details,
    };
  },

  getInvoices: async (branchFilter = null) => {
    // 🔍 Nếu có filter chi nhánh → query theo GSI
    const invoices = branchFilter
      ? await invoiceRepository.findByBranch(branchFilter)
      : await invoiceRepository.findAll();

    const result = [];

    for (const inv of invoices) {
      let userName = "Chưa có thông tin";

      if (inv.user_id) {
        try {
          const user = await userRepository.getUserBySub(inv.user_id);
          userName =
            user?.attributes?.name ||
            user?.UserAttributes?.find(
              (a) => a.Name === "name" || a.Name === "custom:name"
            )?.Value ||
            user?.username ||
            user?.Username ||
            "Chưa có thông tin";
        } catch (err) {
          console.warn(`⚠️ Không lấy được user ${inv.user_id}:`, err.message);
        }
      }

      result.push({
        ...inv,
        user_name: userName,
      });
    }

    return result;
  },

  getInvoiceById: async (id) => {
    const invoice = await invoiceRepository.findById(id);
    if (!invoice) throw new Error("Invoice not found");

    let userName = "Chưa có thông tin";

    if (invoice.user_id) {
      try {
        const user = await userRepository.getUserBySub(invoice.user_id);

        userName =
          user?.attributes?.name ||
          user?.UserAttributes?.find(
            (a) => a.Name === "name" || a.Name === "custom:name"
          )?.Value ||
          user?.username ||
          user?.Username ||
          "Chưa có thông tin";
      } catch (err) {
        console.warn(`⚠️ Không lấy được user ${invoice.user_id}:`, err.message);
      }
    }

    return { ...invoice, user_name: userName };
  },

  updateInvoice: async (id, data) => {
    const existing = await invoiceRepository.findById(id);
    if (!existing) throw new Error("Invoice not found");
    return await invoiceRepository.update(id, data);
  },

  deleteInvoice: async (id) => {
    const existing = await invoiceRepository.findById(id);
    if (!existing) throw new Error("Invoice not found");
    return await invoiceRepository.delete(id);
  },

  // ======================================================
  // LẤY CHI TIẾT CỦA 1 HÓA ĐƠN
  // ======================================================
  getInvoiceDetails: async (invoiceId) => {
    const invoice = await invoiceRepository.findById(invoiceId);
    if (!invoice) throw new Error("Invoice not found");

    // Lấy tên người tạo hóa đơn
    let userName = "Chưa có thông tin";
    if (invoice.user_id) {
      try {
        const user = await userRepository.getUserBySub(invoice.user_id);
        userName =
          user?.attributes?.name ||
          user?.UserAttributes?.find(
            (a) => a.Name === "name" || a.Name === "custom:name"
          )?.Value ||
          user?.username ||
          user?.Username ||
          "Chưa có thông tin";
      } catch (err) {
        console.warn(`⚠️ Không lấy được user ${invoice.user_id}:`, err.message);
      }
    }

    // 🧩 Lấy chi tiết + thông tin thiết bị
    const details = await invoiceDetailRepository.findByInvoiceId(invoiceId);
    const detailsWithUnits = [];

    for (const d of details) {
      const unit = await equipmentUnitRepository.findById(d.equipment_unit_id);

      let equipmentName = "Chưa có thông tin";
      if (unit?.equipment_id) {
        const eq = await equipmentRepository.findById(unit.equipment_id);
        equipmentName = eq?.name || "Chưa có thông tin";
      }

      detailsWithUnits.push({
        ...d,
        equipment_name: equipmentName,
        equipment_unit: {
          ...unit,
          equipment_name: equipmentName,
        },
      });
    }

    return {
      invoice: { ...invoice, user_name: userName },
      details: detailsWithUnits,
    };
  },

  // ======================================================
  // ⚡ LẤY TOÀN BỘ CHI TIẾT HÓA ĐƠN (TỐI ƯU SONG SONG + BATCH)
  // ======================================================
  getAllInvoiceDetails: async (branchFilter = null) => {
    console.time("⚡ getAllInvoiceDetails total");

    // 1️⃣ Lấy invoice theo chi nhánh (nếu có)
    const invoices = branchFilter
      ? await invoiceRepository.findByBranch(branchFilter)
      : await invoiceRepository.findAll();
    if (!invoices.length) return [];

    // 2️⃣ Lấy toàn bộ invoice_detail 1 lần
    const allDetails = await invoiceDetailRepository.findAll();
    if (!allDetails.length) return [];

    // 3️⃣ Gom map nhanh để tra invoice_id → invoice
    const invoiceMap = Object.fromEntries(invoices.map((i) => [i.id, i]));

    // 4️⃣ Gom tất cả user_id từ invoices (loại trùng)
    const userSubs = [
      ...new Set(invoices.map((i) => i.user_id).filter(Boolean)),
    ];

    // Song song lấy toàn bộ user
    const users = await Promise.all(
      userSubs.map((sub) => userRepository.getUserBySub(sub))
    );
    const userMap = Object.fromEntries(userSubs.map((s, i) => [s, users[i]]));

    // 5️⃣ Gom toàn bộ equipment_unit_id từ chi tiết
    const unitIds = [...new Set(allDetails.map((d) => d.equipment_unit_id))];
    const units = unitIds.length
      ? await equipmentUnitRepository.batchFindByIds(unitIds)
      : [];

    // Gom equipment_id để lấy tên thiết bị
    const equipmentIds = [...new Set(units.map((u) => u.equipment_id))];
    const equipments = equipmentIds.length
      ? await equipmentRepository.batchFindByIds(equipmentIds)
      : [];

    // Tạo map lookup
    const unitMap = Object.fromEntries(units.map((u) => [u.id, u]));
    const equipmentMap = Object.fromEntries(equipments.map((e) => [e.id, e]));

    // 6️⃣ Kết hợp dữ liệu cực nhanh O(1)
    const combined = allDetails
      .map((detail) => {
        const invoice = invoiceMap[detail.invoice_id];
        if (!invoice) return null;

        const user = userMap[invoice.user_id];
        const userName =
          user?.attributes?.name ||
          user?.UserAttributes?.find(
            (a) => a.Name === "name" || a.Name === "custom:name"
          )?.Value ||
          user?.username ||
          user?.Username ||
          "Chưa có thông tin";

        const unit = unitMap[detail.equipment_unit_id];
        const eq = unit ? equipmentMap[unit.equipment_id] : null;
        const equipmentName = eq?.name || "Chưa có thông tin";

        return {
          invoice: {
            id: invoice.id,
            total: invoice.total,
            user_id: invoice.user_id,
            created_at: invoice.created_at,
            updated_at: invoice.updated_at,
            user_name: userName,
          },
          detail: {
            ...detail,
            equipment_name: equipmentName,
            equipment_unit: unit
              ? { ...unit, equipment_name: equipmentName }
              : null,
          },
        };
      })
      .filter(Boolean);

    // 7️⃣ Sắp xếp theo ngày tạo mới nhất
    combined.sort(
      (a, b) =>
        new Date(b.invoice.created_at || 0) -
        new Date(a.invoice.created_at || 0)
    );

    console.timeEnd("⚡ getAllInvoiceDetails total");
    return combined;
  },
};

module.exports = invoiceService;
