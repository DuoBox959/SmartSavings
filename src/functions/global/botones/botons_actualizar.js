import { API_BASE } from "../UTILS/utils.js";
import { obtenerUbicacionesGenerico, cargarProductos } from "../selects/carga.js";
import { insertarNuevoProveedor, insertarNuevoSupermercado, aniadirUbicacionASupermercadoExistente } from "../actions/insertar.js";
import { cerrarFormulario } from "../modals/cerrar.js";
import { parsearPrecioHistorico } from "../helpers/helpers.js";

// ==============================
// 🔎 HELPERS
// ==============================
const trimOrNull = (v) => {
  if (v === undefined || v === null) return null;
  const t = String(v).trim();
  return t === "" ? null : t;
};

const numOrNull = (v) => {
  const n = Number(String(v ?? "").replace(",", ".").trim());
  return Number.isFinite(n) ? n : null;
};

// Lee “select + input nuevo” con patrón <prefijo>-<campo>-select / <prefijo>-<campo>-nuevo
const valorOTextoNuevo = (prefijo, campo) => {
  const sel = document.getElementById(`${prefijo}-${campo}-select`);
  const nuevo = document.getElementById(`${prefijo}-${campo}-nuevo`);
  if (!sel) return null;
  if (sel.value === "nuevo") return trimOrNull(nuevo?.value);
  return trimOrNull(sel.value);
};

