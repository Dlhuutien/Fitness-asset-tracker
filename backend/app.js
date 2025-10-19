const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const branchRoutes = require("./routes/branchRoutes");
const vendorRoutes = require("./routes/vendorRoutes");
const categoryMainRoutes = require("./routes/categoryMainRoutes");
const categoryTypeRoutes = require("./routes/categoryTypeRoutes");
const equipmentRoutes = require("./routes/equipmentRoutes");
const attributeRoutes = require('./routes/attributeRoutes');
const attributeValueRoutes = require('./routes/attributeValueRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const equipmentUnitRoutes = require('./routes/equipmentUnitRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const equipmentTransferRoutes = require("./routes/equipmentTransferRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const equipmentDisposalRoutes = require("./routes/equipmentDisposalRoutes");

const app = express();
app.use(cors());
// app.use(bodyParser.json());
// Tăng giới hạn body để tránh PayloadTooLargeError
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));


app.use('/auth', authRoutes);
app.use('/user', userRoutes); // /me, /admin-only,...

// Health check
app.get('/health', (req, res) => res.send('OK'));

app.use("/branch", branchRoutes);
app.use("/vendor", vendorRoutes);
app.use("/categoryMain", categoryMainRoutes);
app.use("/categoryType", categoryTypeRoutes);
app.use("/equipment", equipmentRoutes);
app.use("/attribute", attributeRoutes);
app.use("/attributeValue", attributeValueRoutes);
app.use("/invoice", invoiceRoutes);
app.use("/equipmentUnit", equipmentUnitRoutes);
app.use("/maintenance", maintenanceRoutes);
app.use("/equipmentTransfer", equipmentTransferRoutes);
app.use("/notification", notificationRoutes);
app.use("/disposal", equipmentDisposalRoutes);

module.exports = app;