require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/get_wit_token", (req, res) => {
    res.json({ token: process.env.WIT_ACCESS_TOKEN });
});

const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => {
    res.send("🚀 Servidor de Chatbot funcionando correctamente.");
});

app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
