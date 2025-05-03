// server/POST/enviar.js
const { conectarDB, ObjectId } = require("../../conexion1");

const express = require("express");
const router = express.Router();
const fs = require("fs");

const multer = require("multer");
const path = require("path");
const { parsearPrecioHistorico } = require("../UTILS/utils"); // (según tu estructura)

const rutaUpload2025 = path.join(__dirname, "../uploads/2025");
if (!fs.existsSync(rutaUpload2025)) {
  fs.mkdirSync(rutaUpload2025, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const rutaAbsoluta = path.join(__dirname, "../uploads/2025");
    cb(null, rutaAbsoluta);
  },
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

// =============================================
// LOGIN                                  📌
// =============================================

/**
 * ✅ Iniciar sesión (Login)
 * Ruta: POST /login
 */
router.post("/login", async (req, res) => {
  const db = req.db;

  try {
    const { emailOrUsername, password } = req.body;

    // ⚠️ Verificar datos ingresados
    if (!emailOrUsername || !password) {
      return res.status(400).json({
        error: "Email o nombre de usuario y contraseña son requeridos",
      });
    }

    // 🔍 Buscar usuario por email o nombre de usuario
    const user = await db.collection("Usuarios").findOne({
      $or: [{ email: emailOrUsername }, { nombre: emailOrUsername }],
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // 🔑 Comparar la contraseña directamente (SIN bcrypt, aunque se recomienda usarlo)
    if (user.pass !== password) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // ✅ Usuario autenticado correctamente
    res.json({
      message: "Inicio de sesión exitoso",
      user: {
        _id: user._id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      },
    });
  } catch (err) {
    console.error("❌ Error en login:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// =============================================
// USUARIOS                                  📌
// =============================================

/**
 * ✅ Crear un nuevo usuario (Create)
 * Ruta: POST /usuarios
 */
router.post("/usuarios", async (req, res) => {
  const db = req.db;

  try {
    console.log("📥 Recibiendo solicitud para crear usuario...");
    console.log("📌 Datos recibidos:", req.body);

    const { nombre, pass, email, rol } = req.body;

    if (!nombre || !pass || !email || !rol) {
      console.error("❌ Faltan datos obligatorios.");
      return res
        .status(400)
        .json({ error: "Todos los campos son obligatorios" });
    }

    const nuevoUsuario = {
      nombre,
      pass,
      email,
      fechaRegistro: new Date().toISOString(),
      rol,
    };

    console.log("📤 Insertando en MongoDB:", nuevoUsuario);
    const result = await db.collection("Usuarios").insertOne(nuevoUsuario);
    console.log("✅ Resultado de la inserción:", result);

    if (result.insertedId) {
      nuevoUsuario._id = result.insertedId; // Agregamos el _id al objeto
      console.log("✅ Usuario agregado correctamente:", nuevoUsuario);
      return res.status(201).json({
        message: "Usuario creado correctamente",
        usuario: nuevoUsuario, // Ahora sí devuelve el usuario con el _id
      });
    } else {
      console.error("❌ Error al insertar usuario en MongoDB.");
      return res
        .status(500)
        .json({ error: "Error al guardar el usuario en la base de datos" });
    }
  } catch (err) {
    console.error("❌ Error creando usuario:", err);
    res.status(500).json({ error: "Error al crear usuario" });
  }
});

// =============================================
// PRODUCTOS                                  📌
// =============================================

/**
 * ✅ Crear un nuevo producto con imagen (Create)
 * Ruta: POST /productos
 */
router.post("/productos", upload.single("Imagen"), async (req, res) => {
  const db = req.db;

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se ha subido ninguna imagen" });
    }

    // Convertir IDs a ObjectId solo si existen
    const proveedorId = req.body.Proveedor_id
      ? new ObjectId(req.body.Proveedor_id)
      : null;
    const supermercadoId = req.body.Supermercado_id
      ? new ObjectId(req.body.Supermercado_id)
      : null;
    const usuarioId = req.body.Usuario_id
      ? new ObjectId(req.body.Usuario_id)
      : null;

    const nuevoProducto = {
      Nombre: req.body.Nombre,
      Imagen: `/uploads/2025/${req.file.filename}`,
      Marca: req.body.Marca,
      Peso: req.body.Peso,
      UnidadPeso: req.body.UnidadPeso,
      Estado: req.body.Estado,
      Proveedor_id: proveedorId,
      Supermercado_id: supermercadoId,
      Usuario_id: usuarioId,
    };

    const resultado = await db.collection("Productos").insertOne(nuevoProducto);
    nuevoProducto._id = resultado.insertedId;

    // 🔍 Obtener nombres de las otras colecciones
    const proveedor = proveedorId
      ? await db.collection("Proveedor").findOne({ _id: proveedorId })
      : null;
    const supermercado = supermercadoId
      ? await db.collection("Supermercados").findOne({ _id: supermercadoId })
      : null;
    const usuario = usuarioId
      ? await db.collection("Usuarios").findOne({ _id: usuarioId })
      : null;

    res.status(201).json({
      message: "Producto creado correctamente",
      producto: {
        ...nuevoProducto,
        Proveedor_id: proveedor ? proveedor.Nombre : "N/A",
        Supermercado_id: supermercado ? supermercado.Nombre : "N/A",
        Usuario_id: usuario ? usuario.nombre : "N/A",
      },
    });
  } catch (err) {
    console.error("❌ Error en backend:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// CREAR UN NUEVO PRODUCTO COMPLETO 🧩

router.post(
  "/productos-completos",
  upload.single("Imagen"),
  async (req, res) => {
    const db = req.db;

    try {
      // ✅ Validaciones de ID
      const proveedorId = ObjectId.isValid(req.body.proveedor)
        ? new ObjectId(req.body.proveedor)
        : null;
      const supermercadoId = ObjectId.isValid(req.body.supermercado)
        ? new ObjectId(req.body.supermercado)
        : null;
      const usuarioId = ObjectId.isValid(req.body.usuario)
        ? new ObjectId(req.body.usuario)
        : null;

      // 🎯 LOG DE DEPURACIÓN
      console.log("📥 [REQ] Campos recibidos desde el cliente:");
      console.log("req.body:", req.body);
      console.log("📷 req.file (imagen):", req.file);

      // 1️⃣ Inserción del producto
      const nuevoProducto = {
        Nombre: req.body.nombre,
        Imagen: req.file
          ? `/uploads/2025/${req.file.filename}`
          : req.body.imagen || null,
        Marca: req.body.marca || "Sin marca",
        Peso: req.body.peso,
        UnidadPeso: req.body.unidadPeso,
        Estado: req.body.estado,
        Proveedor_id: proveedorId,
        Supermercado_id: supermercadoId,
        Usuario_id: usuarioId,
        fechaSubida: req.body.fechaSubida || new Date().toISOString(),
        fechaActualizacion:
          req.body.fechaActualizacion || new Date().toISOString(),
      };

      // 🎯 LOG NUEVO PRODUCTO
      console.log("🆕 [PRODUCTO] Datos construidos:", nuevoProducto);

      const resultadoProducto = await db
        .collection("Productos")
        .insertOne(nuevoProducto);
      const productoId = resultadoProducto.insertedId;

      // 2️⃣ Inserción del precio
      let precioHistorico = [];
      try {
        if (
          req.body.precioHistorico &&
          typeof req.body.precioHistorico === "string"
        ) {
          console.log(
            "🧪 Precio histórico recibido:",
            req.body.precioHistorico
          );
          const parsed = JSON.parse(req.body.precioHistorico);
          precioHistorico = Array.isArray(parsed)
            ? parsearPrecioHistorico(parsed)
            : [];
        }
      } catch (e) {
        console.warn("⚠️ precioHistorico inválido:", req.body.precioHistorico);
        precioHistorico = [];
      }

      const nuevoPrecio = {
        producto_id: productoId,
        precioActual: parseFloat(req.body.precioActual),
        precioDescuento: req.body.precioDescuento
          ? parseFloat(req.body.precioDescuento)
          : null,
        unidadLote: req.body.unidadLote || "N/A",
        precioUnidadLote: req.body.precioPorUnidad
          ? parseFloat(req.body.precioPorUnidad)
          : null,
        precioHistorico,
      };

      console.log("💸 [PRECIO] Datos construidos:", nuevoPrecio);
      await db.collection("Precios").insertOne(nuevoPrecio);

      // 3️⃣ Inserción de descripción
      if (req.body.tipo) {
        const nuevaDescripcion = {
          Producto_id: productoId,
          Tipo: req.body.tipo,
          Subtipo: req.body.subtipo || null,
          Utilidad: req.body.utilidad || null,
          Ingredientes: req.body.ingredientes
            ? req.body.ingredientes
                .split(",")
                .map((i) => i.trim())
                .filter((i) => i.length > 0)
            : [],
        };

        // 🎯 LOG DESCRIPCIÓN
        console.log("📝 [DESCRIPCIÓN] Datos construidos:", nuevaDescripcion);
        await db.collection("Descripcion").insertOne(nuevaDescripcion);
      } else {
        console.warn("⚠️ Tipo no enviado. No se creó descripción.");
      }

      res.status(201).json({
        message: "Producto completo creado correctamente",
        producto_id: productoId,
      });
    } catch (err) {
      console.error("❌ Error al crear producto completo:", err);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
);

// =============================================
// TIPOS Y SUBTIPOS                           📌
// =============================================

/**
 * ✅ Crear nuevo tipo
 * Ruta: POST /tipos
 */
router.post("/tipos", async (req, res) => {
  const db = req.db;

  try {
    const { Nombre } = req.body;
    if (!Nombre)
      return res.status(400).json({ error: "Nombre es obligatorio" });

    const nuevoTipo = { Nombre };
    const result = await db.collection("Tipos").insertOne(nuevoTipo);

    res
      .status(201)
      .json({
        message: "Tipo creado correctamente",
        tipo: { ...nuevoTipo, _id: result.insertedId },
      });
  } catch (err) {
    console.error("❌ Error creando tipo:", err);
    res.status(500).json({ error: "Error al crear tipo" });
  }
});

/**
 * ✅ Crear nuevo subtipo
 * Ruta: POST /subtipos
 */
router.post("/subtipos", async (req, res) => {
  const db = req.db;

  try {
    const { Nombre } = req.body;
    if (!Nombre)
      return res.status(400).json({ error: "Nombre es obligatorio" });

    const nuevoSubtipo = { Nombre };
    const result = await db.collection("Subtipos").insertOne(nuevoSubtipo);

    res
      .status(201)
      .json({
        message: "Subtipo creado correctamente",
        subtipo: { ...nuevoSubtipo, _id: result.insertedId },
      });
  } catch (err) {
    console.error("❌ Error creando subtipo:", err);
    res.status(500).json({ error: "Error al crear subtipo" });
  }
});

// =============================================
// PRECIOS                                    📌
// =============================================

/**
 * ✅ Crear un nuevo precios (Create)
 * Ruta: POST /precios
 */
router.post("/precios", async (req, res) => {
  const db = req.db;

  try {
    let {
      producto_id,
      precioActual,
      precioDescuento,
      unidadLote,
      precioUnidadLote,
      precioHistorico,
    } = req.body;

    // ✅ Convertir a números, asegurando que sean válidos
    precioActual = parseFloat(precioActual) || 0;
    precioDescuento = precioDescuento ? parseFloat(precioDescuento) : null;

    // ✅ Si unidadLote está vacío, poner "N/A"
    unidadLote = unidadLote.trim() === "" ? "N/A" : unidadLote;

    // ✅ Si precioHistorico no es un array, inicializarlo vacío
    if (!Array.isArray(precioHistorico)) {
      precioHistorico = [];
    }

    const nuevoPrecio = {
      producto_id: new ObjectId(producto_id),
      precioActual,
      precioDescuento,
      unidadLote,
      precioUnidadLote: precioUnidadLote ? parseFloat(precioUnidadLote) : null,
      precioHistorico,
    };

    const result = await db.collection("Precios").insertOne(nuevoPrecio);
    nuevoPrecio._id = result.insertedId;

    res
      .status(201)
      .json({ message: "Precio creado correctamente", precio: nuevoPrecio });
  } catch (err) {
    console.error("❌ Error creando Precio:", err);
    res.status(500).json({ error: "Error al crear Precio" });
  }
});

// =============================================
// SUPERMERCADOS                              📌
// =============================================

/**
 * ✅ Crear un nuevo supermercado (Create)
 * Ruta: POST /supermercados
 */
router.post("/supermercados", async (req, res) => {
  const db = req.db;

  try {
    const { Nombre, Ubicaciones } = req.body; // Aseguramos que recibimos 'Ubicaciones' como un array

    if (
      !Nombre ||
      !Ubicaciones ||
      !Array.isArray(Ubicaciones) ||
      Ubicaciones.length === 0
    ) {
      return res
        .status(400)
        .json({ error: "El nombre y al menos una ubicación son obligatorios" });
    }

    // Validar cada ubicación
    for (const ubicacion of Ubicaciones) {
      if (!ubicacion.pais || !ubicacion.ciudad || !ubicacion.ubicacion) {
        return res.status(400).json({
          error: "Cada ubicación debe tener Pais, Ciudad y Ubicación.",
        });
      }
    }

    const nuevoSupermercado = { Nombre, Ubicaciones };

    const resultado = await db
      .collection("Supermercados")
      .insertOne(nuevoSupermercado);

    res.status(201).json({
      message: "Supermercado creado correctamente",
      supermercado: { ...nuevoSupermercado, _id: resultado.insertedId },
    });
  } catch (err) {
    console.error("❌ Error creando Supermercado:", err);
    res.status(500).json({ error: "Error al crear Supermercado" });
  }
});

// =============================================
// PROOVEDOR                                  📌
// =============================================

/**
 * ✅ Crear un nuevo proovedor (Create)
 * Ruta: POST /proovedor
 */
router.post("/proveedor", async (req, res) => {
  const db = req.db;

  try {
    const { Nombre, Pais, "C.Autonoma": ComunidadAutonoma } = req.body;

    // 📌 Validar que los campos obligatorios están presentes
    if (!Nombre || !Pais || !ComunidadAutonoma) {
      return res
        .status(400)
        .json({ error: "Todos los campos son obligatorios" });
    }

    const nuevoProveedor = { Nombre, Pais, "C.Autonoma": ComunidadAutonoma };

    const resultado = await db
      .collection("Proveedor")
      .insertOne(nuevoProveedor);

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
// DATOS DEL USUARIO                          📌
// =============================================

/**
 * ✅ Crear un nuevo dato personal (Create)
 * Ruta: POST /datos-personales
 */
router.post("/datos-personales", async (req, res) => {
  const db = req.db;

  try {
    const data = req.body;
    data.usuario_id = new ObjectId(data.usuario_id);

    const result = await db.collection("DatosUsuario").insertOne(data);
    res.status(201).json({
      message: "Datos guardados correctamente",
      id: result.insertedId,
    });
  } catch (err) {
    console.error("❌ Error guardando datos personales:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// =============================================
// DESCRIPCION                                📌
// =============================================

/**
 * ✅ Crear una nueva descripción (Create)
 * Ruta: POST /descripcion
 */
router.post("/descripcion", async (req, res) => {
  const db = req.db;

  try {
    const { Producto_id, Tipo, Subtipo, Utilidad, Ingredientes } = req.body;

    // ✅ Validar que se envió un Producto_id válido
    if (!Producto_id || !Tipo) {
      return res
        .status(400)
        .json({ error: "Producto ID y Tipo son obligatorios" });
    }

    const productoObjectId = new ObjectId(Producto_id);

    // 🔍 Buscar el nombre del producto en la BD
    const producto = await db
      .collection("Productos")
      .findOne({ _id: productoObjectId });

    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const nuevaDescripcion = {
      Producto_id: productoObjectId,
      Tipo,
      Subtipo: Subtipo || null,
      Utilidad: Utilidad || null,
      Ingredientes: Array.isArray(Ingredientes) ? Ingredientes : [],
    };

    const resultado = await db
      .collection("Descripcion")
      .insertOne(nuevaDescripcion);

    res.status(201).json({
      message: "Descripción creada correctamente",
      descripcion: {
        ...nuevaDescripcion,
        _id: resultado.insertedId,
        Producto_id: producto.Nombre, // 🔹 Devolvemos el nombre del producto en lugar del ID
      },
    });
  } catch (err) {
    console.error("❌ Error creando Descripción:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// =============================================
// OPINIONES                                  📌
// =============================================

/**
 * ✅ Crear una nueva opinión (Create)
 * Ruta: POST /opiniones
 */
router.post("/opiniones", async (req, res) => {
  const db = req.db;

  try {
    const { Producto_id, Usuario_id, Opinion, Calificacion } = req.body;

    // ✅ Validar los campos obligatorios
    if (!Producto_id || !Usuario_id || !Opinion) {
      return res
        .status(400)
        .json({ error: "Producto ID, Usuario ID y Opinión son obligatorios" });
    }

    // ✅ Crear nueva opinión con fecha automática
    const nuevaOpinion = {
      Producto_id: new ObjectId(Producto_id),
      Usuario_id: new ObjectId(Usuario_id),
      Opinion,
      Calificacion: Calificacion ? parseInt(Calificacion, 10) : null, // No es obligatorio
      Fecha: new Date().toISOString(), // Se asigna automáticamente
    };

    const resultado = await db.collection("Opiniones").insertOne(nuevaOpinion);

    res.status(201).json({
      message: "Opinión creada correctamente",
      opinion: { ...nuevaOpinion, _id: resultado.insertedId },
    });
  } catch (err) {
    console.error("❌ Error creando Opinión:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// =============================================
// HISTORIAL DEL USUARIO                      📌
// =============================================

/**
 * ✅ Crear nuevo registro de actividad (Create)
 * Ruta: POST /historial
 */
router.post("/historial", async (req, res) => {
  const db = req.db;

  try {
    const { usuario_id, accion } = req.body;

    const nuevoMovimiento = {
      usuario_id: new ObjectId(usuario_id),
      accion,
      fecha: new Date(), // guardamos fecha actual
    };

    await db.collection("HistorialUsuario").insertOne(nuevoMovimiento);
    res.status(201).json({ message: "Movimiento registrado correctamente" });
  } catch (err) {
    console.error("❌ Error registrando historial:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

module.exports = router;
