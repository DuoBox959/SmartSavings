import { API_BASE } from "../UTILS/utils.js";
import { obtenerUbicacionesGenerico, cargarProductos } from "../selects/carga.js";
import { parsearPrecioHistorico } from "../helpers/helpers.js";
import { insertarNuevaMarca, insertarNuevoProveedor, insertarNuevoSubtipo, insertarNuevoSupermercado, insertarNuevoTipo, aniadirUbicacionASupermercadoExistente } from "../actions/insertar.js";
import { cerrarFormularioAgregar } from "../modals/cerrar.js";
import { procesarCampoNuevo } from "../selects/procesarCampos.js";

// ==============================
// 💾 GUARDAR PRODUCTO NUEVO
// ==============================

export async function guardarProductoNuevo() {
  try {
    // 🐞 Verificación rápida de elementos y VALIDACIÓN DE CAMPOS OBLIGATORIOS
    const requiredFields = [
      { id: "add-nombre", name: "Nombre del Producto" },
      { id: "add-peso", name: "Peso" },
      { id: "add-unidadPeso", name: "Unidad de Peso" },
      { id: "add-estado", name: "Estado" },
      { id: "add-precio", name: "Precio Actual" },
    ];

    for (const field of requiredFields) {
      const el = document.getElementById(field.id);
      if (!el) {
        // Si el elemento no se encuentra, es un problema en el HTML/estructura.
        // Se lanza un error para detener la ejecución.
        throw new Error(`Elemento HTML requerido no encontrado: #${field.id}. Por favor, verifique el HTML.`);
      }
      if (el.value.trim() === "") {
        Swal.fire("Error", `El campo "${field.name}" es obligatorio. Por favor, rellénelo.`, "error");
        return; // Detiene la ejecución si un campo obligatorio está vacío
      }
    }

    // Validación específica para el selector de Supermercado y su campo "nuevo"
    const supermercadoSelect = document.getElementById("add-supermercado-select");
    const supermercadoNuevoInput = document.getElementById("add-supermercado-nuevo");
    let selectedSupermercadoValue = supermercadoSelect ? supermercadoSelect.value : "";
    let supermercadoNombre = "";


    if (!supermercadoSelect) {
      throw new Error("Elemento HTML requerido no encontrado: #add-supermercado-select.");
    }

    if (!selectedSupermercadoValue) {
      Swal.fire("Error", "Debe seleccionar una opción para el Supermercado.", "error");
      return;
    }

    if (selectedSupermercadoValue === "nuevo") {
      if (!supermercadoNuevoInput) {
        throw new Error("Elemento HTML requerido no encontrado: #add-supermercado-nuevo.");
      }
      supermercadoNombre = supermercadoNuevoInput.value.trim();
      if (!supermercadoNombre) {
        Swal.fire("Error", "Ha seleccionado 'Otro (escribir nuevo)' para el supermercado. Por favor, introduzca el nombre del nuevo supermercado.", "error");
        return;
      }
    } else {
      // Si se seleccionó un supermercado existente, obtenemos su nombre del texto de la opción
      supermercadoNombre = supermercadoSelect.options[supermercadoSelect.selectedIndex].textContent;
    }

    const formData = new FormData();
    const ubicaciones = obtenerUbicacionesGenerico("add"); // Obtiene todas las ubicaciones del formulario
console.log("🧪 Ubicaciones a enviar:", ubicaciones);

    // ✅ Campos posiblemente nuevos (Marca, Tipo, Subtipo, Proveedor)
    // Se asume que procesarCampoNuevo ya maneja sus propias validaciones internas
    const marca = await procesarCampoNuevo("add", "marca", insertarNuevaMarca);
    const tipo = await procesarCampoNuevo("add", "tipo", insertarNuevoTipo);
    const subtipo = await procesarCampoNuevo("add", "subtipo", insertarNuevoSubtipo);
    const proveedor = await procesarCampoNuevo("add", "proveedor", async (nombre) => {
      const pais = document.getElementById("add-pais-proveedor")?.value || "-";
      return await insertarNuevoProveedor(nombre, pais);
    });

    // 🎯 Lógica para el Supermercado
        let finalSupermercadoId; // Este será el ID del supermercado al que se vinculará el producto

        if (selectedSupermercadoValue === "nuevo") {
            // El usuario quiere un supermercado completamente nuevo.
            // Se inserta un nuevo supermercado con las ubicaciones proporcionadas.
            finalSupermercadoId = await insertarNuevoSupermercado(supermercadoNombre, ubicaciones);
            console.log("Nuevo supermercado creado con ID:", finalSupermercadoId);
        } else {
            // El usuario seleccionó un supermercado existente.
            finalSupermercadoId = selectedSupermercadoValue; // El ID del supermercado existente

            // Si hay ubicaciones nuevas en el formulario, intentar añadirlas al supermercado existente.
            if (ubicaciones.length > 0) {
                console.log(`Intentando añadir ${ubicaciones.length} ubicaciones al supermercado existente (ID: ${finalSupermercadoId}).`);
                for (const ubicacion of ubicaciones) {
                    try {
                        await aniadirUbicacionASupermercadoExistente(finalSupermercadoId, ubicacion);
                        console.log(`Ubicación añadida/existente en el supermercado:`, ubicacion);
                    } catch (updateErr) {
                        console.error(`Error al añadir ubicación ${JSON.stringify(ubicacion)} al supermercado ${finalSupermercadoId}:`, updateErr);
                        // Puedes decidir si quieres que esto detenga la creación del producto
                        // o si solo es una advertencia. Por ahora, solo logueamos el error.
                    }
                }
            }
        }

    // 🏷️ Datos principales
    formData.append("nombre", document.getElementById("add-nombre").value);
    formData.append("marca", marca || "Sin marca");
    formData.append("tipo", tipo || "Sin tipo");
    formData.append("subtipo", subtipo || "Sin subtipo");
    formData.append("peso", document.getElementById("add-peso").value);
    formData.append("unidadPeso", document.getElementById("add-unidadPeso").value);
    formData.append("estado", document.getElementById("add-estado").value);
    formData.append("supermercado", finalSupermercadoId);
    formData.append("proveedor", proveedor);
   

    // 🧠 Detalles adicionales
    const utilidad = document.getElementById("add-utilidad")?.value.trim();
    formData.append("utilidad", utilidad || "Sin descripción");

    const ingredientesInput = document.getElementById("add-ingredientes")?.value;
    const ingredientesArray = ingredientesInput
      ? ingredientesInput.split(",").map((i) => i.trim()).filter((i) => i.length > 0)
      : [];
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
    if (!userId) {
      Swal.fire("Error", "Usuario no autenticado. Por favor, inicie sesión para guardar el producto.", "error");
      return;
    }
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
    Swal.fire("Error", "No se pudo guardar el producto. Detalles: " + err.message, "error");
  }
}
