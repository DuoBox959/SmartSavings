// conexion1.js
require("dotenv").config();
const { MongoClient, ObjectId } = require("mongodb");

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

const client = new MongoClient(uri);
let db;

async function conectarDB() {
  if (!db) {
    try {
      await client.connect();
      console.log("✅ Conectado a MongoDB Atlas");
      db = client.db(dbName);
    } catch (err) {
      console.error("❌ Error al conectar con MongoDB:", err);
      throw new Error('Conexión a MongoDB fallida');
    }
  }
  return db;
}

module.exports = { conectarDB, ObjectId };
