// Inicializa PouchDB para la base de datos local
const db = new PouchDB("comparacion_precios_2");

// Inicializa CouchDB remoto (ajusta usuario y contraseña según tu configuración)
const remoteDB = new PouchDB("http://127.0.0.1:5984/comparacion_precios_2", {
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
  .on("change", (info) =>
    console.log("Sincronización: cambio detectado:", info)
  )
  .on("paused", (err) => console.log("Sincronización pausada:", err))
  .on("active", () => console.log("Sincronización reanudada."))
  .on("error", (err) =>
    console.error("Error durante la sincronización:", err)
  );

// Exportar la base de datos para uso en otros archivos
export { db, remoteDB };
