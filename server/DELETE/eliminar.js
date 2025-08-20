// server/DELETE/eliminar.js
const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const fs = require("fs");
const path = require("path");

// ==================== Helpers ====================
function oidOr400(res, id, what = "ID") {
  if (!ObjectId.isValid(id)) {
    res.status(400).json({ error: `${what} no válido` });
    return null;
  }
  return new ObjectId(id);
}
function safeUnlink(absPath) {
  try {
    if (!absPath) return;
    if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
  } catch (e) {
    console.warn("⚠️ No se pudo borrar archivo:", absPath, e?.message);
  }
}

// =============================================
// Limpieza manual de historiales (debug)
// =============================================
router.get("/forzar-limpieza-historial", async (req, res) => {
  const db = req.db;
  try {
    const historial = db.collection("HistorialUsuario");
    const desde = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const primeros = await historial
      .aggregate([
        { $sort: { fecha: 1 } },
        { $group: { _id: "$usuario_id", primerMovimiento: { $first: "$fecha" } } },
        { $match: { primerMovimiento: { $lte: desde } } },
      ])
      .toArray();

    const idsUsuarios = primeros.map((m) => m._id);
    if (!idsUsuarios.length) return res.json({ message: "No hay historiales para eliminar." });

    const del = await historial.deleteMany({ usuario_id: { $in: idsUsuarios } });
    res.json({ message: `Eliminados ${del.deletedCount} historiales.` });
  } catch (err) {
    console.error("❌ Error limpieza manual:", err);
    res.status(500).json({ error: "Error al ejecutar limpieza manual" });
  }
});

