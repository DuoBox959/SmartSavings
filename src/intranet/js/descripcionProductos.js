// ✅ Variables Globales
let descripcionTable;
let descripcionCache = [];

// ✅ Iniciar DataTable y cargar descripciones cuando el documento esté listo
$(document).ready(() => {
  descripcionTable = $("#descripcionProductosTable").DataTable({
    destroy: true,
    autoWidth: false,
    columns: [
      { title: "ID" },
      { title: "Producto ID" },
      { title: "Tipo" },
      { title: "Subtipo" },
      { title: "Utilidad" },
      { title: "Ingredientes" },
      { title: "Acciones" },
    ],
  });

  cargarDescripciones();
});

// ✅ Cargar descripciones desde el servidor
// ✅ Cargar descripciones desde el servidor
async function cargarDescripciones() {
  try {
    const respuesta = await fetch("http://localhost:3000/api/descripcion");
    const descripciones = await respuesta.json();

    descripcionCache = descripciones; // Guardamos en caché para editar/eliminar
    descripcionTable.clear(); // Limpiar la tabla antes de actualizar

    descripciones.forEach((descripcion) => {
      // ✅ Escapar los valores para evitar errores con comillas
      const utilidad = encodeURIComponent(descripcion.Utilidad || "Sin información");
      const ingredientes = encodeURIComponent(
        Array.isArray(descripcion.Ingredientes)
          ? descripcion.Ingredientes.join(", ")
          : "Sin ingredientes"
      );

      descripcionTable.row.add([
        descripcion._id || "N/A",
        descripcion.Producto_id || "N/A",
        descripcion.Tipo || "N/A",
        descripcion.Subtipo || "N/A",

        // ✅ Botón para ver Utilidad
        `<button class="btn-ver" onclick="verUtilidad('${utilidad}')">Ver Utilidad</button>`,

        // ✅ Botón para ver Ingredientes
        `<button class="btn-ver" onclick="verIngredientes('${ingredientes}')">Ver Ingredientes</button>`,

        accionesHTML(descripcion._id), // Botones de Editar/Eliminar
      ]);
    });

    descripcionTable.draw();
  } catch (error) {
    console.error("❌ Error al cargar descripciones:", error);
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
function mostrarFormularioAgregar() {
  $("#formTitulo").text("Añadir Descripción");
  $(
    "#descripcionID, #productoID, #tipoProducto, #subtipoProducto, #utilidadProducto, #ingredientesProducto"
  ).val("");

  $("#botonesFormulario button:first")
    .off("click")
    .on("click", guardarDescripcion);

  $("#formularioDescripcion").show();
}


// ✅ Guardar una descripción (crear o editar)
async function guardarDescripcion() {
  const id = $("#descripcionID").val();
  const producto_id = $("#productoID").val().trim();

  // 📌 Validar que `producto_id` no esté vacío
  if (!producto_id) {
    alert("⚠️ Producto ID es obligatorio.");
    return;
  }

  const descripcion = {
    Producto_id: producto_id, // Se enviará como string, pero el backend lo convertirá en ObjectId
    Tipo: $("#tipoProducto").val().trim() || null,
    Subtipo: $("#subtipoProducto").val().trim() || null,
    Utilidad: $("#utilidadProducto").val().trim() || null,
    Ingredientes: $("#ingredientesProducto").val().trim()
      ? $("#ingredientesProducto")
          .val()
          .trim()
          .split(",")
          .map((i) => i.trim())
      : [],
  };

  try {
    let response;
    if (id) {
      // Actualizar descripción
      response = await fetch(`http://localhost:3000/api/descripcion/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(descripcion),
      });
    } else {
      // Crear nueva descripción
      response = await fetch("http://localhost:3000/api/descripcion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(descripcion),
      });
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error al guardar descripción");
    }

    await cargarDescripciones();
    cerrarFormulario();
  } catch (err) {
    console.error("❌ Error guardando descripción:", err);
    alert(`❌ Error: ${err.message}`);
  }
}
// ✅ Mostrar la Utilidad en una ventana modal grande
window.verUtilidad = function (utilidad) {
  Swal.fire({
    title: "📌 Utilidad del Producto",
    html: `<p style="font-size: 18px;">${decodeURIComponent(utilidad)}</p>`,
    icon: "info",
    width: "600px", // Ajusta el ancho
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
    width: "600px", // Ajusta el ancho
    padding: "20px",
    confirmButtonText: "Aceptar",
  });
};



// ✅ Editar una descripción
function editarDescripcion(id) {
  const descripcion = descripcionCache.find((d) => d._id === id);
  if (!descripcion) return;

  $("#formTitulo").text("Editar Descripción");
  $("#descripcionID").val(descripcion._id);
  $("#productoID").val(descripcion.Producto_id);
  $("#tipoProducto").val(descripcion.Tipo);
  $("#subtipoProducto").val(descripcion.Subtipo);
  $("#utilidadProducto").val(descripcion.Utilidad);
  $("#ingredientesProducto").val(descripcion.Ingredientes.join(", "));

  $("#botonesFormulario button:first")
    .off("click")
    .on("click", guardarDescripcion);

  $("#formularioDescripcion").show();
}

// ✅ Eliminar una descripción
async function eliminarDescripcion(id) {
  const confirmacion = confirm("¿Estás seguro de eliminar esta descripción?");
  if (!confirmacion) return;

  try {
    const response = await fetch(
      `http://localhost:3000/api/descripcion/${id}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) throw new Error("Error al eliminar descripción");

    await cargarDescripciones();
  } catch (err) {
    console.error("❌ Error eliminando descripción:", err);
  }
}


// ✅ Cerrar el formulario de descripción
function cerrarFormulario() {
  $("#formularioDescripcion").hide();
  $(
    "#descripcionID, #productoID, #tipoProducto, #subtipoProducto, #utilidadProducto, #ingredientesProducto"
  ).val("");
}

// ✅ Exponer funciones globales para que sean accesibles en el HTML
window.mostrarFormularioAgregar = mostrarFormularioAgregar;
window.cerrarFormulario = cerrarFormulario;
window.editarDescripcion = editarDescripcion;
window.eliminarDescripcion = eliminarDescripcion;
window.cargarDescripciones = cargarDescripciones;
