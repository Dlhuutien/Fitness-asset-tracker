const equipmentService = require("../services/equipmentService");
const { uploadFile } = require("../services/file.service");

const equipmentController = {
  createEquipment: async (req, res) => {
    try {
      let imageUrl = null;

      // Nếu có file upload => đẩy lên S3
      if (req.file) {
        imageUrl = await uploadFile(req.file);
      }

      const equipment = await equipmentService.createEquipment({
        ...req.body,
        image: imageUrl || req.body.image,
        attributes: req.body.attributes
          ? JSON.parse(req.body.attributes)
          : req.body.attributes,
      });

      res.status(201).json(equipment);
    } catch (error) {
      console.error("[CREATE EQUIPMENT ERROR]:", error);
      res.status(400).json({ error: error.message });
    }
  },

  getEquipments: async (req, res) => {
    try {
      const equipments = await equipmentService.getEquipments();
      res.json(equipments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getEquipmentById: async (req, res) => {
    try {
      const equipment = await equipmentService.getEquipmentById(req.params.id);
      res.json(equipment);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  updateEquipment: async (req, res) => {
    try {
      console.log("[UPDATE EQUIPMENT] Nhận request:");
      console.log("- Params ID:", req.params.id);
      console.log("- Body:", req.body);
      console.log(
        "- File:",
        req.file ? req.file.originalname : "Không có file"
      );

      // Lấy thiết bị cũ
      const oldEquipment = await equipmentService.getEquipmentById(
        req.params.id
      );

      let imageUrl = oldEquipment.image; // mặc định giữ ảnh cũ

      if (req.file) {
        console.log("Uploading new file...");
        imageUrl = await uploadFile(req.file);
        console.log("Uploaded file URL:", imageUrl);
      }

      // Parse attributes (tránh lỗi khi frontend gửi string)
      const parsedAttributes =
        typeof req.body.attributes === "string"
          ? JSON.parse(req.body.attributes)
          : req.body.attributes;

      // Cập nhật DB
      const equipment = await equipmentService.updateEquipment(req.params.id, {
        ...req.body,
        image: imageUrl,
        attributes: parsedAttributes,
      });

      console.log("Update thành công:", equipment);
      res.json(equipment);
    } catch (error) {
      console.error("[Error updating equipment]:", error);
      res.status(400).json({ error: error.message, stack: error.stack });
    }
  },

  deleteEquipment: async (req, res) => {
    try {
      await equipmentService.deleteEquipment(req.params.id);
      res.json({ message: "Equipment deleted" });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
  getByCategoryTypeId: async (req, res) => {
    try {
      const items = await equipmentService.getEquipmentsByCategoryTypeId(
        req.params.category_type_id
      );
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getByVendorId: async (req, res) => {
    try {
      const items = await equipmentService.getEquipmentsByVendorId(
        req.params.vendor_id
      );
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = equipmentController;
