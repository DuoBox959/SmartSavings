// server/DELETE/eliminar.js
const express = require("express");
const router = express.Router();
const { ObjectId } = require("../conexion1");
// =============================================
// USUARIOS                                  📌
// =============================================


// =============================================
// FORZAR LIMPIEZA HISTORIAL                                 📌
// =============================================
  app.get("/api/forzar-limpieza-historial", async (req, res) => {
    try {
      const historialCollection = db.collection("HistorialUsuario");
  
      const primerosMovimientos = await historialCollection
        .aggregate([
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
        ])
        .toArray();
  
      const idsUsuariosAEliminar = primerosMovimientos.map((m) => m._id);
  
      if (idsUsuariosAEliminar.length > 0) {
        const deleteResult = await historialCollection.deleteMany({
          usuario_id: { $in: idsUsuariosAEliminar },
        });
  
        res.json({ message: `Eliminados ${deleteResult.deletedCount} historiales.` });
      } else {
        res.json({ message: "No hay historiales para eliminar." });
      }
    } catch (err) {
      console.error("❌ Error manual:", err);
      res.status(500).json({ error: "Error al ejecutar limpieza manual" });
    }
  });
// =============================================
// PRODUCTOS                                  📌
// =============================================

// =============================================
// PRECIOS                                    📌
// =============================================

// =============================================
// SUPERMERCADOS                              📌
// =============================================

// =============================================
// PROOVEDOR                                  📌
// =============================================

// =============================================
// DATOS DEL USUARIO                          📌
// =============================================

// =============================================
// DESCRIPCION                                📌
// =============================================

// =============================================
// OPINIONES                                  📌
// =============================================

// =============================================
// HISTORIAL DEL USUARIO                      📌
// =============================================

// =============================================
// METRICAS                                   📊
// =============================================

// =============================================
// REPORTES                                  ⚠️
// =============================================

module.exports = router;
