// server/STATIC/estatico.js
const express = require("express");
const router = express.Router();
const { ObjectId } = require("../conexion1");
const multer = require("multer");

// 📌 Servir archivos estáticos desde la carpeta "uploads"
// ⚠️ Esta línea es CLAVE
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
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