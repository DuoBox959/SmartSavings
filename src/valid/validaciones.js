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
  const idsExistentes = productosCache
    .map((p) => parseInt(p._id))
    .filter(Number.isInteger);
  const idsDisponibles = Array.from(
    { length: Math.max(...idsExistentes, 0) + 1 },
    (_, i) => i + 1
  ).filter((id) => !idsExistentes.includes(id));
  return idsDisponibles.length > 0
    ? idsDisponibles[0].toString()
    : (idsExistentes.length + 1).toString();
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

function validarEmailYPassword(email, password) {
  // Validación de email
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Asegura formato estándar de email
  if (!email) {
    alert('⚠️ El campo "Email" es obligatorio.');
    return false;
  }
  if (!regexEmail.test(email)) {
    alert(
      '⚠️ El campo "Email" debe contener una dirección válida (por ejemplo, usuario@dominio.com).'
    );
    return false;
  }

  // Validación de contraseña
  const regexPassword =
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%?&])[A-Za-z\d@$!%?&]{8,}$/;
  /*
      Reglas de la contraseña:
      - Mínimo 8 caracteres
      - Al menos una letra mayúscula
      - Al menos una letra minúscula
      - Al menos un número
      - Al menos un carácter especial (@, $, !, %, *, ?, &)
  */

  if (!password) {
    alert('⚠️ El campo "Contraseña" es obligatorio.');
    return false;
  }
  if (!regexPassword.test(password)) {
    alert(
      "⚠️ La contraseña debe cumplir con los siguientes requisitos:\n" +
        "- Mínimo 8 caracteres\n" +
        "- Al menos una letra mayúscula\n" +
        "- Al menos una letra minúscula\n" +
        "- Al menos un número\n" +
        "- Al menos un carácter especial (@, $, !, %, *, ?, &)"
    );
    return false;
  }

  // Si todo está bien, devuelve true
  return true;
}
