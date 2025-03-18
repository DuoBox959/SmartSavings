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
}

// 🟢 Guardar proveedor (crear o editar)
async function guardarProveedor() {
  const id = $("#proveedorID").val();
  const nombre = $("#nombreProveedor").val();
  const pais = $("#paisProveedor").val();
  const comunidadAutonoma = $("#comunidadAutonoma").val();

  if (!nombre || !pais || !comunidadAutonoma) {
    alert("⚠️ Todos los campos son obligatorios.");
    return;
  }

  const proveedor = {
    Nombre: nombre,
    Pais: pais,
    "C.Autonoma": comunidadAutonoma,
  };

  try {
    let response;
    if (id) {
      response = await fetch(`http://localhost:3000/api/proveedor/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proveedor),
      });
    } else {
      response = await fetch("http://localhost:3000/api/proveedor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proveedor),
      });
    }

    if (!response.ok) throw new Error("Error al guardar proveedor");

    await cargarProveedores();
    cerrarFormulario();
  } catch (err) {
    console.error("❌ Error guardando proveedor:", err);
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
}
// 🟢 Eliminar proveedor
async function eliminarProveedor(id) {
  const confirmacion = confirm("❗ ¿Estás seguro de eliminar este proveedor?");
  if (!confirmacion) return;

  try {
    const response = await fetch(`http://localhost:3000/api/proveedor/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("❌ Error al eliminar proveedor");

    await cargarProveedores(); // Recargar la tabla después de eliminar
  } catch (err) {
    console.error("❌ Error eliminando proveedor:", err);
  }
}

// 🟢 Volver atrás
function volverAtras() {
  window.location.href = "../html/intranet.html";
}

// 🟢 Cerrar formulario
function cerrarFormulario() {
  $("#formularioProveedor").hide();
  $("#proveedorID, #nombreProveedor, #paisProveedor, #comunidadAutonoma").val(
    ""
  );
}

// 🟢 Exponer funciones globales para el HTML
window.mostrarFormularioAgregar = mostrarFormularioAgregar;
window.cerrarFormulario = cerrarFormulario;
window.guardarProveedor = guardarProveedor;
window.cargarProveedores = cargarProveedores;
window.editarProveedor = editarProveedor;
window.eliminarProveedor = eliminarProveedor;
window.volverAtras = volverAtras;