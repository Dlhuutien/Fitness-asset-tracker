const equipmentTransferService = require("../services/equipmentTransferService");

const equipmentTransferController = {
  createTransfer: async (req, res) => {
    try {
      const transfer = await equipmentTransferService.createTransfer(
        {
          equipment_unit_id: req.body.equipment_unit_id,
          to_branch_id: req.body.to_branch_id,
          description: req.body.description,
          move_start_date: req.body.move_start_date,
        },
        req.user.sub
      );

      res.status(201).json(transfer);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getTransfers: async (req, res) => {
    try {
      const transfers = await equipmentTransferService.getTransfers();
      res.json(transfers);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getTransferById: async (req, res) => {
    try {
      const transfer = await equipmentTransferService.getTransferById(
        req.params.id
      );
      res.json(transfer);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  completeTransfer: async (req, res) => {
    try {
      const transfer = await equipmentTransferService.completeTransfer(
        req.params.id,
        req.body.move_receive_date
      );
      res.json(transfer);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  deleteTransfer: async (req, res) => {
    try {
      await equipmentTransferService.deleteTransfer(req.params.id);
      res.json({ message: "EquipmentTransfer deleted successfully" });
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },
};

module.exports = equipmentTransferController;
