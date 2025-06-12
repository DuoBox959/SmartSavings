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
// 🚀 INICIALIZACIÓN
// ==============================
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await cargarHeaderFooter(); // ✅ Cargar header/footer
    gestionarUsuarioAutenticado(); // ✅ Si estás autenticando usuarios

    // --- Fetch product and price data for nav ---
    const productosRes = await fetch(`${API_BASE}/api/productos-completos`);
    const preciosRes = await fetch(`${API_BASE}/api/precios`);

    if (!productosRes.ok || !preciosRes.ok) {
      throw new Error("Failed to fetch products or prices for navigation.");
    }

    const productos = await productosRes.json();
    const precios = await preciosRes.json();
    // ---------------------------------------------

    await cargarNav(productos, precios); // ✅ Cargar y popular el nav
    aplicarFiltroBusqueda(); // ✅ Aplicar la funcionalidad de búsqueda a la nav

    await cargarOpcionesEnSelects([
      { campo: "supermercado", endpoint: "supermercados", usarId: true },
      { campo: "tipo", endpoint: "tipos", usarId: false },
      { campo: "subtipo", endpoint: "subtipos", usarId: false },
      { campo: "marca", endpoint: "marcas", usarId: false },
      { campo: "proveedor", endpoint: "proveedores", usarId: true },
    ]);

    await cargarDetalleProductos();

    // ✏️ Botón Editar (sin el onclick en HTML)
    document.getElementById("btn-editar-detalle")?.addEventListener("click", async () => {
      const id = new URLSearchParams(window.location.search).get("id");
      if (!id) {
        Swal.fire("Error", "ID de producto no encontrado", "error");
        return;
      }
      await editarProducto(id);
    });

    // 💾 Botón Guardar Cambios
    document.getElementById("btn-guardar-cambios")?.addEventListener("click", () => {
      guardarCambiosDesdeFormulario();
    });

    // ❌ Botón Cancelar del modal
    document.getElementById("btn-cerrar-formulario")?.addEventListener("click", () => {
      cerrarFormulario();
    });

    // ❌ Botón "X" cerrar modal (usando el nuevo ID)
    document.getElementById("close-modal-span")?.addEventListener("click", () => {
      cerrarFormulario();
    });

    // 🔙 Botón Volver (usando el nuevo ID)
    document.getElementById("btn-volver-atras")?.addEventListener("click", () => {
      volverAtras();
    });

    // 🗑️ Botón Eliminar
    document.getElementById("btn-eliminar-detalle")?.addEventListener("click", async () => {
      const productId = new URLSearchParams(window.location.search).get("id");
      if (!productId) {
        Swal.fire("Error", "ID de producto no encontrado", "error");
        return;
      }

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
        const res = await fetch(`${API_BASE}/api/productos-completos/${productId}`, {
          method: "DELETE",
        });

        if (!res.ok) throw new Error("Error al eliminar producto");

        await Swal.fire(
          "✅ Eliminado",
          "Producto eliminado correctamente",
          "success"
        );

        // 🔁 Redirigir al listado
        window.location.href = "../pages/productos.html";
      } catch (err) {
        console.error("❌ Error al eliminar:", err);
        Swal.fire(
          "Error",
          "Hubo un problema al eliminar el producto.",
          "error"
        );
      }
    });

    // === MANEJO DE ONCHANGE PARA LOS SELECTS QUE MUESTRAN CAMPOS NUEVOS ===
    // Seleccionamos todos los selects con la clase 'select-toggle'
    document.querySelectorAll(".select-toggle").forEach(selectElement => {
      selectElement.addEventListener("change", (event) => {
        const targetId = event.target.dataset.targetId; // Obtiene el ID del input a alternar
        const type = event.target.dataset.type; // Obtiene el tipo de campo
        toggleNuevoCampo(type, targetId); // Llama a la función toggleNuevoCampo
      });
    });

  } catch (err) {
    console.error("❌ Error al iniciar la página:", err);
  }
});