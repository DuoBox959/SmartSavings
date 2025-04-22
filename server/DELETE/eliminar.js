// server/DELETE/eliminar.js
const express = require("express");
const router = express.Router();
const { ObjectId } = require("../conexion1");

// =============================================
// FORZAR LIMPIEZA HISTORIAL                                 📌
// =============================================
router.get("/api/forzar-limpieza-historial", async (req, res) => {
  const db = req.db;

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
// USUARIOS                                  📌
// =============================================
/**
 * ✅ Eliminar un usuario (Delete)
 * Ruta: DELETE /api/usuarios/:id
 */
router.delete("/api/usuarios/:id", async (req, res) => {
  const db = req.db;

  try {
    const { id } = req.params;

    // ⚠️ Validar ID antes de convertirlo a ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID no válido" });
    }

    const objectId = new ObjectId(id);
    const result = await db.collection("Usuarios").deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ message: "Usuario eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error eliminando usuario:", err);
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
});

// =============================================
// PRODUCTOS                                  📌
// =============================================

/**
 * ✅ Eliminar producto (Delete)
 * Ruta: DELETE /api/productos/:id
 */
router.delete("/api/productos/:id", async (req, res) => {
  const db = req.db;

  try {
    const { id } = req.params;

    // ⚠️ Validar ID antes de convertirlo a ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID de producto no válido" });
    }

    const objectId = new ObjectId(id);
    const result = await db
      .collection("Productos")
      .deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json({ message: "Producto eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error eliminando producto:", err);
    res.status(500).json({ error: "Error al eliminar producto" });
  }
});

// ELIMINAR PRODUCTO COMPLETO  🧩
router.delete("/api/productos-completos/:id", async (req, res) => {
  const db = req.db;

  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: "ID inválido" });

    const _id = new ObjectId(id);

    // 🔥 Borrar de todas las colecciones relacionadas
    await db.collection("Productos").deleteOne({ _id });
    await db.collection("Precios").deleteMany({ producto_id: _id });
    await db.collection("Descripcion").deleteMany({ Producto_id: _id });
    await db.collection("Opiniones").deleteMany({ Producto_id: _id }); // si usas opiniones

    res.json({ message: "Producto y datos asociados eliminados correctamente" });
  } catch (err) {
    console.error("❌ Error eliminando producto completo:", err);
    res.status(500).json({ error: "Error interno al eliminar producto" });
  }
});

// =============================================
// PRECIOS                                    📌
// =============================================

/**
 * ✅ Eliminar precios (Delete)
 * Ruta: DELETE /api/precios/:id
 */
router.delete("/api/precios/:id", async (req, res) => {
  const db = req.db;

  try {
    const { id } = req.params;

    // ⚠️ Validar ID antes de convertirlo a ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID no válido" });
    }

    const objectId = new ObjectId(id);
    const result = await db.collection("Precios").deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Precio no encontrado" });
    }

    res.json({ message: "Precio eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error eliminando Precio:", err);
    res.status(500).json({ error: "Error al eliminar precio" });
  }
});

// =============================================
// SUPERMERCADOS                              📌
// =============================================

/**
 * ✅ Eliminar supermercados (Delete)
 * Ruta: DELETE /api/supermercados/:id
 */
router.delete("/api/supermercados/:id", async (req, res) => {
  const db = req.db;

  try {
    const { id } = req.params;

    // ⚠️ Validar ID antes de convertirlo a ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID no válido" });
    }

    const objectId = new ObjectId(id);
    const result = await db
      .collection("Supermercados")
      .deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Supermercado no encontrado" });
    }

    res.json({ message: "Supermercado eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error eliminando Supermercado:", err);
    res.status(500).json({ error: "Error al eliminar Supermercado" });
  }
});

// =============================================
// PROOVEDOR                                  📌
// =============================================

/**
 * ✅ Eliminar proovedor (Delete)
 * Ruta: DELETE /api/proovedor/:id
 */
router.delete("/api/proveedor/:id", async (req, res) => {
  const db = req.db;

  try {
    const { id } = req.params;

    // ⚠️ Validar ID antes de convertirlo a ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID no válido" });
    }

    const objectId = new ObjectId(id);
    const result = await db
      .collection("Proveedor")
      .deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Proveedor no encontrado" });
    }

    res.json({ message: "Proveedor eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error eliminando Proveedor:", err);
    res.status(500).json({ error: "Error al eliminar Proveedor" });
  }
});

// =============================================
// DATOS DEL USUARIO                          📌
// =============================================

/**
 * ✅ Eliminar Dato personal (Delete)
 * Ruta: DELETE /api/datos-personales/:id
 */
router.delete("/api/datos-personales/:id", async (req, res) => {
  const db = req.db;

  try {
    const datoId = new ObjectId(req.params.id);
    const result = await db
      .collection("DatosUsuario")
      .deleteOne({ _id: datoId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Dato no encontrado" });
    }

    res.json({ message: "Dato personal eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error eliminando dato personal:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// =============================================
// DESCRIPCION                                📌
// =============================================

/**
 * ✅ Eliminar Descripcion (Delete)
 * Ruta: DELETE /api/descripcion/:id
 */
router.delete("/api/descripcion/:id", async (req, res) => {
  const db = req.db;

  try {
    const { id } = req.params;

    // ⚠️ Validar ID antes de convertirlo a ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID no válido" });
    }

    const objectId = new ObjectId(id);
    const result = await db
      .collection("Descripcion")
      .deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Descripcion no encontrado" });
    }

    res.json({ message: "Descripcion eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error eliminando Descripcion:", err);
    res.status(500).json({ error: "Error al eliminar Descripcion" });
  }
});

// =============================================
// OPINIONES                                  📌
// =============================================

/**
 * ✅ Eliminar opinión (Delete)
 * Ruta: DELETE /api/opiniones/:id
 */
router.delete("/api/opiniones/:id", async (req, res) => {
  const db = req.db;

  try {
    const { id } = req.params;

    // ⚠️ Validar ID antes de convertirlo a ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID no válido" });
    }

    const objectId = new ObjectId(id);
    const result = await db
      .collection("Opiniones")
      .deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Opinion no encontrado" });
    }

    res.json({ message: "Opinion eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error eliminando Opinion:", err);
    res.status(500).json({ error: "Error al eliminar Opinion" });
  }
});
// =============================================
// HISTORIAL DEL USUARIO                      📌
// =============================================

/**
 * ✅ Eliminar entrada del historial (Delete)
 * Ruta: DELETE /api/historial/:id
 */
router.delete("/api/historial/:id", async (req, res) => {
  const db = req.db;

  try {
    const id = new ObjectId(req.params.id);

    const result = await db
      .collection("HistorialUsuario")
      .deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Movimiento no encontrado" });
    }

    res.json({ message: "Movimiento eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error eliminando historial:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

module.exports = router;
