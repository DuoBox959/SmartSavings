// ==============================
// 🔗 Imports
// ==============================
import { API_BASE } from "../UTILS/utils.js";
import { volverAtras } from "../funciones.js";
import { cerrarFormularioAgregar, cerrarFormulario } from "../modals/cerrar.js";
import { agregarUbicacionAdd, toggleNuevoCampo } from "../helpers/helpers.js";
import { cargarUbicaciones } from "../selects/carga.js";

// ==============================
// 🧰 Inicializadores generales
// ==============================
export function inicializarBotonesGlobales() {
  // 🔙 Volver atrás
  const btnVolverAtras = document.getElementById("btn-volver-atras");
  if (btnVolverAtras) btnVolverAtras.addEventListener("click", volverAtras);

  // ❌ Cerrar modales
  document.getElementById("btn-cerrar-editar")?.addEventListener("click", cerrarFormulario);
  document.getElementById("btn-cerrar-agregar")?.addEventListener("click", cerrarFormularioAgregar);
  document.getElementById("btn-cancelar-editar")?.addEventListener("click", cerrarFormulario);
  document.getElementById("btn-cancelar-agregar")?.addEventListener("click", cerrarFormularioAgregar);

  // ➕ Añadir ubicación (EN EL MODAL DE EDITAR – tu contenedor es `ubicaciones-container-add`)
  const btnAgregarUbicacion = document.getElementById("btn-agregar-ubicacion");
  if (btnAgregarUbicacion) btnAgregarUbicacion.addEventListener("click", agregarUbicacionAdd);
}

export function inicializarSelectsDinamicos() {
  const campos = ["marca", "tipo", "subtipo", "proveedor", "supermercado"];

  campos.forEach((campo) => {
    const selectAdd = document.getElementById(`add-${campo}-select`);
    if (selectAdd) selectAdd.addEventListener("change", () => toggleNuevoCampo("add", campo));

    const selectEdit = document.getElementById(`edit-${campo}-select`);
    if (selectEdit) selectEdit.addEventListener("change", () => toggleNuevoCampo("edit", campo));
  });
}

// ==============================
// 📍 Lógica dinámica: ubicación (solo modal AGREGAR)
// ==============================

// Supermercado (existente vs nuevo)
const supermercadoSelect = document.getElementById("add-supermercado-select");
if (supermercadoSelect) {
  supermercadoSelect.addEventListener("change", async (e) => {
    const supermercadoId = e.target.value;

    const cont = document.getElementById("selector-ubicacion-dinamico");
    const paisSel = document.getElementById("add-pais-existente");
    const inpPais = document.getElementById("add-nuevo-pais");
    const ciudadSel = document.getElementById("add-ciudad-existente");
    const inpCiudad = document.getElementById("add-nueva-ciudad");
    const ubicSel = document.getElementById("add-ubicacion-existente");
    const inpUbic = document.getElementById("add-nueva-ubicacion");

    if (!cont) return;

    // reset visual
    const hide = (el) => el && (el.style.display = "none");
    const show = (el) => el && (el.style.display = "inline-block");

    if (!supermercadoId) {
      cont.style.display = "none";
      return;
    }

    // 🆕 NUEVO supermercado → mostramos inputs manuales
    if (supermercadoId === "nuevo") {
      cont.style.display = "block";
      hide(paisSel);   show(inpPais);
      hide(ciudadSel); show(inpCiudad);
      hide(ubicSel);   show(inpUbic);
      return;
    }

    // 🗂️ EXISTENTE → mostramos selects con datos del súper elegido
    cont.style.display = "block";
    show(paisSel);   hide(inpPais);
    hide(ciudadSel); hide(inpCiudad);
    hide(ubicSel);   hide(inpUbic);

    try {
      const supermercados = await fetch(`${API_BASE}/api/supermercados`).then((r) => r.json());
      const supermercado = supermercados.find((s) => s._id === supermercadoId);
      if (!supermercado || !Array.isArray(supermercado.Ubicaciones)) return;

      const paises = [...new Set(
        supermercado.Ubicaciones
          .map((u) => u.Pais)
          .filter((p) => typeof p === "string" && p.trim() !== "" && p !== "undefined")
      )];

      paisSel.innerHTML = `<option value="">Selecciona un país</option>`;
      paises.forEach((p) => (paisSel.innerHTML += `<option value="${p}">${p}</option>`));
      paisSel.innerHTML += `<option value="nuevo">Otro (nuevo país)</option>`;

      // autoselect si solo hay uno
      if (paises.length === 1) {
        paisSel.value = paises[0];
        paisSel.dispatchEvent(new Event("change"));
      }
    } catch (err) {
      console.error("❌ Error cargando países del supermercado:", err);
    }
  });
}

