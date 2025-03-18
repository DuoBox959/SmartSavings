// ✅ Variables Globales
let supermercadosTable;
let supermercadosCache = [];

// ✅ Iniciar DataTable y cargar supermercados
$(document).ready(() => {
  supermercadosTable = $("#supermercadosTable").DataTable({
    destroy: true,
    autoWidth: false,
    columns: [
      { title: "ID" },
      { title: "Nombre" },
      { title: "País" },
      { title: "Ciudad" },
      { title: "Ubicación" }, // 🔹 Se mostrará como una cadena
      { title: "Acciones" },
    ],
  });

  cargarSupermercados();
});

// ✅ Cargar supermercados desde el servidor
async function cargarSupermercados() {
  try {
    const respuesta = await fetch("http://localhost:3000/api/supermercados");
    const supermercados = await respuesta.json();

    supermercadosCache = supermercados; // Guardamos en caché

    supermercadosTable.clear(); // Limpiamos tabla antes de actualizar
    supermercados.forEach((supermercado) => {
      supermercadosTable.row.add([
        supermercado._id,
        supermercado.Nombre || "Sin Nombre",
        supermercado.Pais || "Desconocido",
        supermercado.Ciudad || "Desconocida",
        formatoUbicacion(supermercado.Ubicacion), // 🔹 Función para convertir el array en texto
        accionesHTML(supermercado._id),
      ]);
    });

    supermercadosTable.draw();
  } catch (error) {
    console.error("❌ Error al cargar supermercados:", error);
  }
}

// ✅ Función para convertir `Ubicacion` de array a string
function formatoUbicacion(ubicacion) {
  if (Array.isArray(ubicacion)) {
    return ubicacion.join(", "); // 🔹 Convierte el array en una cadena separada por comas
  }
  return ubicacion || "No disponible";
}

// ✅ Función para generar botones de acciones
function accionesHTML(id) {
  return `
    <button onclick="editarSupermercado('${id}')">✏️ Editar</button>
    <button class="btn-eliminar" onclick="eliminarSupermercado('${id}')">🗑️ Eliminar</button>
  `;
}

// ✅ Mostrar formulario para agregar un supermercado
function mostrarFormularioAgregar() {
  $("#formTitulo").text("Añadir Supermercado");
  $("#supermercadoID, #nombreSupermercado, #paisSupermercado, #ciudadSupermercado, #ubicacionSupermercado").val("");

  $("#botonesFormulario button:first")
    .off("click")
    .on("click", guardarSupermercado);

  $("#formularioSupermercado").show();
}

// ✅ Guardar un supermercado (crear o editar)
async function guardarSupermercado() {
    const id = $("#supermercadoID").val();
    const nombre = $("#nombreSupermercado").val();
    const pais = $("#paisSupermercado").val();
    const ciudad = $("#ciudadSupermercado").val();
    const ubicacion = $("#ubicacionSupermercado").val().split(",").map(u => u.trim()); // 🔹 Convertir a array
  
    if (!nombre || !pais || !ciudad || !ubicacion.length) {
      alert("⚠️ Todos los campos son obligatorios.");
      return;
    }
  
    const supermercado = { Nombre: nombre, Pais: pais, Ciudad: ciudad, Ubicacion: ubicacion };
  
    try {
      let response;
      if (id) {
        // PUT = actualizar
        response = await fetch(`http://localhost:3000/api/supermercados/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(supermercado),
        });
      } else {
        // POST = nuevo
        response = await fetch("http://localhost:3000/api/supermercados", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(supermercado),
        });
      }
  
      if (!response.ok) throw new Error("Error al guardar supermercado");
  
      await cargarSupermercados(); // 🔹 Recargar la tabla con los nuevos datos
      cerrarFormulario();
    } catch (err) {
      console.error("❌ Error guardando supermercado:", err);
    }
  }
  
// ✅ Editar un supermercado
function editarSupermercado(id) {
  const supermercado = supermercadosCache.find((s) => s._id === id);
  if (!supermercado) return;

  $("#formTitulo").text("Editar Supermercado");
  $("#supermercadoID").val(supermercado._id);
  $("#nombreSupermercado").val(supermercado.Nombre || "");
  $("#paisSupermercado").val(supermercado.Pais || "");
  $("#ciudadSupermercado").val(supermercado.Ciudad || "");
  $("#ubicacionSupermercado").val((supermercado.Ubicacion || []).join(", ")); // 🔹 Convertir array a string

  $("#botonesFormulario button:first")
    .off("click")
    .on("click", guardarSupermercado);

  $("#formularioSupermercado").show();
}

// ✅ Eliminar un supermercado
async function eliminarSupermercado(id) {
  const confirmacion = confirm("¿Estás seguro de eliminar este supermercado?");
  if (!confirmacion) return;

  try {
    const response = await fetch(`http://localhost:3000/api/supermercados/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Error al eliminar supermercado");

    await cargarSupermercados();
  } catch (err) {
    console.error("❌ Error eliminando supermercado:", err);
  }
}

// 🟢 Volver atrás
function volverAtras() {
  window.location.href = "../html/intranet.html";
}

// ✅ Cerrar formulario
function cerrarFormulario() {
  $("#formularioSupermercado").hide();
  $("#supermercadoID, #nombreSupermercado, #paisSupermercado, #ciudadSupermercado, #ubicacionSupermercado").val("");
}

// ✅ Exponer funciones globales
window.mostrarFormularioAgregar = mostrarFormularioAgregar;
window.cerrarFormulario = cerrarFormulario;
window.editarSupermercado = editarSupermercado;
window.eliminarSupermercado = eliminarSupermercado;
window.cargarSupermercados = cargarSupermercados;
window.volverAtras = volverAtras;
