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

//PRODUCTOS

// ✅ Obtener todos los productos
app.get("/api/productos", async (req, res) => {
  try {
    const productos = await db.collection("Productos").find().toArray();
    res.json(productos);
  } catch (err) {
    console.error("❌ Error obteniendo productos:", err);
    res.status(500).json({ error: "Error al obtener productos" });
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

