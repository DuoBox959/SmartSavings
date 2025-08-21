// ==============================
// 📦 IMPORTACIONES
// ==============================
import { cargarHeaderFooter, volverAtras, cargarNav } from "../functions/global/funciones.js";
import { gestionarUsuarioAutenticado } from "../functions/global/header.js";
import { cargarOpcionesEnSelects, cargarDetalleProductos } from "../functions/global/selects/carga.js";
import { cerrarFormulario } from "../functions/global/modals/cerrar.js";
import { toggleNuevoCampo } from "../functions/global/helpers/helpers.js";
import { editarProducto } from "../functions/global/actions/editar.js";
import { guardarCambiosDesdeFormulario } from "../functions/global/botones/botons_actualizar.js";
import { aplicarFiltroBusqueda } from "../functions/global/nav.js";
import { API_BASE } from "../functions/global/UTILS/utils.js";

// ==============================
// 🧰 Helpers locales
// ==============================
const unicos = (arr, mapFn) => [...new Set(arr.map(mapFn).filter(Boolean))];

const poblarSelectCampo = (campo, valores) => {
  const ids = [`edit-${campo}-select`];
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

const poblarDesdeProductos = (productos) => {
  const tipos    = unicos(productos, (p) => p.Tipo ?? p.tipo);
  const subtipos = unicos(productos, (p) => p.Subtipo ?? p.subtipo);
  const marcas   = unicos(productos, (p) => p.Marca ?? p.marca);
  poblarSelectCampo("tipo", tipos);
  poblarSelectCampo("subtipo", subtipos);
  poblarSelectCampo("marca", marcas);
};

// ==============================
// 🚀 INICIALIZACIÓN
// ==============================
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await cargarHeaderFooter();
    gestionarUsuarioAutenticado();

    // Cargamos productos y precios para la barra de búsqueda
    const [productosRes, preciosRes] = await Promise.all([
      fetch(`${API_BASE}/api/productos`),
      fetch(`${API_BASE}/api/precios`),
    ]);
    if (!productosRes.ok || !preciosRes.ok) {
      throw new Error("No se pudieron cargar productos/precios para la navegación.");
    }
    const [productos, precios] = await Promise.all([productosRes.json(), preciosRes.json()]);

    await cargarNav(productos, precios);
    aplicarFiltroBusqueda();

    // Cargar todos los selects (incluye tipo/subtipo/marca desde endpoints)
await cargarOpcionesEnSelects([
  { campo: "supermercado", endpoint: "supermercados", usarId: true },
  { campo: "proveedor",    endpoint: "proveedor",     usarId: true },
  { campo: "tipo",         endpoint: "tipos" },
  { campo: "subtipo",      endpoint: "subtipos" },
  { campo: "marca",        endpoint: "marcas" },
]);


    // Pinta la ficha del producto (usa el id del querystring)
    await cargarDetalleProductos();

    // ✏️ Editar
    document.getElementById("btn-editar-detalle")?.addEventListener("click", async () => {
      const id = new URLSearchParams(window.location.search).get("id");
      if (!id) return Swal.fire("Error", "ID de producto no encontrado", "error");
      await editarProducto(id);
    });

    // 💾 Guardar cambios
    document.getElementById("btn-guardar-cambios")?.addEventListener("click", () => {
      guardarCambiosDesdeFormulario();
    });

    // ❌ Cerrar modal
    document.getElementById("btn-cerrar-formulario")?.addEventListener("click", cerrarFormulario);
    document.getElementById("close-modal-span")?.addEventListener("click", cerrarFormulario);

    // 🔙 Volver
    document.getElementById("btn-volver-atras")?.addEventListener("click", volverAtras);

    // 🗑️ Eliminar
    document.getElementById("btn-eliminar-detalle")?.addEventListener("click", async () => {
      const productId = new URLSearchParams(window.location.search).get("id");
      if (!productId) return Swal.fire("Error", "ID de producto no encontrado", "error");

      const confirm = await Swal.fire({
        title: "¿Estás seguro?",
        text: "Esta acción no se puede deshacer.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
      });
      if (!confirm.isConfirmed) return;

      try {
        const res = await fetch(`${API_BASE}/api/productos-completos/${productId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Error al eliminar producto");
        await Swal.fire("✅ Eliminado", "Producto eliminado correctamente", "success");
        window.location.href = "../pages/productos.html";
      } catch (err) {
        console.error("❌ Error al eliminar:", err);
        Swal.fire("Error", "Hubo un problema al eliminar el producto.", "error");
      }
    });

    // 🔀 Toggles para inputs "nuevo" en EDITAR
    document.getElementById("edit-tipo-select")
      ?.addEventListener("change", () => toggleNuevoCampo("edit", "tipo"));
    document.getElementById("edit-marca-select")
      ?.addEventListener("change", () => toggleNuevoCampo("edit", "marca"));
    document.getElementById("edit-subtipo-select")
      ?.addEventListener("change", () => toggleNuevoCampo("edit", "subtipo"));
    document.getElementById("edit-proveedor-select")
      ?.addEventListener("change", () => toggleNuevoCampo("edit", "proveedor"));
    document.getElementById("edit-supermercado-select")
      ?.addEventListener("change", () => toggleNuevoCampo("edit", "supermercado", "selector-ubicacion-dinamico"));

  } catch (err) {
    console.error("❌ Error al iniciar la página:", err);
    Swal.fire("Error", "No se pudo cargar el detalle del producto.", "error");
  }
});
