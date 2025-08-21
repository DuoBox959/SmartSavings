// ==============================
// 📦 IMPORTACIONES DE FUNCIONES EXTERNAS
// ==============================
// UI global (header/footer/nav)
import { cargarHeaderFooter, cargarNav } from "../functions/global/funciones.js";
import { gestionarUsuarioAutenticado } from "../functions/global/header.js";
import { aplicarFiltroBusqueda } from "../functions/global/nav.js";

// Utils / constantes
import { API_BASE } from "../functions/global/UTILS/utils.js";

// Acciones CRUD
import { eliminarProducto } from "../functions/global/botones/botons_eliminar.js";
import { guardarCambiosDesdeFormulario } from "../functions/global/botones/botons_actualizar.js";
import { guardarProductoNuevo } from "../functions/global/botones/botons_agregar.js";
import { mostrarFormularioAgregar, renderizarProductos } from "../functions/global/modals/mostrar.js";
import { editarProducto } from "../functions/global/actions/editar.js";

// Inicializadores / helpers UI
import { inicializarBotonesGlobales, inicializarSelectsDinamicos } from "../functions/global/eventos/events.js";
import { agregarUbicacionAdd, toggleNuevoCampo } from "../functions/global/helpers/helpers.js";
import { cargarOpcionesEnSelects } from "../functions/global/selects/carga.js";

// 👇 Solo usamos helpers de modal importados (sin redefinirlos luego)
import { openModal, closeModal, cerrarFormulario, cerrarFormularioAgregar } from "../functions/global/modals/cerrar.js";

// ==============================
// 🧰 HELPERS LOCALES (para esta vista)
// ==============================

/** Devuelve valores únicos limpios de un array aplicando mapFn. */
const unicos = (arr, mapFn) => [...new Set(arr.map(mapFn).filter(Boolean))];

/** Rellena los selects add/edit de un campo con valores dados. */
const poblarSelectCampo = (campo, valores) => {
  const ids = [`add-${campo}-select`, `edit-${campo}-select`];
  ids.forEach((id) => {
    const sel = document.getElementById(id);
    if (!sel) return;

    const etiqueta = sel.querySelector("option[value='']")?.textContent || "Selecciona una opción";
    sel.innerHTML = `
      <option value="">${etiqueta}</option>
      <option value="nuevo">Otro (escribir nuevo)</option>
    `;

    valores.forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      sel.appendChild(opt);
    });
  });
};

/** Deriva tipo, subtipo y marca a partir de la lista de productos. */
const poblarDesdeProductos = (productos) => {
  const tipos = unicos(productos, (p) => p.Tipo ?? p.tipo);
  const subtipos = unicos(productos, (p) => p.Subtipo ?? p.subtipo);
  const marcas = unicos(productos, (p) => p.Marca ?? p.marca);

  poblarSelectCampo("tipo", tipos);
  poblarSelectCampo("subtipo", subtipos);
  poblarSelectCampo("marca", marcas);
};

