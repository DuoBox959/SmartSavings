// ==============================
// Modal helpers (accesibles)
// ==============================
export function openModal(id) {
  const m = document.getElementById(id);
  if (!m) return;

  m.__opener = document.activeElement || null;

  m.style.display = "flex";               // o "block" según tu CSS
  m.setAttribute("aria-hidden", "false");

  requestAnimationFrame(() => {
    (m.querySelector("[autofocus], input, select, textarea, button") || m).focus();
  });
}

export function closeModal(id) {
  const m = document.getElementById(id);
  if (!m) return;

  if (m.contains(document.activeElement)) {
    document.activeElement.blur();
  }
  m.setAttribute("aria-hidden", "true");
  m.style.display = "none";

  if (m.__opener && document.body.contains(m.__opener)) {
    try { m.__opener.focus(); } catch {}
  }
}

export function setModalVisible(id, visible) {
  return visible ? openModal(id) : closeModal(id);
}

// ==============================
// 🧹 UTILIDAD GENÉRICA DE CIERRE + LIMPIEZA
// ==============================
function cerrarGenerico({ modalId, formId, ubicacionIds = [], after }) {
  const form = document.getElementById(formId);
  if (form) {
    form.querySelectorAll(".nuevo-campo").forEach((el) => { el.value = ""; el.style.display = "none"; });
    form.querySelectorAll("select").forEach((sel) => { sel.selectedIndex = 0; });
    form.querySelectorAll(".input-error").forEach((el) => el.classList.remove("input-error"));
    form.querySelectorAll('input[type="file"]').forEach((f) => (f.value = ""));
    form.querySelectorAll("details[open]").forEach((d) => (d.open = false));
    form.reset();
  }

  document.querySelectorAll('[id^="selector-ubicacion-dinamico"]').forEach((el) => (el.style.display = "none"));
  ubicacionIds.forEach((id) => { const cont = document.getElementById(id); if (cont) cont.innerHTML = ""; });

  // 👇 cierre correcto del modal (sin duplicar)
  closeModal(modalId);

  if (typeof after === "function") after();
}

// ==============================
// Cierres específicos
// ==============================
export function cerrarFormulario() {
  cerrarGenerico({
    modalId: "modal-editar",
    formId: "form-editar-producto",
    ubicacionIds: ["ubicaciones-container", "ubicaciones-container-add"],
    after: () => {
      const chk = document.getElementById("edit-editar-nombre-supermercado");
      const campo = document.getElementById("edit-nombre-supermercado-actual");
      if (chk) chk.checked = false;
      if (campo) campo.style.display = "none";
    },
  });
}

export function cerrarFormularioAgregar() {
  cerrarGenerico({
    modalId: "modal-agregar",
    formId: "form-agregar-producto",
    ubicacionIds: ["ubicaciones-container-add", "ubicaciones-container"],
  });
}
