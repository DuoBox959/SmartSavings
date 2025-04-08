import * as validaciones from "../../valid/validaciones.js";

// 🔹 Variables globales
let proveedorTable;
let proveedorCache = [];

// 🔹 Iniciar DataTable y cargar proveedores al iniciar
$(document).ready(() => {
  proveedorTable = $("#proveedorTable").DataTable({
    destroy: true,
    autoWidth: false,
    columns: [
      { title: "ID" },
      { title: "Nombre" },
      { title: "País" },
      { title: "Comunidad Autónoma" },
      { title: "Acciones" },
    ],
  });

  cargarProveedores();

  // 🧼 Limpiar espacios innecesarios en los inputs de proveedor
  $("#nombreProveedor, #paisProveedor, #comunidadAutonoma").on(
    "blur",
    function () {
      $(this).val($(this).val().trim());
    }
  );

  // 🚫 BONUS: prevenir espacios al inicio mientras escribe
  $("#nombreProveedor, #paisProveedor, #comunidadAutonoma").on(
    "input",
    function () {
      if (this.value.startsWith(" ")) {
        this.value = this.value.trimStart();
      }
    }
  );
});

// 🟢 Cargar proveedores desde el servidor
async function cargarProveedores() {
  try {
    const respuesta = await fetch("http://localhost:3000/api/proveedor");
    const proveedores = await respuesta.json();

    proveedorCache = proveedores;
    proveedorTable.clear();
    proveedores.forEach((proveedor) => {
      proveedorTable.row.add([
        proveedor._id,
        proveedor.Nombre,
        proveedor.Pais,
        proveedor["C.Autonoma"] || "N/A",
        accionesHTML(proveedor._id),
      ]);
    });

    proveedorTable.draw();
  } catch (error) {
    console.error("❌ Error al cargar proveedores:", error);
  }
}

// 🟢 Generar HTML para botones de editar y eliminar
function accionesHTML(id) {
  return `
    <button onclick="editarProveedor('${id}')">✏️ Editar</button>
    <button class="btn-eliminar" onclick="eliminarProveedor('${id}')">🗑️ Eliminar</button>
  `;
}

// 🟢 Mostrar formulario para agregar un proveedor
function mostrarFormularioAgregar() {
  $("#formTitulo").text("Añadir Proveedor");
  $("#proveedorID, #nombreProveedor, #paisProveedor, #comunidadAutonoma").val(
    ""
  );

  $("#botonesFormulario button:first")
    .off("click")
    .on("click", guardarProveedor);

  $("#formularioProveedor").show();
  document
    .getElementById("formularioProveedor")
    .scrollIntoView({ behavior: "smooth" });
}

// 🟢 Guardar proveedor (crear o editar)
async function guardarProveedor() {
  // Obtener los valores de los campos del formulario
  const id = $("#proveedorID").val();
  const nombre = $("#nombreProveedor").val().trim();
  const pais = $("#paisProveedor").val().trim();
  const comunidadAutonoma = $("#comunidadAutonoma").val().trim();

  // 🛑 Validar que los campos no estén vacíos
  if (validaciones.camposVacios(nombre, pais, comunidadAutonoma)) {
    Swal.fire({
      icon: 'warning',
      title: 'Campos vacíos',
      text: 'Todos los campos son obligatorios.',
      confirmButtonText: 'Aceptar',
    });
    return;
  }

  // Crear el objeto del proveedor
  const proveedor = {
    Nombre: nombre,
    Pais: pais,
    "C.Autonoma": comunidadAutonoma,
  };

  try {
    let response;
    if (id) {
      // Editar proveedor
      response = await fetch(`http://localhost:3000/api/proveedor/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proveedor),
      });
    } else {
      // Crear nuevo proveedor
      response = await fetch("http://localhost:3000/api/proveedor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proveedor),
      });
    }

    if (!response.ok) throw new Error("Error al guardar proveedor");

    // Recargar proveedores y cerrar el formulario
    await cargarProveedores();
    cerrarFormulario();
  } catch (err) {
    console.error("❌ Error guardando proveedor:", err);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Hubo un problema al guardar el proveedor. Intenta nuevamente.',
      confirmButtonText: 'Aceptar',
    });
  }
}

// 🟢 Editar proveedor
function editarProveedor(id) {
  const proveedor = proveedorCache.find((p) => p._id === id);
  if (!proveedor) {
    alert("❌ Error: Proveedor no encontrado.");
    return;
  }

  $("#formTitulo").text("Editar Proveedor");
  $("#proveedorID").val(proveedor._id);
  $("#nombreProveedor").val(proveedor.Nombre || "");
  $("#paisProveedor").val(proveedor.Pais || "");
  $("#comunidadAutonoma").val(proveedor["C.Autonoma"] || "");

  $("#botonesFormulario button:first")
    .off("click")
    .on("click", guardarProveedor); // Se usa la misma función de guardar

  $("#formularioProveedor").show();
  document
    .getElementById("formularioProveedor")
    .scrollIntoView({ behavior: "smooth" });
}
// 🟢 Eliminar proveedor
async function eliminarProveedor(id) {
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
    const response = await fetch(`http://localhost:3000/api/proveedor/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("❌ Error al eliminar proveedor");

    await Swal.fire("Eliminado", "El proveedor ha sido eliminado.", "success");

    await cargarProveedores(); // Recargar la tabla después de eliminar
  } catch (err) {
    console.error("❌ Error eliminando proveedor:", err);
    Swal.fire("Error", "No se pudo eliminar el proveedor.", "error");
  }
}

// 🟢 Cerrar formulario
function cerrarFormulario() {
  $("#formularioProveedor").hide();
  $("#proveedorID, #nombreProveedor, #paisProveedor, #comunidadAutonoma").val(
    ""
  );
}

function eliminarEspaciosAlInicio(event) {
  const valor = event.target.value;
  event.target.value = valor.replace(/^\s+/, '');
}

document.addEventListener('DOMContentLoaded', function () {
  const camposTexto = ['nombreProveedor', 'paisProveedor', 'comunidadAutonoma'];

  camposTexto.forEach(id => {
    const campo = document.getElementById(id);
    if (campo) {
      campo.addEventListener('input', eliminarEspaciosAlInicio);
    }
  });
});

// 🟢 Exponer funciones globales para el HTML
window.mostrarFormularioAgregar = mostrarFormularioAgregar;
window.cerrarFormulario = cerrarFormulario;
window.guardarProveedor = guardarProveedor;
window.cargarProveedores = cargarProveedores;
window.editarProveedor = editarProveedor;
window.eliminarProveedor = eliminarProveedor;
