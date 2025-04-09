const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { conectarDB } = require("./conexion1");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads/2025"));

// Conexión a DB y carga de rutas
(async () => {
  const db = await conectarDB();
  app.use((req, res, next) => {
    req.db = db;
    next();
  });

  // ✅ Rutas organizadas desde carpeta src/rutasdb
app.use("/api/usuarios", require("./src/rutasdb/usuarios"));
app.use("/api/login", require("./src/rutasdb/login"));
app.use("/api/productos", require("./src/rutasdb/productos"));
app.use("/api/productos-completos", require("./src/rutasdb/productosCompletos"));
app.use("/api/precios", require("./src/rutasdb/precios"));
app.use("/api/comparador-precios", require("./src/rutasdb/comparador"));
app.use("/api/supermercados", require("./src/rutasdb/supermercados"));
app.use("/api/descripcion", require("./src/rutasdb/descripcion"));
app.use("/api/proveedor", require("./src/rutasdb/proveedor"));
app.use("/api/opiniones", require("./src/rutasdb/opiniones"));
app.use("/api/historial", require("./src/rutasdb/historial"));
app.use("/api/historial-reciente", require("./src/rutasdb/historialReciente"));
app.use("/api/datos-personales", require("./src/rutasdb/datosPersonales"));
app.use("/api/metricas", require("./src/rutasdb/metricas"));
app.use("/api/reportes", require("./src/rutasdb/reportes"));
app.use("/api/usuarios/activos-semanales", require("./src/rutasdb/usuariosActivosSemanal"));
app.use("/api/tipos", require("./src/rutasdb/tipos"));
app.use("/api/subtipos", require("./src/rutasdb/subtipos"));
app.use("/api/marcas", require("./src/rutasdb/marcas"));
app.use("/api/proveedores", require("./src/rutasdb/proveedores"));
app.use("/api/forzar-limpieza-historial", require("./src/rutasdb/limpiezaHistorialManual"));


  app.listen(process.env.PORT || 3000, () =>
    console.log(`✅ Servidor en http://localhost:${process.env.PORT || 3000}`)
  );
})();
