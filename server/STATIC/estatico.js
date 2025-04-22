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
// ✅ Función de utilidad para transformar el string a array de objetos
function parsearPrecioHistorico(input) {
  if (!input || typeof input !== "string") return [];

  const partes = input.split(",").map(e => e.trim());
  const resultado = [];

  for (let i = 0; i < partes.length - 1; i += 2) {
    const precio = parseFloat(partes[i]);
    const año = parseInt(partes[i + 1]);

    if (!isNaN(precio) && !isNaN(año)) {
      resultado.push({ precio, año });
    }
  }

  return resultado;
}
/**
 * ✅ Modificar un usuario existente (Update)
 * Ruta: PUT /api/usuarios/:id
 */
app.put("/api/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // ⚠️ Verificar si el ID es válido antes de convertirlo a ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID no válido" });
    }

    const objectId = new ObjectId(id);

    const updateData = {};
    if (req.body.nombre) updateData.nombre = req.body.nombre;
    if (req.body.pass) updateData.pass = req.body.pass;
    if (req.body.email) updateData.email = req.body.email;
    if (req.body.rol) updateData.rol = req.body.rol;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No se enviaron cambios" });
    }

    console.log("📤 Actualizando usuario en MongoDB:", updateData);

    const result = await db
      .collection("Usuarios")
      .updateOne({ _id: objectId }, { $set: updateData });

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({ error: "Usuario no encontrado o sin cambios" });
    }

    res.json({
      message: "Usuario actualizado correctamente",
      usuario: updateData,
    });
  } catch (err) {
    console.error("❌ Error actualizando usuario:", err);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
});