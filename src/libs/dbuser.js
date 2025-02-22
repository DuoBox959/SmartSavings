// Usa window.PouchDB para acceder a la librería cargada desde el archivo pouchdb-9.0.0.min.js
const db = new window.PouchDB("usuarios");

const remoteDB = new window.PouchDB("http://127.0.0.1:5984/usuarios", {
  auth: {
    username: "admin", // Cambia por tu usuario de CouchDB
    password: "Dalma87", // Cambia por tu contraseña de CouchDB
  },
});

// Configura sincronización automática
db.sync(remoteDB, {
  live: true, // Mantener sincronización en tiempo real
  retry: true, // Reintentos automáticos en caso de fallo
})
  .on("change", (info) => console.log("Sincronización: cambio detectado:", info))
  .on("paused", (err) => console.log("Sincronización pausada:", err))
  .on("active", () => console.log("Sincronización reanudada."))
  .on("error", (err) => console.error("Error durante la sincronización:", err));

// Función para buscar un usuario por email sin usar índices
const findUserByEmail = async (email) => {
  try {
    const result = await db.allDocs({ include_docs: true });
    const user = result.rows.find(row => row.doc.email === email);
    return user ? user.doc : null;
  } catch (error) {
    console.error("Error buscando el usuario:", error);
    throw error; // Lanzar el error para ser manejado en el login.js
  }
};

// Exporta la base de datos y la función de búsqueda
export { db, remoteDB, findUserByEmail };
