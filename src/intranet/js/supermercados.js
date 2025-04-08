import * as validaciones from "../../valid/validaciones.js";

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

  // 🧼 Limpiar espacios extra en inputs de supermercado
  $(
    "#nombreSupermercado, #paisSupermercado, #ciudadSupermercado, #ubicacionSupermercado"
  )
    .on("blur", function () {
      $(this).val($(this).val().trim());
    })
    .on("input", function () {
      if (this.value.startsWith(" ")) {
        this.value = this.value.trimStart();
      }
    });
});

// ✅ Cargar supermercados desde el servidor
async function cargarSupermercados() {
  try {
    const respuesta = await fetch("http://localhost:3000/api/supermercados");
    const supermercados = await respuesta.json();

    supermercadosCache = supermercados; // Guardamos en caché

    supermercadosTable.clear(); // Limpiamos la tabla antes de actualizar
    supermercados.forEach((supermercado) => {
      supermercadosTable.row.add([
        supermercado._id,
        supermercado.Nombre || "Sin Nombre",
        supermercado.Pais || "Desconocido",
        supermercado.Ciudad || "Desconocida",
        `<button class="btn btn-primary" onclick="verUbicacion('${supermercado._id}')">📍 Ver Ubicación</button>`, // 🔹 Nuevo botón
        accionesHTML(supermercado._id),
      ]);
    });

    supermercadosTable.draw();
  } catch (error) {
    console.error("❌ Error al cargar supermercados:", error);
  }
}
function verUbicacion(id) {
  const supermercado = supermercadosCache.find((s) => s._id === id);
  if (!supermercado) return;

  const ubicacion = Array.isArray(supermercado.Ubicacion)
    ? supermercado.Ubicacion.join(", ")
    : "Ubicación no disponible";

  Swal.fire({
    title: "📍 Ubicación del Supermercado",
    text: ubicacion,
    icon: "info",
    confirmButtonText: "Aceptar",
    width: "600px",
  });
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
  $(
    "#supermercadoID, #nombreSupermercado, #paisSupermercado, #ciudadSupermercado, #ubicacionSupermercado"
  ).val("");

  $("#botonesFormulario button:first")
    .off("click")
    .on("click", guardarSupermercado);

  $("#formularioSupermercado").show();
  document
    .getElementById("formularioSupermercado")
    .scrollIntoView({ behavior: "smooth" });
}

// ✅ Guardar un supermercado (crear o editar)
async function guardarSupermercado() {
  const id = $("#supermercadoID").val();
  let nombre = $("#nombreSupermercado").val().trim();
  let pais = $("#paisSupermercado").val().trim();
  let ciudad = $("#ciudadSupermercado").val().trim();
  let ubicacion = $("#ubicacionSupermercado").val().trim();

  // 🛑 Validación de campos vacíos (Nombre, País y Ciudad son obligatorios)
  if (validaciones.camposVacios(nombre, pais, ciudad)) {
    validaciones.mostrarAlertaError("⚠️ Campos Obligatorios", "Los campos Nombre, País y Ciudad son obligatorios.");
    return;
  }

  // Asignamos valores predeterminados a los campos opcionales (como la Ubicación)
  ubicacion = ubicacion || "-"; // Si la ubicación está vacía, asignamos un valor predeterminado

  // 🛑 Validación de formato del nombre del supermercado (no debe estar vacío)
  if (!validaciones.esTextoValido(nombre)) {
    validaciones.mostrarAlertaError("⚠️ Error", "El nombre del supermercado no es válido.");
    return;
  }

  // 🛑 Validación de formato del país (no debe estar vacío)
  if (!validaciones.esTextoValido(pais)) {
    validaciones.mostrarAlertaError("⚠️ Error", "El país no es válido.");
    return;
  }

  // 🛑 Validación de formato de ciudad (no debe estar vacío)
  if (!validaciones.esTextoValido(ciudad)) {
    validaciones.mostrarAlertaError("⚠️ Error", "La ciudad no es válida.");
    return;
  }

  // Convertir la ubicación en un array si contiene valores
  let ubicacionArray = ubicacion !== "-" ? ubicacion.split(",").map((u) => u.trim()) : [];

  // Creamos el objeto supermercado con los datos ingresados
  const supermercado = {
    Nombre: nombre,
    Pais: pais,
    Ciudad: ciudad,
    Ubicacion: ubicacionArray, // Guardamos la ubicación como un array
  };

  try {
    let response;
    if (id) {
      // Si existe el id, actualizamos el supermercado (PUT)
      response = await fetch(`http://localhost:3000/api/supermercados/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supermercado),
      });
    } else {
      // Si no existe el id, creamos un nuevo supermercado (POST)
      response = await fetch("http://localhost:3000/api/supermercados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supermercado),
      });
    }

    // Verificamos si la respuesta fue exitosa
    if (!response.ok) throw new Error("Error al guardar supermercado");

    // Recargamos la tabla con los nuevos datos
    await cargarSupermercados();
    cerrarFormulario();
  } catch (err) {
    console.error("❌ Error guardando supermercado:", err);
    validaciones.mostrarAlertaError("❌ Error", "No se pudo guardar el supermercado.");
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
  document
    .getElementById("formularioSupermercado")
    .scrollIntoView({ behavior: "smooth" });
}

// ✅ Eliminar un supermercado
async function eliminarSupermercado(id) {
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
    const response = await fetch(
      `http://localhost:3000/api/supermercados/${id}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) throw new Error("Error al eliminar supermercado");

    await Swal.fire(
      "Eliminado",
      "El supermercado ha sido eliminado.",
      "success"
    );

    await cargarSupermercados();
  } catch (err) {
    console.error("❌ Error eliminando supermercado:", err);
    Swal.fire("Error", "No se pudo eliminar el supermercado.", "error");
  }
}

// ✅ Cerrar formulario
function cerrarFormulario() {
  $("#formularioSupermercado").hide();
  $(
    "#supermercadoID, #nombreSupermercado, #paisSupermercado, #ciudadSupermercado, #ubicacionSupermercado"
  ).val("");
}

function eliminarEspaciosAlInicio(event) {
  const valor = event.target.value;
  event.target.value = valor.replace(/^\s+/, '');
}

document.addEventListener('DOMContentLoaded', function () {
  const camposTexto = [
    'nombreSupermercado',
    'paisSupermercado',
    'ciudadSupermercado',
    'ubicacionSupermercado'
  ];

  camposTexto.forEach(id => {
    const campo = document.getElementById(id);
    if (campo) {
      campo.addEventListener('input', eliminarEspaciosAlInicio);
    }
  });
});

// ✅ Exponer funciones globales
window.mostrarFormularioAgregar = mostrarFormularioAgregar;
window.cerrarFormulario = cerrarFormulario;
window.editarSupermercado = editarSupermercado;
window.eliminarSupermercado = eliminarSupermercado;
window.cargarSupermercados = cargarSupermercados;
window.verUbicacion = verUbicacion;
