// ==============================
// 🔗 Importar configuración base de la API
// ==============================
import { API_BASE } from "../UTILS/utils.js";
import { volverAtras } from "../funciones.js";
import { cerrarFormularioAgregar, cerrarFormulario } from "../modals/cerrar.js";
import { agregarUbicacion } from "../helpers/helpers.js";

//ONCLICK
export function inicializarBotonesGlobales() {
  // 🔙 Volver atrás
  const btnVolverAtras = document.getElementById("btn-volver-atras");
  if (btnVolverAtras) {
    btnVolverAtras.addEventListener("click", volverAtras);
  }

  // ❌ Cerrar modales (Editar y Agregar)
  const btnCerrarEditar = document.getElementById("btn-cerrar-editar");
  if (btnCerrarEditar) {
    btnCerrarEditar.addEventListener("click", cerrarFormulario);
  }

  const btnCerrarAgregar = document.getElementById("btn-cerrar-agregar");
  if (btnCerrarAgregar) {
    btnCerrarAgregar.addEventListener("click", cerrarFormularioAgregar);
  }

  // ❌ Botones de "Cancelar"
  const btnCancelarEditar = document.getElementById("btn-cancelar-editar");
  if (btnCancelarEditar) {
    btnCancelarEditar.addEventListener("click", cerrarFormulario);
  }

  const btnCancelarAgregar = document.getElementById("btn-cancelar-agregar");
  if (btnCancelarAgregar) {
    btnCancelarAgregar.addEventListener("click", cerrarFormularioAgregar);
  }

  // ➕ Agregar ubicación dinámica
  const btnAgregarUbicacion = document.getElementById("btn-agregar-ubicacion");
  if (btnAgregarUbicacion) {
    btnAgregarUbicacion.addEventListener("click", agregarUbicacion);
  }
}
//ONCHANGE
export function inicializarSelectsDinamicos() {
  const campos = ["marca", "tipo", "subtipo", "proveedor", "supermercado"];

  campos.forEach((campo) => {
    const selectAdd = document.getElementById(`add-${campo}-select`);
    if (selectAdd) {
      selectAdd.addEventListener("change", () => toggleNuevoCampo("add", campo));
    }

    const selectEdit = document.getElementById(`edit-${campo}-select`);
    if (selectEdit) {
      selectEdit.addEventListener("change", () => toggleNuevoCampo("edit", campo));
    }
  });
}

// ==============================
// 📍 Cuando seleccionas supermercado
// ==============================
document.getElementById("add-supermercado-select").addEventListener("change", async (e) => {
  const supermercadoId = e.target.value;

  const ubicacionContenedor = document.getElementById("selector-ubicacion-dinamico");
  const paisSelect = document.getElementById("add-pais-existente");
  const nuevoPaisInput = document.getElementById("add-nuevo-pais");
  const ciudadSelect = document.getElementById("add-ciudad-existente");
  const nuevaCiudadInput = document.getElementById("add-nueva-ciudad");
  const ubicacionInput = document.getElementById("add-nueva-ubicacion");

  if (!supermercadoId || supermercadoId === "nuevo") {
    ubicacionContenedor.style.display = "none";
    return;
  }

  ubicacionContenedor.style.display = "block";

  // ✅ Obtener datos del supermercado desde API
  const supermercados = await fetch(`${API_BASE}/api/supermercados`).then(res => res.json());
  const supermercado = supermercados.find((s) => s._id === supermercadoId);

  if (!supermercado || !Array.isArray(supermercado.Ubicaciones)) {
    console.warn("❌ Supermercado sin ubicaciones válidas");
    return;
  }

  // 🌍 Filtrar países válidos del supermercado
  const paises = [
    ...new Set(
      supermercado.Ubicaciones
        .map((u) => u.Pais)
        .filter((p) => typeof p === "string" && p.trim() !== "" && p !== "undefined")
    ),
  ];

  paisSelect.innerHTML = `<option value="">Selecciona un país</option>`;
  paises.forEach((p) => {
    paisSelect.innerHTML += `<option value="${p}">${p}</option>`;
  });
  paisSelect.innerHTML += `<option value="nuevo">Otro (nuevo país)</option>`;
  paisSelect.style.display = "inline-block";

  // 💡 Si solo hay un país, seleccionarlo automáticamente
  if (paises.length === 1) {
    paisSelect.value = paises[0];
    paisSelect.dispatchEvent(new Event("change"));
  }

  // Ocultar campos secundarios
  nuevoPaisInput.style.display = "none";
  ciudadSelect.style.display = "none";
  nuevaCiudadInput.style.display = "none";
  ubicacionInput.style.display = "none";
});

