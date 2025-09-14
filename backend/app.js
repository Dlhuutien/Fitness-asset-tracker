const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');

const vendorRoutes = require("./routes/vendorRoutes");
const categoryMainRoutes = require("./routes/categoryMainRouters");
const categoryTypeRoutes = require("./routes/categoryTypeRoutes");
const equipmentRoutes = require("./routes/equipmentRoutes");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/', userRoutes); // /me, /admin-only,...

// Health check
app.get('/health', (req, res) => res.send('OK'));

app.use("/vendors", vendorRoutes);
app.use("/categoryMain", categoryMainRoutes);
app.use("/categoryType", categoryTypeRoutes);
app.use("/equipment", equipmentRoutes);

module.exports = app;