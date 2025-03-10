// conexion.js
const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://duobox959:yjlf3ZTmBoneNIua@comparadorprecios.qawi7.mongodb.net/?retryWrites=true&w=majority&appName=ComparadorPrecios";

const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("✅ Conexión exitosa a MongoDB Atlas");

    const db = client.db("miappdb");
    const collection = db.collection("usuarios");

    const result = await collection.insertOne({ nombre: "Juan", correo: "juan@example.com" });

    console.log("📥 Documento insertado con ID:", result.insertedId);
  } catch (err) {
    console.error("❌ Error de conexión:", err);
  } finally {
    await client.close();
  }
}

run();
