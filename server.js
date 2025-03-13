// server.js
const { conectarDB, ObjectId } = require("./conexion1");

require("dotenv").config();
const express = require("express");
const cors = require("cors");

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
    console.log("📥 Recibiendo solicitud para crear usuario...");
    console.log("📌 Datos recibidos:", req.body);

    const { nombre, pass, email, rol } = req.body;

    if (!nombre || !pass || !email || !rol) {
      console.error("❌ Faltan datos obligatorios.");
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    const nuevoUsuario = {
      nombre,
      pass,
      email,
      fechaRegistro: new Date().toISOString(),
      rol
    };

    console.log("📤 Insertando en MongoDB:", nuevoUsuario);
    const result = await db.collection("Usuarios").insertOne(nuevoUsuario);
    console.log("✅ Resultado de la inserción:", result);

    if (result.insertedId) {
      nuevoUsuario._id = result.insertedId; // ✅ Agregamos el _id al objeto
      console.log("✅ Usuario agregado correctamente:", nuevoUsuario);
      return res.status(201).json({
        message: "Usuario creado correctamente",
        usuario: nuevoUsuario // ✅ Ahora sí devuelve el usuario con el _id
      });
    } else {
      console.error("❌ Error al insertar usuario en MongoDB.");
      return res.status(500).json({ error: "Error al guardar el usuario en la base de datos" });
    }
  } catch (err) {
    console.error("❌ Error creando usuario:", err);
    res.status(500).json({ error: "Error al crear usuario" });
  }
});





// ✅ Actualizar usuario
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

    const result = await db.collection("Usuarios").updateOne(
      { _id: objectId },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Usuario no encontrado o sin cambios" });
    }

    res.json({ message: "Usuario actualizado correctamente", usuario: updateData });
  } catch (err) {
    console.error("❌ Error actualizando usuario:", err);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
});



// ✅ Eliminar usuario
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
