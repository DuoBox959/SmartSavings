import { API_BASE } from "../UTILS/utils.js";
import { obtenerUbicacionesGenerico, cargarProductos } from "../selects/carga.js";
import { parsearPrecioHistorico, trimOrNull, numOrNull, valorOTextoNuevo } from "../helpers/helpers.js";
import { insertarNuevoProveedor, insertarNuevoSupermercado, aniadirUbicacionASupermercadoExistente } from "../actions/insertar.js";
import { cerrarFormularioAgregar } from "../modals/cerrar.js";

// ==============================
// 💾 GUARDAR PRODUCTO NUEVO
// ==============================
export async function guardarProductoNuevo() {
  try {
    // ✅ Validación de campos obligatorios
    const required = [
      { id: "add-nombre", name: "Nombre del Producto" },
      { id: "add-peso", name: "Peso" },
      { id: "add-unidadPeso", name: "Unidad de Peso" },
      { id: "add-estado", name: "Estado" },
      { id: "add-precio", name: "Precio Actual" },
      { id: "add-supermercado-select", name: "Supermercado" },
    ];

    for (const f of required) {
      const el = document.getElementById(f.id);
      if (!el) throw new Error(`Elemento requerido no encontrado: #${f.id}`);
      if (String(el.value).trim() === "") {
        await Swal.fire("Error", `El campo "${f.name}" es obligatorio.`, "error");
        return;
      }
    }

    // 🏪 Supermercado (existente o nuevo)
    const supermercadoSelect = document.getElementById("add-supermercado-select");
    const supermercadoNuevoInput = document.getElementById("add-supermercado-nuevo");
    const ubicaciones = obtenerUbicacionesGenerico("add") || [];

    let supermercadoId = null;
    if (supermercadoSelect.value === "nuevo") {
      const nombreSup = trimOrNull(supermercadoNuevoInput?.value);
      if (!nombreSup) {
        await Swal.fire("Error", "Indica el nombre del nuevo supermercado.", "error");
        return;
      }
      supermercadoId = await insertarNuevoSupermercado(nombreSup, ubicaciones);
    } else {
      supermercadoId = trimOrNull(supermercadoSelect.value);
      // Si el usuario añadió ubicaciones nuevas, intentamos agregarlas al supermercado existente.
      if (ubicaciones.length > 0 && supermercadoId) {
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

    // 👤 Usuario
    const usuario = JSON.parse(sessionStorage.getItem("user"));
    const userId = usuario?._id || usuario?.id;
    if (!userId) {
      await Swal.fire("Error", "Usuario no autenticado. Inicia sesión.", "error");
      return;
    }

    // 🏭 Proveedor (existente o nuevo)
    let proveedorId = null;
    const provSel = document.getElementById("add-proveedor-select");
    if (provSel?.value === "nuevo") {
      const nombreProv = trimOrNull(document.getElementById("add-proveedor-nuevo")?.value);
      const paisProv = trimOrNull(document.getElementById("add-pais-proveedor")?.value) || "España";
      if (!nombreProv) {
        await Swal.fire("Error", "Introduce el nombre del nuevo proveedor.", "error");
        return;
      }
      proveedorId = await insertarNuevoProveedor(nombreProv, paisProv);
    } else {
      proveedorId = trimOrNull(provSel?.value);
    }

    // 🏷️ Campos que viven dentro de Productos (texto simple)
    const nombre = trimOrNull(document.getElementById("add-nombre")?.value);
    const marca = valorOTextoNuevo("marca") || "Sin marca";
    const tipo = valorOTextoNuevo("tipo") || "Sin tipo";
    const subtipo = valorOTextoNuevo("subtipo") || "Sin subtipo";
    const utilidad = trimOrNull(document.getElementById("add-utilidad")?.value) || "Sin descripción";
    const estado = trimOrNull(document.getElementById("add-estado")?.value) || "En stock";
    const unidadPeso = trimOrNull(document.getElementById("add-unidadPeso")?.value) || "kg";
    const peso = numOrNull(document.getElementById("add-peso")?.value);

    if (!Number.isFinite(peso)) {
      await Swal.fire("Error", "Peso no válido.", "error");
      return;
    }

    // 🧂 Ingredientes (array)
    const ingInput = trimOrNull(document.getElementById("add-ingredientes")?.value) || "";
    const ingredientes = ingInput.split(",").map((s) => s.trim()).filter(Boolean);

    // 💰 Precios
    const precioActual = numOrNull(document.getElementById("add-precio")?.value);
    const precioDescuento = numOrNull(document.getElementById("add-precioDescuento")?.value);
    const unidadLote = numOrNull(document.getElementById("add-unidadLote")?.value);
    const precioUnidadLote = numOrNull(document.getElementById("add-precioPorUnidad")?.value);
    const precioHistorico = parsearPrecioHistorico(document.getElementById("add-precioHistorico")?.value || "");

    if (!Number.isFinite(precioActual)) {
      await Swal.fire("Error", "Precio actual no válido.", "error");
      return;
    }

    // 📦 FormData para /api/productos-completos
    const fd = new FormData();
    // NOTA: usamos claves en minúscula para ser coherentes con tu código de actualización
    fd.append("nombre", nombre);
    fd.append("marca", marca);
    fd.append("tipo", tipo);
    fd.append("subtipo", subtipo);
    fd.append("peso", String(peso));
    fd.append("unidadPeso", unidadPeso);
    fd.append("estado", estado);
    fd.append("utilidad", utilidad);
    fd.append("ingredientes", JSON.stringify(ingredientes));
    fd.append("usuario", userId);
    fd.append("proveedor", proveedorId || "");
    fd.append("supermercado", supermercadoId);
    fd.append("paisProveedor", trimOrNull(document.getElementById("add-pais-proveedor")?.value) || "España");
    fd.append("fechaSubida", new Date().toISOString());
    fd.append("fechaActualizacion", new Date().toISOString());

    // Enviar precios junto al producto si tu endpoint los procesa
    fd.append("precioActual", String(precioActual));
    if (precioDescuento !== null) fd.append("precioDescuento", String(precioDescuento));
    if (unidadLote !== null) fd.append("unidadLote", String(unidadLote));
    if (precioUnidadLote !== null) {
      // algunos backends lo llaman precioPorUnidad; añadimos ambos por compatibilidad
      fd.append("precioPorUnidad", String(precioUnidadLote));
      fd.append("precioUnidadLote", String(precioUnidadLote));
    }
    fd.append("precioHistorico", JSON.stringify(precioHistorico));

    // Imagen
    const imagenInput = document.getElementById("add-imagen");
    if (imagenInput?.files?.length > 0) {
      const file = imagenInput.files[0];
      if (!file.type.startsWith("image/")) {
        await Swal.fire("Error", "El archivo seleccionado no es una imagen válida.", "warning");
        return;
      }
      // Si tu backend espera "Imagen" (mayúscula), mantenlo así:
      fd.append("Imagen", file);
    }

    // 🚀 Crear producto (y quizá precios) en una sola llamada
    const res = await fetch(`${API_BASE}/api/productos-completos`, {
      method: "POST",
      body: fd,
    });

    const text = await res.text();
    let json = {};
    try { json = JSON.parse(text); } catch { /* texto no JSON */ }

    if (!res.ok) {
      console.error("Respuesta del servidor:", text);
      throw new Error(json?.message || "Error al crear producto.");
    }

    // Intentar obtener el ID del producto de varias formas
    const productoId = json.producto_id || json?.producto?._id || json?._id;
    if (!productoId) {
      console.warn("No se recibió producto_id en la respuesta. Respuesta:", json);
    }

    // 💾 Fallback: si tu endpoint NO creó el doc de precios, lo creamos ahora
    if (!json.precio_id && productoId) {
      const payloadPrecio = {
        producto_id: productoId,
        precioActual,
        precioDescuento,
        unidadLote,
        precioUnidadLote,
        precioHistorico,
      };
      const resPrecio = await fetch(`${API_BASE}/api/precios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadPrecio),
      });
      if (!resPrecio.ok) {
        const t = await resPrecio.text();
        console.warn("⚠️ El producto se creó pero falló la creación de Precios:", t);
      }
    }

    await Swal.fire("✅ Éxito", "Producto creado correctamente.", "success");
    cerrarFormularioAgregar();
    cargarProductos();

  } catch (err) {
    console.error("❌ Error guardando producto nuevo:", err);
    Swal.fire("Error", err.message || "No se pudo guardar el producto.", "error");
  }
}
