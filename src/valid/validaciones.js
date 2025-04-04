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

// 🔐 Validar seguridad de contraseña
function esPasswordSegura(password) {
  const regex = /^(?=.*[a-z])(?=.*\d).{8,}$/;
  return regex.test(password);
}


// 🔡 Eliminar espacios iniciales y finales
function limpiarEspacios(texto) {
  return texto.replace(/\s+/g, " ").trim();
}

// 🔤 Convertir a minúsculas
function aMinusculas(texto) {
  return texto.toLowerCase();
}

// ❌ Validar campos vacíos
function camposVacios(...campos) {
  return campos.some((campo) => !campo || campo.trim() === "");
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

export function esTextoValido(texto) {
  return texto.trim().length > 0;
}

export function esNumeroValido(numero) {
  return !isNaN(numero) && Number(numero) > 0;
}

export function esImagenValida(archivo) {
  if (!archivo) return false;
  const tiposValidos = ["image/jpeg", "image/png", "image/webp"];
  return tiposValidos.includes(archivo.type);
}

export function esUsernameValido(username) {
  const regex = /^(?!-)[a-zA-Z0-9-]+(?<!-)$/;
  return regex.test(username) && !username.includes(" ");
}



// ✅ Exporta todas las necesarias
export {
  limpiarEspacios,
  esEmailValido,
  esPasswordSegura,
  camposVacios,
  mostrarAlertaError,
};
