import { API_BASE } from "../UTILS/utils.js";

// ==============================
// 🗑️ ELIMINAR UN PRODUCTO DEL SISTEMA: productos y sus detalles
// ==============================
export async function eliminarProducto(id) {
  try {
    const confirm = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    const res = await fetch(`${API_BASE}/api/productos-completos/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("Error al eliminar producto completo");

    Swal.fire("✅ Eliminado", "Producto eliminado correctamente", "success");
    window.cargarProductos(); // Llamada global
  } catch (err) {
    console.error("❌ Error al eliminar producto:", err);
    Swal.fire("Error", "Hubo un problema al eliminar el producto.", "error");
  }
}

// ==============================
// 🗑️ ELIMINAR UN GRUPO DE CAMPOS DE UBICACIÓN
// ==============================
export function eliminarUbicacion(btn) {
  btn.parentElement.remove(); // Borra el contenedor asociado al botón
}
