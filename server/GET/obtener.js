// server/GET/obtener.js
const express = require("express");
const router = express.Router();
const { ObjectId } = require("../conexion1");

// Ejemplos:
router.get("/api/productos", async (req, res) => { /*...*/ });

router.get("/api/productos/:id", async (req, res) => { /*...*/ });

router.get("/api/productos-completos", async (req, res) => { /*...*/ });

router.get("/api/precios", async (req, res) => { /*...*/ });

router.get("/api/supermercados", async (req, res) => { /*...*/ });

router.get("/api/proveedor", async (req, res) => { /*...*/ });

router.get("/api/descripcion", async (req, res) => { /*...*/ });

router.get("/api/opiniones", async (req, res) => { /*...*/ });

router.get("/api/historial", async (req, res) => { /*...*/ });

router.get("/api/usuarios", async (req, res) => { /*...*/ });

router.get("/api/tipos", async (req, res) => { /*...*/ });

router.get("/api/subtipos", async (req, res) => { /*...*/ });

router.get("/api/marcas", async (req, res) => { /*...*/ });

module.exports = router;
