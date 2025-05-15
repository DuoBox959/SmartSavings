import { API_BASE } from "../UTILS/utils.js"; 
import { obtenerUbicacionesGenerico } from "../selects/cargar.js";
import { parsearPrecioHistorico  } from "../selects/helpers.js";

// ==============================
// 💾 GUARDAR PRODUCTO NUEVO
// ==============================

export async function guardarProductoNuevo() {
  try {
    // 🐞 Verificación rápida de elementos
    [
      "add-nombre",
      "add-marca-select",
      "add-tipo-select",
      "add-subtipo-select",
      "add-peso",
      "add-unidadPeso",
      "add-estado",
      "add-supermercado-select",
      "add-proveedor-select",
      "add-precio",
      "add-precioDescuento",
      "add-unidadLote",
      "add-precioPorUnidad",
      "add-utilidad",
      "add-ingredientes",
      "add-precioHistorico",
      "add-imagen",
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) console.warn(`⚠️ Elemento NO encontrado: #${id}`);
    });

    const formData = new FormData();
    const ubicaciones = obtenerUbicacionesGenerico("add");

    // ✅ Campos posiblemente nuevos
    const marca = await procesarCampoNuevo("add", "marca", insertarNuevaMarca);
    const tipo = await procesarCampoNuevo("add", "tipo", insertarNuevoTipo);
    const subtipo = await procesarCampoNuevo("add", "subtipo", insertarNuevoSubtipo);
    const proveedor = await procesarCampoNuevo("add", "proveedor", async (nombre) => {
      const pais = document.getElementById("add-pais-proveedor")?.value || "-";
      return await insertarNuevoProveedor(nombre, pais);
    });
    const supermercado = await procesarCampoNuevo("add", "supermercado", async (nombre) => {
      return await insertarNuevoSupermercado(nombre, ubicaciones);
    });

    // 🏷️ Datos principales
    formData.append("nombre", document.getElementById("add-nombre").value);
    formData.append("marca", marca || "Sin marca");
    formData.append("tipo", tipo || "Sin tipo");
    formData.append("subtipo", subtipo || "Sin subtipo");
    formData.append("peso", document.getElementById("add-peso").value);
    formData.append("unidadPeso", document.getElementById("add-unidadPeso").value);
    formData.append("estado", document.getElementById("add-estado").value);
    formData.append("supermercado", supermercado);
    formData.append("proveedor", proveedor);
    formData.append("ubicaciones", JSON.stringify(ubicaciones));

    // 🧠 Detalles adicionales
    const utilidad = document.getElementById("add-utilidad").value.trim();
    formData.append("utilidad", utilidad || "Sin descripción");

    const ingredientesInput = document.getElementById("add-ingredientes").value;
    const ingredientesArray = ingredientesInput
      .split(",")
      .map((i) => i.trim())
      .filter((i) => i.length > 0);
    formData.append("ingredientes", ingredientesArray.join(","));

    // 💰 Precios
    formData.append("precioActual", document.getElementById("add-precio").value);
    formData.append("precioDescuento", document.getElementById("add-precioDescuento")?.value || "");
    formData.append("unidadLote", document.getElementById("add-unidadLote")?.value || "N/A");
    formData.append("precioPorUnidad", document.getElementById("add-precioPorUnidad")?.value || "");

    // 🗓️ Fechas y usuario
    formData.append("fechaSubida", new Date().toISOString());
    formData.append("fechaActualizacion", new Date().toISOString());
    const usuario = JSON.parse(sessionStorage.getItem("user"));
    const userId = usuario?._id || usuario?.id;
    if (!userId) throw new Error("Usuario no autenticado");
    formData.append("usuario", userId);

    // 🖼️ Imagen
    const imagenInput = document.getElementById("add-imagen");
    if (imagenInput?.files?.length > 0) {
      formData.append("Imagen", imagenInput.files[0]);
    }

    // 📈 Precio histórico con utilidad importada
    const precioHistoricoTexto = document.getElementById("add-precioHistorico")?.value || "";
    const precioHistoricoArray = parsearPrecioHistorico(precioHistoricoTexto);
    formData.append("precioHistorico", JSON.stringify(precioHistoricoArray));

    // 🚀 Envío al backend
    const response = await fetch(`${API_BASE}/api/productos-completos`, {
      method: "POST",
      body: formData,
    });

    const responseText = await response.text();
    let result;

    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error("❌ Respuesta no es JSON:", responseText);
      throw new Error("Respuesta no válida del servidor");
    }

    if (!response.ok || !result.producto_id) {
      console.warn(result);
      throw new Error("Error al crear producto");
    }

    // 🎉 Producto creado
    Swal.fire("✅ Éxito", "Producto creado correctamente", "success");
    cerrarFormularioAgregar();
    cargarProductos();
  } catch (err) {
    console.error("❌ Error guardando producto nuevo:", err);
    Swal.fire("Error", "No se pudo guardar el producto", "error");
  }
}