// ==============================
// 🌍 Cuando seleccionas un país
// ==============================
document.getElementById("add-pais-existente").addEventListener("change", async (e) => {
  const paisSeleccionado = e.target.value;
  const supermercadoId = document.getElementById("add-supermercado-select").value;

  const nuevoPaisInput = document.getElementById("add-nuevo-pais");
  const ciudadSelect = document.getElementById("add-ciudad-existente");
  const nuevaCiudadInput = document.getElementById("add-nueva-ciudad");
  const ubicacionInput = document.getElementById("add-nueva-ubicacion");

  if (paisSeleccionado === "nuevo") {
    nuevoPaisInput.style.display = "inline-block";
    ciudadSelect.style.display = "none";
    nuevaCiudadInput.style.display = "inline-block";
    ubicacionInput.style.display = "inline-block";
    return;
  }

  nuevoPaisInput.style.display = "none";

  // ✅ Obtener ciudades para ese país desde API
  const supermercados = await fetch(`${API_BASE}/api/supermercados`).then(res => res.json());
  const supermercado = supermercados.find((s) => s._id === supermercadoId);

  const ciudades = [
    ...new Set(
      supermercado.Ubicaciones
        .filter((u) => u.Pais === paisSeleccionado)
        .map((u) => u.Ciudad)
    ),
  ];

  ciudadSelect.innerHTML = `<option value="">Selecciona una ciudad</option>`;
  ciudades.forEach((c) => {
    ciudadSelect.innerHTML += `<option value="${c}">${c}</option>`;
  });
  ciudadSelect.innerHTML += `<option value="nuevo">Otra (nueva ciudad)</option>`;

  ciudadSelect.style.display = "inline-block";
  nuevaCiudadInput.style.display = "none";
  ubicacionInput.style.display = "none";
});

// ==============================
// 🏙️ Cuando seleccionas una ciudad
// ==============================
document.getElementById("add-ciudad-existente").addEventListener("change", async (e) => {
  const ciudad = e.target.value;
  const supermercadoId = document.getElementById("add-supermercado-select").value;
  const pais = document.getElementById("add-pais-existente").value;

  const nuevaCiudadInput = document.getElementById("add-nueva-ciudad");
  const ubicacionInput = document.getElementById("add-nueva-ubicacion");

  if (ciudad === "nuevo") {
    nuevaCiudadInput.style.display = "inline-block";
    ubicacionInput.style.display = "inline-block";
    return;
  }

  nuevaCiudadInput.style.display = "none";

  // ✅ Cargar ubicaciones disponibles desde API
  try {
    const supermercados = await fetch(`${API_BASE}/api/supermercados`).then(res => res.json());
    const supermercado = supermercados.find((s) => s._id === supermercadoId);
    if (!supermercado) return;

    // Esta función deberías tenerla en helpers.js o funciones.js
    cargarUbicaciones(supermercado, pais, ciudad);
  } catch (err) {
    console.error("❌ Error cargando ubicaciones por ciudad:", err);
  }
});

// ==============================
// 🧭 Cuando seleccionas ubicación
// ==============================
document.getElementById("add-ubicacion-existente").addEventListener("change", (e) => {
  const nuevaUbicacionInput = document.getElementById("add-nueva-ubicacion");
  const labelNuevaUbicacion = document.getElementById("label-add-nueva-ubicacion");
  const mostrar = e.target.value === "nuevo";

  if (nuevaUbicacionInput && labelNuevaUbicacion) {
    nuevaUbicacionInput.style.display = mostrar ? "inline-block" : "none";
    labelNuevaUbicacion.style.display = mostrar ? "inline-block" : "none";

    if (!mostrar) {
      nuevaUbicacionInput.value = ""; // Limpiar si oculta
    }
  }
});
