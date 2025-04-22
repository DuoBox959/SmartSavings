const express = require("express");
const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 👇 Importa tus rutas divididas
const rutasPOST = require("./POST/enviar");
const rutasGET = require("./GET/obtener");
const rutasDELETE = require("./DELETE/eliminar");

// 👇 Usa tus routers
app.use(rutasPOST);
app.use(rutasGET);
app.use(rutasDELETE);
