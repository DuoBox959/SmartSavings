// =============================================
// 🅰️ CONFIGURACIÓN INICIAL
// =============================================

const { conectarDB, ObjectId } = require("./conexion1");
require("dotenv").config();
const multer = require("multer");
const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// 📌 Servir archivos estáticos desde la carpeta "uploads"
app.use("/uploads", express.static("uploads"));

let db;

// 📌 Configuración de almacenamiento para imágenes con Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/2025/"); // Carpeta donde se guardarán las imágenes
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Renombrar archivo con timestamp
  },
});

const upload = multer({ storage: storage });

// 🔌 Conectar a MongoDB Atlas
(async () => {
  try {
    db = await conectarDB();
    console.log("✅ Conectado correctamente a MongoDB Atlas");

    // 🔍 Verificar qué base de datos se está usando
    console.log("📌 Base de datos seleccionada:", db.databaseName);

    // 🔍 Verificar si la colección "usuarios" existe
    const collections = await db.listCollections().toArray();
    console.log(
      "📌 Colecciones disponibles:",
      collections.map((c) => c.name)
    );
    const cron = require("node-cron"); // esto arriba del archivo, con los otros requires

    cron.schedule("0 3 * * *", async () => {
      console.log("🧹 Ejecutando limpieza automática de historiales...");
    
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
                  $lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // más de 7 días
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
    
          console.log(`🗑️ ${deleteResult.deletedCount} historiales eliminados.`);
        } else {
          console.log("📦 No hay historiales para eliminar hoy.");
        }
      } catch (err) {
        console.error("❌ Error ejecutando cron de limpieza:", err);
      }
    });
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Error al conectar a la base de datos:", err);
    process.exit(1);
  }
})();

// ✅ Ruta simple de prueba
app.get("/", (req, res) => {
  res.send("🚀 Servidor funcionando con MongoDB Atlas");
});

// =============================================
// 🅱️ RUTAS DE AUTENTICACIÓN (LOGIN)
// =============================================

/**
 * ✅ Iniciar sesión (Login)
 * Ruta: POST /api/login
 */
