// server/STATIC/estatico.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { conectarDB, ObjectId } = require("../conexion1");
(async () => {
  db = await conectarDB();
})();

// 📌 Servir archivos estáticos desde la carpeta "uploads"
// ⚠️ Esta línea es CLAVE
const path = require("path");
router.use("/uploads", express.static(path.join(__dirname, "uploads")));
module.exports = router;

let db;

// 📌 Configuración de almacenamiento para imágenes con Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/2025/"); // Carpeta donde se guardarán las imágenes
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Renombrar archivo con timestamp
  },
});

const upload = multer({ storage: storage });

