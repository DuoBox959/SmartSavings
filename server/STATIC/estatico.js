// server/STATIC/estatico.js
const express = require("express");
const router = express.Router();
const path = require("path");

// 📌 Servir archivos estáticos desde la carpeta "uploads"
router.use("/uploads", express.static(path.join(__dirname, "uploads")));

module.exports = router;

