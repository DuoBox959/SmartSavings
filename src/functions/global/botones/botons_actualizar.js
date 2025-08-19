import { API_BASE } from "../UTILS/utils.js";
import { obtenerUbicacionesGenerico, cargarProductos } from "../selects/carga.js";
import { insertarNuevaMarca, insertarNuevoProveedor, insertarNuevoSubtipo, insertarNuevoSupermercado, insertarNuevoTipo } from "../actions/insertar.js";
import { procesarCampoNuevo } from "../selects/procesarCampos.js";
import { cerrarFormulario } from "../modals/cerrar.js";


// ==============================
// 📝 GUARDAR CAMBIOS DESDE EL FORMULARIO DE EDICIÓN: productos y sus detalles.
// ==============================
export async function guardarCambiosDesdeFormulario() {
  try {
    const id = document.getElementById("edit-producto-id").value;
    const formData = new FormData();
    const ubicaciones = obtenerUbicacionesGenerico("edit");

    const marca = await procesarCampoNuevo("edit", "marca", insertarNuevaMarca);
    const tipo = await procesarCampoNuevo("edit", "tipo", insertarNuevoTipo);
    const subtipo = await procesarCampoNuevo("edit", "subtipo", insertarNuevoSubtipo);
    const proveedor = await procesarCampoNuevo("edit", "proveedor", insertarNuevoProveedor);
    const supermercadoNombre = await procesarCampoNuevo("edit", "supermercado", async (nombre) => {
      return await insertarNuevoSupermercado(nombre, ubicaciones);
    });

    const nombre = document.getElementById("edit-nombre").value;
    const peso = document.getElementById("edit-peso").value;
    const precio = parseFloat(document.getElementById("edit-precio").value);

    // ✅ Validaciones básicas
    if (!nombre || !peso || isNaN(precio)) {
      Swal.fire("Error", "Por favor completa los campos obligatorios correctamente", "warning");
      return;
    }

    formData.append("nombre", nombre);
    formData.append("marca", marca || "Sin marca");
    formData.append("peso", peso);
    formData.append("unidadPeso", document.getElementById("edit-unidadPeso").value);
    formData.append("estado", document.getElementById("edit-estado").value);
    formData.append("fechaActualizacion", new Date().toISOString());

    formData.append("tipo", tipo || "Sin tipo");
    formData.append("subtipo", subtipo || "Sin subtipo");
    formData.append("utilidad", document.getElementById("edit-utilidad")?.value || "Sin descripción");
    formData.append("ubicaciones", JSON.stringify(ubicaciones));

    formData.append("paisProveedor", document.getElementById("edit-pais-proveedor")?.value || "España");

    // 🧼 Limpieza de campos opcionales
    const limpiarVacio = (val) => val?.trim() === "" ? null : val.trim();

    formData.append("precioActual", precio);
    formData.append("precioDescuento", limpiarVacio(document.getElementById("edit-precioDescuento")?.value));
    formData.append("unidadLote", limpiarVacio(document.getElementById("edit-unidadLote")?.value) || "N/A");
    formData.append("precioPorUnidad", limpiarVacio(document.getElementById("edit-precioPorUnidad")?.value) || "0");

    const usuario = JSON.parse(sessionStorage.getItem("user"));
    const userId = usuario?._id || usuario?.id;
    formData.append("usuario", userId);
    formData.append("proveedor", proveedor);
    formData.append("supermercado", supermercadoNombre);

    const ingredientesInput = document.getElementById("edit-ingredientes").value;
    const ingredientesArray = ingredientesInput.split(",").map((i) => i.trim()).filter((i) => i.length > 0);
    formData.append("ingredientes", ingredientesArray.join(","));

    const imagenInput = document.getElementById("edit-imagen");
    if (imagenInput?.files?.length > 0) {
      const file = imagenInput.files[0];
      if (!file.type.startsWith("image/")) {
        Swal.fire("Error", "El archivo seleccionado no es una imagen válida", "warning");
        return;
      }
      formData.append("imagen", file); // ⬅️ en minúscula
    }

    const productoRes = await fetch(`${API_BASE}/api/productos-completos/${id}`, {
      method: "PUT",
      body: formData,
    });

    const productoData = await productoRes.json();
    if (!productoRes.ok) throw new Error(productoData?.message || "Error al actualizar el producto");

    // 🧾 Historial de precios
    const historialTexto = document.getElementById("edit-precioHistorico").value;
    let historialArray = [];

    if (historialTexto.includes("\n")) {
      historialArray = historialTexto
        .split("\n")
        .map((l) => l.split(",").map((e) => e.trim()))
        .filter((a) => a.length === 2)
        .map(([precio, anio]) => ({
          precio: parseFloat(precio),
          anio: parseInt(anio),
        }));
    } else {
      const arr = historialTexto.split(",").map((e) => e.trim());
      for (let i = 0; i < arr.length; i += 2) {
        if (arr[i + 1]) {
          historialArray.push({
            precio: parseFloat(arr[i]),
            anio: parseInt(arr[i + 1]),
          });
        }
      }
    }
    console.log("🛠️ Enviando datos al backend para actualizar producto...");




    const payloadPrecio = {
      producto_id: id,
      precioActual: precio,
      precioDescuento: limpiarVacio(document.getElementById("edit-precioDescuento").value),
      unidadLote: limpiarVacio(document.getElementById("edit-unidadLote").value) || "N/A",
      precioUnidadLote: parseFloat(limpiarVacio(document.getElementById("edit-precioPorUnidad").value) || "0"),
      precioHistorico: historialArray,
    };

    console.log("📦 Payload de precio a enviar:", payloadPrecio);
    const precioRes = await fetch(`${API_BASE}/api/precios/por-producto/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadPrecio), 
    });


    const precioResText = await precioRes.text();

    if (precioRes.ok) {
      console.log("✅ Producto actualizado correctamente");
      console.log("📊 Precio actualizado a:", document.getElementById("edit-precio").value);
    } else {
      console.warn("⚠️ Algo falló al actualizar el producto", precioResText);
    }

    console.log("🔁 Respuesta del backend:", precioResText);

    // ✍️ Descripción
    await fetch(`${API_BASE}/api/descripcion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Producto_id: id,
        Tipo: tipo,
        Subtipo: subtipo,
        Utilidad: document.getElementById("edit-utilidad").value || "Sin descripción",
      }),
    });

    // 🎉 Todo OK
    Swal.fire("✅ Éxito", "Producto actualizado completamente", "success");
    cerrarFormulario();
    cargarProductos();
  } catch (err) {
    console.error("❌ Error al actualizar producto completo:", err);
    Swal.fire("Error", err.message || "Hubo un problema al actualizar el producto.", "error");
  }
}