// País
const paisSelect = document.getElementById("add-pais-existente");
if (paisSelect) {
  paisSelect.addEventListener("change", async (e) => {
    const pais = e.target.value;
    const supId = document.getElementById("add-supermercado-select")?.value;

    const inpPais = document.getElementById("add-nuevo-pais");
    const ciudadSel = document.getElementById("add-ciudad-existente");
    const inpCiudad = document.getElementById("add-nueva-ciudad");
    const ubicSel = document.getElementById("add-ubicacion-existente");
    const inpUbic = document.getElementById("add-nueva-ubicacion");

    const hide = (el) => el && (el.style.display = "none");
    const show = (el) => el && (el.style.display = "inline-block");

    if (pais === "nuevo") {
      show(inpPais);
      hide(ciudadSel); show(inpCiudad);
      hide(ubicSel);   show(inpUbic);
      return;
    }

    hide(inpPais);

    // si no hay súper, nada que hacer
    if (!supId || supId === "nuevo") return;

    try {
      const supermercados = await fetch(`${API_BASE}/api/supermercados`).then((r) => r.json());
      const supermercado = supermercados.find((s) => s._id === supId);
      if (!supermercado) return;

      const ciudades = [
        ...new Set(
          supermercado.Ubicaciones
            .filter((u) => u.Pais === pais)
            .map((u) => u.Ciudad)
            .filter(Boolean)
        ),
      ];

      ciudadSel.innerHTML = `<option value="">Selecciona una ciudad</option>`;
      ciudades.forEach((c) => (ciudadSel.innerHTML += `<option value="${c}">${c}</option>`));
      ciudadSel.innerHTML += `<option value="nuevo">Otra (nueva ciudad)</option>`;

      show(ciudadSel);  hide(inpCiudad);
      hide(ubicSel);    hide(inpUbic);
    } catch (err) {
      console.error("❌ Error cargando ciudades:", err);
    }
  });
}

// Ciudad
const ciudadSelect = document.getElementById("add-ciudad-existente");
if (ciudadSelect) {
  ciudadSelect.addEventListener("change", async (e) => {
    const ciudad = e.target.value;
    const supId = document.getElementById("add-supermercado-select")?.value;
    const pais = document.getElementById("add-pais-existente")?.value;

    const inpCiudad = document.getElementById("add-nueva-ciudad");
    const ubicSel = document.getElementById("add-ubicacion-existente");
    const inpUbic = document.getElementById("add-nueva-ubicacion");

    const hide = (el) => el && (el.style.display = "none");
    const show = (el) => el && (el.style.display = "inline-block");

    if (ciudad === "nuevo") {
      show(inpCiudad);
      show(inpUbic);
      hide(ubicSel);
      return;
    }

    hide(inpCiudad);

    try {
      const supermercados = await fetch(`${API_BASE}/api/supermercados`).then((r) => r.json());
      const supermercado = supermercados.find((s) => s._id === supId);
      if (!supermercado) return;

      // pinta las ubicaciones existentes de ese país/ciudad
      cargarUbicaciones(supermercado, pais, ciudad);
      show(ubicSel); // el helper ya rellena y muestra el select; por si acaso, lo forzamos visible
      hide(inpUbic);
    } catch (err) {
      console.error("❌ Error cargando ubicaciones por ciudad:", err);
    }
  });
}

// Ubicación (mostrar input manual si eligen "nuevo")
const ubicacionSelect = document.getElementById("add-ubicacion-existente");
if (ubicacionSelect) {
  ubicacionSelect.addEventListener("change", (e) => {
    const inpUbic = document.getElementById("add-nueva-ubicacion");
    const lblUbic = document.getElementById("label-add-nueva-ubicacion");
    const nuevo = e.target.value === "nuevo";
    if (inpUbic && lblUbic) {
      inpUbic.style.display = nuevo ? "inline-block" : "none";
      lblUbic.style.display = nuevo ? "inline-block" : "none";
      if (!nuevo) inpUbic.value = "";
    }
  });
}
