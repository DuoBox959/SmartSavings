// Usa window.PouchDB para acceder a la librería cargada desde el archivo pouchdb-9.0.0.min.js
const db = new window.PouchDB("comparacion_precios_2");

const remoteDB = new window.PouchDB("http://127.0.0.1:5984/comparacion_precios_2", {
  auth: {
    username: "admin", // Cambia por tu usuario de CouchDB
    password: "Dalma87", // Cambia por tu contraseña de CouchDB
  },
});

// Configura sincronización automática
db.sync(remoteDB, {
  live: true, // Sincronización en tiempo real
  retry: true, // Reintentos automáticos
})
  .on("change", (info) => console.log("Sincronización: cambio detectado:", info))
  .on("paused", (err) => console.log("Sincronización pausada:", err))
  .on("active", () => console.log("Sincronización reanudada."))
  .on("error", (err) => console.error("Error durante la sincronización:", err));

// Exporta la base de datos para uso en otros módulos
export { db, remoteDB };
