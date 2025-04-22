// server/DELETE/eliminar.js
const express = require("express");
const router = express.Router();
const { ObjectId } = require("../conexion1");

// Ejemplos:
router.delete("/api/productos/:id", async (req, res) => { /*...*/ });

router.delete("/api/precios/:id", async (req, res) => { /*...*/ });

router.delete("/api/supermercados/:id", async (req, res) => { /*...*/ });

router.delete("/api/proveedor/:id", async (req, res) => { /*...*/ });

router.delete("/api/descripcion/:id", async (req, res) => { /*...*/ });

router.delete("/api/opiniones/:id", async (req, res) => { /*...*/ });

router.delete("/api/historial/:id", async (req, res) => { /*...*/ });

router.delete("/api/usuarios/:id", async (req, res) => { /*...*/ });

module.exports = router;
