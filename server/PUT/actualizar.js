// server/PUT/actualizar.js
const { parsearPrecioHistorico } = require("../../src/functions/global/helpers/helpers");

const express = require("express");
const router = express.Router();
const { ObjectId } = require("../../conexion1.js");
const multer = require("multer");
const path = require("path");
const fs = require('fs').promises;

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/2025/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// =============================================
// USUARIOS                                  📌
// =============================================

/**
 * ✅ Modificar un usuario existente (Update)
 * Ruta: PUT /usuarios/:id
 */
router.put("/usuarios/:id", async (req, res) => {
  const db = req.db;

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
// =============================================
// PRODUCTOS                                  📌
// =============================================
/**
 * ✅ Actualizar producto existente (Update)
 * Ruta: PUT /productos/:id
 */

router.put("/productos/:id", upload.single("Imagen"), async (req, res) => {
  const db = req.db;

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
        const rutaAnterior = path.join(
          __dirname,
          "uploads",
          "2025",
          req.body.imagenAnterior
        );

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
 * ✅ Editar todos los productos completos (Update)
 * Ruta: PUT /productos-completos/:id
 */
router.put(
  "/productos-completos/:id",
  upload.single("Imagen"),
  async (req, res) => {
    const db = req.db;

    try {
      const { id } = req.params;
      console.log("📦 [PUT /productos-completos/:id] Datos recibidos:");
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
        fechaActualizacion:
          req.body.fechaActualizacion || new Date().toISOString(),
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
      const result = await db
        .collection("Productos")
        .updateOne({ _id: objectId }, { $set: updateData });

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }

      // ✅ 2️⃣ Actualizar precios
      const nuevoPrecio = {
        producto_id: objectId,
        precioActual: parseFloat(req.body.precioActual),
        precioDescuento: req.body.precioDescuento
          ? parseFloat(req.body.precioDescuento)
          : null,
        unidadLote: req.body.unidadLote || "N/A",
        precioUnidadLote: req.body.precioPorUnidad
          ? parseFloat(req.body.precioPorUnidad)
          : null,
        precioHistorico: parsearPrecioHistorico(req.body.precioHistorico),
      };

      await db
        .collection("Precios")
        .updateOne(
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

        await db
          .collection("Descripcion")
          .updateOne(
            { Producto_id: objectId },
            { $set: descripcionActualizada },
            { upsert: true }
          );
      }

      // ✅ 4️⃣ Actualizar país del proveedor
      if (req.body.paisProveedor && ObjectId.isValid(req.body.proveedor)) {
        await db
          .collection("Proveedor")
          .updateOne(
            { _id: new ObjectId(req.body.proveedor) },
            { $set: { Pais: req.body.paisProveedor } }
          );
      }

      // ✅ 5️⃣ Actualizar país y ciudad del supermercado
      if (
        (req.body.paisSupermercado || req.body.ciudad) &&
        ObjectId.isValid(req.body.supermercado)
      ) {
        await db.collection("Supermercados").updateOne(
          { _id: new ObjectId(req.body.supermercado) },
          {
            $set: {
              Pais: req.body.paisSupermercado || "España",
              Ciudad: req.body.ciudad || "N/A",
              Ubicacion: [req.body.ubicacion || ""],
            },
          }
        );
      }

      res.json({ message: "Producto completo actualizado correctamente" });
    } catch (err) {
      console.error("❌ Error actualizando producto completo:", err);
      res
        .status(500)
        .json({ error: "Error interno al actualizar producto completo" });
    }
  }
);

// =============================================
// PRECIOS                                    📌
// =============================================

/**
 * ✅ Actualizar precios existente (Update)
 * Ruta: PUT /precios/:id
 */
router.put("/precios/:id", async (req, res) => {
  const db = req.db;

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
 * ✅ Actualizar precios por producto_id (Update)
 * Ruta: PUT /precios/por-producto/:productoId
 */
router.put("/precios/por-producto/:productoId", async (req, res) => {
  console.log("📥 Recibido precio actualizado:", req.body);

  const db = req.db;

  try {
    const { productoId } = req.params;
    if (!ObjectId.isValid(productoId)) {
      return res.status(400).json({ error: "ID de producto no válido" });
    }

    const productoObjectId = new ObjectId(productoId);
    let updateData = req.body;

    // ✅ Parsear números (aunque vengan como strings)
    updateData.precioActual = parseFloat(updateData.precioActual) || 0;
    updateData.precioDescuento = updateData.precioDescuento
      ? parseFloat(updateData.precioDescuento)
      : null;
    updateData.precioUnidadLote = updateData.precioUnidadLote
      ? parseFloat(updateData.precioUnidadLote)
      : null;
    updateData.unidadLote = updateData.unidadLote || "N/A";

    // ✅ Asegurar que precioHistorico está bien formado
    if (typeof updateData.precioHistorico === "string") {
      const partes = updateData.precioHistorico
        .split(/,|\n/)
        .map((p) => p.trim());
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
      updateData.precioHistorico = updateData.precioHistorico
        .map((entry) => ({
          precio: parseFloat(entry.precio),
          año: parseInt(entry.año),
        }))
        .filter((e) => !isNaN(e.precio) && !isNaN(e.año));
    }

    // 🔄 Actualiza (sin upsert para evitar sobrescribir)
    const result = await db
      .collection("Precios")
      .updateOne({ producto_id: productoObjectId }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res
        .status(404)
        .json({ error: "No se encontró precio para ese producto" });
    }

    res.json({
      message: "✅ Precio actualizado correctamente (por producto_id)",
    });
  } catch (err) {
    console.error("❌ Error en PUT /precios/por-producto:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// =============================================
// SUPERMERCADOS                              📌
// =============================================

/**
 * ✅ Actualizar supermercados existente (Update)
 * Ruta: PUT /supermercados/:id
 */
// router.put("/supermercados/:id", async (req, res) => {
//   const db = req.db;

//   try {
//     const id = new ObjectId(req.params.id);
//     const updateData = req.body;

//     const result = await db
//       .collection("Supermercados")
//       .updateOne({ _id: id }, { $set: updateData });

//     if (result.modifiedCount === 0) {
//       return res.status(404).json({ error: "Supermercado no encontrado" });
//     }

//     res.json({ message: "Supermercado actualizado correctamente" });
//   } catch (err) {
//     console.error("❌ Error actualizando Supermercado:", err);
//     res.status(500).json({ error: "Error al actualizar Supermercado" });
//   }
// });

router.patch("/supermercados/:id/ubicacion", async (req, res) => {
  const db = req.db;
  const supermercadoId = req.params.id;

  try {
    if (!ObjectId.isValid(supermercadoId)) {
      return res.status(400).json({ error: "ID de supermercado inválido." });
    }

    const { pais, ciudad, ubicacion } = req.body;

    if (!pais || !ciudad || !ubicacion) {
      return res.status(400).json({
        error: "Se requiere 'pais', 'ciudad' y 'ubicacion' para añadir una nueva ubicación.",
      });
    }

    const nuevaUbicacion = { pais, ciudad, ubicacion };

    // 🔍 Buscar supermercado actual
    const supermercado = await db
      .collection("Supermercados")
      .findOne({ _id: new ObjectId(supermercadoId) });

    if (!supermercado) {
      return res.status(404).json({ error: "Supermercado no encontrado." });
    }

    // 🔁 Validar si la calle ya existe (exactamente)
    const yaExiste = supermercado.Ubicaciones?.some(
      (u) => u.ubicacion === ubicacion
    );

    if (yaExiste) {
      return res.status(200).json({
        message: "Ubicación ya registrada para este supermercado.",
        ubicacion: nuevaUbicacion,
      });
    }

    // ✅ Si no existe, agregarla con $push
    await db.collection("Supermercados").updateOne(
      { _id: new ObjectId(supermercadoId) },
      { $push: { Ubicaciones: nuevaUbicacion } }
    );

    const supermercadoActualizado = await db
      .collection("Supermercados")
      .findOne({ _id: new ObjectId(supermercadoId) });

    res.status(200).json({
      message: "Ubicación añadida correctamente.",
      supermercado: supermercadoActualizado,
    });
  } catch (err) {
    console.error("❌ Error al añadir ubicación:", err);
    res
      .status(500)
      .json({ error: "Error interno del servidor al añadir ubicación." });
  }
});


// =============================================
// PROOVEDOR                                  📌
// =============================================

/**
 * ✅ Actualizar proovedor existente (Update)
 * Ruta: PUT /proovedor/:id
 */
router.put("/proveedor/:id", async (req, res) => {
  const db = req.db;

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

// =============================================
// DATOS DEL USUARIO                          📌
// =============================================

/**
 * ✅ Actualizar dato personal existente (Update)
 * Ruta: PUT /datos-personales/:id
 */
router.put("/datos-personales/:id", async (req, res) => {
  const db = req.db;

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

// =============================================
// DESCRIPCION                                📌
// =============================================

/**
 * ✅ Actualizar descripcion existente (Update)
 * Ruta: PUT /descripcion/:id
 */
router.put("/descripcion/:id", async (req, res) => {
  const db = req.db;

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

// =============================================
// OPINIONES                                  📌
// =============================================

/**
 * ✅ Actualizar opinión existente (Update)
 * Ruta: PUT /opiniones/:id
 */
router.put("/opiniones/:id", async (req, res) => {
  const db = req.db;

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

// =============================================
// HISTORIAL DEL USUARIO                      📌
// =============================================

/**
 * ✅ Actualizar una entrada del historial (Update)
 * Ruta: PUT /historial/:id
 */
router.put("/historial/:id", async (req, res) => {
  const db = req.db;

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

module.exports = router;