app.post("/api/login", async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    // ⚠️ Verificar datos ingresados
    if (!emailOrUsername || !password) {
      return res
        .status(400)
        .json({
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
// 🅲️ CRUD DE USUARIOS
// =============================================

/**
 * ✅ Crear un nuevo usuario (Create)
 * Ruta: POST /api/usuarios
 */

app.post("/api/usuarios", async (req, res) => {
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

/**
 * ✅ Obtener todos los usuarios (Read)
 * Ruta: GET /api/usuarios
 */
app.get("/api/usuarios", async (req, res) => {
  try {
    const usuarios = await db.collection("Usuarios").find().toArray();
    res.json(usuarios);
  } catch (err) {
    console.error("❌ Error obteniendo usuarios:", err);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

/**
 * ✅ Modificar un usuario existente (Update)
 * Ruta: PUT /api/usuarios/:id
 */
app.put("/api/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // ⚠️ Verificar si el ID es válido antes de convertirlo a ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID no válido" });
    }

    const objectId = new ObjectId(id);

    const updateData = {};
    if (req.body.nombre) updateData.nombre = req.body.nombre;
    if (req.body.pass) updateData.pass = req.body.pass;
    if (req.body.email) updateData.email = req.body.email;
    if (req.body.rol) updateData.rol = req.body.rol;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No se enviaron cambios" });
    }

    console.log("📤 Actualizando usuario en MongoDB:", updateData);

    const result = await db
      .collection("Usuarios")
      .updateOne({ _id: objectId }, { $set: updateData });

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({ error: "Usuario no encontrado o sin cambios" });
    }

    res.json({
      message: "Usuario actualizado correctamente",
      usuario: updateData,
    });
  } catch (err) {
    console.error("❌ Error actualizando usuario:", err);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
});

/**
 * ✅ Eliminar un usuario (Delete)
 * Ruta: DELETE /api/usuarios/:id
 */
app.delete("/api/usuarios/:id", async (req, res) => {
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

// 🔍 Buscar usuario por email para eliminarlo desde el lado cliente
app.get("/api/usuarios/email/:email", async (req, res) => {
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

/**
 * ✅ Obtener un usuario por ID (Read)
 * Ruta: GET /api/usuarios/:id
 */
app.get("/api/usuarios/:id", async (req, res) => {
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
// 🅳️ CRUD DE PRODUCTOS
// =============================================

/**
 * ✅ Crear un nuevo producto con imagen (Create)
 * Ruta: POST /api/productos
 */
app.post("/api/productos", upload.single("Imagen"), async (req, res) => {
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
/**
 * ✅ Crear un nuevo producto completo con imagen (Create)
 * Ruta: POST /api/productos-completos
 */
// ✅ Función de utilidad para transformar el string a array de objetos
function parsearPrecioHistorico(input) {
  if (!input || typeof input !== "string") return [];

  const partes = input.split(",").map(e => e.trim());
  const resultado = [];

  for (let i = 0; i < partes.length - 1; i += 2) {
    const precio = parseFloat(partes[i]);
    const año = parseInt(partes[i + 1]);

    if (!isNaN(precio) && !isNaN(año)) {
      resultado.push({ precio, año });
    }
  }

  return resultado;
}

app.post("/api/productos-completos", upload.single("Imagen"), async (req, res) => {
  try {
    // ✅ Validaciones seguras para evitar BSONError
    const proveedorId = ObjectId.isValid(req.body.proveedor) ? new ObjectId(req.body.proveedor) : null;
    const supermercadoId = ObjectId.isValid(req.body.supermercado) ? new ObjectId(req.body.supermercado) : null;
    const usuarioId = ObjectId.isValid(req.body.usuario) ? new ObjectId(req.body.usuario) : null;

    console.log("📦 Formulario recibido:");
    console.log("req.body:", req.body);
    console.log("req.file:", req.file);

    // 1️⃣ Insertar producto
    const nuevoProducto = {
      Nombre: req.body.nombre,
      Imagen: req.file ? `/uploads/2025/${req.file.filename}` : req.body.imagen || null,
      Marca: req.body.marca || "Sin marca",
      Peso: req.body.peso,
      UnidadPeso: req.body.unidadPeso,
      Estado: req.body.estado,
      Proveedor_id: proveedorId,
      Supermercado_id: supermercadoId,
      Usuario_id: usuarioId,
      fechaSubida: req.body.fechaSubida || new Date().toISOString(),
      fechaActualizacion: req.body.fechaActualizacion || new Date().toISOString(),
    };

    const resultadoProducto = await db.collection("Productos").insertOne(nuevoProducto);
    const productoId = resultadoProducto.insertedId;

    // 2️⃣ Insertar precio
    const nuevoPrecio = {
      producto_id: productoId,
      precioActual: parseFloat(req.body.precioActual),
      precioDescuento: req.body.precioDescuento ? parseFloat(req.body.precioDescuento) : null,
      unidadLote: req.body.unidadLote || "N/A",
      precioUnidadLote: req.body.precioPorUnidad ? parseFloat(req.body.precioPorUnidad) : null,
      precioHistorico: parsearPrecioHistorico(req.body.precioHistorico),
    };

    await db.collection("Precios").insertOne(nuevoPrecio);

    // 3️⃣ Insertar descripción (opcional)
    if (req.body.tipo) {
      const nuevaDescripcion = {
        Producto_id: productoId,
        Tipo: req.body.tipo,
        Subtipo: req.body.subtipo || null,
        Utilidad: req.body.utilidad || null,
        Ingredientes: req.body.ingredientes
        ? req.body.ingredientes.split(",").map(i => i.trim()).filter(i => i.length > 0)
        : [],
            };

      await db.collection("Descripcion").insertOne(nuevaDescripcion);
    }

    res.status(201).json({
      message: "Producto completo creado correctamente",
      producto_id: productoId,
    });

  } catch (err) {
    console.error("❌ Error al crear producto completo:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// function parsearPrecioHistorico(input) {
//   if (!input) return [];

//   const valores = input
//     .split(",")
//     .map((v) => v.trim())
//     .filter((v) => v !== "");

//   const resultado = [];
//   for (let i = 0; i < valores.length; i += 2) {
//     const precio = parseFloat(valores[i]);
//     const año = valores[i + 1];
//     if (!isNaN(precio) && año) {
//       resultado.push({ precio, fecha: año });
//     }
//   }

//   return resultado;
// }
app.get("/api/precios/producto/:id", async (req, res) => {
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

/**
 * ✅ Obtener todos los productos (Read)
 * Ruta: GET /api/productos
 */
app.get("/api/productos", async (req, res) => {
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
 * ✅ Obtener todos los productos completos (Read)
 * Ruta: GET /api/productos-completos
 */
app.get("/api/productos-completos", async (req, res) => {
  try {
    const productos = await db.collection("Productos").aggregate([
      {
        $lookup: {
          from: "Descripcion",
          localField: "_id",
          foreignField: "Producto_id",
          as: "Descripcion"
        }
      },
      {
        $unwind: {
          path: "$Descripcion",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          Utilidad: "$Descripcion.Utilidad",
          Ingredientes: "$Descripcion.Ingredientes"
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
          Utilidad: 1,
          Ingredientes: 1
        }
      }
    ]).toArray();

    res.json(productos);
  } catch (err) {
    console.error("❌ Error en GET /api/productos-completos:", err);
    res.status(500).json({ error: "Error al obtener productos completos" });
  }
});

app.put("/api/productos-completos/:id", upload.single("Imagen"), async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID de producto no válido" });
    }

    const objectId = new ObjectId(id);

    const updateData = {
      Nombre: req.body.nombre,
      Marca: req.body.marca,
      Peso: req.body.peso,
      UnidadPeso: req.body.unidadPeso,
      Estado: req.body.estado,
      fechaActualizacion: req.body.fechaActualizacion || new Date().toISOString(),
    };

    if (req.file) {
      updateData.Imagen = `/uploads/2025/${req.file.filename}`;
    }

    if (ObjectId.isValid(req.body.supermercado)) {
      updateData.Supermercado_id = new ObjectId(req.body.supermercado);
    }

    if (ObjectId.isValid(req.body.proveedor)) {
      updateData.Proveedor_id = new ObjectId(req.body.proveedor);
    }

    if (ObjectId.isValid(req.body.usuario)) {
      updateData.Usuario_id = new ObjectId(req.body.usuario);
    }

    // ✅ 1️⃣ Actualizar producto
    const result = await db.collection("Productos").updateOne(
      { _id: objectId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    // ✅ 2️⃣ Actualizar o insertar precios
    const nuevoPrecio = {
      producto_id: objectId,
      precioActual: parseFloat(req.body.precioActual),
      precioDescuento: req.body.precioDescuento ? parseFloat(req.body.precioDescuento) : null,
      unidadLote: req.body.unidadLote || "N/A",
      precioUnidadLote: req.body.precioPorUnidad ? parseFloat(req.body.precioPorUnidad) : null,
      precioHistorico: parsearPrecioHistorico(req.body.precioHistorico),
    };

    await db.collection("Precios").updateOne(
      { producto_id: objectId },
      { $set: nuevoPrecio },
      { upsert: true }
    );

    // ✅ 3️⃣ Actualizar o insertar descripción con Utilidad e Ingredientes
    if (req.body.tipo) {
      const descripcionActualizada = {
        Producto_id: objectId,
        Tipo: req.body.tipo,
        Subtipo: req.body.subtipo || null,
        Utilidad: req.body.utilidad || "Sin descripción",
        Ingredientes: req.body.ingredientes
          ? req.body.ingredientes.split(",").map((i) => i.trim())
          : [],
      };

      await db.collection("Descripcion").updateOne(
        { Producto_id: objectId },
        { $set: descripcionActualizada },
        { upsert: true }
      );
    }

    res.json({ message: "Producto completo actualizado correctamente" });

  } catch (err) {
    console.error("❌ Error actualizando producto completo:", err);
    res.status(500).json({ error: "Error interno al actualizar producto completo" });
  }
});


// 🧹 Eliminar producto completo con precios y descripción asociada
app.delete("/api/productos-completos/:id", async (req, res) => {
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



/**
 * ✅ Actualizar producto existente (Update)
 * Ruta: PUT /api/productos/:id
 */
app.put("/api/productos/:id", upload.single("Imagen"), async (req, res) => {
  try {
    const { id } = req.params;
    console.log("📥 Datos recibidos para actualizar:", req.body);

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID de producto no válido" });
    }

    const objectId = new ObjectId(id);
    const updateData = {};

    // 📌 Si se subió una nueva imagen, actualizarla
    if (req.file) {
      updateData.Imagen = `/uploads/${req.file.filename}`;
    }

    if (req.body.nombre) updateData.Nombre = req.body.nombre;
    if (req.body.marca) updateData.Marca = req.body.marca;
    if (req.body.peso) updateData.Peso = req.body.peso;
    if (req.body.unidadPeso) updateData.UnidadPeso = req.body.unidadPeso;
    if (req.body.estado) updateData.Estado = req.body.estado;
    if (req.body.proveedor_id)
      updateData.Proveedor_id = new ObjectId(req.body.proveedor_id);
    if (req.body.supermercado_id)
      updateData.Supermercado_id = new ObjectId(req.body.supermercado_id);
    if (req.body.usuario_id)
      updateData.Usuario_id = new ObjectId(req.body.usuario_id);

    console.log("🛠️ Datos a actualizar:", updateData);

    if (Object.keys(updateData).length === 0) {
      return res
        .status(200)
        .json({ message: "No hubo cambios en el producto." });
    }

    const result = await db
      .collection("Productos")
      .updateOne({ _id: objectId }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    console.log("✅ Producto actualizado en MongoDB:", result);
    res.json({
      message: "Producto actualizado correctamente",
      producto: updateData,
    });
  } catch (err) {
    console.error("❌ Error actualizando producto:", err);
    res.status(500).json({ error: "Error al actualizar producto" });
  }
});

/**
 * ✅ Obtener un producto por ID (Read)
 * Ruta: GET /api/productos/:id
 */
app.get("/api/productos/:id", async (req, res) => {
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

/**
 * ✅ Eliminar producto (Delete)
 * Ruta: DELETE /api/productos/:id
 */
app.delete("/api/productos/:id", async (req, res) => {
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
/**
 * ✅ Obtener precios con nombre de producto y supermercado
 * Ruta: GET /api/comparador-precios NUEVO
 */
app.get("/api/comparador-precios", async (req, res) => {
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
    console.error("❌ Error en /api/comparador-precios:", err);
    res
      .status(500)
      .json({ error: "Error al obtener precios para comparación" });
  }
});

// =============================================
// 🅴 CRUD DE PRECIOS: Ver porque no sale lista de precio historico y convertirlo en boton para verlos todos
// =============================================

/**
 * ✅ Crear un nuevo precios (Create)
 * Ruta: POST /api/precios
 */
app.post("/api/precios", async (req, res) => {
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

/**
 * ✅ Obtener todos los precios (Read)
 * Ruta: GET /api/precios
 */
app.get("/api/precios", async (req, res) => {
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

/**
 * ✅ Actualizar precios existente (Update)
 * Ruta: PUT /api/precios/:id
 */
app.put("/api/precios/:id", async (req, res) => {
  try {
    const id = new ObjectId(req.params.id);
    const updateData = req.body;

    const result = await db
      .collection("Precios")
      .updateOne({ _id: id }, { $set: updateData });

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Precio no encontrado" });
    }

    res.json({ message: "Precio actualizado correctamente" });
  } catch (err) {
    console.error("❌ Error actualizando Precio:", err);
    res.status(500).json({ error: "Error al actualizar precio" });
  }
});

/**
 * ✅ Eliminar precios (Delete)
 * Ruta: DELETE /api/precios/:id
 */
app.delete("/api/precios/:id", async (req, res) => {
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
// 🅵 CRUD DE SUPERMERCADOS
// =============================================

/**
 * ✅ Crear un nuevo supermercados (Create)
 * Ruta: POST /api/supermercados
 */
app.post("/api/supermercados", async (req, res) => {
  try {
    const { Nombre, Pais, Ciudad, Ubicacion } = req.body;

    if (!Nombre || !Pais || !Ciudad || !Ubicacion) {
      return res
        .status(400)
        .json({ error: "Todos los campos son obligatorios" });
    }

    const nuevoSupermercado = { Nombre, Pais, Ciudad, Ubicacion };

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

/**
 * ✅ Obtener todos los supermercados (Read)
 * Ruta: GET /api/supermercados
 */
app.get("/api/supermercados", async (req, res) => {
  try {
    const supermercados = await db.collection("Supermercados").find().toArray(); // 👈 Usa el nombre correcto de la colección
    console.log("📌 Supermercados encontrados:", supermercados); // 👀 Verificar en la consola del servidor
    res.json(supermercados);
  } catch (err) {
    console.error("❌ Error obteniendo supermercados:", err);
    res.status(500).json({ error: "Error al obtener supermercados" });
  }
});

/**
 * ✅ Actualizar supermercados existente (Update)
 * Ruta: PUT /api/supermercados/:id
 */
app.put("/api/supermercados/:id", async (req, res) => {
  try {
    const id = new ObjectId(req.params.id);
    const updateData = req.body;

    const result = await db
      .collection("Supermercados")
      .updateOne({ _id: id }, { $set: updateData });

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Supermercado no encontrado" });
    }

    res.json({ message: "Supermercado actualizado correctamente" });
  } catch (err) {
    console.error("❌ Error actualizando Supermercado:", err);
    res.status(500).json({ error: "Error al actualizar Supermercado" });
  }
});

/**
 * ✅ Eliminar supermercados (Delete)
 * Ruta: DELETE /api/supermercados/:id
 */
app.delete("/api/supermercados/:id", async (req, res) => {
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
// 🅶 CRUD DE DESCRIPCIÓN
// =============================================

/**
 * ✅ Crear una nueva descripción (Create)
 * Ruta: POST /api/descripcion
 */
app.post("/api/descripcion", async (req, res) => {
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

/**
 * ✅ Obtener todas las descripciones (Read)
 * Ruta: GET /api/descripcion
 */
app.get("/api/descripcion", async (req, res) => {
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
app.get("/api/descripcion/producto/:id", async (req, res) => {
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

/**
 * ✅ Actualizar descripcion existente (Update)
 * Ruta: PUT /api/descripcion/:id
 */
app.put("/api/descripcion/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID de descripción no válido" });
    }

    const updateData = req.body;

    if (updateData.Producto_id) {
      updateData.Producto_id = new ObjectId(updateData.Producto_id);
    }

    if (updateData.Ingredientes) {
      updateData.Ingredientes = Array.isArray(updateData.Ingredientes)
        ? updateData.Ingredientes
        : updateData.Ingredientes.split(",").map((i) => i.trim());
    }

    // 🔍 Buscar el nombre del producto si se está actualizando
    let productoNombre = null;
    if (updateData.Producto_id) {
      const producto = await db
        .collection("Productos")
        .findOne({ _id: updateData.Producto_id });
      if (!producto) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }
      productoNombre = producto.Nombre;
    }

    const result = await db
      .collection("Descripcion")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({ error: "Descripción no encontrada o sin cambios" });
    }

    res.json({
      message: "Descripción actualizada correctamente",
      descripcion: {
        ...updateData,
        Producto_id: productoNombre || updateData.Producto_id, // 🔹 Devolvemos el nombre si fue actualizado
      },
    });
  } catch (err) {
    console.error("❌ Error actualizando descripción:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * ✅ Eliminar Descripcion (Delete)
 * Ruta: DELETE /api/descripcion/:id
 */
app.delete("/api/descripcion/:id", async (req, res) => {
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
// 🅷 CRUD DE PROOVEDOR
// =============================================

/**
 * ✅ Crear un nuevo proovedor (Create)
 * Ruta: POST /api/proovedor
 */
app.post("/api/proveedor", async (req, res) => {
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

/**
 * ✅ Obtener todos los proovedores (Read)
 * Ruta: GET /api/descripcion
 */
app.get("/api/proveedor", async (req, res) => {
  try {
    const proveedor = await db.collection("Proveedor").find().toArray();
    res.json(proveedor);
  } catch (err) {
    console.error("❌ Error obteniendo proveedor:", err);
    res.status(500).json({ error: "Error al obtener proveedor" });
  }
});

/**
 * ✅ Actualizar proovedor existente (Update)
 * Ruta: PUT /api/proovedor/:id
 */
app.put("/api/proveedor/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // 📌 Validar el ID
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID de proveedor no válido" });
    }

    const updateData = {};
    if (req.body.Nombre) updateData.Nombre = req.body.Nombre;
    if (req.body.Pais) updateData.Pais = req.body.Pais;
    if (req.body["C.Autonoma"])
      updateData["C.Autonoma"] = req.body["C.Autonoma"];

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No se enviaron cambios" });
    }

    const result = await db
      .collection("Proveedor")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({ error: "Proveedor no encontrado o sin cambios" });
    }

    res.json({ message: "Proveedor actualizado correctamente" });
  } catch (err) {
    console.error("❌ Error actualizando proveedor:", err);
    res.status(500).json({ error: "Error al actualizar proveedor" });
  }
});

/**
 * ✅ Eliminar proovedor (Delete)
 * Ruta: DELETE /api/proovedor/:id
 */
app.delete("/api/proveedor/:id", async (req, res) => {
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
// 🅸 CRUD DE OPINIONES:
// =============================================

/**
 * ✅ Crear una nueva opinión (Create)
 * Ruta: POST /api/opiniones
 */
app.post("/api/opiniones", async (req, res) => {
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

/**
 * ✅ Obtener todas las opiniones (Read)
 * Ruta: GET /api/opiniones
 */
app.get("/api/opiniones", async (req, res) => {
  try {
    const opiniones = await db.collection("Opiniones").find().toArray();
    res.json(opiniones);
  } catch (err) {
    console.error("❌ Error obteniendo opiniones:", err);
    res.status(500).json({ error: "Error al obtener opiniones" });
  }
});

/**
 * ✅ Actualizar opinión existente (Update)
 * Ruta: PUT /api/opiniones/:id
 */
app.put("/api/opiniones/:id", async (req, res) => {
  try {
    const id = new ObjectId(req.params.id);
    const updateData = req.body;

    const result = await db
      .collection("Opiniones")
      .updateOne({ _id: id }, { $set: updateData });

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Opinion no encontrada" });
    }

    res.json({ message: "Opinion actualizada correctamente" });
  } catch (err) {
    console.error("❌ Error actualizando Opinion:", err);
    res.status(500).json({ error: "Error al actualizar Opinion" });
  }
});

/**
 * ✅ Eliminar Descripcion (Delete)
 * Ruta: DELETE /api/descripcion/:id
 */
app.delete("/api/opiniones/:id", async (req, res) => {
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

// 📊 API para obtener datos de uso del sistema
/**
 * ✅ Obtener métricas del sistema
 * Ruta: GET /api/metricas
 */
app.get("/api/metricas", async (req, res) => {
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

// 📊 API para los reportes
/**
 *
 * Ruta: GET /api/reportes
 */
app.get("/api/reportes", async (req, res) => {
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

// =============================================
// 🅳️ CRUD DE DATOS PERSONALES
// =============================================

/**
 * ✅ Obtener datos personales por usuario_id
 * Ruta: GET /api/datos-personales?usuario_id=ID
 */
app.get("/api/datos-personales", async (req, res) => {
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


/**
 * ✅ Crear un nuevo dato personal (Create)
 * Ruta: POST /api/datos-personales
 */
app.post("/api/datos-personales", async (req, res) => {
  try {
    const data = req.body;
    data.usuario_id = new ObjectId(data.usuario_id);

    const result = await db.collection("DatosUsuario").insertOne(data);
    res
      .status(201)
      .json({
        message: "Datos guardados correctamente",
        id: result.insertedId,
      });
  } catch (err) {
    console.error("❌ Error guardando datos personales:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

/**
 * ✅ Obtener todos los datos personales (Read)
 * Ruta: GET /api/datos-personales
 */
app.get("/api/datos-personales", async (req, res) => {
  try {
    const datos = await db.collection("DatosUsuario").find().toArray();
    res.json(datos);
  } catch (err) {
    console.error("❌ Error obteniendo datos personales:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

/**
 * ✅ Actualizar dato personal existente (Update)
 * Ruta: PUT /api/datos-personales/:id
 */
app.put("/api/datos-personales/:id", async (req, res) => {
  try {
    const id = new ObjectId(req.params.id); // Convierte el _id recibido en la URL en un ObjectId
    const data = req.body;

    // Convertir `usuario_id` a ObjectId si está presente en los datos
    if (data.usuario_id) {
      data.usuario_id = new ObjectId(data.usuario_id); // Convertir usuario_id a ObjectId si es una cadena
    }

    const result = await db.collection("DatosUsuario").updateOne(
      { _id: id }, // 👈 Correctamente usamos ObjectId para _id
      { $set: data }
    );

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({ error: "Datos personales no encontrados o sin cambios" });
    }

    res.json({ message: "Datos personales actualizados correctamente" });
  } catch (err) {
    console.error("❌ Error actualizando datos personales:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

/**
 * ✅ Eliminar Dato personal (Delete)
 * Ruta: DELETE /api/datos-personales/:id
 */
app.delete("/api/datos-personales/:id", async (req, res) => {
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
// 🅴 CRUD DE HISTORIAL / ACTIVIDAD DEL USUARIO
// =============================================

/**
 * ✅ Crear nuevo registro de actividad (Create)
 * Ruta: POST /api/historial
 */
app.post("/api/historial", async (req, res) => {
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

/**
 * ✅ Obtener el historial de un usuario (Read)
 * Ruta: GET /api/historial/:usuarioId
 */
app.get("/api/historial/:usuarioId", async (req, res) => {
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

/**
 * ✅ Actualizar una entrada del historial (Update)
 * Ruta: PUT /api/historial/:id
 */
app.put("/api/historial/:id", async (req, res) => {
  try {
    const id = new ObjectId(req.params.id);
    const data = req.body;

    const result = await db
      .collection("HistorialUsuario")
      .updateOne({ _id: id }, { $set: data });

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Movimiento no encontrado" });
    }

    res.json({ message: "Movimiento actualizado correctamente" });
  } catch (err) {
    console.error("❌ Error actualizando historial:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

/**
 * ✅ Eliminar entrada del historial (Delete)
 * Ruta: DELETE /api/historial/:id
 */
app.delete("/api/historial/:id", async (req, res) => {
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

/**
 * ✅ Obtener toda la actividad (Read)
 * Ruta: GET /api/historial
 */
app.get("/api/historial", async (req, res) => {
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
 * ✅ Obtener usuarios activos en los últimos 7 días
 * Ruta: GET /api/usuarios/activos-recientes
 */
app.get("/api/historial-reciente", async (req, res) => {
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

/**
 * 📊 Usuarios activos por semana real
 * Ruta: GET /api/usuarios/activos-semanales
 */
app.get("/api/usuarios/activos-semanales", async (req, res) => {
  try {
    const ahora = new Date();
    const hace28dias = new Date();
    hace28dias.setDate(hace28dias.getDate() - 28);

    const actividad = await db
      .collection("HistorialUsuario")
      .aggregate([
        {
          $match: { fecha: { $gte: hace28dias } }, // 🔥 NO SE USA ObjectId AQUÍ
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
// 📁 CRUDs para: tipos, subtipos y marcas
// =============================================

app.get("/api/tipos", async (req, res) => {
  try {
    const tipos = await db.collection("Descripcion").distinct("Tipo");
    res.json(tipos.filter(Boolean));
  } catch (err) {
    console.error("❌ Error al obtener tipos:", err);
    res.status(500).json({ error: "Error al obtener tipos" });
  }
});

app.get("/api/subtipos", async (req, res) => {
  try {
    const subtipos = await db.collection("Descripcion").distinct("Subtipo");
    res.json(subtipos.filter(Boolean));
  } catch (err) {
    console.error("❌ Error al obtener subtipos:", err);
    res.status(500).json({ error: "Error al obtener subtipos" });
  }
});

app.get("/api/marcas", async (req, res) => {
  try {
    const marcas = await db.collection("Productos").distinct("Marca");
    res.json(marcas.filter(Boolean));
  } catch (err) {
    console.error("❌ Error al obtener marcas:", err);
    res.status(500).json({ error: "Error al obtener marcas" });
  }
});
/**
 * ✅ Obtener nombres de proveedores (para los selects)
 * Ruta: GET /api/proveedores
 */
app.get("/api/proveedores", async (req, res) => {
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