// ==============================
// 🚀 INICIALIZACIÓN
// ==============================
document.addEventListener("DOMContentLoaded", async () => {
  // 🔒 Autenticación mínima en cliente
  const usuario = sessionStorage.getItem("user");
  if (!usuario) {
    Swal.fire({
      icon: "warning",
      title: "No has iniciado sesión",
      text: "Por favor, inicia sesión para continuar.",
      confirmButtonText: "Ir al inicio",
      allowOutsideClick: false,
    }).then(() => (window.location.href = "index.html"));
    return;
  }

  try {
    // 🧩 Header/Footer comunes
    await cargarHeaderFooter();

    // 📦 Cargar productos, precios y supermercados en paralelo
    const [productosRes, preciosRes, supersRes] = await Promise.all([
      fetch(`${API_BASE}/api/productos`),
      fetch(`${API_BASE}/api/precios`),
      fetch(`${API_BASE}/api/supermercados`),
    ]);

    if (!productosRes.ok || !preciosRes.ok || !supersRes.ok) {
      throw new Error(`Fallo al cargar datos (${productosRes.status}/${preciosRes.status}/${supersRes.status})`);
    }

    const [productos, precios, supermercados] = await Promise.all([
      productosRes.json(),
      preciosRes.json(),
      supersRes.json(),
    ]);

    // 🧭 Render inicial
    await cargarNav(productos, precios);
    renderizarProductos(productos, precios, supermercados);

    aplicarFiltroBusqueda();
    gestionarUsuarioAutenticado();
    inicializarBotonesGlobales();

    // 🔽 Selects desde API (todo: incl. tipo/subtipo/marca)
    await cargarOpcionesEnSelects([
      { campo: "supermercado", endpoint: "supermercados", usarId: true },
      { campo: "proveedor",    endpoint: "proveedor",     usarId: true },
      { campo: "tipo",         endpoint: "tipos" },
      { campo: "subtipo",      endpoint: "subtipos" },
      { campo: "marca",        endpoint: "marcas" },
    ]);

    // (Opcional) Fallback si los endpoints vinieran vacíos
    const needsFallback =
      (document.getElementById("add-tipo-select")?.options.length ?? 0) <= 2 ||
      (document.getElementById("edit-tipo-select")?.options.length ?? 0) <= 2;
    if (needsFallback) poblarDesdeProductos(productos);

    // 🆕 Habilitar selects con opción "nuevo"
    inicializarSelectsDinamicos();

    // ➕ Abrir modal agregar
    document.getElementById("btn-agregar-producto")?.addEventListener("click", async () => {
      await cargarOpcionesEnSelects([
        { campo: "supermercado", endpoint: "supermercados", usarId: true },
        { campo: "proveedor",    endpoint: "proveedor",     usarId: true },
        { campo: "tipo",         endpoint: "tipos" },
        { campo: "subtipo",      endpoint: "subtipos" },
        { campo: "marca",        endpoint: "marcas" },
      ]);
      mostrarFormularioAgregar();    // pinta/prepare form
      openModal("modal-agregar");    // abre accesible
    });

    // 💾 Guardar nuevo producto
    document.getElementById("btn-guardar-producto")?.addEventListener("click", guardarProductoNuevo);

    // 💾 Guardar cambios en edición
    document.getElementById("btn-guardar-cambios")?.addEventListener("click", guardarCambiosDesdeFormulario);

    // 🔙 Volver atrás
    document.getElementById("btn-volver-atras")?.addEventListener("click", () => {
      if (window.history.length > 1) window.history.back();
      else window.location.href = "index.html";
    });

    // ✏️ Mostrar input para editar nombre de supermercado
    document.getElementById("edit-editar-nombre-supermercado")?.addEventListener("change", function () {
      const campo = document.getElementById("edit-nombre-supermercado-actual");
      if (campo) campo.style.display = this.checked ? "block" : "none";
    });

    // 🪟 Modales (accesibilidad + UX) — usamos SOLO los helpers importados

    // Cierres explícitos (limpian y cierran)
    document.getElementById("btn-cerrar-agregar")
      ?.addEventListener("click", () => cerrarFormularioAgregar());
    document.getElementById("btn-cancelar-agregar")
      ?.addEventListener("click", () => cerrarFormularioAgregar());

    document.getElementById("btn-cerrar-editar")
      ?.addEventListener("click", () => cerrarFormulario());
    document.getElementById("btn-cancelar-editar")
      ?.addEventListener("click", () => cerrarFormulario());

    // Escape para cerrar
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        ["modal-agregar", "modal-editar"].forEach((id) => closeModal(id));
      }
    });

    // Clic en overlay para cerrar (fuera de .modal-content)
    document.querySelectorAll(".modal")?.forEach((m) =>
      m.addEventListener("click", (e) => {
        if (e.target === m) closeModal(m.id);
      })
    );

    // ➕ Añadir ubicación (modal agregar)
    document.getElementById("btn-agregar-ubicacion")?.addEventListener("click", agregarUbicacionAdd);

    // 🧱 Delegación: editar/eliminar desde tarjetas
    document.getElementById("productos-container")?.addEventListener("click", (e) => {
      const btnEditar = e.target.closest(".btn-editar");
      const btnEliminar = e.target.closest(".btn-eliminar");
      if (btnEditar?.dataset.productId) editarProducto(btnEditar.dataset.productId);
      if (btnEliminar?.dataset.productId) eliminarProducto(btnEliminar.dataset.productId);
    });

    // 🆕 Toggles para campos "nuevo"
    // Agregar
    document.getElementById("add-tipo-select")?.addEventListener("change", () => toggleNuevoCampo("add", "tipo"));
    document.getElementById("add-supermercado-select")?.addEventListener("change", () => toggleNuevoCampo("add", "supermercado", "selector-ubicacion-dinamico"));
    document.getElementById("add-marca-select")?.addEventListener("change", () => toggleNuevoCampo("add", "marca"));
    document.getElementById("add-proveedor-select")?.addEventListener("change", () => toggleNuevoCampo("add", "proveedor"));
    document.getElementById("add-subtipo-select")?.addEventListener("change", () => toggleNuevoCampo("add", "subtipo"));

    // Editar
    document.getElementById("edit-tipo-select")?.addEventListener("change", () => toggleNuevoCampo("edit", "tipo"));
    document.getElementById("edit-supermercado-select")?.addEventListener("change", () => toggleNuevoCampo("edit", "supermercado"));
    document.getElementById("edit-marca-select")?.addEventListener("change", () => toggleNuevoCampo("edit", "marca"));
    document.getElementById("edit-proveedor-select")?.addEventListener("change", () => toggleNuevoCampo("edit", "proveedor"));
    document.getElementById("edit-subtipo-select")?.addEventListener("change", () => toggleNuevoCampo("edit", "subtipo"));

  } catch (error) {
    // 🧯 Manejo de errores global
    console.error("Error en la inicialización:", error);
    Swal.fire({ icon: "error", title: "Error", text: "No se pudieron cargar los datos. Inténtalo más tarde." });
  }
});
