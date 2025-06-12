import { ENDPOINTS } from "../UTILS/utils.js"; 
import { safeSetValue } from "../helpers/helpers.js";

// ==============================
// ✏️ EDICIÓN DE PRODUCTOS
// ==============================
export async function editarProducto(id) {
  try {
    // Usando los ENDPOINTS definidos
    const producto = await (await fetch(`${ENDPOINTS.productos}/${id}`)).json();
    const precios = await (await fetch(ENDPOINTS.precios)).json();
    const descripcion = await (await fetch(`${ENDPOINTS.descripcionProducto}/${id}`)).json();
    const supermercados = await (await fetch(ENDPOINTS.supermercados)).json();
    const proveedores = await (await fetch(ENDPOINTS.proveedores)).json();

    const precioData = precios.find((p) => p.producto_id === id) || {};
    const supermercado = supermercados.find((s) => s._id === producto.Supermercado_id) || {};
    const proveedor = proveedores.find((p) => p._id === producto.Proveedor_id) || {};

    console.log("📦 Producto cargado:", producto);

    // 📄 Asignar valores al formulario
    safeSetValue("edit-producto-id", producto._id);
    safeSetValue("edit-nombre", producto.Nombre);
    safeSetValue("edit-marca-select", producto.Marca);
    safeSetValue("edit-peso", producto.Peso);
    safeSetValue("edit-unidadPeso", producto.UnidadPeso);
    safeSetValue("edit-estado", producto.Estado || "En stock");
    safeSetValue("edit-supermercado-select", supermercado._id);
    safeSetValue("edit-proveedor-select", proveedor._id);
    safeSetValue("edit-pais-proveedor", proveedor.Pais);
    safeSetValue("edit-fecha-subida", producto.fechaSubida);
    safeSetValue("edit-fecha-actualizacion", new Date().toISOString());
    safeSetValue("edit-usuario", producto.usuario);

    // 🧠 Descripción
    safeSetValue("edit-tipo-select", descripcion.Tipo || "Sin tipo");
    safeSetValue("edit-subtipo-select", descripcion.Subtipo || "Sin subtipo");
    safeSetValue("edit-utilidad", descripcion.Utilidad || "Sin descripción");
    safeSetValue("edit-ingredientes", (descripcion.Ingredientes || []).join(", "));

    // 💸 Precios
    safeSetValue("edit-precio", precioData.precioActual);
    safeSetValue("edit-precioDescuento", precioData.precioDescuento);
    safeSetValue("edit-unidadLote", precioData.unidadLote);
    safeSetValue("edit-precioPorUnidad", precioData.precioUnidadLote);

    const historial = (precioData.precioHistorico || [])
      .map((entry) => `${entry.precio}, ${entry.año}`)
      .join("\n");
    safeSetValue("edit-precioHistorico", historial);

    // Mostrar modal
    document.getElementById("modal-editar").style.display = "flex";
  } catch (err) {
    console.error("❌ Error al cargar producto para editar:", err);
    Swal.fire("Error", "Hubo un problema al cargar el producto para edición.", "error");
  }
}