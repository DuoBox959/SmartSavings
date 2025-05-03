const express = require("express");
const router = express.Router();

router.use(require("../GET/obtener"));
router.use(require("../POST/enviar"));
router.use(require("../PUT/actualizar"));
router.use(require("../DELETE/eliminar"));
router.use(require("../STATIC/estatico"));

module.exports = router;
