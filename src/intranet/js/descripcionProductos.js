// ✅ Variables Globales 
let descripcionTable;
let descripcionCache = [];
let productosCache = [];

// ✅ Iniciar DataTable y cargar descripciones cuando el documento esté listo
$(document).ready(() => {
  descripcionTable = $("#descripcionProductosTable").DataTable({
    destroy: true,
    autoWidth: false,
    columns: [
      { title: "ID" },
      { title: "Producto" },
      { title: "Tipo" },
      { title: "Subtipo" },
      { title: "Utilidad" },
      { title: "Ingredientes" },
      { title: "Acciones" },
    ],
  });

  cargarDescripciones();

    // 🧼 Limpiar espacios al salir de los inputs
    $("#tipoProducto, #subtipoProducto, #utilidadProducto, #ingredientesProducto").on("blur", function () {
      const limpio = $(this).val().trim();
      $(this).val(limpio);
    });
  
    // 🚫 BONUS: prevenir espacios al inicio mientras se escribe
    $("#tipoProducto, #subtipoProducto, #utilidadProducto, #ingredientesProducto").on("input", function () {
      if (this.value.startsWith(" ")) {
        this.value = this.value.trimStart();
      }
    });
  
});

// ✅ Cargar descripciones desde el servidor
async function cargarDescripciones() {
  try {
    const respuesta = await fetch("http://localhost:3000/api/descripcion");
    const descripciones = await respuesta.json();

    descripcionCache = descripciones;
    descripcionTable.clear();

    descripciones.forEach((descripcion) => {
      const utilidad = encodeURIComponent(descripcion.Utilidad || "Sin información");
      const ingredientes = encodeURIComponent(
        Array.isArray(descripcion.Ingredientes)
          ? descripcion.Ingredientes.join(", ")
          : "Sin ingredientes"
      );

      descripcionTable.row.add([
        descripcion._id || "N/A",
        descripcion.Producto_id || "N/A", // Muestra el **nombre** del producto
        descripcion.Tipo || "N/A",
        descripcion.Subtipo || "N/A",
        `<button class="btn-ver" onclick="verUtilidad('${utilidad}')">Ver Utilidad</button>`,
        `<button class="btn-ver" onclick="verIngredientes('${ingredientes}')">Ver Ingredientes</button>`,
        accionesHTML(descripcion._id),
      ]);
    });

    descripcionTable.draw();
  } catch (error) {
    console.error("❌ Error al cargar descripciones:", error);
  }
}

// ✅ Cargar productos en el `<select>`
async function cargarOpcionesSelects() {
  try {
    const respuesta = await fetch("http://localhost:3000/api/productos");
    const productos = await respuesta.json();

    productosCache = productos;
    const selectProducto = $("#productoID");
    selectProducto.empty();
    selectProducto.append('<option value="">Selecciona un producto</option>');

    productos.forEach((producto) => {
      selectProducto.append(
        `<option value="${producto._id}">${producto.Nombre}</option>`
      );
    });
  } catch (error) {
    console.error("❌ Error cargando productos:", error);
  }
}

// ✅ Función para generar botones de acciones
function accionesHTML(id) {
  return `
    <button onclick="editarDescripcion('${id}')">✏️ Editar</button>
    <button class="btn-eliminar" onclick="eliminarDescripcion('${id}')">🗑️ Eliminar</button>
  `;
}

// ✅ Mostrar formulario para agregar una descripción
async function mostrarFormularioAgregar() {
  $("#formTitulo").text("Añadir Descripción");
  $("#descripcionID").val("");
  $("#productoID").val("").prop("disabled", false); // 🔹 Habilitamos el select nuevamente
  $("#tipoProducto").val("");
  $("#subtipoProducto").val("");
  $("#utilidadProducto").val("");
  $("#ingredientesProducto").val("");
  
  await cargarOpcionesSelects();

  $("#botonesFormulario button:first")
    .off("click")
    .on("click", guardarDescripcion);

  $("#formularioDescripcion").show();
  document.getElementById("formularioDescripcion").scrollIntoView({ behavior: "smooth" });
}

