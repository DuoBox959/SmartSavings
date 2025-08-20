// server/PUT/actualizar.js
const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const path = require("path");
const fs = require("fs/promises");
const fssync = require("fs");
const multer = require("multer");

// ============ uploads ============
const uploadsDir = path.join(__dirname, "../uploads/2025");
if (!fssync.existsSync(uploadsDir)) fssync.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ============ helpers ============
const oid = (v) => (ObjectId.isValid(v) ? new ObjectId(v) : null);
const toFloatOrNull = (v) => {
  if (v === undefined || v === null || `${v}`.trim() === "") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
const parseMaybeJSON = (v, fallback) => {
  if (Array.isArray(v)) return v;
  if (typeof v !== "string") return fallback;
  try { const p = JSON.parse(v); return Array.isArray(p) ? p : fallback; }
  catch { return fallback; }
};
const parsePrecioHistorico = (raw) => {
  // Acepta JSON string de [{precio, anio}] o array ya listo
  const arr = parseMaybeJSON(raw, Array.isArray(raw) ? raw : []);
  return arr
    .map((x) => ({ precio: toFloatOrNull(x.precio), anio: parseInt(x.anio ?? x.año, 10) }))
    .filter((x) => x.precio !== null && Number.isInteger(x.anio));
};
const normalizeIngredientes = (raw) =>
  parseMaybeJSON(raw, Array.isArray(raw) ? raw : (typeof raw === "string" ? raw.split(",") : []))
    .map((s) => String(s).trim())
    .filter(Boolean);
const unlinkIfExists = async (maybePath) => {
  if (!maybePath) return;
  try {
    const abs = maybePath.startsWith("/uploads")
      ? path.resolve(process.cwd(), "." + maybePath)
      : path.resolve(uploadsDir, maybePath);
    await fs.unlink(abs);
  } catch { /* noop */ }
};

// =============================================
// USUARIOS
// =============================================
router.put("/usuarios/:id", async (req, res) => {
  const db = req.db;
  try {
    const _id = oid(req.params.id);
    if (!_id) return res.status(400).json({ error: "ID no válido" });

    const update = {};
    if (req.body.nombre) update.nombre = req.body.nombre;
    if (req.body.pass) update.pass = req.body.pass;
    if (req.body.email) update.email = req.body.email;
    if (req.body.rol) update.rol = req.body.rol;
    if (!Object.keys(update).length) return res.status(400).json({ error: "No se enviaron cambios" });

    const r = await db.collection("Usuarios").updateOne({ _id }, { $set: update });
    if (!r.matchedCount) return res.status(404).json({ error: "Usuario no encontrado o sin cambios" });

    res.json({ message: "Usuario actualizado correctamente", usuario: update });
  } catch (e) {
    console.error("❌ Error actualizando usuario:", e);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
});

// =============================================
// PRODUCTOS (básico)
// =============================================
router.put("/productos/:id", upload.single("Imagen"), async (req, res) => {
  const db = req.db;
  try {
    const _id = oid(req.params.id);
    if (!_id) return res.status(400).json({ error: "ID de producto no válido" });

    const update = {};
    if (req.file) {
      update.Imagen = `/uploads/2025/${req.file.filename}`;
      await unlinkIfExists(req.body.imagenAnterior);
    }

    if (req.body.nombre) update.Nombre = req.body.nombre;
    if (req.body.marca) update.Marca = req.body.marca;
    if (req.body.peso !== undefined) update.Peso = toFloatOrNull(req.body.peso);
    if (req.body.unidadPeso) update.UnidadPeso = req.body.unidadPeso;
    if (req.body.estado) update.Estado = req.body.estado;

    // Descriptivo en Productos (tu esquema actual)
    if (req.body.tipo !== undefined) update.Tipo = req.body.tipo || null;
    if (req.body.subtipo !== undefined) update.Subtipo = req.body.subtipo || null;
    if (req.body.utilidad !== undefined) update.Utilidad = req.body.utilidad || null;
    if (req.body.ingredientes !== undefined) update.Ingredientes = normalizeIngredientes(req.body.ingredientes);

    if (req.body.proveedor_id) update.Proveedor_id = oid(req.body.proveedor_id);
    if (req.body.supermercado_id) update.Supermercado_id = oid(req.body.supermercado_id);
    if (req.body.usuario_id) update.Usuario_id = oid(req.body.usuario_id);

    if (!Object.keys(update).length) return res.status(200).json({ message: "No hubo cambios en el producto." });

    update.fechaActualizacion = new Date().toISOString();

    const r = await db.collection("Productos").updateOne({ _id }, { $set: update });
    if (!r.matchedCount) return res.status(404).json({ error: "Producto no encontrado" });

    res.json({ message: "Producto actualizado correctamente", producto: update });
  } catch (e) {
    console.error("❌ Error actualizando producto:", e);
    res.status(500).json({ error: "Error al actualizar producto" });
  }
});

// =============================================
// PRODUCTO COMPLETO (Producto + Precios)
// =============================================
router.put("/productos-completos/:id", upload.single("Imagen"), async (req, res) => {
  const db = req.db;
  try {
    const _id = oid(req.params.id);
    if (!_id) return res.status(400).json({ error: "ID de producto no válido" });

    // 1) Producto
    const updProd = {
      Nombre: req.body.nombre,
      Marca: req.body.marca,
      Peso: toFloatOrNull(req.body.peso),
      UnidadPeso: req.body.unidadPeso,
      Estado: req.body.estado,
      Utilidad: req.body.utilidad || "Sin descripción",
      Tipo: req.body.tipo || "Sin tipo",
      Subtipo: req.body.subtipo || "Sin subtipo",
      PaisProveedor: req.body.paisProveedor || "España",
      Proveedor_id: oid(req.body.proveedor),
      Supermercado_id: oid(req.body.supermercado),
      Usuario_id: oid(req.body.usuario),
      fechaActualizacion: req.body.fechaActualizacion || new Date().toISOString(),
    };

    if (req.file) {
      updProd.Imagen = `/uploads/2025/${req.file.filename}`;
      await unlinkIfExists(req.body.imagenAnterior);
    }
    if (req.body.ingredientes !== undefined) updProd.Ingredientes = normalizeIngredientes(req.body.ingredientes);

    // limpia propiedades undefined para no sobreescribir con undefined
    Object.keys(updProd).forEach(k => updProd[k] === undefined && delete updProd[k]);

    const r1 = await db.collection("Productos").updateOne({ _id }, { $set: updProd });
    if (!r1.matchedCount) return res.status(404).json({ error: "Producto no encontrado" });

    // 2) Precios (upsert)
    const precioUnidadLote = req.body.precioPorUnidad ?? req.body.precioUnidadLote;
    const updPrecio = {
      producto_id: _id,
      precioActual: toFloatOrNull(req.body.precioActual) ?? 0,
      precioDescuento: toFloatOrNull(req.body.precioDescuento),
      unidadLote:
        (req.body.unidadLote == null || String(req.body.unidadLote).trim() === "")
          ? "N/A"
          : (Number.isFinite(Number(req.body.unidadLote)) ? Number(req.body.unidadLote) : req.body.unidadLote),
      precioUnidadLote: toFloatOrNull(precioUnidadLote),
      precioHistorico: parsePrecioHistorico(req.body.precioHistorico),
    };

    await db.collection("Precios").updateOne(
      { producto_id: _id },
      { $set: updPrecio },
      { upsert: true }
    );

    // 3) País proveedor si corresponde
    if (req.body.paisProveedor && ObjectId.isValid(req.body.proveedor)) {
      await db.collection("Proveedor").updateOne(
        { _id: new ObjectId(req.body.proveedor) },
        { $set: { Pais: req.body.paisProveedor } }
      );
    }

    res.json({ message: "Producto completo actualizado correctamente" });
  } catch (e) {
    console.error("❌ Error actualizando producto completo:", e);
    res.status(500).json({ error: "Error interno al actualizar producto completo" });
  }
});

// =============================================
// PRECIOS
// =============================================
router.put("/precios/:id", async (req, res) => {
  const db = req.db;
  try {
    const _id = oid(req.params.id);
    if (!_id) return res.status(400).json({ error: "ID de precio no válido" });

    const update = {
      precioActual: toFloatOrNull(req.body.precioActual) ?? 0,
      precioDescuento: toFloatOrNull(req.body.precioDescuento),
      precioUnidadLote: toFloatOrNull(req.body.precioUnidadLote),
      unidadLote:
        (req.body.unidadLote == null || String(req.body.unidadLote).trim() === "")
          ? "N/A"
          : (Number.isFinite(Number(req.body.unidadLote)) ? Number(req.body.unidadLote) : req.body.unidadLote),
      precioHistorico: parsePrecioHistorico(req.body.precioHistorico),
    };

    const r = await db.collection("Precios").updateOne({ _id }, { $set: update });
    if (!r.matchedCount) return res.status(404).json({ error: "Precio no encontrado" });

    res.json({ message: "Precio actualizado correctamente" });
  } catch (e) {
    console.error("❌ Error actualizando Precio:", e);
    res.status(500).json({ error: "Error al actualizar precio" });
  }
});

router.put("/precios/por-producto/:productoId", async (req, res) => {
  const db = req.db;
  try {
    const producto_id = oid(req.params.productoId);
    if (!producto_id) return res.status(400).json({ error: "ID de producto no válido" });

    const update = {
      precioActual: toFloatOrNull(req.body.precioActual) ?? 0,
      precioDescuento: toFloatOrNull(req.body.precioDescuento),
      precioUnidadLote: toFloatOrNull(req.body.precioUnidadLote),
      unidadLote:
        (req.body.unidadLote == null || String(req.body.unidadLote).trim() === "")
          ? "N/A"
          : (Number.isFinite(Number(req.body.unidadLote)) ? Number(req.body.unidadLote) : req.body.unidadLote),
      precioHistorico: parsePrecioHistorico(req.body.precioHistorico),
    };

    const r = await db.collection("Precios").updateOne({ producto_id }, { $set: update });
    if (!r.matchedCount) return res.status(404).json({ error: "No se encontró precio para ese producto" });

    res.json({ message: "✅ Precio actualizado correctamente (por producto_id)" });
  } catch (e) {
    console.error("❌ Error en PUT /precios/por-producto:", e);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// =============================================
// SUPERMERCADOS – añadir ubicación
// =============================================
router.patch("/supermercados/:id/ubicacion", async (req, res) => {
  const db = req.db;
  try {
    const _id = oid(req.params.id);
    if (!_id) return res.status(400).json({ error: "ID de supermercado inválido" });

    const { pais, ciudad, ubicacion } = req.body;
    if (!pais || !ciudad || !ubicacion)
      return res.status(400).json({ error: "Faltan 'pais', 'ciudad' y/o 'ubicacion'" });

    const superm = await db.collection("Supermercados").findOne({ _id });
    if (!superm) return res.status(404).json({ error: "Supermercado no encontrado." });

    const existe = superm.Ubicaciones?.some((u) => u.ubicacion === ubicacion && u.pais === pais && u.ciudad === ciudad);
    if (existe) return res.status(200).json({ message: "Ubicación ya registrada", ubicacion: { pais, ciudad, ubicacion } });

    await db.collection("Supermercados").updateOne(
      { _id },
      { $push: { Ubicaciones: { pais, ciudad, ubicacion } } }
    );

    const actualizado = await db.collection("Supermercados").findOne({ _id });
    res.json({ message: "Ubicación añadida correctamente.", supermercado: actualizado });
  } catch (e) {
    console.error("❌ Error al añadir ubicación:", e);
    res.status(500).json({ error: "Error interno del servidor al añadir ubicación." });
  }
});

// =============================================
// PROVEEDOR
// =============================================
router.put("/proveedor/:id", async (req, res) => {
  const db = req.db;
  try {
    const _id = oid(req.params.id);
    if (!_id) return res.status(400).json({ error: "ID de proveedor no válido" });

    const update = {};
    if (req.body.Nombre) update.Nombre = req.body.Nombre;
    if (req.body.Pais) update.Pais = req.body.Pais;
    if (req.body["C.Autonoma"]) update["C.Autonoma"] = req.body["C.Autonoma"];
    if (!Object.keys(update).length) return res.status(400).json({ error: "No se enviaron cambios" });

    const r = await db.collection("Proveedor").updateOne({ _id }, { $set: update });
    if (!r.matchedCount) return res.status(404).json({ error: "Proveedor no encontrado o sin cambios" });

    res.json({ message: "Proveedor actualizado correctamente" });
  } catch (e) {
    console.error("❌ Error actualizando proveedor:", e);
    res.status(500).json({ error: "Error al actualizar proveedor" });
  }
});

// =============================================
// DATOS PERSONALES
// =============================================
router.put("/datos-personales/:id", async (req, res) => {
  const db = req.db;
  try {
    const _id = oid(req.params.id);
    if (!_id) return res.status(400).json({ error: "ID no válido" });

    const data = { ...req.body };
    if (data.usuario_id) data.usuario_id = oid(data.usuario_id);

    const r = await db.collection("DatosUsuario").updateOne({ _id }, { $set: data });
    if (!r.matchedCount) return res.status(404).json({ error: "Datos personales no encontrados o sin cambios" });

    res.json({ message: "Datos personales actualizados correctamente" });
  } catch (e) {
    console.error("❌ Error actualizando datos personales:", e);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// =============================================
// (Compat) "descripcion" -> actualizar campos en Productos
// =============================================
router.put("/descripcion/:id", async (req, res) => {
  const db = req.db;
  try {
    // Aquí el :id es el del PRODUCTO (no existe colección Descripcion)
    const _id = oid(req.params.id);
    if (!_id) return res.status(400).json({ error: "ID de producto no válido" });

    const update = {
      Tipo: req.body.Tipo ?? req.body.tipo ?? null,
      Subtipo: req.body.Subtipo ?? req.body.subtipo ?? null,
      Utilidad: req.body.Utilidad ?? req.body.utilidad ?? null,
      Ingredientes: normalizeIngredientes(req.body.Ingredientes ?? req.body.ingredientes),
      fechaActualizacion: new Date().toISOString(),
    };

    const r = await db.collection("Productos").updateOne({ _id }, { $set: update });
    if (!r.matchedCount) return res.status(404).json({ error: "Producto no encontrado" });

    res.json({ message: "Descripción aplicada al producto" });
  } catch (e) {
    console.error("❌ Error aplicando descripción:", e);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// =============================================
// HISTORIAL
// =============================================
router.put("/historial/:id", async (req, res) => {
  const db = req.db;
  try {
    const _id = oid(req.params.id);
    if (!_id) return res.status(400).json({ error: "ID no válido" });

    const r = await db.collection("HistorialUsuario").updateOne({ _id }, { $set: req.body });
    if (!r.matchedCount) return res.status(404).json({ error: "Movimiento no encontrado" });

    res.json({ message: "Movimiento actualizado correctamente" });
  } catch (e) {
    console.error("❌ Error actualizando historial:", e);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

module.exports = router;
