import * as validaciones from "../../valid/validaciones.js";

// 🔹 Variables globales
let preciosTable;
let preciosCache = [];
let productosCache = {}; // 🆕 Guardar productos en caché para acceso rápido

// 🔹 Iniciar DataTable y cargar datos cuando el documento esté listo
$(document).ready(async () => {
  preciosTable = $("#preciosTable").DataTable({
    destroy: true,
    autoWidth: false,
    columns: [
      { title: "ID" },
      { title: "Producto" },
      { title: "Precio Actual" },
      { title: "Precio Descuento" },
      { title: "Unidad/Lote" },
      { title: "Precio por Unidad/Lote" },
      { title: "Precio Histórico" },
      { title: "Acciones" },
    ],
  });

  // 🆕 Esperar a que los productos se carguen antes de los precios
  await cargarProductos();
  await cargarPrecios();

  // 🧼 Limpiar espacios innecesarios en unidadLote y precioHistorico
  $("#unidadLote, #precioHistorico").on("blur", function () {
    $(this).val($(this).val().trim());
  });

  // 🚫 BONUS: Prevenir espacios al inicio mientras se escribe
  $("#unidadLote, #precioHistorico").on("input", function () {
    if (this.value.startsWith(" ")) {
      this.value = this.value.trimStart();
    }
  });
});

// 🟢 Cargar productos y llenar el select
async function cargarProductos() {
  try {
    const respuesta = await fetch("http://localhost:3000/api/productos");
    const productos = await respuesta.json();

    if (!Array.isArray(productos))
      throw new Error("Formato incorrecto en productos");

    // Guardar productos en caché con estructura { id: nombre }
    productos.forEach((producto) => {
      productosCache[producto._id] = producto.Nombre; // 🔥 Asegurar que la clave es correcta
    });

    // Llenar el select de productos
    const select = $("#productoID");
    select.empty().append('<option value="">Selecciona un producto</option>');
    productos.forEach((producto) => {
      select.append(
        `<option value="${producto._id}">${producto.Nombre}</option>`
      );
    });

    console.log("✅ Productos cargados:", productosCache);
  } catch (error) {
    console.error("❌ Error al cargar productos:", error);
  }
}

// 🟢 Cargar precios desde servidor Express
async function cargarPrecios() {
  try {
    const respuesta = await fetch("http://localhost:3000/api/precios");
    const precios = await respuesta.json();

    if (!Array.isArray(precios))
      throw new Error("Formato incorrecto en precios");

    preciosCache = precios;
    preciosTable.clear(); // Limpiamos la tabla antes de actualizar

    precios.forEach((precio) => {
      const nombreProducto =
        productosCache[precio.producto_id] || "Producto Desconocido"; // 🛠️ Ahora sí debería aparecer bien

      // Asegurarse de que los valores sean numéricos antes de formatearlos
      const precioActual = typeof precio.precioActual === "number" ? precio.precioActual.toFixed(2) + " €" : "N/A";
      const precioDescuento = typeof precio.precioDescuento === "number" ? precio.precioDescuento.toFixed(0) + " %" : "N/A";
      const precioUnidadLote = typeof precio.precioUnidadLote === "number" ? precio.precioUnidadLote.toFixed(2) + " €" : "N/A";

      // Manejo de precioHistorico: Asegurarse de que es un array de objetos con año y precio
      const preciosHistoricos = Array.isArray(precio.precioHistorico) && precio.precioHistorico.length > 0
        ? precio.precioHistorico
            .map((historico) => {
              try {
                // Comprobar si 'historico' es una cadena válida antes de aplicar 'trim'
                if (typeof historico === "string") {
                  // Limpiar cualquier coma extra al final
                  const cleanedHistorico = historico.trim().replace(/,\s*$/, "");

                  // Convertir el string en objeto JSON
                  const historicoObj = JSON.parse(cleanedHistorico);

                  // Validar que el objeto tenga propiedades correctas
                  if (historicoObj.precio && historicoObj.año) {
                    return `${historicoObj.precio.toFixed(2)} € (${historicoObj.año})`;
                  }
                }
              } catch (error) {
                console.error("❌ Error en formato de precio histórico", error);
              }
              return "N/A"; // Si no es un precio válido, devolver "N/A"
            })
            .join(", ")
        : "No disponible";

      preciosTable.row.add([
        precio._id || "N/A",
        nombreProducto, // 🔄 Mostrar nombre del producto correctamente
        precioActual,
        precioDescuento,
        precio.unidadLote || "N/A",
        precioUnidadLote,
        `<button class="btn btn-primary" onclick="verPrecioHistorico('${precio._id}')">Ver Precio Histórico</button>`,
        accionesHTML(precio._id),
      ]);
    });

    console.log("✅ Precios cargados con nombres de productos:", precios);
    preciosTable.draw();
  } catch (error) {
    console.error("❌ Error al cargar precios:", error);
  }
}

