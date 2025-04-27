// =============================================
// 🔌 DEPENDENCIAS Y CONFIGURACIÓN INICIAL
// =============================================
const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");
const { conectarDB} = require("../conexion1");
require("dotenv").config();
const cron = require("node-cron");
const fs = require("fs").promises; 
let db;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use((req, res, next) => {
  req.db = db;
  next();
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Algo salió mal en el servidor!");
});

// ✅ Importa todas las rutas desde `routes/index.js`
const rutas = require("./ROUTES");
app.use("/api", rutas);

// Conexión y servidor
(async () => {
  try {
    db = await conectarDB();
    console.log("✅ Conectado correctamente a MongoDB Atlas");

    const collections = await db.listCollections().toArray();
    console.log("📌 Colecciones disponibles:", collections.map(c => c.name));

    // Cron diario 3 AM
    cron.schedule("0 3 * * *", async () => {
      console.log("🧹 Ejecutando limpieza automática de historiales...");
      try {
        const historialCollection = db.collection("HistorialUsuario");
        const primerosMovimientos = await historialCollection.aggregate([
          { $sort: { fecha: 1 } },
          {
            $group: {
              _id: "$usuario_id",
              primerMovimiento: { $first: "$fecha" },
            },
          },
          {
            $match: {
              primerMovimiento: {
                $lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              },
            },
          },
        ]).toArray();

        const idsUsuariosAEliminar = primerosMovimientos.map((m) => m._id);

        if (idsUsuariosAEliminar.length > 0) {
          const result = await historialCollection.deleteMany({
            usuario_id: { $in: idsUsuariosAEliminar },
          });
          console.log(`🗑️ ${result.deletedCount} historiales eliminados.`);
        } else {
          console.log("📦 No hay historiales para eliminar hoy.");
        }
      } catch (err) {
        console.error("❌ Error ejecutando cron:", err);
      }
    });

    // Iniciar servidor
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error("❌ Error al conectar a la base de datos:", err);
    process.exit(1);
  }
})();
