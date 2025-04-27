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
      { title: "Ubicaciones" }, // 🔹 Se mostrará como una cadena
      { title: "Acciones" },
    ],
  });

  cargarSupermercados();

  // 🧼 Limpiar espacios extra en inputs de supermercado
  $(
    "#nombreSupermercado, #ubicacionSupermercado"
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

    supermercadosCache = supermercados;

    supermercadosTable.clear();
    supermercados.forEach((supermercado) => {
      supermercadosTable.row.add([
        supermercado._id?.$oid || supermercado._id || "Sin ID",
        supermercado.Nombre || "Sin Nombre",
        `<button class="btn btn-primary" onclick="verUbicaciones('${supermercado._id?.$oid || supermercado._id}')">📍 Ver Ubicaciones</button>`,
        accionesHTML(supermercado._id?.$oid || supermercado._id),
      ]);
    });

    supermercadosTable.draw();
  } catch (error) {
    console.error("❌ Error al cargar supermercados:", error);
  }
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
  $( "#supermercadoID, #nombreSupermercado, #ubicacionSupermercado" ).val("");

  $("#botonesFormulario button:first")
    .off("click")
    .on("click", guardarSupermercado);

  $("#formularioSupermercado").show();
  document
    .getElementById("formularioSupermercado")
    .scrollIntoView({ behavior: "smooth" });
}

// ✅ Guardar un supermercado (crear o editar)
// ✅ Guardar un supermercado (crear o editar)
async function guardarSupermercado() {
  const id = $("#supermercadoID").val();
  let nombre = $("#nombreSupermercado").val().trim();

  // Obtener todas las ubicaciones ingresadas por el usuario
  const ubicaciones = [];
  const paises = document.querySelectorAll('.paisSupermercado');
  const ciudades = document.querySelectorAll('.ciudadSupermercado');
  const direcciones = document.querySelectorAll('.ubicacionSupermercado');
  
  // Recorrer todas las ubicaciones y agregarlas al array
  for (let i = 0; i < paises.length; i++) {
    let pais = paises[i].value.trim();
    let ciudad = ciudades[i].value.trim();
    let ubicacion = direcciones[i].value.trim();
    
    if (!pais || !ciudad || !ubicacion) {
      validaciones.mostrarAlertaError("⚠️ Campos Obligatorios", "Todos los campos de ubicación deben ser completados.");
      return;
    }

    ubicaciones.push({
      Pais: pais,
      Ciudad: ciudad,
      Ubicacion: ubicacion,
    });
  }

  if (validaciones.camposVacios(nombre)) {
    validaciones.mostrarAlertaError("⚠️ Campos Obligatorios", "El nombre del supermercado es obligatorio.");
    return;
  }

  if (!validaciones.esTextoValido(nombre)) {
    validaciones.mostrarAlertaError("⚠️ Error", "Verifica el campo de nombre del supermercado.");
    return;
  }

  const supermercado = {
    Nombre: nombre,
    Ubicaciones: ubicaciones, // Agregar las ubicaciones al supermercado
  };

  try {
    let response;
    if (id) {
      response = await fetch(`http://localhost:3000/api/supermercados/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supermercado),
      });
    } else {
      response = await fetch("http://localhost:3000/api/supermercados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supermercado),
      });
    }

    if (!response.ok) throw new Error("Error al guardar supermercado");

    await cargarSupermercados();
    cerrarFormulario();

    // ✅ Mostrar Swal cuando se haya agregado o editado correctamente
    await Swal.fire({
      title: id ? "Supermercado Editado" : "Supermercado Agregado",
      text: `El supermercado ${nombre} ha sido ${id ? "editado" : "agregado"} exitosamente.`,
      icon: "success",
      confirmButtonText: "Aceptar",
    });

  } catch (err) {
    console.error("❌ Error guardando supermercado:", err);
    validaciones.mostrarAlertaError("❌ Error", "No se pudo guardar el supermercado.");
  }
}

// ✅ Editar un supermercado
function editarSupermercado(id) {
  const supermercado = supermercadosCache.find((s) => s._id?.$oid === id || s._id === id);
  if (!supermercado) return;

  $("#formTitulo").text("Editar Supermercado");
  $("#supermercadoID").val(supermercado._id?.$oid || supermercado._id);
  $("#nombreSupermercado").val(supermercado.Nombre || "");
  $("#ubicacionSupermercado").val(supermercado.Ubicaciones?.[0]?.Ubicacion || "");

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
  $( "#supermercadoID, #nombreSupermercado, #ubicacionSupermercado" ).val("");
}

document.addEventListener('DOMContentLoaded', function () {
  const camposTexto = [
    'nombreSupermercado',
    'ubicacionSupermercado'
  ];

  camposTexto.forEach(id => {
    const campo = document.getElementById(id);
    if (campo) {
      campo.addEventListener('input', eliminarEspaciosAlInicio);
    }
  });
});

function eliminarEspaciosAlInicio(event) {
  const valor = event.target.value;
  event.target.value = valor.replace(/^\s+/, '');
}

function verUbicaciones(id) {
  const supermercado = supermercadosCache.find((s) => s._id?.$oid === id || s._id === id);
  if (!supermercado) return;

  const ubicaciones = supermercado.Ubicaciones?.map(u => 
    `${u.Pais}, ${u.Ciudad}: ${u.Ubicacion}`
  ).join("\n") || "No hay ubicaciones disponibles";

  Swal.fire({
    title: "📍 Ubicaciones del Supermercado",
    text: ubicaciones,
    icon: "info",
    confirmButtonText: "Aceptar",
    width: "600px",
  });
}

// Función para agregar un campo de ubicación dinámicamente
function agregarUbicacion() {
  // Crear un nuevo contenedor para una ubicación
  const contenedorUbicacion = document.createElement('div');
  contenedorUbicacion.classList.add('ubicacion-container');
  
  // Crear los campos de entrada para País, Ciudad y Ubicación
  contenedorUbicacion.innerHTML = `
    <label for="paisSupermercado">País:</label>
    <input type="text" class="paisSupermercado" placeholder="País" required />

    <label for="ciudadSupermercado">Ciudad:</label>
    <input type="text" class="ciudadSupermercado" placeholder="Ciudad" required />

    <label for="ubicacionSupermercado">Ubicación:</label>
    <input type="text" class="ubicacionSupermercado" placeholder="Dirección" required />

<button type="button" onclick="eliminarUbicacion(this)" style="display: block; margin: 0 auto;">❌ Eliminar</button>
 
  `;
  
  // Añadir el nuevo contenedor al contenedor de ubicaciones
  document.getElementById("ubicacionesContainer").appendChild(contenedorUbicacion);
}

// Función para eliminar una ubicación
function eliminarUbicacion(button) {
  const contenedorUbicacion = button.parentElement;
  contenedorUbicacion.remove();
}


// ✅ Exponer funciones globales
window.mostrarFormularioAgregar = mostrarFormularioAgregar;
window.cerrarFormulario = cerrarFormulario;
window.editarSupermercado = editarSupermercado;
window.eliminarSupermercado = eliminarSupermercado;
window.cargarSupermercados = cargarSupermercados;
window.verUbicaciones = verUbicaciones;
window.agregarUbicacion = agregarUbicacion;
window.eliminarUbicacion = eliminarUbicacion;