function verPrecioHistorico(id) {
  const precio = preciosCache.find((p) => p._id === id);
  if (!precio) return;

  // Comprobamos si precioHistorico es un array y si tiene elementos
  const preciosHistoricos = Array.isArray(precio.precioHistorico)
    ? precio.precioHistorico
        .map((historico) => {
          try {
            // Verificamos que el formato del histórico sea el esperado
            const historicoObj = typeof historico === "string" ? JSON.parse(historico.trim()) : historico;

            // Verificamos si las propiedades 'precio' y 'año' existen
            if (historicoObj && historicoObj.precio !== undefined && historicoObj.año !== undefined) {
              // Devolver precio formateado si es válido
              return `${historicoObj.precio.toFixed(2)} € (${historicoObj.año})`;
            } else {
              return "N/A";
            }
          } catch (error) {
            console.error("❌ Error en formato de precio histórico:", error);
            return "N/A";
          }
        })
        .join(", ")
    : "No disponible";

  Swal.fire({
    title: "💰 Historial de Precios",
    text: preciosHistoricos,
    icon: "info",
    confirmButtonText: "Aceptar",
    width: "600px",
  });
}

// 🟢 Generar HTML para editar y eliminar
function accionesHTML(id) {
  return `
    <button onclick="editarPrecio('${id}')">✏️ Editar</button>
    <button class="btn-eliminar" onclick="eliminarPrecio('${id}')">🗑️ Eliminar</button>
  `;
}

// 🟢 Mostrar formulario para agregar
function mostrarFormularioAgregar() {
  $("#formTitulo").text("Añadir Precio");
  $(
    "#precioID, #productoID, #precioActual, #precioDescuento, #unidadLote, #precioHistorico"
  ).val("");

  $("#botonesFormulario button:first")
    .off("click")
    .on("click", guardarCambiosDesdeFormulario);

  $("#formularioPrecio").show();
  document
    .getElementById("formularioPrecio")
    .scrollIntoView({ behavior: "smooth" });
}

