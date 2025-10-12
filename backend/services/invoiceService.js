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

    // 1. Tạo invoice trước (chưa có total)
    const invoice = await invoiceRepository.create({
      user_id: data.user_id,
      total: 0,
    });

    let total = 0;
    const details = [];

    // 2. Loop qua items
    for (const item of data.items) {
      const { equipment_id, branch_id, quantity, cost } = item;

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

      // Lấy warranty_duration từ equipment
      const warranty_duration = Number(equipment.warranty_duration) || 0;

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
          description: "Imported via invoice",
          status: "In Stock",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          warranty_start_date: new Date().toISOString(),
          warranty_end_date: new Date(
            new Date().setFullYear(new Date().getFullYear() + warranty_duration)
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

  getInvoices: async () => {
    const invoices = await invoiceRepository.findAll();
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
  // LẤY TOÀN BỘ CHI TIẾT HÓA ĐƠN (/invoice/details)
  // ======================================================
  getAllInvoiceDetails: async () => {
    const invoices = await invoiceRepository.findAll();
    const allDetails = await invoiceDetailRepository.findAll();
    const combined = [];

    for (const detail of allDetails) {
      const invoice = invoices.find((inv) => inv.id === detail.invoice_id);
      if (!invoice) continue;

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
          console.warn(
            `⚠️ Không lấy được user ${invoice.user_id}:`,
            err.message
          );
        }
      }

      // 🧩 Lấy thông tin thiết bị
      const unit = await equipmentUnitRepository.findById(
        detail.equipment_unit_id
      );

      let equipmentName = "Chưa có thông tin";
      if (unit?.equipment_id) {
        const eq = await equipmentRepository.findById(unit.equipment_id);
        equipmentName = eq?.name || "Chưa có thông tin";
      }

      // ✅ Cấu trúc chuẩn có thêm equipment_name
      combined.push({
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
          equipment_unit: {
            ...unit,
            equipment_name: equipmentName,
          },
        },
      });
    }

    // 🔄 Sắp xếp mới nhất
    combined.sort(
      (a, b) =>
        new Date(b.invoice.created_at || 0) -
        new Date(a.invoice.created_at || 0)
    );

    return combined;
  },
};

module.exports = invoiceService;
