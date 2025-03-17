// 🔹 Variables globales
let proveedorTable;
let proveedorCache = [];

// 🔹 Iniciar DataTable y cargar proveedores cuando el documento esté listo
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

// 🟢 Cargar proveedores desde servidor Express
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

// 🟢 Generar HTML para editar y eliminar
function accionesHTML(id) {
  return `
    <button onclick="editarProveedor('${id}')">✏️ Editar</button>
    <button class="btn-eliminar" onclick="eliminarProveedor('${id}')">🗑️ Eliminar</button>
  `;
}

// 🟢 Mostrar formulario para agregar
function mostrarFormularioAgregar() {
  $("#formTitulo").text("Añadir Proveedor");
  $("#proveedorID, #nombreProveedor, #paisProveedor, #comunidadAutonoma").val(
    ""
  );

  $("#botonesFormulario button:first")
    .off("click")
    .on("click", guardarCambiosDesdeFormulario);
  $("#formularioProveedor").show();
  document
    .getElementById("formularioProveedor")
    .scrollIntoView({ behavior: "smooth" });
}

// 🟢 Guardar proveedor (crear o editar)
async function guardarCambiosDesdeFormulario() {
  const id = $("#proveedorID").val();
  const nombre = $("#nombreProveedor").val();
  const pais = $("#paisProveedor").val();
  const comunidadAutonoma = $("#comunidadAutonoma").val();

  if (!nombre || !pais || !comunidadAutonoma) {
    alert("⚠️ Todos los campos son obligatorios.");
    return;
  }

  const proveedor = { nombre, pais, comunidadAutonoma };

  try {
    let response;
    if (id) {
      response = await fetch(`http://localhost:3000/api/proveedores/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proveedor),
      });
    } else {
      response = await fetch("http://localhost:3000/api/proveedores", {
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
  if (!proveedor) return;

  $("#formTitulo").text("Editar Proveedor");
  $("#proveedorID").val(proveedor._id);
  $("#nombreProveedor").val(proveedor.nombre || "");
  $("#paisProveedor").val(proveedor.pais || "");
  $("#comunidadAutonoma").val(proveedor.comunidadAutonoma || "");

  $("#botonesFormulario button:first")
    .off("click")
    .on("click", guardarCambiosDesdeFormulario);
  $("#formularioProveedor").show();
  document
    .getElementById("formularioProveedor")
    .scrollIntoView({ behavior: "smooth" });
}

// 🟢 Eliminar proveedor
async function eliminarProveedor(id) {
  const confirmacion = confirm("¿Estás seguro de eliminar este proveedor?");
  if (!confirmacion) return;

  try {
    const response = await fetch(
      `http://localhost:3000/api/proveedores/${id}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) throw new Error("Error al eliminar proveedor");

    await cargarProveedores();
  } catch (err) {
    console.error("❌ Error eliminando proveedor:", err);
  }
}

// 🟢 Cerrar formulario
function cerrarFormulario() {
  $("#formularioProveedor").hide();
  $("#proveedorID, #nombreProveedor, #paisProveedor, #comunidadAutonoma").val(
    ""
  );
}

// 🟢 Volver atrás
function volverAtras() {
  window.location.href = "../html/intranet.html";
}

// 🟢 Exponer funciones globales
window.editarProveedor = editarProveedor;
window.eliminarProveedor = eliminarProveedor;
window.mostrarFormularioAgregar = mostrarFormularioAgregar;
window.guardarCambiosDesdeFormulario = guardarCambiosDesdeFormulario;
window.cerrarFormulario = cerrarFormulario;
window.volverAtras = volverAtras;
window.cargarProveedores = cargarProveedores;
