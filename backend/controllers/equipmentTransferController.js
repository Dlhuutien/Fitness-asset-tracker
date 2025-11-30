const equipmentTransferService = require("../services/equipmentTransferService");
const notificationService = require("../services/notificationService");
const userService = require("../services/userService");

const equipmentTransferController = {
  createTransfer: async (req, res) => {
    try {
      const { unit_ids, to_branch_id, description, move_start_date } = req.body;

      const { transfer, details } =
        await equipmentTransferService.createTransfer(
          { unit_ids, to_branch_id, description, move_start_date },
          req.user.sub
        );

      const admins = await userService.getUsersByRoles([
        "admin",
        "super-admin",
      ]);
      await notificationService.notifyTransferCreated(
        transfer,
        details,
        admins,
        req.user.sub
      );

      res.status(201).json({ transfer, details });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getTransfers: async (req, res) => {
    try {
      const transfers = await equipmentTransferService.getTransfers(
        req.branchFilter
      );
      res.json(transfers);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getTransfersByStatus: async (req, res) => {
    try {
      const { status } = req.params;
      const transfers = await equipmentTransferService.getTransfersByStatus(
        status,
        req.branchFilter // ✅ truyền filter vào service
      );
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
      const { transfer, details } =
        await equipmentTransferService.completeTransfer(
          req.params.id,
          req.body.move_receive_date,
          req.user.sub
        );

      const admins = await userService.getUsersByRoles([
        "admin",
        "super-admin",
      ]);
      await notificationService.notifyTransferCompleted(
        transfer,
        details,
        admins,
        req.user.sub
      );

      res.json({ transfer, details });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  cancelTransfer: async (req, res) => {
    try {
      const { description } = req.body;

      const transfer = await equipmentTransferService.cancelTransfer(
        req.params.id,
        description,
        req.user.sub
      );

      res.json({ message: "Transfer cancelled", transfer });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  confirmCancelTransfer: async (req, res) => {
    try {
      const { transfer, details } =
        await equipmentTransferService.confirmCancelTransfer(
          req.params.id,
          req.user.sub
        );

      res.json({ message: "Transfer fully cancelled", transfer, details });
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
