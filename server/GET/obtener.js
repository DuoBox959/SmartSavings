// server/GET/obtener.js
const express = require("express");
const { ObjectId } = require("mongodb");
const router = express.Router();

// Helpers
const oid = (v) => (ObjectId.isValid(v) ? new ObjectId(v) : null);
const badId = (res, msg = "ID no válido") => res.status(400).json({ error: msg });

// ==============================
// USUARIOS
// ==============================
router.get("/usuarios", async (req, res) => {
  try {
    const usuarios = await req.db.collection("Usuarios").find().toArray();
    res.json(usuarios);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

router.get("/usuarios/:id", async (req, res) => {
  try {
    const _id = oid(req.params.id);
    if (!_id) return badId(res);
    const user = await req.db.collection("Usuarios").findOne({ _id });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

router.get("/usuarios/email/:email", async (req, res) => {
  try {
    const user = await req.db.collection("Usuarios").findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al buscar usuario" });
  }
});

// ==============================
// PRODUCTOS
// ==============================
// ✅ Obtener todos los productos (mantiene los _id y añade nombres)
router.get("/productos", async (req, res) => {
  const db = req.db;

  try {
    const productos = await db
      .collection("Productos")
      .aggregate([
        {
          $lookup: {
            from: "Proveedor",
            localField: "Proveedor_id",
            foreignField: "_id",
            as: "ProveedorInfo"
          }
        },
        {
          $lookup: {
            from: "Supermercados",
            localField: "Supermercado_id",
            foreignField: "_id",
            as: "SupermercadoInfo"
          }
        },
        {
          $lookup: {
            from: "Usuarios",
            localField: "Usuario_id",
            foreignField: "_id",
            as: "UsuarioInfo"
          }
        },
        {
          $addFields: {
            ProveedorNombre: { $arrayElemAt: ["$ProveedorInfo.Nombre", 0] },
            SupermercadoNombre: { $arrayElemAt: ["$SupermercadoInfo.Nombre", 0] },
            UsuarioNombre: { $arrayElemAt: ["$UsuarioInfo.nombre", 0] },
            Ubicaciones: {
              $ifNull: [{ $arrayElemAt: ["$SupermercadoInfo.Ubicaciones", 0] }, []]
            }
          }
        },
        {
          $project: {
            _id: 1,
            Nombre: 1,
            Imagen: 1,
            Marca: 1,
            Peso: 1,
            UnidadPeso: 1,
            Estado: 1,
            // 👇 mantenemos los IDs originales
            Proveedor_id: 1,
            Supermercado_id: 1,
            Usuario_id: 1,
            // 👇 y además exponemos los nombres
            ProveedorNombre: 1,
            SupermercadoNombre: 1,
            UsuarioNombre: 1,
            Ubicaciones: 1
          }
        }
      ])
      .toArray();

    res.json(productos);
  } catch (err) {
    console.error("❌ Error obteniendo productos:", err);
    res.status(500).json({ error: "Error al obtener productos" });
  }
});


router.get("/productos/:id", async (req, res) => {
  try {
    const _id = oid(req.params.id);
    if (!_id) return badId(res, "ID de producto no válido");
    const producto = await req.db.collection("Productos").findOne({ _id });
    if (!producto) return res.status(404).json({ error: "Producto no encontrado" });
    res.json(producto);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener producto" });
  }
});

// Productos “completos”: une solo con Supermercados y devuelve campos del propio producto
router.get("/productos-completos", async (req, res) => {
  try {
    const docs = await req.db
      .collection("Productos")
      .aggregate([
        {
          $lookup: {
            from: "Supermercados",
            localField: "Supermercado_id",
            foreignField: "_id",
            as: "SupermercadoInfo",
          },
        },
        { $unwind: { path: "$SupermercadoInfo", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            Nombre: 1,
            Imagen: 1,
            Marca: 1,
            Peso: 1,
            UnidadPeso: 1,
            Estado: 1,
            Tipo: 1,
            Subtipo: 1,
            Utilidad: 1,
            Ingredientes: 1,

            Proveedor_id: 1,
            Supermercado_id: 1,
            Usuario_id: 1,

            SupermercadoNombre: { $ifNull: ["$SupermercadoInfo.Nombre", null] },
            Ubicaciones: { $ifNull: ["$SupermercadoInfo.Ubicaciones", []] },
          },
        },
      ])
      .toArray();

    res.json(docs);
  } catch (err) {
    console.error("❌ Error en GET /productos-completos:", err);
    res.status(500).json({ error: "Error al obtener productos completos" });
  }
});

// Distintos desde Productos (no hay colección Descripcion)
router.get("/tipos", async (req, res) => {
  try {
    const tipos = await req.db.collection("Productos").distinct("Tipo");
    res.json((tipos || []).filter(Boolean));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener tipos" });
  }
});

router.get("/subtipos", async (req, res) => {
  try {
    const subtipos = await req.db.collection("Productos").distinct("Subtipo");
    res.json((subtipos || []).filter(Boolean));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener subtipos" });
  }
});

router.get("/marcas", async (req, res) => {
  try {
    const marcas = await req.db.collection("Productos").distinct("Marca");
    res.json((marcas || []).filter(Boolean));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener marcas" });
  }
});

// ==============================
// PRECIOS
// ==============================
router.get("/precios", async (req, res) => {
  try {
    const precios = await req.db.collection("Precios").find().toArray();
    res.json(precios);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener precios" });
  }
});

// Alias que casa con tu PUT /precios/por-producto/:id
router.get("/precios/por-producto/:id", async (req, res) => {
  try {
    const _id = oid(req.params.id);
    if (!_id) return badId(res);
    const precio = await req.db.collection("Precios").findOne({ producto_id: _id });
    if (!precio) return res.status(404).json({ error: "Precio no encontrado" });
    res.json(precio);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Mantengo tu ruta antigua por compatibilidad
router.get("/precios/producto/:id", async (req, res) => {
  try {
    const _id = oid(req.params.id);
    if (!_id) return badId(res);
    const precio = await req.db.collection("Precios").findOne({ producto_id: _id });
    if (!precio) return res.status(404).json({ error: "Precio no encontrado" });
    res.json(precio);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/comparador-precios", async (req, res) => {
  try {
    const precios = await req.db
      .collection("Precios")
      .aggregate([
        { $lookup: { from: "Productos", localField: "producto_id", foreignField: "_id", as: "ProductoInfo" } },
        { $unwind: "$ProductoInfo" },
        { $lookup: { from: "Supermercados", localField: "ProductoInfo.Supermercado_id", foreignField: "_id", as: "SupermercadoInfo" } },
        { $unwind: "$SupermercadoInfo" },
        {
          $project: {
            _id: 1,
            producto_id: 1,
            precioActual: 1,
            precioDescuento: 1,
            unidadLote: 1,
            precioUnidadLote: 1,
            Nombre: "$ProductoInfo.Nombre",
            Supermercado: "$SupermercadoInfo.Nombre",
            Peso: "$ProductoInfo.Peso",
            UnidadPeso: "$ProductoInfo.UnidadPeso",
          },
        },
      ])
      .toArray();

    res.json(precios);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener precios para comparación" });
  }
});

// ==============================
// SUPERMERCADOS
// ==============================
router.get("/supermercados", async (req, res) => {
  try {
    const supermercados = await req.db.collection("Supermercados").find().toArray();
    res.json(supermercados);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener supermercados" });
  }
});

// ==============================
// PROVEEDOR
// ==============================
router.get("/proveedor", async (req, res) => {
  try {
    const proveedor = await req.db.collection("Proveedor").find().toArray();
    res.json(proveedor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener proveedor" });
  }
});

router.get("/proveedores", async (req, res) => {
  try {
    const proveedores = await req.db.collection("Proveedor").find().toArray();
    res.json(proveedores.map((p) => ({ _id: p._id, Nombre: p.Nombre })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener proveedores" });
  }
});

// ==============================
// DATOS USUARIO
// ==============================
router.get("/datos-personales", async (req, res) => {
  try {
    const { usuario_id } = req.query;
    if (usuario_id) {
      const _id = oid(usuario_id);
      if (!_id) return badId(res, "usuario_id no válido");
      const datos = await req.db.collection("DatosUsuario").find({ usuario_id: _id }).toArray();
      return res.json(datos);
    }
    const datos = await req.db.collection("DatosUsuario").find().toArray();
    res.json(datos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// ==============================
// OPINIONES
// ==============================
router.get("/opiniones", async (req, res) => {
  try {
    const opiniones = await req.db.collection("Opiniones").find().toArray();
    res.json(opiniones);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener opiniones" });
  }
});

// ==============================
// HISTORIAL
// ==============================
router.get("/historial", async (req, res) => {
  try {
    const historial = await req.db.collection("HistorialUsuario").find().sort({ fecha: -1 }).toArray();
    res.json(historial);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

router.get("/historial/:usuarioId", async (req, res) => {
  try {
    const usuarioId = oid(req.params.usuarioId);
    if (!usuarioId) return badId(res);
    const historial = await req.db
      .collection("HistorialUsuario")
      .aggregate([
        { $match: { usuario_id: usuarioId } },
        { $lookup: { from: "Usuarios", localField: "usuario_id", foreignField: "_id", as: "usuario" } },
        { $unwind: "$usuario" },
        { $project: { fecha: 1, accion: 1, usuario: "$usuario.nombre" } },
        { $sort: { fecha: -1 } },
        { $limit: 20 },
      ])
      .toArray();
    res.json(historial);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

router.get("/historial-reciente", async (req, res) => {
  try {
    const hace7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const movimientos = await req.db
      .collection("HistorialUsuario")
      .aggregate([
        { $match: { fecha: { $gte: hace7 } } },
        { $lookup: { from: "Usuarios", localField: "usuario_id", foreignField: "_id", as: "Usuario" } },
        { $unwind: "$Usuario" },
        { $project: { fecha: 1, accion: 1, usuario: "$Usuario.nombre" } },
        { $sort: { fecha: -1 } },
      ])
      .toArray();
    res.json(movimientos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/usuarios/activos-semanales", async (req, res) => {
  try {
    const hace28 = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
    const actividad = await req.db
      .collection("HistorialUsuario")
      .aggregate([
        { $match: { fecha: { $gte: hace28 } } },
        { $project: { usuario_id: 1, semana: { $isoWeek: "$fecha" }, anio: { $isoWeekYear: "$fecha" } } },
        { $group: { _id: { semana: "$semana", anio: "$anio" }, usuarios: { $addToSet: "$usuario_id" } } },
        { $project: { semana: "$_id.semana", anio: "$_id.anio", usuarios: { $size: "$usuarios" } } },
      ])
      .toArray();

    const getISOWeek = (d) => {
      const t = new Date(d.getTime());
      t.setHours(0, 0, 0, 0);
      t.setDate(t.getDate() + 4 - (t.getDay() || 7));
      const y0 = new Date(t.getFullYear(), 0, 1);
      return Math.ceil(((t - y0) / 86400000 + 1) / 7);
    };

    const resultado = Array.from({ length: 4 }, (_, i) => {
      const f = new Date(Date.now() - i * 7 * 86400000);
      const semanaISO = getISOWeek(f);
      const year = f.getFullYear();
      const m = actividad.find((a) => a.semana === semanaISO && a.anio === year);
      return { semana: `Semana ${semanaISO} (${year})`, usuarios: m ? m.usuarios : 0 };
    }).reverse();

    res.json(resultado);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener usuarios activos" });
  }
});

router.get("/metricas", async (req, res) => {
  try {
    const totalUsuarios = await req.db.collection("Usuarios").countDocuments();
    const totalProductos = await req.db.collection("Productos").countDocuments();
    const totalOpiniones = await req.db.collection("Opiniones").countDocuments();

    res.json({
      usoSistema: [
        { categoria: "Usuarios Registrados", cantidad: totalUsuarios },
        { categoria: "Productos Creados", cantidad: totalProductos },
        { categoria: "Opiniones Publicadas", cantidad: totalOpiniones },
      ],
      actividadUsuarios: Array.from({ length: 4 }, (_, i) => ({
        semana: `Semana ${i + 1}`,
        usuarios: Math.floor(Math.random() * 300),
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener métricas" });
  }
});

router.get("/reportes", async (req, res) => {
  try {
    const totalUsuarios = await req.db.collection("Usuarios").countDocuments();
    const hace7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const usuariosActivos = await req.db
      .collection("HistorialUsuario")
      .aggregate([{ $match: { fecha: { $gte: hace7 } } }, { $group: { _id: "$usuario_id" } }])
      .toArray();

    const totalProductos = await req.db.collection("Productos").countDocuments();
    const totalSupermercados = await req.db.collection("Supermercados").countDocuments();

    const top = await req.db.collection("Productos").find().sort({ comparaciones: -1 }).limit(1).toArray();
    const productoMasComparado = top[0]?.Nombre ?? "N/A";

    const comparacionesPorCategoria = await req.db
      .collection("Productos")
      .aggregate([{ $group: { _id: "$Categoria", total: { $sum: "$comparaciones" } } }, { $sort: { total: -1 } }])
      .toArray();

    const historial = await req.db
      .collection("HistorialUsuario")
      .aggregate([
        { $lookup: { from: "Usuarios", localField: "usuario_id", foreignField: "_id", as: "usuarioInfo" } },
        { $unwind: "$usuarioInfo" },
        { $project: { fecha: 1, accion: 1, usuario: "$usuarioInfo.nombre" } },
        { $sort: { fecha: -1 } },
        { $limit: 10 },
      ])
      .toArray();

    res.json({
      totalUsuarios,
      usuariosActivos: usuariosActivos.length,
      totalProductos,
      totalSupermercados,
      productoMasComparado,
      comparacionesPorCategoria,
      historial,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener reportes" });
  }
});

module.exports = router;
