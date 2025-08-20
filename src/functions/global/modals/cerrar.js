// ==============================
// 🧹 UTILIDAD GENÉRICA DE CIERRE + LIMPIEZA
// ==============================
function cerrarGenerico({ modalId, formId, ubicacionIds = [], after }) {
  // 1) Form: reset + limpieza visual extra
  const form = document.getElementById(formId);
  if (form) {
    // Oculta y limpia inputs "nuevo-campo"
    form.querySelectorAll(".nuevo-campo").forEach((el) => {
      el.value = "";
      el.style.display = "none";
    });

    // Restablece selects al primer option
    form.querySelectorAll("select").forEach((sel) => {
      sel.selectedIndex = 0;
    });

    // Quita marcas de error
    form.querySelectorAll(".input-error").forEach((el) => el.classList.remove("input-error"));

    // Limpia inputs file
    form.querySelectorAll('input[type="file"]').forEach((f) => (f.value = ""));

    // Cierra <details>
    form.querySelectorAll("details[open]").forEach((d) => (d.open = false));

    // Reset general
    form.reset();
  }

  // 2) Oculta cualquier bloque de ubicación dinámico (soporta IDs duplicados/variantes)
  document
    .querySelectorAll('[id^="selector-ubicacion-dinamico"]')
    .forEach((el) => (el.style.display = "none"));

  // 3) Limpia contenedores de ubicaciones (acepta varias opciones de ID)
  ubicacionIds.forEach((id) => {
    const cont = document.getElementById(id);
    if (cont) cont.innerHTML = "";
  });

  // 4) Oculta modal y marca aria-hidden
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
  }

  // 5) Hooks específicos del modal
  if (typeof after === "function") after();
}

// ==============================
// 🧹 CERRAR Y LIMPIAR FORMULARIO DE EDICIÓN
// ==============================
export function cerrarFormulario() {
  cerrarGenerico({
    modalId: "modal-editar",
    formId: "form-editar-producto",
    // Soporta ambos IDs por si en tu HTML usaste uno u otro:
    ubicacionIds: ["ubicaciones-container", "ubicaciones-container-add"],
    after: () => {
      // Desmarca y oculta el input para renombrar supermercado (si existe)
      const chk = document.getElementById("edit-editar-nombre-supermercado");
      const campo = document.getElementById("edit-nombre-supermercado-actual");
      if (chk) chk.checked = false;
      if (campo) campo.style.display = "none";
    },
  });
}

// ==============================
// 🧹 CERRAR Y LIMPIAR FORMULARIO DE AGREGADO
// ==============================
export function cerrarFormularioAgregar() {
  cerrarGenerico({
    modalId: "modal-agregar",
    formId: "form-agregar-producto",
    // En "Agregar" normalmente usas este:
    ubicacionIds: ["ubicaciones-container-add", "ubicaciones-container"],
  });
}