// =============================================
// USUARIOS
// =============================================
router.delete("/usuarios/:id", async (req, res) => {
  const db = req.db;
  const _id = oidOr400(res, req.params.id, "ID de usuario");
  if (!_id) return;

  try {
    const out = await db.collection("Usuarios").deleteOne({ _id });
    if (!out.deletedCount) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json({ message: "Usuario eliminado", deletedCount: out.deletedCount });
  } catch (err) {
    console.error("❌ Error eliminando usuario:", err);
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
});

// =============================================
// PRODUCTOS (simple)
// =============================================
router.delete("/productos/:id", async (req, res) => {
  const db = req.db;
  const _id = oidOr400(res, req.params.id, "ID de producto");
  if (!_id) return;

  try {
    const out = await db.collection("Productos").deleteOne({ _id });
    if (!out.deletedCount) return res.status(404).json({ error: "Producto no encontrado" });
    res.json({ message: "Producto eliminado", deletedCount: out.deletedCount });
  } catch (err) {
    console.error("❌ Error eliminando producto:", err);
    res.status(500).json({ error: "Error al eliminar producto" });
  }
});

// =============================================
// PRODUCTOS (completo: producto + precios + opiniones + imagen)
// =============================================
router.delete("/productos-completos/:id", async (req, res) => {
  const db = req.db;
  const _id = oidOr400(res, req.params.id, "ID de producto");
  if (!_id) return;

  try {
    // 1) Leer producto (para ruta de imagen y nombre)
    const producto = await db.collection("Productos").findOne({ _id });
    if (!producto) return res.status(404).json({ error: "Producto no encontrado" });

    // 2) Borrar documentos relacionados
    const [delProducto, delPrecios, delOpin] = await Promise.all([
      db.collection("Productos").deleteOne({ _id }),
      db.collection("Precios").deleteMany({
        $or: [{ producto_id: _id }, { producto_id: String(_id) }],
      }),
      db.collection("Opiniones").deleteMany({
        $or: [{ Producto_id: _id }, { Producto_id: String(_id) }, { Producto_id: producto.Nombre }],
      }),
    ]);

    // 3) Borrar imagen física si existía en /uploads
    if (typeof producto.Imagen === "string" && producto.Imagen.startsWith("/uploads")) {
      const abs = path.resolve(process.cwd(), `.${producto.Imagen}`);
      safeUnlink(abs);
    }

    res.json({
      message: "Producto y datos asociados eliminados correctamente",
      stats: {
        productos: delProducto.deletedCount,
        precios: delPrecios.deletedCount,
        opiniones: delOpin.deletedCount,
      },
    });
  } catch (err) {
    console.error("❌ Error eliminando producto completo:", err);
    res.status(500).json({ error: "Error interno al eliminar producto" });
  }
});

// =============================================
// PRECIOS
// =============================================
router.delete("/precios/:id", async (req, res) => {
  const db = req.db;
  const _id = oidOr400(res, req.params.id, "ID de precio");
  if (!_id) return;

  try {
    const out = await db.collection("Precios").deleteOne({ _id });
    if (!out.deletedCount) return res.status(404).json({ error: "Precio no encontrado" });
    res.json({ message: "Precio eliminado", deletedCount: out.deletedCount });
  } catch (err) {
    console.error("❌ Error eliminando precio:", err);
    res.status(500).json({ error: "Error al eliminar precio" });
  }
});

// =============================================
// SUPERMERCADOS
// =============================================
router.delete("/supermercados/:id", async (req, res) => {
  const db = req.db;
  const _id = oidOr400(res, req.params.id, "ID de supermercado");
  if (!_id) return;

  try {
    const out = await db.collection("Supermercados").deleteOne({ _id });
    if (!out.deletedCount) return res.status(404).json({ error: "Supermercado no encontrado" });

    // Opcional: cuántos productos referencian este super
    const orfanos = await db.collection("Productos").countDocuments({ Supermercado_id: _id });
    res.json({
      message: "Supermercado eliminado",
      deletedCount: out.deletedCount,
      productosQueReferencian: orfanos,
    });
  } catch (err) {
    console.error("❌ Error eliminando supermercado:", err);
    res.status(500).json({ error: "Error al eliminar supermercado" });
  }
});

// =============================================
// PROVEEDOR
// =============================================
router.delete("/proveedor/:id", async (req, res) => {
  const db = req.db;
  const _id = oidOr400(res, req.params.id, "ID de proveedor");
  if (!_id) return;

  try {
    const out = await db.collection("Proveedor").deleteOne({ _id });
    if (!out.deletedCount) return res.status(404).json({ error: "Proveedor no encontrado" });

    // Opcional: cuántos productos referencian este proveedor
    const usados = await db.collection("Productos").countDocuments({ Proveedor_id: _id });
    res.json({
      message: "Proveedor eliminado",
      deletedCount: out.deletedCount,
      productosQueReferencian: usados,
    });
  } catch (err) {
    console.error("❌ Error eliminando proveedor:", err);
    res.status(500).json({ error: "Error al eliminar proveedor" });
  }
});

// =============================================
// DATOS DEL USUARIO
// =============================================
router.delete("/datos-personales/:id", async (req, res) => {
  const db = req.db;
  const _id = oidOr400(res, req.params.id, "ID del dato");
  if (!_id) return;

  try {
    const out = await db.collection("DatosUsuario").deleteOne({ _id });
    if (!out.deletedCount) return res.status(404).json({ error: "Dato no encontrado" });
    res.json({ message: "Dato personal eliminado", deletedCount: out.deletedCount });
  } catch (err) {
    console.error("❌ Error eliminando dato personal:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// =============================================
// OPINIONES
// =============================================
router.delete("/opiniones/:id", async (req, res) => {
  const db = req.db;
  const _id = oidOr400(res, req.params.id, "ID de opinión");
  if (!_id) return;

  try {
    const out = await db.collection("Opiniones").deleteOne({ _id });
    if (!out.deletedCount) return res.status(404).json({ error: "Opinión no encontrada" });
    res.json({ message: "Opinión eliminada", deletedCount: out.deletedCount });
  } catch (err) {
    console.error("❌ Error eliminando opinión:", err);
    res.status(500).json({ error: "Error al eliminar opinión" });
  }
});

// =============================================
// HISTORIAL DEL USUARIO
// =============================================
router.delete("/historial/:id", async (req, res) => {
  const db = req.db;
  const _id = oidOr400(res, req.params.id, "ID de movimiento");
  if (!_id) return;

  try {
    const out = await db.collection("HistorialUsuario").deleteOne({ _id });
    if (!out.deletedCount) return res.status(404).json({ error: "Movimiento no encontrado" });
    res.json({ message: "Movimiento eliminado", deletedCount: out.deletedCount });
  } catch (err) {
    console.error("❌ Error eliminando historial:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

module.exports = router;
