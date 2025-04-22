
const app = express();
const fs = require("fs").promises; 






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
/**
 * ✅ Añadir todos los productos completos (Read)
 * Ruta: POST /api/productos-completos
 */
app.post("/api/productos-completos", upload.single("Imagen"), async (req, res) => {
  try {
    // ✅ Validaciones de ID
    const proveedorId = ObjectId.isValid(req.body.proveedor) ? new ObjectId(req.body.proveedor) : null;
    const supermercadoId = ObjectId.isValid(req.body.supermercado) ? new ObjectId(req.body.supermercado) : null;
    const usuarioId = ObjectId.isValid(req.body.usuario) ? new ObjectId(req.body.usuario) : null;

    // 🎯 LOG DE DEPURACIÓN
    console.log("📥 [REQ] Campos recibidos desde el cliente:");
    console.log("req.body:", req.body);
    console.log("📷 req.file (imagen):", req.file);

    // 1️⃣ Inserción del producto
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

    // 🎯 LOG NUEVO PRODUCTO
    console.log("🆕 [PRODUCTO] Datos construidos:", nuevoProducto);

    const resultadoProducto = await db.collection("Productos").insertOne(nuevoProducto);
    const productoId = resultadoProducto.insertedId;

    // 2️⃣ Inserción del precio
    const nuevoPrecio = {
      producto_id: productoId,
      precioActual: parseFloat(req.body.precioActual),
      precioDescuento: req.body.precioDescuento ? parseFloat(req.body.precioDescuento) : null,
      unidadLote: req.body.unidadLote || "N/A",
      precioUnidadLote: req.body.precioPorUnidad ? parseFloat(req.body.precioPorUnidad) : null,
      precioHistorico: parsearPrecioHistorico(req.body.precioHistorico),
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
          ? req.body.ingredientes.split(",").map(i => i.trim()).filter(i => i.length > 0)
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
});

/**
 * ✅ Obtener todos los productos completos (Read)
 * Ruta: GET /api/productos-completos
 */


/**
 * ✅ Editar todos los productos completos (Read)
 * Ruta: PUT /api/productos-completos
 */
app.put("/api/productos-completos/:id", upload.single("Imagen"), async (req, res) => {
  try {
    const { id } = req.params;
    console.log("📦 [PUT /api/productos-completos/:id] Datos recibidos:");
    console.log("req.body:", req.body);
    console.log("req.file:", req.file);

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
      Utilidad: req.body.utilidad || "Sin descripción", 
      Tipo: req.body.tipo || "Sin tipo",
      Subtipo: req.body.subtipo || "Sin subtipo",
      PaisProveedor: req.body.paisProveedor || "España",
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

    // ✅ 2️⃣ Actualizar precios
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

    // ✅ 3️⃣ Actualizar descripción
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

    // ✅ 4️⃣ Actualizar país del proveedor
    if (req.body.paisProveedor && ObjectId.isValid(req.body.proveedor)) {
      await db.collection("Proveedor").updateOne(
        { _id: new ObjectId(req.body.proveedor) },
        { $set: { Pais: req.body.paisProveedor } }
      );
    }

    // ✅ 5️⃣ Actualizar país y ciudad del supermercado
    if ((req.body.paisSupermercado || req.body.ciudad) && ObjectId.isValid(req.body.supermercado)) {
      await db.collection("Supermercados").updateOne(
        { _id: new ObjectId(req.body.supermercado) },
        {
          $set: {
            Pais: req.body.paisSupermercado || "España",
            Ciudad: req.body.ciudad || "N/A",
            Ubicacion: [req.body.ubicacion || ""]
          }
        }
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

    // ✅ Si se subió una nueva imagen, actualizamos y eliminamos la anterior
    if (req.file) {
      updateData.Imagen = `/uploads/2025/${req.file.filename}`;

      if (req.body.imagenAnterior) {
        const rutaAnterior = path.join(__dirname, "uploads", "2025", req.body.imagenAnterior);
        try {
          await fs.unlink(rutaAnterior);
          console.log("🗑️ Imagen anterior eliminada:", rutaAnterior);
        } catch (err) {
          console.warn("⚠️ No se pudo eliminar imagen anterior:", err.message);
        }
      }
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
      return res.status(200).json({ message: "No hubo cambios en el producto." });
    }

    const result = await db
      .collection("Productos")
      .updateOne({ _id: objectId }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

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


app.put("/api/precios/por-producto/:productoId", async (req, res) => {
  console.log("📥 Recibido precio actualizado:", req.body);

  try {
    const { productoId } = req.params;
    if (!ObjectId.isValid(productoId)) {
      return res.status(400).json({ error: "ID de producto no válido" });
    }

    const productoObjectId = new ObjectId(productoId);
    let updateData = req.body;

    // ✅ Parsear números (aunque vengan como strings)
    updateData.precioActual = parseFloat(updateData.precioActual) || 0;
    updateData.precioDescuento = updateData.precioDescuento ? parseFloat(updateData.precioDescuento) : null;
    updateData.precioUnidadLote = updateData.precioUnidadLote ? parseFloat(updateData.precioUnidadLote) : null;
    updateData.unidadLote = updateData.unidadLote || "N/A";

    // ✅ Asegurar que precioHistorico está bien formado
    if (typeof updateData.precioHistorico === "string") {
      const partes = updateData.precioHistorico.split(/,|\n/).map(p => p.trim());
      const historico = [];
      for (let i = 0; i < partes.length - 1; i += 2) {
        const precio = parseFloat(partes[i]);
        const año = parseInt(partes[i + 1]);
        if (!isNaN(precio) && !isNaN(año)) {
          historico.push({ precio, año });
        }
      }
      updateData.precioHistorico = historico;
    }

    // ✅ Si ya viene como array, validarlo igual
    if (Array.isArray(updateData.precioHistorico)) {
      updateData.precioHistorico = updateData.precioHistorico.map(entry => ({
        precio: parseFloat(entry.precio),
        año: parseInt(entry.año)
      })).filter(e => !isNaN(e.precio) && !isNaN(e.año));
    }

    // 🔄 Actualiza (sin upsert para evitar sobrescribir)
    const result = await db.collection("Precios").updateOne(
      { producto_id: productoObjectId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "No se encontró precio para ese producto" });
    }

    res.json({ message: "✅ Precio actualizado correctamente (por producto_id)" });

  } catch (err) {
    console.error("❌ Error en PUT /precios/por-producto:", err);
    res.status(500).json({ error: "Error interno del servidor" });
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


// 📊 API para los reportes


// =============================================
// 🅳️ CRUD DE DATOS PERSONALES
// =============================================




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
 * 📊 Usuarios activos por semana real
 * Ruta: GET /api/usuarios/activos-semanales
 */








