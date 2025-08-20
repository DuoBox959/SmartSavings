import { ENDPOINTS } from "../UTILS/utils.js";
import { safeSetValue } from "../helpers/helpers.js";

// ✏️ EDICIÓN DE PRODUCTOS
export async function editarProducto(id) {
  try {
    // Cargamos en paralelo: producto, precio del producto, supers y proveedores
    const [prodRes, precioRes, supersRes, provRes] = await Promise.all([
      fetch(`${ENDPOINTS.productos}/${id}`),
      fetch(`${ENDPOINTS.precios}/producto/${id}`),     // /api/precios/producto/:id
      fetch(ENDPOINTS.supermercados),                   // /api/supermercados
      fetch(ENDPOINTS.proveedores),                     // /api/proveedor
    ]);

    if (!prodRes.ok) throw new Error("Producto no encontrado");

    const producto       = await prodRes.json();
    const precioData     = precioRes.ok ? await precioRes.json() : null;
    const supermercados  = supersRes.ok ? await supersRes.json() : [];
    const proveedores    = provRes.ok ? await provRes.json() : [];

    // Buscar súper y proveedor por _id
    const sup = supermercados.find(
      s => String(s._id) === String(producto.Supermercado_id)
    ) || {};
    const prov = proveedores.find(
      p => String(p._id) === String(producto.Proveedor_id)
    ) || {};

    // ----- Producto (campos directos de tu colección Productos)
    safeSetValue("edit-producto-id", producto._id);
    safeSetValue("edit-nombre", producto.Nombre);
    safeSetValue("edit-marca-select", producto.Marca);
    safeSetValue("edit-peso", producto.Peso);
    safeSetValue("edit-unidadPeso", producto.UnidadPeso);
    safeSetValue("edit-estado", producto.Estado || "En stock");

    // selects por ID
    safeSetValue("edit-supermercado-select", sup._id || "");
    safeSetValue("edit-proveedor-select",   prov._id || "");

    // extras
    safeSetValue("edit-pais-proveedor", prov.Pais || "");
    safeSetValue("edit-fecha-subida", producto.fechaSubida || "");
    safeSetValue("edit-fecha-actualizacion", new Date().toISOString());
    safeSetValue("edit-usuario", producto.usuario || "");

    // ----- “Descripción” ahora viene del propio producto
    safeSetValue("edit-tipo-select", producto.Tipo || "Sin tipo");
    safeSetValue("edit-subtipo-select", producto.Subtipo || "Sin subtipo");
    safeSetValue("edit-utilidad", producto.Utilidad || "Sin descripción");
    safeSetValue("edit-ingredientes", Array.isArray(producto.Ingredientes) ? producto.Ingredientes.join(", ") : "");

    // ----- Precios
    if (precioData) {
      safeSetValue("edit-precio",            precioData.precioActual ?? "");
      safeSetValue("edit-precioDescuento",   precioData.precioDescuento ?? "");
      safeSetValue("edit-unidadLote",        precioData.unidadLote ?? "N/A");
      safeSetValue("edit-precioPorUnidad",   precioData.precioUnidadLote ?? "");

      const historial = Array.isArray(precioData.precioHistorico)
        ? precioData.precioHistorico
            .map(e => `${e.precio}, ${e.año ?? e.anio ?? ""}`.trim())
            .join("\n")
        : "";
      safeSetValue("edit-precioHistorico", historial);
    } else {
      // si no hay registro de precios aún
      safeSetValue("edit-precio", "");
      safeSetValue("edit-precioDescuento", "");
      safeSetValue("edit-unidadLote", "N/A");
      safeSetValue("edit-precioPorUnidad", "");
      safeSetValue("edit-precioHistorico", "");
    }

    // Mostrar modal
    document.getElementById("modal-editar").style.display = "flex";
  } catch (err) {
    console.error("❌ Error al cargar producto para editar:", err);
    Swal.fire("Error", "Hubo un problema al cargar el producto para edición.", "error");
  }
}
