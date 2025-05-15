// ==============================
// 🧹 CERRAR Y LIMPIAR FORMULARIO DE EDICIÓN
// ==============================
export function cerrarFormulario() {
  const form = document.getElementById("form-editar-producto");
  if (form) {
    form.reset(); // 🔄 Resetea todos los campos del formulario
  }

  const modal = document.getElementById("modal-editar");
  if (modal) {
    modal.style.display = "none"; // 🔒 Oculta el modal de edición
  }

  const ubicaciones = document.getElementById("ubicaciones-container");
  if (ubicaciones) {
    ubicaciones.innerHTML = ""; // 🔥 Elimina cualquier grupo dinámico de ubicación añadido
  }
}

// ==============================
// 🧹 CERRAR Y LIMPIAR FORMULARIO DE AGREGADO
// ==============================
export function cerrarFormularioAgregar() {
  const form = document.getElementById("form-agregar-producto");
  if (form) {
    form.reset(); // 🔄 Resetea todos los campos del formulario
  }

  const modal = document.getElementById("modal-agregar");
  if (modal) {
    modal.style.display = "none"; // 🔒 Oculta el modal de agregar
  }

  const ubicaciones = document.getElementById("ubicaciones-container-add");
  if (ubicaciones) {
    ubicaciones.innerHTML = ""; // 🔥 Elimina los inputs dinámicos de ubicación añadidos en el modal de "add"
  }
}
