// 📋 Validaciones para los campos del formulario 
async function asignarIDDisponible() {
  try {
    // 🔍 Obtener todos los documentos desde la base de datos
    const result = await db.allDocs({ include_docs: true });

    // 🔢 Extraer IDs existentes y convertirlos a números enteros
    const idsExistentes = result.rows
      .map((row) => parseInt(row.doc._id))
      .filter(Number.isInteger)
      .sort((a, b) => a - b);

    if (idsExistentes.length === 0) return "1";

    for (let i = 0; i < idsExistentes.length; i++) {
      if (idsExistentes[i] !== i + 1) {
        return (i + 1).toString();
      }
    }

    return (idsExistentes[idsExistentes.length - 1] + 1).toString();
  } catch (error) {
    console.error("❌ Error obteniendo ID disponible:", error);
    return new Date().getTime().toString(); // Alternativa
  }
}

// 🔧 Asignar valores predeterminados a los campos opcionales
function asignarValoresPredeterminados() {
  const marcaProducto = $("#marcaProducto").val().trim();
  const precioLote = $("#precioLote").val();
  const ubicacionSupermercado = $("#ubicacionSupermercado").val().trim();

  $("#marcaProducto").val(marcaProducto || "-");
  $("#precioLote").val(precioLote || "0");
  $("#ubicacionSupermercado").val(ubicacionSupermercado || "-");
}

// =======================
// ✅ VALIDACIONES COMUNES
// =======================

// 📧 Validar formato de email
function esEmailValido(correo) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(correo);
}

// 🔐 Validar longitud mínima de contraseña
function esPasswordSegura(password, longitudMinima = 6) {
  return password.length >= longitudMinima;
}

// 🔡 Eliminar espacios iniciales y finales
function limpiarEspacios(texto) {
  return texto.trim();
}

// 🔤 Convertir a minúsculas
function aMinusculas(texto) {
  return texto.toLowerCase();
}

// ❌ Validar campos vacíos
function camposVacios(...campos) {
  return campos.some(campo => !campo || campo.trim() === "");
}

// ⚠️ SweetAlert para errores
function mostrarAlertaError(titulo, mensaje) {
  Swal.fire({
    icon: "warning",
    title: titulo,
    text: mensaje,
    confirmButtonText: "Aceptar",
  });
}
