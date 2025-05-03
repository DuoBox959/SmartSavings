// server/GET/obtener.js
const express = require("express");
const { ObjectId } = require("mongodb"); // ✅ Solo desde mongodb, no desde tu server
const router = express.Router(); // ✅ Ahora sí podemos usar express.Router()

// =============================================
// USUARIOS                                  📌
// =============================================

/**
 * ✅ Obtener todos los usuarios (Read)
 * Ruta: GET /usuarios
 */
router.get("/usuarios", async (req, res) => {
  const db = req.db;

  try {
    const usuarios = await db.collection("Usuarios").find().toArray();
    res.json(usuarios);
  } catch (err) {
    console.error("❌ Error obteniendo usuarios:", err);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

/**
 * ✅ Obtener un usuario por ID (Read)
 * Ruta: GET /usuarios/:id
 */
router.get("/usuarios/:id", async (req, res) => {
  const db = req.db;

  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID no válido" });
    }

    const user = await db
      .collection("Usuarios")
      .findOne({ _id: new ObjectId(id) });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(user);
  } catch (err) {
    console.error("❌ Error obteniendo usuario por ID:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// =============================================
// PRODUCTOS                                  📌
// =============================================

/**
 * ✅ Obtener todos los productos (Read)
 * Ruta: GET /productos
 */
router.get("/productos", async (req, res) => {
  const db = req.db;

  try {
    const productos = await db
      .collection("Productos")
      .aggregate([
        {
          $lookup: {
            from: "Proveedor", // Conectar con la colección de Proveedor
            localField: "Proveedor_id",
            foreignField: "_id",
            as: "ProveedorInfo",
          },
        },
        {
          $lookup: {
            from: "Supermercados", // Conectar con la colección de Supermercados
            localField: "Supermercado_id",
            foreignField: "_id",
            as: "SupermercadoInfo",
          },
        },
        {
          $lookup: {
            from: "Usuarios", // Conectar con la colección de Usuarios
            localField: "Usuario_id",
            foreignField: "_id",
            as: "UsuarioInfo",
          },
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
            Proveedor_id: { $arrayElemAt: ["$ProveedorInfo.Nombre", 0] }, // Nombre del proveedor
            Supermercado_id: { $arrayElemAt: ["$SupermercadoInfo.Nombre", 0] }, // Nombre del supermercado
            Usuario_id: { $arrayElemAt: ["$UsuarioInfo.nombre", 0] }, // Nombre del usuario
          },
        },
      ])
      .toArray();

    res.json(productos);
  } catch (err) {
    console.error("❌ Error obteniendo productos:", err);
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

/**
 * ✅ Obtener un producto por ID (Read)
 * Ruta: GET /productos/:id
 */
router.get("/productos/:id", async (req, res) => {
  const db = req.db;

  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID de producto no válido" });
    }

    const producto = await db
      .collection("Productos")
      .findOne({ _id: new ObjectId(id) });

    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(producto);
  } catch (err) {
    console.error("❌ Error obteniendo producto:", err);
    res.status(500).json({ error: "Error al obtener producto" });
  }
});

// OBTENER MARCAS 🧩
router.get("/marcas", async (req, res) => {
  const db = req.db;

  try {
    const marcas = await db.collection("Productos").distinct("Marca");
    res.json(marcas.filter((m) => m));
  } catch (err) {
    console.error("❌ Error al obtener marcas:", err);
    res.status(500).json({ error: "Error al obtener marcas" });
  }
});

//OBTENER PRODUCTO COMPLETO 🧩
router.get("/productos-completos", async (req, res) => {
  const db = req.db;

  try {
    const productos = await db
      .collection("Productos")
      .aggregate([
        {
          $lookup: {
            from: "Descripcion",
            localField: "_id",
            foreignField: "Producto_id",
            as: "Descripcion",
          },
        },
        {
          $unwind: {
            path: "$Descripcion",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            Utilidad: "$Descripcion.Utilidad",
            Ingredientes: "$Descripcion.Ingredientes",
          },
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
            Utilidad: 1,
            Ingredientes: 1,
          },
        },
      ])
      .toArray();

    res.json(productos);
  } catch (err) {
    console.error("❌ Error en GET /productos-completos:", err);
    res.status(500).json({ error: "Error al obtener productos completos" });
  }
});

// =============================================
// PRECIOS                                    📌
// =============================================

/**
 * ✅ Obtener todos los precios (Read)
 * Ruta: GET /precios
 */
router.get("/precios", async (req, res) => {
  const db = req.db;

  try {
    if (!db) {
      return res
        .status(500)
        .json({ error: "No hay conexión con la base de datos" });
    }
    const precios = await db.collection("Precios").find().toArray();
    console.log("✅ Precios obtenidos:", precios);
    res.json(precios);
  } catch (err) {
    console.error("❌ Error obteniendo precios:", err);
    res.status(500).json({ error: "Error al obtener precios" });
  }
});

//OBTENER EL PRECIO DEL PRODUCTO 🧩
router.get("/precios/producto/:id", async (req, res) => {
  const db = req.db;

  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID no válido" });
    }

    const precio = await db.collection("Precios").findOne({
      producto_id: new ObjectId(id),
    });

    if (!precio) {
      return res.status(404).json({ error: "Precio no encontrado" });
    }

    res.json(precio);
  } catch (err) {
    console.error("❌ Error al obtener precio del producto:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

//OBTENER EL COMPARADOR DE PRECIOS 🧩
router.get("/comparador-precios", async (req, res) => {
  const db = req.db;

  try {
    const precios = await db
      .collection("Precios")
      .aggregate([
        {
          $lookup: {
            from: "Productos",
            localField: "producto_id",
            foreignField: "_id",
            as: "ProductoInfo",
          },
        },
        {
          $unwind: "$ProductoInfo", // 🧨 Para poder usar los campos de Producto directamente
        },
        {
          $lookup: {
            from: "Supermercados",
            localField: "ProductoInfo.Supermercado_id",
            foreignField: "_id",
            as: "SupermercadoInfo",
          },
        },
        {
          $unwind: "$SupermercadoInfo", // 🧨 También lo desenrollamos
        },
        {
          $project: {
            _id: 1,
            precioActual: 1,
            precioDescuento: 1,
            unidadLote: 1,
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
    console.error("❌ Error en /comparador-precios:", err);
    res
      .status(500)
      .json({ error: "Error al obtener precios para comparación" });
  }
});

// =============================================
// SUPERMERCADOS                              📌
// =============================================

/**
 * ✅ Obtener todos los supermercados (Read)
 * Ruta: GET /supermercados
 */
router.get("/supermercados", async (req, res) => {
  const db = req.db;

  try {
    const supermercados = await db.collection("Supermercados").find().toArray(); // 👈 Usa el nombre correcto de la colección
    console.log("📌 Supermercados encontrados:", supermercados); // 👀 Verificar en la consola del servidor
    res.json(supermercados);
  } catch (err) {
    console.error("❌ Error obteniendo supermercados:", err);
    res.status(500).json({ error: "Error al obtener supermercados" });
  }
});

// =============================================
// PROOVEDOR                                  📌
// =============================================

/**
 * ✅ Obtener todos los proveedor(Read)
 * Ruta: GET /proveedor
 */
router.get("/proveedor", async (req, res) => {
  const db = req.db;

  try {
    const proveedor = await db.collection("Proveedor").find().toArray();
    res.json(proveedor);
  } catch (err) {
    console.error("❌ Error obteniendo proveedor:", err);
    res.status(500).json({ error: "Error al obtener proveedor" });
  }
});

/**
 * ✅ Obtener nombres de proveedores (para los selects)
 * Ruta: GET /proveedores
 */
router.get("/proveedores", async (req, res) => {
  const db = req.db;

  try {
    const proveedores = await db.collection("Proveedor").find().toArray();
    const nombres = proveedores.map((p) => ({
      _id: p._id,
      Nombre: p.Nombre,
    }));
    res.json(nombres);
  } catch (err) {
    console.error("❌ Error obteniendo nombres de proveedores:", err);
    res.status(500).json({ error: "Error al obtener proveedores" });
  }
});

// =============================================
// DATOS DEL USUARIO                          📌
// =============================================

/**
 * ✅ Obtener datos personales por usuario_id
 * Ruta: GET /datos-personales?usuario_id=ID
 */
router.get("/datos-personales", async (req, res) => {
  const db = req.db;

  try {
    const { usuario_id } = req.query;

    if (usuario_id) {
      const datos = await db
        .collection("DatosUsuario")
        .find({ usuario_id: new ObjectId(usuario_id) })
        .toArray();
      return res.json(datos);
    }

    // Si no se pasa usuario_id, devuelve todos (opcional)
    const datos = await db.collection("DatosUsuario").find().toArray();
    res.json(datos);
  } catch (err) {
    console.error("❌ Error obteniendo datos personales:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// Obtener usuario por email para eliminarlo desde el lado cliente 🧩
router.get("/usuarios/email/:email", async (req, res) => {
  const db = req.db;

  try {
    const { email } = req.params;

    const user = await db.collection("Usuarios").findOne({ email: email });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(user);
  } catch (err) {
    console.error("❌ Error al buscar usuario:", err);
    res.status(500).json({ error: "Error al buscar usuario" });
  }
});

// =============================================
// DESCRIPCION                                📌
// =============================================

/**
 * ✅ Obtener todas las descripciones (Read)
 * Ruta: GET /descripcion
 */
router.get("/descripcion", async (req, res) => {
  const db = req.db;

  try {
    const descripciones = await db
      .collection("Descripcion")
      .aggregate([
        {
          $lookup: {
            from: "Productos", // Colección de productos
            localField: "Producto_id", // Campo en la colección de Descripcion
            foreignField: "_id", // Campo en la colección de Productos
            as: "ProductoInfo", // Nombre del campo resultante
          },
        },
        {
          $project: {
            _id: 1,
            Producto_id: { $arrayElemAt: ["$ProductoInfo.Nombre", 0] }, // Obtener nombre del producto
            Tipo: 1,
            Subtipo: 1,
            Utilidad: 1,
            Ingredientes: 1,
          },
        },
      ])
      .toArray();

    res.json(descripciones);
  } catch (err) {
    console.error("❌ Error obteniendo descripciones:", err);
    res.status(500).json({ error: "Error al obtener descripciones" });
  }
});

// OBTENER DESCRIPCION DE LOS PRODUCTOS POR ID 🧩
router.get("/descripcion/producto/:id", async (req, res) => {
  const db = req.db;

  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID no válido" });
    }

    const descripcion = await db.collection("Descripcion").findOne({
      Producto_id: new ObjectId(id),
    });

    if (!descripcion) {
      return res.status(404).json({ error: "Descripción no encontrada" });
    }

    res.json(descripcion);
  } catch (err) {
    console.error("❌ Error al obtener descripción del producto:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// OBTENER TIPOS 🧩
router.get("/tipos", async (req, res) => {
  const db = req.db;

  try {
    const tipos = await db.collection("Descripcion").distinct("Tipo");
    res.json(tipos.filter((t) => t)); // Filtra null/undefined
  } catch (err) {
    console.error("❌ Error al obtener tipos:", err);
    res.status(500).json({ error: "Error al obtener tipos" });
  }
});

// OBTENER SUBTIPOS 🧩
router.get("/subtipos", async (req, res) => {
  const db = req.db;

  try {
    const subtipos = await db.collection("Descripcion").distinct("Subtipo");
    res.json(subtipos.filter((s) => s));
  } catch (err) {
    console.error("❌ Error al obtener subtipos:", err);
    res.status(500).json({ error: "Error al obtener subtipos" });
  }
});

// =============================================
// OPINIONES                                  📌
// =============================================

/**
 * ✅ Obtener todas las opiniones (Read)
 * Ruta: GET /opiniones
 */
router.get("/opiniones", async (req, res) => {
  const db = req.db;

  try {
    const opiniones = await db.collection("Opiniones").find().toArray();
    res.json(opiniones);
  } catch (err) {
    console.error("❌ Error obteniendo opiniones:", err);
    res.status(500).json({ error: "Error al obtener opiniones" });
  }
});

// =============================================
// HISTORIAL DEL USUARIO                      📌
// =============================================

/**
 * ✅ Obtener toda la actividad (Read)
 * Ruta: GET /historial
 */
router.get("/historial", async (req, res) => {
  const db = req.db;

  try {
    const historial = await db
      .collection("HistorialUsuario")
      .find()
      .sort({ fecha: -1 }) // Más reciente primero
      .toArray();

    res.json(historial);
  } catch (err) {
    console.error("❌ Error obteniendo historial:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

/**
 * ✅ Obtener el historial de un usuario (Read)
 * Ruta: GET /historial/:usuarioId
 */

router.get("/historial/:usuarioId", async (req, res) => {
  const db = req.db;

  try {
    const usuarioId = new ObjectId(req.params.usuarioId);

    const historial = await db
      .collection("HistorialUsuario")
      .aggregate([
        { $match: { usuario_id: usuarioId } },
        {
          $lookup: {
            from: "Usuarios",
            localField: "usuario_id",
            foreignField: "_id",
            as: "usuario",
          },
        },
        { $unwind: "$usuario" },
        {
          $project: {
            fecha: 1,
            accion: 1,
            usuario: "$usuario.nombre", // 👈 nombre del usuario
          },
        },
        { $sort: { fecha: -1 } },
        { $limit: 20 },
      ])
      .toArray();

    res.json(historial);
  } catch (err) {
    console.error("❌ Error obteniendo historial:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// OBTENER USUARIOS ACTIVOS EN LOS ULTIMOS 7 DIAS 🧩
router.get("/historial-reciente", async (req, res) => {
  const db = req.db;

  try {
    const hace7dias = new Date();
    hace7dias.setDate(hace7dias.getDate() - 7);

    const movimientos = await db
      .collection("HistorialUsuario")
      .aggregate([
        {
          $match: {
            fecha: { $gte: hace7dias },
          },
        },
        {
          $lookup: {
            from: "Usuarios",
            localField: "usuario_id",
            foreignField: "_id",
            as: "Usuario",
          },
        },
        {
          $unwind: "$Usuario",
        },
        {
          $project: {
            fecha: 1,
            accion: 1,
            usuario: "$Usuario.nombre",
          },
        },
        { $sort: { fecha: -1 } },
      ])
      .toArray();

    res.json(movimientos);
  } catch (err) {
    console.error("❌ Error obteniendo historial reciente:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// OBTENER USUARIOS ACTIVOS SEMANALMENTE 🧩
router.get("/usuarios/activos-semanales", async (req, res) => {
  const db = req.db;

  try {
    const ahora = new Date();
    const hace28dias = new Date();
    hace28dias.setDate(hace28dias.getDate() - 28);

    const actividad = await db
      .collection("HistorialUsuario")
      .aggregate([
        {
          $match: { fecha: { $gte: hace28dias } },
        },
        {
          $project: {
            usuario_id: 1,
            semana: { $isoWeek: "$fecha" },
            anio: { $isoWeekYear: "$fecha" },
          },
        },
        {
          $group: {
            _id: { semana: "$semana", anio: "$anio" },
            usuarios: { $addToSet: "$usuario_id" },
          },
        },
        {
          $project: {
            semana: "$_id.semana",
            anio: "$_id.anio",
            usuarios: { $size: "$usuarios" },
          },
        },
      ])
      .toArray();

    // 🧠 Crear array de semanas ISO con 0 si falta
    const resultadoFinal = Array.from({ length: 4 }, (_, i) => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - i * 7);
      const semanaISO = getISOWeek(fecha);
      const anio = fecha.getFullYear();

      const encontrado = actividad.find(
        (a) => a.semana === semanaISO && a.anio === anio
      );

      return {
        semana: `Semana ${semanaISO} (${anio})`,
        usuarios: encontrado ? encontrado.usuarios : 0,
      };
    }).reverse();

    res.json(resultadoFinal);
  } catch (err) {
    console.error("❌ Error en /activos-semanales:", err);
    res.status(500).json({ error: "Error al obtener usuarios activos" });
  }
});

function getISOWeek(date) {
  const tempDate = new Date(date.getTime());
  tempDate.setHours(0, 0, 0, 0);
  tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
  const yearStart = new Date(tempDate.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((tempDate - yearStart) / 86400000 + 1) / 7);
  return weekNo;
}

// =============================================
// METRICAS                                   📊
// =============================================

/**
 * ✅ Obtener métricas del sistema para obtener datos de uso del sistema
 * Ruta: GET /metricas
 */
router.get("/metricas", async (req, res) => {
  const db = req.db;

  try {
    // 🔹 Obtener métricas desde la BD
    const totalUsuarios = await db.collection("Usuarios").countDocuments();
    const totalProductos = await db.collection("Productos").countDocuments();
    const totalOpiniones = await db.collection("Opiniones").countDocuments();

    const metricas = {
      usoSistema: [
        { categoria: "Usuarios Registrados", cantidad: totalUsuarios },
        { categoria: "Productos Creados", cantidad: totalProductos },
        { categoria: "Opiniones Publicadas", cantidad: totalOpiniones },
      ],
      actividadUsuarios: [
        { semana: "Semana 1", usuarios: Math.floor(Math.random() * 300) },
        { semana: "Semana 2", usuarios: Math.floor(Math.random() * 300) },
        { semana: "Semana 3", usuarios: Math.floor(Math.random() * 300) },
        { semana: "Semana 4", usuarios: Math.floor(Math.random() * 300) },
      ],
    };

    res.json(metricas);
  } catch (err) {
    console.error("❌ Error obteniendo métricas:", err);
    res.status(500).json({ error: "Error al obtener métricas" });
  }
});

// =============================================
// REPORTES                                  ⚠️
// =============================================

/**
 *✅ Obtener reportes
 * Ruta: GET /reportes
 */
router.get("/reportes", async (req, res) => {
  const db = req.db;

  try {
    const totalUsuarios = await db.collection("Usuarios").countDocuments();

    const hace7dias = new Date();
    hace7dias.setDate(hace7dias.getDate() - 7);
    const usuariosActivos = await db
      .collection("HistorialUsuario")
      .aggregate([
        { $match: { fecha: { $gte: hace7dias } } },
        { $group: { _id: "$usuario_id" } },
      ])
      .toArray();

    const totalProductos = await db.collection("Productos").countDocuments();
    const totalSupermercados = await db
      .collection("Supermercados")
      .countDocuments();

    const productosMasComparados = await db
      .collection("Productos")
      .find()
      .sort({ comparaciones: -1 })
      .limit(1)
      .toArray();

    const productoMasComparado =
      productosMasComparados.length > 0
        ? productosMasComparados[0].Nombre
        : "N/A";

    const comparacionesPorCategoria = await db
      .collection("Productos")
      .aggregate([
        { $group: { _id: "$Categoria", total: { $sum: "$comparaciones" } } },
        { $sort: { total: -1 } },
      ])
      .toArray();

    const historial = await db
      .collection("HistorialUsuario")
      .aggregate([
        {
          $lookup: {
            from: "Usuarios",
            localField: "usuario_id",
            foreignField: "_id",
            as: "usuarioInfo",
          },
        },
        { $unwind: "$usuarioInfo" },
        {
          $project: {
            fecha: 1,
            accion: 1,
            usuario: "$usuarioInfo.nombre",
          },
        },
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
  } catch (error) {
    console.error("❌ Error obteniendo reportes:", error);
    res.status(500).json({ error: "Error al obtener reportes" });
  }
});

module.exports = router;
