// server/POST/enviar.js
const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

// ============= Uploads =============
const uploadsDir = path.join(__dirname, "../uploads/2025");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ============= Helpers =============
const toObjectId = (v) => (ObjectId.isValid(v) ? new ObjectId(v) : null);
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

// =============================================
// LOGIN
// =============================================
router.post("/login", async (req, res) => {
  const db = req.db;
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password)
      return res.status(400).json({ error: "Email/usuario y contraseña son requeridos" });

    const user = await db.collection("Usuarios").findOne({
      $or: [{ email: emailOrUsername }, { nombre: emailOrUsername }],
    });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    if (user.pass !== password) return res.status(401).json({ error: "Contraseña incorrecta" });

    res.json({
      message: "Inicio de sesión exitoso",
      user: { _id: user._id, nombre: user.nombre, email: user.email, rol: user.rol },
    });
  } catch (err) {
    console.error("❌ Error en login:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// =============================================
// USUARIOS
// =============================================
router.post("/usuarios", async (req, res) => {
  const db = req.db;
  try {
    const { nombre, pass, email, rol } = req.body;
    if (!nombre || !pass || !email || !rol)
      return res.status(400).json({ error: "Todos los campos son obligatorios" });

    const nuevo = { nombre, pass, email, fechaRegistro: new Date().toISOString(), rol };
    const r = await db.collection("Usuarios").insertOne(nuevo);
    res.status(201).json({ message: "Usuario creado correctamente", usuario: { ...nuevo, _id: r.insertedId } });
  } catch (err) {
    console.error("❌ Error creando usuario:", err);
    res.status(500).json({ error: "Error al crear usuario" });
  }
});

// =============================================
// PRODUCTOS (simple con imagen)
// =============================================
router.post("/productos", upload.single("Imagen"), async (req, res) => {
  const db = req.db;
  try {
    if (!req.file) return res.status(400).json({ error: "No se ha subido ninguna imagen" });

    const nuevoProducto = {
      Nombre: req.body.Nombre,
      Imagen: `/uploads/2025/${req.file.filename}`,
      Marca: req.body.Marca || "Sin marca",
      Peso: toFloatOrNull(req.body.Peso),
      UnidadPeso: req.body.UnidadPeso || "kg",
      Estado: req.body.Estado || "En stock",
      Tipo: req.body.Tipo || null,
      Subtipo: req.body.Subtipo || null,
      Utilidad: req.body.Utilidad || null,
      Ingredientes: parseMaybeJSON(req.body.Ingredientes, [])
        .map((s) => String(s).trim()).filter(Boolean),
      Proveedor_id: toObjectId(req.body.Proveedor_id),
      Supermercado_id: toObjectId(req.body.Supermercado_id),
      Usuario_id: toObjectId(req.body.Usuario_id),
      fechaSubida: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
    };

    const r = await db.collection("Productos").insertOne(nuevoProducto);
    const [prov, sup, usr] = await Promise.all([
      nuevoProducto.Proveedor_id ? db.collection("Proveedor").findOne({ _id: nuevoProducto.Proveedor_id }) : null,
      nuevoProducto.Supermercado_id ? db.collection("Supermercados").findOne({ _id: nuevoProducto.Supermercado_id }) : null,
      nuevoProducto.Usuario_id ? db.collection("Usuarios").findOne({ _id: nuevoProducto.Usuario_id }) : null,
    ]);

    res.status(201).json({
      message: "Producto creado correctamente",
      producto: {
        ...nuevoProducto,
        _id: r.insertedId,
        Proveedor_id: prov?.Nombre ?? "N/A",
        Supermercado_id: sup?.Nombre ?? "N/A",
        Usuario_id: usr?.nombre ?? "N/A",
      },
    });
  } catch (err) {
    console.error("❌ Error en backend:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// =============================================
// PRODUCTO COMPLETO (Producto + Precios)
// =============================================
router.post("/productos-completos", upload.single("Imagen"), async (req, res) => {
  const db = req.db;
  try {
    const proveedorId = toObjectId(req.body.proveedor);
    const supermercadoId = toObjectId(req.body.supermercado);
    const usuarioId = toObjectId(req.body.usuario);

    // Ingredientes viene como JSON.stringify([...]) desde el front
    const ingredientes = parseMaybeJSON(req.body.ingredientes, [])
      .map((s) => String(s).trim()).filter(Boolean);

    const nuevoProducto = {
      Nombre: req.body.nombre,
      Imagen: req.file ? `/uploads/2025/${req.file.filename}` : (req.body.imagen || null),
      Marca: req.body.marca || "Sin marca",
      Peso: toFloatOrNull(req.body.peso),
      UnidadPeso: req.body.unidadPeso || "kg",
      Estado: req.body.estado || "En stock",
      Tipo: req.body.tipo || null,
      Subtipo: req.body.subtipo || null,
      Utilidad: req.body.utilidad || null,
      Ingredientes: ingredientes,
      PaisProveedor: req.body.paisProveedor || "España",
      Proveedor_id: proveedorId,
      Supermercado_id: supermercadoId,
      Usuario_id: usuarioId,
      fechaSubida: req.body.fechaSubida || new Date().toISOString(),
      fechaActualizacion: req.body.fechaActualizacion || new Date().toISOString(),
    };

    const rProd = await db.collection("Productos").insertOne(nuevoProducto);
    const productoId = rProd.insertedId;

    // precioHistorico como JSON de [{precio, anio}]
    let precioHistorico = parseMaybeJSON(req.body.precioHistorico, []);
    precioHistorico = precioHistorico
      .map((x) => ({ precio: toFloatOrNull(x.precio), anio: parseInt(x.anio, 10) }))
      .filter((x) => x.precio !== null && Number.isInteger(x.anio));

    // compatibilidad: precioPorUnidad o precioUnidadLote
    const ppu = req.body.precioPorUnidad ?? req.body.precioUnidadLote;

    const nuevoPrecio = {
      producto_id: productoId,
      precioActual: toFloatOrNull(req.body.precioActual) ?? 0,
      precioDescuento: toFloatOrNull(req.body.precioDescuento),
      unidadLote: (req.body.unidadLote == null || String(req.body.unidadLote).trim() === "")
        ? "N/A"
        : (Number.isFinite(Number(req.body.unidadLote)) ? Number(req.body.unidadLote) : req.body.unidadLote),
      precioUnidadLote: toFloatOrNull(ppu),
      precioHistorico,
    };
    const rPrecio = await db.collection("Precios").insertOne(nuevoPrecio);

    res.status(201).json({
      message: "Producto completo creado correctamente",
      producto_id: productoId,
      precio_id: rPrecio.insertedId,
    });
  } catch (err) {
    console.error("❌ Error al crear producto completo:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// =============================================
// TIPOS / SUBTIPOS (opcionales)
// =============================================
router.post("/tipos", async (req, res) => {
  const db = req.db;
  try {
    const { Nombre } = req.body;
    if (!Nombre) return res.status(400).json({ error: "Nombre es obligatorio" });
    const r = await db.collection("Tipos").insertOne({ Nombre });
    res.status(201).json({ message: "Tipo creado correctamente", tipo: { _id: r.insertedId, Nombre } });
  } catch (err) {
    console.error("❌ Error creando tipo:", err);
    res.status(500).json({ error: "Error al crear tipo" });
  }
});

router.post("/subtipos", async (req, res) => {
  const db = req.db;
  try {
    const { Nombre } = req.body;
    if (!Nombre) return res.status(400).json({ error: "Nombre es obligatorio" });
    const r = await db.collection("Subtipos").insertOne({ Nombre });
    res.status(201).json({ message: "Subtipo creado correctamente", subtipo: { _id: r.insertedId, Nombre } });
  } catch (err) {
    console.error("❌ Error creando subtipo:", err);
    res.status(500).json({ error: "Error al crear subtipo" });
  }
});

// =============================================
// PRECIOS
// =============================================
router.post("/precios", async (req, res) => {
  const db = req.db;
  try {
    const nuevoPrecio = {
      producto_id: toObjectId(req.body.producto_id),
      precioActual: toFloatOrNull(req.body.precioActual) ?? 0,
      precioDescuento: toFloatOrNull(req.body.precioDescuento),
      unidadLote:
        (req.body.unidadLote == null || String(req.body.unidadLote).trim() === "")
          ? "N/A"
          : (Number.isFinite(Number(req.body.unidadLote)) ? Number(req.body.unidadLote) : req.body.unidadLote),
      precioUnidadLote: toFloatOrNull(req.body.precioUnidadLote),
      precioHistorico: Array.isArray(req.body.precioHistorico) ? req.body.precioHistorico : [],
    };
    const r = await db.collection("Precios").insertOne(nuevoPrecio);
    res.status(201).json({ message: "Precio creado correctamente", precio: { ...nuevoPrecio, _id: r.insertedId } });
  } catch (err) {
    console.error("❌ Error creando Precio:", err);
    res.status(500).json({ error: "Error al crear Precio" });
  }
});

// =============================================
// SUPERMERCADOS
// =============================================
router.post("/supermercados", async (req, res) => {
  const db = req.db;
  try {
    const Nombre = (req.body.Nombre || "").trim();

    const src = Array.isArray(req.body.Ubicaciones) ? req.body.Ubicaciones : [];
    const Ubicaciones = src
      .map(u => ({
        pais: (u.pais || u.Pais || "").trim(),
        ciudad: (u.ciudad || u.Ciudad || "").trim(),
        ubicacion: (u.ubicacion || u.Ubicacion || "").trim(),
      }))
      .filter(u => u.pais && u.ciudad && u.ubicacion);

    if (!Nombre) return res.status(400).json({ error: "El nombre del supermercado es obligatorio" });

    const nuevoSupermercado = { Nombre, Ubicaciones };
    const r = await db.collection("Supermercados").insertOne(nuevoSupermercado);

    res.status(201).json({ message: "Supermercado creado correctamente", supermercado: { ...nuevoSupermercado, _id: r.insertedId } });
  } catch (err) {
    console.error("❌ Error creando Supermercado:", err);
    res.status(500).json({ error: "Error al crear Supermercado" });
  }
});

router.patch("/supermercados/:id/ubicacion", async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  if (!ObjectId.isValid(id)) return res.status(400).json({ error: "ID de supermercado inválido." });

  const pais = (req.body.pais || req.body.Pais || "").trim();
  const ciudad = (req.body.ciudad || req.body.Ciudad || "").trim();
  const ubicacion = (req.body.ubicacion || req.body.Ubicacion || "").trim();
  if (!pais || !ciudad || !ubicacion) return res.status(400).json({ error: "Se requiere 'pais', 'ciudad' y 'ubicacion'." });

  const sup = await db.collection("Supermercados").findOne({ _id: new ObjectId(id) });
  if (!sup) return res.status(404).json({ error: "Supermercado no encontrado." });

  const ya = (sup.Ubicaciones || []).some(u => (u.ubicacion || u.Ubicacion || "").toLowerCase() === ubicacion.toLowerCase());
  if (ya) return res.status(200).json({ message: "Ubicación ya registrada para este supermercado.", supermercado: sup });

  await db.collection("Supermercados").updateOne(
    { _id: sup._id },
    { $push: { Ubicaciones: { pais, ciudad, ubicacion } } }
  );

  const actualizado = await db.collection("Supermercados").findOne({ _id: sup._id });
  res.json({ message: "Ubicación añadida correctamente.", supermercado: actualizado });
});


// =============================================
// PROVEEDOR
// =============================================
router.post("/proveedor", async (req, res) => {
  const db = req.db;
  try {
    const Nombre = (req.body.Nombre || "").trim();
    const Pais = (req.body.Pais || "").trim();

    // aceptar varias formas y hacerlo opcional
    const ComunidadAutonoma =
      (req.body?.C?.Autonoma || req.body["C.Autonoma"] || req.body.ComunidadAutonoma || "").trim();

    if (!Nombre || !Pais) {
      return res.status(400).json({ error: "Nombre y País son obligatorios" });
    }

    // guardamos sin puntos en las claves
    const nuevoProveedor = { Nombre, Pais };
    if (ComunidadAutonoma) nuevoProveedor.C = { Autonoma: ComunidadAutonoma };

    const resultado = await db.collection("Proveedor").insertOne(nuevoProveedor);

    res.status(201).json({
      message: "Proveedor creado correctamente",
      proveedor: { ...nuevoProveedor, _id: resultado.insertedId },
    });
  } catch (err) {
    console.error("❌ Error creando proveedor:", err);
    res.status(500).json({ error: "Error al crear proveedor" });
  }
});

// =============================================
// DATOS DEL USUARIO
// =============================================
router.post("/datos-personales", async (req, res) => {
  const db = req.db;
  try {
    const data = { ...req.body, usuario_id: toObjectId(req.body.usuario_id) };
    const r = await db.collection("DatosUsuario").insertOne(data);
    res.status(201).json({ message: "Datos guardados correctamente", id: r.insertedId });
  } catch (err) {
    console.error("❌ Error guardando datos personales:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// =============================================
// (Compat) DESCRIPCION -> actualiza campos en Productos
// =============================================
router.post("/descripcion", async (req, res) => {
  const db = req.db;
  try {
    const { Producto_id, Tipo, Subtipo, Utilidad, Ingredientes } = req.body;
    const _id = toObjectId(Producto_id);
    if (!_id || !Tipo) return res.status(400).json({ error: "Producto ID y Tipo son obligatorios" });

    const update = {
      Tipo,
      Subtipo: Subtipo ?? null,
      Utilidad: Utilidad ?? null,
      Ingredientes: Array.isArray(Ingredientes) ? Ingredientes : [],
      fechaActualizacion: new Date().toISOString(),
    };

    const r = await db.collection("Productos").updateOne({ _id }, { $set: update });
    if (!r.matchedCount) return res.status(404).json({ error: "Producto no encontrado" });

    res.status(201).json({ message: "Descripción aplicada al producto", producto_id: _id });
  } catch (err) {
    console.error("❌ Error aplicando descripción:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// =============================================
// OPINIONES
// =============================================
router.post("/opiniones", async (req, res) => {
  const db = req.db;
  try {
    const { Producto_id, Usuario_id, Opinion, Calificacion } = req.body;
    if (!Producto_id || !Usuario_id || !Opinion)
      return res.status(400).json({ error: "Producto ID, Usuario ID y Opinión son obligatorios" });

    const nueva = {
      Producto_id: toObjectId(Producto_id),
      Usuario_id: toObjectId(Usuario_id),
      Opinion,
      Calificacion: Calificacion ? parseInt(Calificacion, 10) : null,
      Fecha: new Date().toISOString(),
    };
    const r = await db.collection("Opiniones").insertOne(nueva);
    res.status(201).json({ message: "Opinión creada correctamente", opinion: { ...nueva, _id: r.insertedId } });
  } catch (err) {
    console.error("❌ Error creando Opinión:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// =============================================
// MARCAS (opcional)
// =============================================
router.post("/marcas", async (req, res) => {
  const db = req.db;
  try {
    const { Nombre } = req.body;
    if (!Nombre) return res.status(400).json({ error: "El nombre de la marca es obligatorio" });
    const r = await db.collection("Marcas").insertOne({ Nombre });
    res.status(201).json({ message: "Marca creada correctamente", marca: { _id: r.insertedId, Nombre } });
  } catch (err) {
    console.error("❌ Error creando marca:", err);
    res.status(500).json({ error: "Error al crear marca" });
  }
});

// =============================================
// HISTORIAL
// =============================================
router.post("/historial", async (req, res) => {
  const db = req.db;
  try {
    const { usuario_id, accion } = req.body;
    const nuevo = { usuario_id: toObjectId(usuario_id), accion, fecha: new Date() };
    await db.collection("HistorialUsuario").insertOne(nuevo);
    res.status(201).json({ message: "Movimiento registrado correctamente" });
  } catch (err) {
    console.error("❌ Error registrando historial:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

module.exports = router;
