// =============================================
// 🔌 DEPENDENCIAS Y CONFIGURACIÓN INICIAL
// =============================================
require("dotenv").config();

const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");
const cron = require("node-cron");
const { conectarDB } = require("../conexion1");

let db;
let server;

// ---------- Middlewares base ----------
app.use(cors());
app.use(express.json());

// Archivos estáticos (imágenes subidas)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Inyecta la conexión en cada request (se asigna tras conectar)
app.use((req, res, next) => {
  req.db = db;
  next();
});

// ✅ Importa todas las rutas
const rutas = require("./ROUTES");
app.use("/api", rutas);

// Handler de errores SIEMPRE al final
app.use((err, req, res, next) => {
  console.error("💥 Unhandled error:", err);
  res.status(500).send("Algo salió mal en el servidor!");
});

// ---------- Conexión y arranque ----------
(async () => {
  try {
    db = await conectarDB();
    console.log("✅ Conectado correctamente a MongoDB Atlas");

    const collections = await db.listCollections().toArray();
    console.log("📌 Colecciones disponibles:", collections.map((c) => c.name));

    // Cron diario a las 03:00
    cron.schedule("0 3 * * *", async () => {
      console.log("🧹 Ejecutando limpieza automática de historiales...");
      try {
        const historial = db.collection("HistorialUsuario");
        const sieteDias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const primeros = await historial
          .aggregate([
            { $sort: { fecha: 1 } },
            { $group: { _id: "$usuario_id", primerMovimiento: { $first: "$fecha" } } },
            { $match: { primerMovimiento: { $lte: sieteDias } } },
          ])
          .toArray();

        const ids = primeros.map((m) => m._id);
        if (ids.length) {
          const { deletedCount } = await historial.deleteMany({ usuario_id: { $in: ids } });
          console.log(`🗑️ ${deletedCount} historiales eliminados.`);
        } else {
          console.log("📦 No hay historiales para eliminar hoy.");
        }
      } catch (err) {
        console.error("❌ Error ejecutando cron:", err);
      }
    });

    // Iniciar servidor
    const PORT = Number(process.env.PORT) || 3000;
    server = app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`❌ Puerto ${PORT} en uso. Cierra el proceso que lo ocupa o cambia PORT.`);
      } else {
        console.error("❌ Error del servidor HTTP:", err);
      }
      process.exit(1);
    });
  } catch (err) {
    console.error("❌ Error al conectar a la base de datos:", err);
    process.exit(1);
  }
})();

// ---------- Cierre limpio ----------
const shutdown = () => {
  if (server) {
    console.log("\n🛑 Cerrando servidor...");
    server.close(() => {
      console.log("✅ Servidor cerrado.");
      process.exit(0);
    });
    // Si no cierra en 5s, forzamos salida
    setTimeout(() => process.exit(0), 5000).unref();
  } else {
    process.exit(0);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("unhandledRejection", (reason) => {
  console.error("❌ Unhandled Promise Rejection:", reason);
});
