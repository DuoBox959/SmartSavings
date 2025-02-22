import { db } from "../../libs/dbuser.js"; // ✅ Asegúrate de que `dbuser.js` existe

// 🔹 Variables globales
let usuariosTable;
let usuariosCache = [];

// 🔹 Iniciar DataTable y cargar usuarios cuando el documento esté listo
$(document).ready(() => {
  usuariosTable = $("#usuariosTable").DataTable({
    destroy: true,
    autoWidth: false,
    columns: [
      { title: "ID" },
      { title: "Nombre" },
      { title: "Email" },
      { title: "Rol" },
      { title: "Estado" },
      { title: "Fecha Registro" },
      { title: "Acciones" },
    ],
  });

  cargarUsuarios(); // ✅ Ahora se llama correctamente
});

// 🟢 **Cargar usuarios en la tabla**
async function cargarUsuarios() {
  try {
    const result = await db.allDocs({ include_docs: true });
    usuariosCache = result.rows.map((row) => row.doc);

    usuariosTable.clear();

    usuariosCache.forEach((usuario) => {
      usuariosTable.row.add([
        usuario._id,
        usuario.name || "Sin nombre",
        usuario.email || "Sin email",
        usuario.rol || "usuario",
        usuario.estado || "activo",
        usuario.fechaRegistro
          ? formatearFecha(usuario.fechaRegistro)
          : "Sin fecha",
        accionesHTML(usuario._id),
      ]);
    });

    usuariosTable.draw();
  } catch (err) {
    console.error("❌ Error cargando usuarios:", err);
  }
}

// 🟢 **Acciones de editar y eliminar**
function accionesHTML(id) {
  return `
        <button onclick="editarUsuario('${id}')">✏️ Editar</button>
        <button class="btn-eliminar" onclick="eliminarUsuario('${id}')">🗑️ Eliminar</button>
    `;
}

// 🟢 **Mostrar formulario para agregar usuario**
function mostrarFormularioAgregar() {
  $("#formTitulo").text("Añadir Usuario");
  $("#usuarioID, #nombreUsuario, #emailUsuario, #passwordUsuario").val("");
  $("#rolUsuario").val("usuario");
  $("#estadoUsuario").val("activo");
  $("#formularioUsuario").show();

  // Desplazamiento suave al formulario
  document
    .getElementById("formularioUsuario")
    .scrollIntoView({ behavior: "smooth" });
}

// 🟢 **Guardar cambios desde el formulario**
async function guardarCambiosDesdeFormulario() {
  const id = $("#usuarioID").val();
  const nombre = $("#nombreUsuario").val();
  const email = $("#emailUsuario").val();
  let password = $("#passwordUsuario").val();
  const rol = $("#rolUsuario").val();
  const estado = $("#estadoUsuario").val();
  const fechaRegistro = new Date().toISOString();

  if (!nombre || !email || !password) {
    alert("⚠️ Todos los campos son obligatorios.");
    return;
  }

  // ✅ Encriptar contraseña con SHA-256
  password = CryptoJS.SHA256(password).toString();

  let doc;
  if (id) {
    try {
      const existingDoc = await db.get(id);
      doc = { ...existingDoc, name: nombre, email, password, rol, estado };
    } catch (err) {
      console.error("❌ Error obteniendo el usuario:", err);
      return;
    }
  } else {
    doc = {
      _id: await asignarIDDisponible(),
      name: nombre,
      email,
      password,
      rol,
      estado,
      fechaRegistro,
      productosCreados: [], // ✅ Agregar campo vacío por defecto
    };
  }

  try {
    await db.put(doc);
    cargarUsuarios();
    cerrarFormulario();
  } catch (err) {
    console.error("❌ Error guardando usuario:", err);
  }
}

// 🟢 **Generar un ID único**
async function asignarIDDisponible() {
  const timestamp = new Date().getTime();
  return `user-${timestamp}`;
}

// 🟢 **Formatear fecha de registro**
function formatearFecha(fechaISO) {
  const fecha = new Date(fechaISO);
  return fecha.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// 🟢 **Editar un usuario**
function editarUsuario(id) {
  const usuario = usuariosCache.find((u) => u._id === id);
  if (!usuario) return;

  $("#formTitulo").text("Editar Usuario");
  $("#usuarioID").val(usuario._id);
  $("#nombreUsuario").val(usuario.name || "");
  $("#emailUsuario").val(usuario.email || "");
  $("#passwordUsuario").val(usuario.password || "");
  $("#rolUsuario").val(usuario.rol || "usuario");
  $("#estadoUsuario").val(usuario.estado || "activo");
  $("#formularioUsuario").show();
}

// 🟢 **Eliminar un usuario**
async function eliminarUsuario(id) {
  const usuario = usuariosCache.find((u) => u._id === id);
  if (!usuario) return;

  if (confirm("¿Estás seguro de eliminar este usuario?")) {
    try {
      await db.remove(usuario);
      cargarUsuarios();
    } catch (err) {
      console.error("❌ Error eliminando usuario:", err);
    }
  }
}

// 🟢 **Funciones globales para el HTML**
window.editarUsuario = editarUsuario;
window.eliminarUsuario = eliminarUsuario;
window.mostrarFormularioAgregar = mostrarFormularioAgregar;
window.guardarCambiosDesdeFormulario = guardarCambiosDesdeFormulario;
window.cerrarFormulario = cerrarFormulario;
window.volverAtras = volverAtras;
window.cargarUsuarios = cargarUsuarios; // ✅ Hacerla accesible globalmente

function volverAtras() {
  window.location.href = "../html/intranet.html";
}

function cerrarFormulario() {
  $("#formularioUsuario").hide();
  $("#usuarioID, #nombreUsuario, #emailUsuario, #passwordUsuario").val("");
}
