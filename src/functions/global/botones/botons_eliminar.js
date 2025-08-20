import { API_BASE } from "../UTILS/utils.js";
import { cargarProductos } from "../selects/carga.js";
import { quitarTarjetaDeDOM, safeJson } from "../helpers/helpers.js";

// ==============================
// 🗑️ ELIMINAR UN PRODUCTO COMPLETO (cascade) + fallback manual
// ==============================
export async function eliminarProducto(id) {
  try {
    const confirm = await Swal.fire({
      title: "¿Eliminar producto?",
      text: "Se eliminará todo lo relacionado a este producto. Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });

    if (!confirm.isConfirmed) return;

    // UX optimista: deshabilitar botones para evitar doble click
    document.querySelectorAll(".btn-eliminar, .btn-editar, #btn-eliminar-detalle")
      .forEach(b => b.disabled = true);

    // 1) INTENTO PRINCIPAL: endpoint de borrado total (servidor hace cascade)
    const resCascade = await fetch(`${API_BASE}/api/productos-completos/${id}?cascade=1`, {
      method: "DELETE",
    });

    if (resCascade.ok || resCascade.status === 204) {
      quitarTarjetaDeDOM(id);
      await Swal.fire("✅ Eliminado", "Producto eliminado correctamente.", "success");
      await cargarProductos();
      return;
    }

    // 2) FALLBACK MANUAL (por si tu backend aún no hace cascade en ese endpoint)
    const avisos = [];

    // 2.1) Precios del producto
    try {
      const r = await fetch(`${API_BASE}/api/precios/por-producto/${id}`, { method: "DELETE" });
      if (!r.ok && r.status !== 404) {
        const b = await safeJson(r);
        avisos.push(`Precios: ${b?.message || r.statusText || "error"}`);
      }
    } catch (e) {
      avisos.push("Precios: error de red.");
    }

    // 2.2) Opiniones (si tienes colección)
    try {
      const r = await fetch(`${API_BASE}/api/opiniones/por-producto/${id}`, { method: "DELETE" });
      // si no existe el endpoint, 404 está bien; lo ignoramos
      if (!r.ok && r.status !== 404) {
        const b = await safeJson(r);
        avisos.push(`Opiniones: ${b?.message || r.statusText || "error"}`);
      }
    } catch (e) {
      // ignorar si no la usas
    }

    // 2.3) Descripción (si todavía existiera esa colección)
    try {
      const r = await fetch(`${API_BASE}/api/descripcion/por-producto/${id}`, { method: "DELETE" });
      if (!r.ok && r.status !== 404) {
        const b = await safeJson(r);
        avisos.push(`Descripción: ${b?.message || r.statusText || "error"}`);
      }
    } catch (e) {
      // ignorar si ya no usas esta colección
    }

    // 2.4) Borrado del propio producto
    const resProd = await fetch(`${API_BASE}/api/productos/${id}`, { method: "DELETE" });
    if (!resProd.ok && resProd.status !== 404) {
      const body = await safeJson(resProd);
      throw new Error(body?.message || resProd.statusText || "Error al eliminar el producto.");
    }

    // (opcional) 2.5) Imagen asociada (si tu backend expone algo así)
    // try {
    //   await fetch(`${API_BASE}/api/imagenes/por-producto/${id}`, { method: "DELETE" });
    // } catch {}

    quitarTarjetaDeDOM(id);

    if (avisos.length > 0) {
      console.warn("Eliminación con avisos:", avisos);
      await Swal.fire({
        icon: "warning",
        title: "Producto eliminado (con avisos)",
        html: `Se eliminó el producto. Algunos datos secundarios reportaron:<br><small>${avisos.join("<br>")}</small>`,
      });
    } else {
      await Swal.fire("✅ Eliminado", "Producto eliminado correctamente.", "success");
    }

    await cargarProductos();

  } catch (err) {
    console.error("❌ Error al eliminar producto:", err);
    Swal.fire("Error", err.message || "Hubo un problema al eliminar el producto.", "error");
  } finally {
    // re-habilitar botones
    document.querySelectorAll(".btn-eliminar, .btn-editar, #btn-eliminar-detalle")
      .forEach(b => b.disabled = false);
  }
}

// ==============================
// 🗑️ ELIMINAR UN GRUPO DE CAMPOS DE UBICACIÓN (en formularios)
// ==============================
export function eliminarUbicacion(btn) {
  btn?.parentElement?.remove();
}
