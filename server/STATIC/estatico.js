const express = require("express");
const router = express.Router();
const path = require("path");

// 📦 Servir carpeta de imágenes
router.use("/uploads", express.static(path.join(__dirname, "../uploads")));

module.exports = router;
