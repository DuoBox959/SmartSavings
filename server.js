// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { conectarDB } = require("./conexion1");

const app = express();
app.use(cors());
app.use(express.json());

let db;

// 🔌 Conectar a MongoDB Atlas
(async () => {
  try {
    db = await conectarDB();
    console.log("✅ Conectado correctamente a MongoDB Atlas");

    // 🔍 Verificar qué base de datos se está usando
    console.log("📌 Base de datos seleccionada:", db.databaseName);

    // 🔍 Verificar si la colección "usuarios" existe
    const collections = await db.listCollections().toArray();
    console.log("📌 Colecciones disponibles:", collections.map(c => c.name));

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

//USUARIOS

// ✅ Obtener todos los usuarios
app.get("/api/usuarios", async (req, res) => {
  try {
    const usuarios = await db.collection("Usuarios").find().toArray();
    res.json(usuarios);
  } catch (err) {
    console.error("❌ Error obteniendo usuarios:", err);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

// ✅ Crear nuevo usuario
app.post("/api/usuarios", async (req, res) => {
  try {
    const nuevoUsuario = req.body;
    await db.collection("Usuarios").insertOne(nuevoUsuario);
    res.status(201).json({ message: "Usuario creado correctamente" });
  } catch (err) {
    console.error("❌ Error creando usuario:", err);
    res.status(500).json({ error: "Error al crear usuario" });
  }
});

// ✅ Actualizar usuario
app.put("/api/usuarios/:id", async (req, res) => {
  try {
    const id = new ObjectId(req.params.id);
    const updateData = req.body;

    const result = await db.collection("Usuarios").updateOne(
      { _id: id },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ message: "Usuario actualizado correctamente" });
  } catch (err) {
    console.error("❌ Error actualizando usuario:", err);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
});

// ✅ Eliminar usuario
app.delete("/api/usuarios/:id", async (req, res) => {
  try {
    const id = new ObjectId(req.params.id);
    const result = await db.collection("Usuarios").deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ message: "Usuario eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error eliminando usuario:", err);
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
});

//PRODUCTO

// ✅ Ruta para iniciar sesión
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // ⚠️ Verificar datos ingresados
    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son requeridos" });
    }

    // 🔍 Buscar usuario en la BD
    const user = await db.collection("Usuarios").findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // 🔑 Comparar la contraseña directamente (SIN bcrypt)
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

// ✅ Crear nuevo producto
app.post("/api/productos", async (req, res) => {
  try {
    const nuevoProducto = req.body;
    await db.collection("Productos").insertOne(nuevoProducto);
    res.status(201).json({ message: "Producto creado correctamente" });
  } catch (err) {
    console.error("❌ Error creando Producto:", err);
    res.status(500).json({ error: "Error al crear Producto" });
  }
});

// ✅ Actualizar producto
app.put("/api/productos/:id", async (req, res) => {
  try {
    const id = new ObjectId(req.params.id);
    const updateData = req.body;

    const result = await db.collection("Productos").updateOne(
      { _id: id },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json({ message: "Producto actualizado correctamente" });
  } catch (err) {
    console.error("❌ Error actualizando Producto:", err);
    res.status(500).json({ error: "Error al actualizar producto" });
  }
});

// ✅ Eliminar producto
app.delete("/api/productos/:id", async (req, res) => {
  try {
    const id = new ObjectId(req.params.id);
    const result = await db.collection("Productos").deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json({ message: "Producto eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error eliminando producto:", err);
    res.status(500).json({ error: "Error al eliminar producto" });
  }
});

//PRECIOS

// ✅ Obtener todos los precios
app.get("/api/precios", async (req, res) => {
  try {
    const precios = await db.collection("Precios").find().toArray();
    res.json(precios);
  } catch (err) {
    console.error("❌ Error obteniendo precios:", err);
    res.status(500).json({ error: "Error al obtener precios" });
  }
});

// ✅ Crear nuevo precio
app.post("/api/precios", async (req, res) => {
  try {
    const nuevoPrecio = req.body;
    await db.collection("Precios").insertOne(nuevoPrecio);
    res.status(201).json({ message: "Precio creado correctamente" });
  } catch (err) {
    console.error("❌ Error creando Precio:", err);
    res.status(500).json({ error: "Error al crear Precio" });
  }
});

// ✅ Actualizar precio
app.put("/api/precios/:id", async (req, res) => {
  try {
    const id = new ObjectId(req.params.id);
    const updateData = req.body;

    const result = await db.collection("Precios").updateOne(
      { _id: id },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Precio no encontrado" });
    }

    res.json({ message: "Precio actualizado correctamente" });
  } catch (err) {
    console.error("❌ Error actualizando Precio:", err);
    res.status(500).json({ error: "Error al actualizar precio" });
  }
});

// ✅ Eliminar precio
app.delete("/api/precios/:id", async (req, res) => {
  try {
    const id = new ObjectId(req.params.id);
    const result = await db.collection("Precios").deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Precio no encontrado" });
    }

    res.json({ message: "Precio eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error eliminando precio:", err);
    res.status(500).json({ error: "Error al eliminar precio" });
  }
});

//SUPERMERCADO

// ✅ Obtener todos los supermercados
app.get("/api/supermercados", async (req, res) => {
  try {
    const supermercados = await db.collection("Supermecados").find().toArray();
    res.json(supermercados);
  } catch (err) {
    console.error("❌ Error obteniendo supermercados:", err);
    res.status(500).json({ error: "Error al obtener supermercados" });
  }
});

// ✅ Crear nuevo supermercados
app.post("/api/supermercados", async (req, res) => {
  try {
    const nuevoSupermercado = req.body;
    await db.collection("Supermercado").insertOne(nuevoSupermercado);
    res.status(201).json({ message: "Supermercado creado correctamente" });
  } catch (err) {
    console.error("❌ Error creando Supermercado:", err);
    res.status(500).json({ error: "Error al crear Supermercado" });
  }
});

// ✅ Actualizar supermercado
app.put("/api/supermercados/:id", async (req, res) => {
  try {
    const id = new ObjectId(req.params.id);
    const updateData = req.body;

    const result = await db.collection("Supermercados").updateOne(
      { _id: id },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Supermercado no encontrado" });
    }

    res.json({ message: "Supermercado actualizado correctamente" });
  } catch (err) {
    console.error("❌ Error actualizando Supermercado:", err);
    res.status(500).json({ error: "Error al actualizar Supermercado" });
  }
});

// ✅ Eliminar supermercado
app.delete("/api/supermercados/:id", async (req, res) => {
  try {
    const id = new ObjectId(req.params.id);
    const result = await db.collection("Supermercados").deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Supermercado no encontrado" });
    }

    res.json({ message: "Supermercado eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error eliminando supermercado:", err);
    res.status(500).json({ error: "Error al eliminar supermercado" });
  }
});

//DESCRIPCION

// ✅ Obtener todos los supermercados
app.get("/api/descripcion", async (req, res) => {
  try {
    const descripcion = await db.collection("Descripcion").find().toArray();
    res.json(descripcion);
  } catch (err) {
    console.error("❌ Error obteniendo descripcion:", err);
    res.status(500).json({ error: "Error al obtener descripcion" });
  }
});

// ✅ Crear nueva descripcion
app.post("/api/descripcion", async (req, res) => {
  try {
    const nuevaDescripcion = req.body;
    await db.collection("Descripcion").insertOne(nuevaDescripcion);
    res.status(201).json({ message: "Descripcion creada correctamente" });
  } catch (err) {
    console.error("❌ Error creando Descripcion:", err);
    res.status(500).json({ error: "Error al crear Descripcion" });
  }
});

// ✅ Actualizar descripcion
app.put("/api/descripcion/:id", async (req, res) => {
  try {
    const id = new ObjectId(req.params.id);
    const updateData = req.body;

    const result = await db.collection("Descripcion").updateOne(
      { _id: id },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Descripcion no encontrado" });
    }

    res.json({ message: "Descripcion actualizado correctamente" });
  } catch (err) {
    console.error("❌ Error actualizando Descripcion:", err);
    res.status(500).json({ error: "Error al actualizar Descripcion" });
  }
});

// ✅ Eliminar descripcion
app.delete("/api/descripcion/:id", async (req, res) => {
  try {
    const id = new ObjectId(req.params.id);
    const result = await db.collection("Descripcion").deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Descripcion no encontrado" });
    }

    res.json({ message: "Descripcion eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error eliminando Descripcion:", err);
    res.status(500).json({ error: "Error al eliminar Descripcion" });
  }
});

//PROVEEDOR

// ✅ Obtener todos los proveedores
app.get("/api/proveedor", async (req, res) => {
  try {
    const proveedor = await db.collection("Proveedor").find().toArray();
    res.json(proveedor);
  } catch (err) {
    console.error("❌ Error obteniendo proveedor:", err);
    res.status(500).json({ error: "Error al obtener proveedor" });
  }
});

// ✅ Crear nuevo proveedor
app.post("/api/proveedor", async (req, res) => {
  try {
    const nuevoProveedor = req.body;
    await db.collection("Proveedor").insertOne(nuevoProveedor);
    res.status(201).json({ message: "Proveedor creado correctamente" });
  } catch (err) {
    console.error("❌ Error creando Proveedor:", err);
    res.status(500).json({ error: "Error al crear Proveedor" });
  }
});

// ✅ Actualizar proveedor
app.put("/api/proveedor/:id", async (req, res) => {
  try {
    const id = new ObjectId(req.params.id);
    const updateData = req.body;

    const result = await db.collection("Proveedor").updateOne(
      { _id: id },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Proveedor no encontrado" });
    }

    res.json({ message: "Proveedor actualizado correctamente" });
  } catch (err) {
    console.error("❌ Error actualizando Proveedor:", err);
    res.status(500).json({ error: "Error al actualizar Proveedor" });
  }
});

// ✅ Eliminar proveedor
app.delete("/api/proveedor/:id", async (req, res) => {
  try {
    const id = new ObjectId(req.params.id);
    const result = await db.collection("Proveedor").deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Proveedor no encontrado" });
    }

    res.json({ message: "Proveedor eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error eliminando Proveedor:", err);
    res.status(500).json({ error: "Error al eliminar Proveedor" });
  }
});

//OPINIONES

// ✅ Obtener todas las opiniones
app.get("/api/opiniones", async (req, res) => {
  try {
    const opiniones = await db.collection("Opiniones").find().toArray();
    res.json(opiniones);
  } catch (err) {
    console.error("❌ Error obteniendo opiniones:", err);
    res.status(500).json({ error: "Error al obtener opiniones" });
  }
});

// ✅ Crear nueva opinion
app.post("/api/opiniones", async (req, res) => {
  try {
    const nuevaOpinion = req.body;
    await db.collection("Opiniones").insertOne(nuevaOpinion);
    res.status(201).json({ message: "Opinion creado correctamente" });
  } catch (err) {
    console.error("❌ Error creando Opinion:", err);
    res.status(500).json({ error: "Error al crear Opinion" });
  }
});

// ✅ Actualizar opinion
app.put("/api/opiniones/:id", async (req, res) => {
  try {
    const id = new ObjectId(req.params.id);
    const updateData = req.body;

    const result = await db.collection("Opinion").updateOne(
      { _id: id },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Opinion no encontrada" });
    }

    res.json({ message: "Opinion actualizada correctamente" });
  } catch (err) {
    console.error("❌ Error actualizando Opinion:", err);
    res.status(500).json({ error: "Error al actualizar Opinion" });
  }
});

// ✅ Eliminar opinion
app.delete("/api/opiniones/:id", async (req, res) => {
  try {
    const id = new ObjectId(req.params.id);
    const result = await db.collection("Opiniones").deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Opinion no encontrada" });
    }

    res.json({ message: "Opinion eliminada correctamente" });
  } catch (err) {
    console.error("❌ Error eliminando Opinion:", err);
    res.status(500).json({ error: "Error al eliminar Opinion" });
  }
});



