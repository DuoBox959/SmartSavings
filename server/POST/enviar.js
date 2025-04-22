// server/POST/enviar.js
const express = require("express");
const router = express.Router();
const { ObjectId } = require("../conexion1"); // importa tu conexión
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/2025/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// 🎯 Aquí van todas las rutas POST (te doy ejemplos)
router.post("/api/login", async (req, res) => { /*...*/ });

router.post("/api/usuarios", async (req, res) => { /*...*/ });

router.post("/api/productos", upload.single("Imagen"), async (req, res) => { /*...*/ });

router.post("/api/productos-completos", upload.single("Imagen"), async (req, res) => { /*...*/ });

router.post("/api/precios", async (req, res) => { /*...*/ });

router.post("/api/supermercados", async (req, res) => { /*...*/ });

router.post("/api/proveedor", async (req, res) => { /*...*/ });

router.post("/api/descripcion", async (req, res) => { /*...*/ });

router.post("/api/opiniones", async (req, res) => { /*...*/ });

router.post("/api/historial", async (req, res) => { /*...*/ });

router.post("/api/datos-personales", async (req, res) => { /*...*/ });

module.exports = router;