// ✅ Guardar una descripción (crear o editar)
async function guardarDescripcion(event) {
  event.preventDefault();

  const id = $("#descripcionID").val();
  const producto_id = $("#productoID").val().trim(); // 🔹 Debe ser un ObjectId válido

  // 🛠️ Si el producto seleccionado tiene un nombre en vez de un ID, buscar su ID en `productosCache`
  const productoEncontrado = productosCache.find((p) => p.Nombre === producto_id);
  const productoIdReal = productoEncontrado ? productoEncontrado._id : producto_id;

  // 🛠️ Verificar que Producto_id es un ObjectId válido antes de enviarlo
  if (!productoIdReal.match(/^[0-9a-fA-F]{24}$/)) {
    alert("⚠️ Error: Producto ID no es válido.");
    console.error("❌ Producto_id inválido:", productoIdReal);
    return;
  }

  const descripcion = {
    Producto_id: productoIdReal, // 🔹 Ahora siempre es el ID correcto
    Tipo: $("#tipoProducto").val().trim() || null,
    Subtipo: $("#subtipoProducto").val().trim() || null,
    Utilidad: $("#utilidadProducto").val().trim() || null,
    Ingredientes: $("#ingredientesProducto").val().trim()
      ? $("#ingredientesProducto").val().trim().split(",").map((i) => i.trim())
      : [],
  };

  // 🔍 Verificar los datos que se enviarán
  console.log("📤 Enviando datos al backend:", JSON.stringify(descripcion));

  try {
    let response;
    if (id) {
      response = await fetch(`http://localhost:3000/api/descripcion/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(descripcion),
      });
    } else {
      response = await fetch("http://localhost:3000/api/descripcion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(descripcion),
      });
    }

    // 🔍 Depurar la respuesta del backend
    console.log("🔄 Respuesta del servidor:", response);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Respuesta con error:", errorData);
      throw new Error(errorData.error || "Error al guardar descripción");
    }

    await cargarDescripciones();
    cerrarFormulario();
  } catch (err) {
    console.error("❌ Error guardando descripción:", err);
    alert(`❌ Error: ${err.message}`);
  }
}

// ✅ Editar una descripción (CORREGIDO, SOLO UNA FUNCIÓN)
async function editarDescripcion(id) {
  const descripcion = descripcionCache.find((d) => d._id === id);
  if (!descripcion) return;

  $("#formTitulo").text("Editar Descripción");
  $("#descripcionID").val(descripcion._id);
  $("#tipoProducto").val(descripcion.Tipo);
  $("#subtipoProducto").val(descripcion.Subtipo);
  $("#utilidadProducto").val(descripcion.Utilidad);
  $("#ingredientesProducto").val(descripcion.Ingredientes.join(", "));

  await cargarOpcionesSelects();

  // 🛠️ Buscar el producto por ID para obtener su nombre correcto
  const producto = productosCache.find((p) => p._id === descripcion.Producto_id);
  const nombreProducto = producto ? producto.Nombre : "Nombre de producto, no editable.";

  // 🛠️ Si el producto no está en el select, agregarlo
  const selectProducto = $("#productoID");
  if (selectProducto.find(`option[value='${descripcion.Producto_id}']`).length === 0) {
    selectProducto.append(
      `<option value="${descripcion.Producto_id}" selected>${nombreProducto}</option>`
    );
  }

  // 🔹 Asignar el ID correcto pero mostrar el nombre
  $("#productoID").val(descripcion.Producto_id).prop("disabled", true);

  $("#botonesFormulario button:first")
    .off("click")
    .on("click", guardarDescripcion);

  $("#formularioDescripcion").show();
  document.getElementById("formularioDescripcion").scrollIntoView({ behavior: "smooth" });
}

// ✅ Mostrar la Utilidad en una ventana modal grande
window.verUtilidad = function (utilidad) {
  Swal.fire({
    title: "📌 Utilidad del Producto",
    html: `<p style="font-size: 18px;">${decodeURIComponent(utilidad)}</p>`,
    icon: "info",
    width: "600px",
    padding: "20px",
    confirmButtonText: "Aceptar",
  });
};

// ✅ Mostrar los Ingredientes en una ventana modal grande
window.verIngredientes = function (ingredientes) {
  Swal.fire({
    title: "🥗 Ingredientes",
    html: `<p style="font-size: 18px; text-align: left;">${decodeURIComponent(ingredientes)}</p>`,
    icon: "info",
    width: "600px",
    padding: "20px",
    confirmButtonText: "Aceptar",
  });
};

// ✅ Eliminar una descripción
async function eliminarDescripcion(id) {
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
    const response = await fetch(`http://localhost:3000/api/descripcion/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Error al eliminar descripción");

    await Swal.fire("Eliminado", "La descripción ha sido eliminada.", "success");

    await cargarDescripciones();
  } catch (err) {
    console.error("❌ Error eliminando descripción:", err);
    Swal.fire("Error", "No se pudo eliminar la descripción.", "error");
  }
}

// ✅ Cerrar el formulario de descripción
function cerrarFormulario() {
  $("#formularioDescripcion").hide();
  $("#descripcionID, #productoID, #tipoProducto, #subtipoProducto, #utilidadProducto, #ingredientesProducto").val("");
}

// ✅ Exponer funciones globales
window.mostrarFormularioAgregar = mostrarFormularioAgregar;
window.cerrarFormulario = cerrarFormulario;
window.editarDescripcion = editarDescripcion;
window.eliminarDescripcion = eliminarDescripcion;
window.cargarDescripciones = cargarDescripciones;
window.cargarOpcionesSelects = cargarOpcionesSelects;
