// 📋 Validaciones para los campos del formulario
function validarCamposFormulario() {
  // Obtener valores de los campos del formulario
  const nombreProducto = $("#nombreProducto").val().trim();
  const marcaProducto = $("#marcaProducto").val().trim();
  const precioUnidad = $("#precioUnidad").val();
  const precioLote = $("#precioLote").val();
  const supermercado = $("#nombreSupermercado").val().trim();

  // Expresión regular para validar letras, números, espacios y caracteres acentuados
  const regexLetrasNumerosEspacios = /^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑüÜ]+$/;

  // 🔍 Validación de campo "Producto" (obligatorio y caracteres válidos)
  if (!nombreProducto) {
    alert('El campo "Producto" es obligatorio.');
    return false;
  }
  if (!regexLetrasNumerosEspacios.test(nombreProducto)) {
    alert(
      'El campo "Producto" solo puede contener letras, números, espacios y caracteres acentuados.'
    );
    return false;
  }

  // 🔍 Validación de campo "Precio Unidad" (obligatorio y >= 0)
  if (!precioUnidad || parseFloat(precioUnidad) < 0) {
    alert(
      'El campo "Precio Unidad" es obligatorio y debe ser un número mayor o igual a 0.'
    );
    return false;
  }

  // 🔍 Validación de campo "Precio Lote" (opcional pero no negativo)
  if (precioLote && parseFloat(precioLote) < 0) {
    alert('El campo "Precio Lote" no puede ser un número negativo.');
    return false;
  }

  // 🔍 Validación de campo "Marca" (opcional pero caracteres válidos)
  if (marcaProducto && !regexLetrasNumerosEspacios.test(marcaProducto)) {
    alert(
      'El campo "Marca" solo puede contener letras, números, espacios y caracteres acentuados.'
    );
    return false;
  }

  // 🔍 Validación de campo "Supermercado" (obligatorio y caracteres válidos)
  if (!supermercado) {
    alert('El campo "Supermercado" es obligatorio.');
    return false;
  }
  if (!regexLetrasNumerosEspacios.test(supermercado)) {
    alert(
      'El campo "Supermercado" solo puede contener letras, números, espacios y caracteres acentuados.'
    );
    return false;
  }

  // ✅ Si todas las validaciones pasan, devuelve `true`
  return true;
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