// ==============================
// 📝 GUARDAR CAMBIOS DESDE EL FORMULARIO DE EDICIÓN
// ==============================
export async function guardarCambiosDesdeFormulario() {
  try {
    const id = document.getElementById("edit-producto-id")?.value;
    if (!id) {
      await Swal.fire("Error", "No se encontró el ID de producto.", "error");
      return;
    }

    // 🏪 Ubicaciones para supermercado (si aplica)
    const ubicaciones = obtenerUbicacionesGenerico("edit") || [];

    // 🏷️ Campos texto que viven dentro de Productos
    const nombre  = trimOrNull(document.getElementById("edit-nombre")?.value);
    const marca   = valorOTextoNuevo("edit", "marca")   || "Sin marca";
    const tipo    = valorOTextoNuevo("edit", "tipo")    || "Sin tipo";
    const subtipo = valorOTextoNuevo("edit", "subtipo") || "Sin subtipo";
    const utilidad = trimOrNull(document.getElementById("edit-utilidad")?.value) || "Sin descripción";
    const estado   = trimOrNull(document.getElementById("edit-estado")?.value) || "En stock";
    const unidadPeso = trimOrNull(document.getElementById("edit-unidadPeso")?.value) || "kg";
    const peso = numOrNull(document.getElementById("edit-peso")?.value);
    const precioActual = numOrNull(document.getElementById("edit-precio")?.value);

    // ✅ Validaciones básicas
    if (!nombre || !Number.isFinite(peso) || !Number.isFinite(precioActual)) {
      await Swal.fire("Error", "Revisa Nombre, Peso y Precio actual.", "warning");
      return;
    }

    // 👤 Usuario
    const usuario = JSON.parse(sessionStorage.getItem("user"));
    const userId = usuario?._id || usuario?.id;

    // 🏭 Proveedor (existente o nuevo)
    let proveedorId = null;
    const provSel = document.getElementById("edit-proveedor-select");
    if (provSel?.value === "nuevo") {
      const nombreProv = trimOrNull(document.getElementById("edit-proveedor-nuevo")?.value);
      const paisProv = trimOrNull(document.getElementById("edit-pais-proveedor")?.value) || "España";
      if (!nombreProv) {
        await Swal.fire("Error", "Introduce el nombre del nuevo proveedor.", "error");
        return;
      }
      proveedorId = await insertarNuevoProveedor(nombreProv, paisProv);
    } else {
      proveedorId = trimOrNull(provSel?.value);
    }

    // 🏪 Supermercado (existente o nuevo)
    const supSel = document.getElementById("edit-supermercado-select");
    const supNuevoNombre = trimOrNull(document.getElementById("edit-supermercado-nuevo")?.value);
    let supermercadoId = null;

    if (supSel?.value === "nuevo" || supNuevoNombre) {
      const nombreSup = supNuevoNombre || "Supermercado";
      supermercadoId = await insertarNuevoSupermercado(nombreSup, ubicaciones);
    } else {
      supermercadoId = trimOrNull(supSel?.value);
      // Si hay ubicaciones nuevas, intenta añadirlas al supermercado existente
      if (supermercadoId && ubicaciones.length > 0) {
        for (const u of ubicaciones) {
          try {
            await aniadirUbicacionASupermercadoExistente(supermercadoId, u);
          } catch (e) {
            console.warn("No se pudo añadir una ubicación al supermercado existente:", u, e);
          }
        }
      }
    }

    if (!supermercadoId) {
      await Swal.fire("Error", "Selecciona un supermercado válido.", "error");
      return;
    }

    // 🧂 Ingredientes (array → JSON string)
    const ingInput = trimOrNull(document.getElementById("edit-ingredientes")?.value) || "";
    const ingredientes = ingInput.split(",").map((s) => s.trim()).filter(Boolean);

    // 💰 Otros campos de precio
    const precioDescuento   = numOrNull(document.getElementById("edit-precioDescuento")?.value);
    const unidadLote        = numOrNull(document.getElementById("edit-unidadLote")?.value);
    const precioUnidadLote  = numOrNull(document.getElementById("edit-precioPorUnidad")?.value);
    const precioHistorico   = parsearPrecioHistorico(document.getElementById("edit-precioHistorico")?.value || "");

    // 📦 FormData para actualizar el producto
    const fd = new FormData();
    fd.append("nombre", nombre);
    fd.append("marca", marca);
    fd.append("tipo", tipo);
    fd.append("subtipo", subtipo);
    fd.append("peso", String(peso));
    fd.append("unidadPeso", unidadPeso);
    fd.append("estado", estado);
    fd.append("utilidad", utilidad);
    fd.append("ingredientes", JSON.stringify(ingredientes));
    fd.append("usuario", userId || "");
    fd.append("proveedor", proveedorId || "");
    fd.append("supermercado", supermercadoId);
    fd.append("paisProveedor", trimOrNull(document.getElementById("edit-pais-proveedor")?.value) || "España");
    fd.append("fechaActualizacion", new Date().toISOString());

    // (opcional) si tu endpoint /productos-completos también acepta precio, lo mandamos igual
    fd.append("precioActual", String(precioActual));
    if (precioDescuento !== null)  fd.append("precioDescuento", String(precioDescuento));
    if (unidadLote !== null)       fd.append("unidadLote", String(unidadLote));
    if (precioUnidadLote !== null) {
      fd.append("precioPorUnidad", String(precioUnidadLote));
      fd.append("precioUnidadLote", String(precioUnidadLote));
    }
    fd.append("precioHistorico", JSON.stringify(precioHistorico));

    // Imagen (usa la misma clave que en AGREGAR: "Imagen")
    const imagenInput = document.getElementById("edit-imagen");
    if (imagenInput?.files?.length > 0) {
      const file = imagenInput.files[0];
      if (!file.type.startsWith("image/")) {
        await Swal.fire("Error", "El archivo seleccionado no es una imagen válida", "warning");
        return;
      }
      fd.append("Imagen", file); // 👈 coherente con crear
    }

    // 🚀 PUT producto
    const productoRes = await fetch(`${API_BASE}/api/productos-completos/${id}`, {
      method: "PUT",
      body: fd,
    });
    const productoTxt = await productoRes.text();
    if (!productoRes.ok) {
      let errMsg = "Error al actualizar el producto";
      try { errMsg = JSON.parse(productoTxt)?.message || errMsg; } catch {}
      throw new Error(errMsg);
    }

    // 🚀 PUT precios (end-point dedicado)
    const payloadPrecio = {
      producto_id: id,
      precioActual,
      precioDescuento,
      unidadLote,
      precioUnidadLote,
      precioHistorico,
    };

    const precioRes = await fetch(`${API_BASE}/api/precios/por-producto/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadPrecio),
    });

    if (!precioRes.ok) {
      const t = await precioRes.text();
      console.warn("⚠️ Producto actualizado, pero falló actualización de precios:", t);
    }

    await Swal.fire("✅ Éxito", "Producto actualizado correctamente.", "success");
    cerrarFormulario();
    cargarProductos();

  } catch (err) {
    console.error("❌ Error al actualizar producto:", err);
    Swal.fire("Error", err.message || "Hubo un problema al actualizar el producto.", "error");
  }
}
