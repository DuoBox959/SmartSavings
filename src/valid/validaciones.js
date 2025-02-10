

// 📋 Validaciones para los campos del formulario
async function asignarIDDisponible() {
  try {
    // 🔍 Obtener todos los documentos desde la base de datos
    const result = await db.allDocs({ include_docs: true });

    console.log("📄 Documentos obtenidos:", result.rows); // DEPURACIÓN

    // 🔢 Extraer IDs existentes y convertirlos a números enteros solo si son numéricos
    const idsExistentes = result.rows
      .map((row) => row.doc._id) // Obtener `_id`
      .filter((id) => /^\d+$/.test(id)) // Solo IDs numéricos
      .map((id) => parseInt(id, 10)) // Convertir a número
      .sort((a, b) => a - b); // Ordenar de menor a mayor

    console.log("🔢 IDs existentes:", idsExistentes); // DEPURACIÓN

    if (idsExistentes.length === 0) return "1"; // Si no hay productos, empezar en "1"

    // 🔎 Buscar el primer ID libre en la secuencia
    for (let i = 0; i < idsExistentes.length; i++) {
      if (idsExistentes[i] !== i + 1) {
        console.log("✅ ID asignado:", (i + 1).toString()); // DEPURACIÓN
        return (i + 1).toString(); // Devuelve el primer ID faltante
      }
    }

    // Si no hay huecos, asignar el siguiente número disponible
    const nuevoID = (idsExistentes[idsExistentes.length - 1] + 1).toString();
    console.log("✅ Nuevo ID asignado:", nuevoID); // DEPURACIÓN
    return nuevoID;
  } catch (error) {
    console.error("❌ Error obteniendo ID disponible:", error);
    return new Date().getTime().toString(); // Alternativa: ID basado en timestamp si hay error
  }
}

// Asigna un nuevo ID disponible basado en los IDs existentes
async function asignarIDDisponible() {
  try {
    // 🔍 Obtener todos los documentos desde la base de datos
    const result = await db.allDocs({ include_docs: true });

    // 🔢 Extraer IDs existentes y convertirlos a números enteros
    const idsExistentes = result.rows
      .map((row) => parseInt(row.doc._id)) // Convertir `_id` a número
      .filter(Number.isInteger) // Filtrar solo valores enteros válidos
      .sort((a, b) => a - b); // Ordenar de menor a mayor

    if (idsExistentes.length === 0) return "1"; // Si no hay productos, empezar en "1"

    // 🔎 Buscar el primer ID libre en la secuencia
    for (let i = 0; i < idsExistentes.length; i++) {
      if (idsExistentes[i] !== i + 1) {
        return (i + 1).toString(); // Devuelve el primer ID faltante
      }
    }

    // Si no hay huecos, asignar el siguiente número disponible
    return (idsExistentes[idsExistentes.length - 1] + 1).toString();
  } catch (error) {
    console.error("❌ Error obteniendo ID disponible:", error);
    return "1"; // Si hay error, evitar que falle el código
  }
}

// 🔧 Asignar valores predeterminados a los campos opcionales
function asignarValoresPredeterminados() {
  // Obtener valores actuales de los campos opcionales
  const marcaProducto = $("#marcaProducto").val().trim();
  const precioLote = $("#precioLote").val();
  const ubicacionSupermercado = $("#ubicacionSupermercado").val().trim();

  // Si no se proporciona un valor, asignar valores predeterminados
  $("#marcaProducto").val(marcaProducto || "-"); // Predeterminado: "-"
  $("#precioLote").val(precioLote || "0"); // Predeterminado: "0"
  $("#ubicacionSupermercado").val(ubicacionSupermercado || "-"); // Predeterminado: "-"
}