// 🟢 Guardar precio (crear o editar) con validaciones
async function guardarCambiosDesdeFormulario() {
  const id = $("#precioID").val();
  const producto_id = $("#productoID").val();
  const precioActual = parseFloat($("#precioActual").val());
  const precioDescuento = parseFloat($("#precioDescuento").val()) || null;
  const unidadLote = $("#unidadLote").val();
  const precioUnidadLote = parseFloat($("#precioUnidadLote").val()) || null;

  // Validación de campos obligatorios
  if (validaciones.camposVacios(producto_id, $("#precioActual").val())) {
    validaciones.mostrarAlertaError("Campos requeridos", "Producto ID y Precio Actual son obligatorios.");
    return;
  }

  // Validación de que el Precio Actual sea un número válido
  if (!validaciones.esNumeroValido(precioActual)) {
    validaciones.mostrarAlertaError("Precio no válido", "Por favor, ingresa un precio actual válido.");
    return;
  }

  // Procesar precioHistorico (este es opcional, pero si se ingresa, debe ser válido)
  const precioHistoricoInput = $("#precioHistorico").val();
  let precioHistorico = [];
  if (precioHistoricoInput.trim() !== "") {
    precioHistorico = precioHistoricoInput
      .split(",")  // Separar la cadena por comas
      .map(item => item.trim()) // Limpiar los espacios
      .reduce((acc, curr, index, array) => {
        if (index % 2 === 0) {
          // Asegurarse de que el precio y el año sean válidos
          if (!validaciones.esNumeroValido(curr) || !validaciones.esNumeroValido(array[index + 1])) {
            validaciones.mostrarAlertaError("Precio Histórico no válido", "Asegúrate de que los precios y años del historial sean válidos.");
            return [];
          }
          acc.push({ precio: parseFloat(curr), año: parseInt(array[index + 1]) });
        }
        return acc;
      }, []);
  }

  // Validación de precioHistorico vacío (si se ingresó algo, debe ser válido)
  if (precioHistorico.length === 0 && precioHistoricoInput.trim() !== "") {
    validaciones.mostrarAlertaError("Precio Histórico", "El historial de precios no es válido.");
    return;
  }

  // Preparar objeto de precio
  const precio = {
    producto_id,
    precioActual,
    precioDescuento,
    unidadLote,
    precioUnidadLote,
    precioHistorico,
  };

  try {
    let response;
    if (id) {
      response = await fetch(`http://localhost:3000/api/precios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(precio),
      });
    } else {
      response = await fetch("http://localhost:3000/api/precios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(precio),
      });
    }

    if (!response.ok) throw new Error("Error al guardar precio");

    await cargarPrecios();
    cerrarFormulario();
  } catch (err) {
    console.error("❌ Error guardando precio:", err);
  }
}

// 🟢 Editar precio
function editarPrecio(id) {
  const precio = preciosCache.find((p) => p._id === id);
  if (!precio) return;

  $("#formTitulo").text("Editar Precio");
  $("#precioID").val(precio._id);
  $("#productoID").val(precio.producto_id);
  $("#precioActual").val(precio.precioActual);
  $("#precioDescuento").val(precio.precioDescuento || "");
  $("#unidadLote").val(precio.unidadLote || "");
  $("#precioUnidadLote").val(precio.precioUnidadLote || "");

  // Formatear el precioHistorico para mostrarlo en el formulario
  $("#precioHistorico").val(
    precio.precioHistorico && Array.isArray(precio.precioHistorico)
      ? precio.precioHistorico.map(historico => `${historico.precio},${historico.año}`).join(", ")
      : ""
  );

  $("#botonesFormulario button:first")
    .off("click")
    .on("click", guardarCambiosDesdeFormulario);

  $("#formularioPrecio").show();
  document
    .getElementById("formularioPrecio")
    .scrollIntoView({ behavior: "smooth" });
}

// 🟢 Eliminar precio
async function eliminarPrecio(id) {
  const result = await Swal.fire({
    title: "¿Estás seguro?",
    text: "Esta acción no se puede deshacer",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
  });

  if (!result.isConfirmed) return;

  try {
    const response = await fetch(`http://localhost:3000/api/precios/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Error al eliminar precio");

    await Swal.fire("Eliminado", "El precio ha sido eliminado.", "success");

    await cargarPrecios();
  } catch (err) {
    console.error("❌ Error eliminando precio:", err);
    Swal.fire("Error", "No se pudo eliminar el precio.", "error");
  }
}

// 🟢 Cerrar formulario
function cerrarFormulario() {
  $("#formularioPrecio").hide();
  $(
    "#precioID, #productoID, #precioActual, #precioDescuento, #unidadLote, #precioUnidadLote, #precioHistorico"
  ).val("");
}

// 🟢 Exponer funciones globales
window.editarPrecio = editarPrecio;
window.eliminarPrecio = eliminarPrecio;
window.mostrarFormularioAgregar = mostrarFormularioAgregar;
window.guardarCambiosDesdeFormulario = guardarCambiosDesdeFormulario;
window.cerrarFormulario = cerrarFormulario;
window.cargarPrecios = cargarPrecios;
window.verPrecioHistorico = verPrecioHistorico;
