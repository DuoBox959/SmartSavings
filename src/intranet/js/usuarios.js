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
      { title: "Password" },
      { title: "Email" },
      { title: "Fecha Registro" },
      { title: "Rol" },
      { title: "Acciones" },
    ],
  });

  cargarUsuarios(); // ✅ Llama la nueva función fetch
});

// 🟢 Cargar usuarios desde servidor Express

async function cargarUsuarios() {
  try {
    const respuesta = await fetch("http://localhost:3000/api/usuarios");
    const usuarios = await respuesta.json();

    usuariosCache = usuarios; // 👈 ACTUALIZAMOS EL CACHE GLOBAL

    usuariosTable.clear(); // ✅ Limpiamos tabla antes de cargar nuevos
    usuarios.forEach((usuario) => { // ✅ Ahora 'usuario' está definido
      usuariosTable.row.add([
        usuario._id,  
        usuario.nombre,
        usuario.pass,  // ✅ CORREGIDO: el campo en la BD es 'pass', no 'password'
        usuario.email,
        formatearFecha(usuario.fechaRegistro || new Date().toISOString()),
        usuario.rol,
        accionesHTML(usuario._id),
      ]);
    });
    
   
    usuariosTable.draw(); // ✅ Renderizar cambios
  } catch (error) {
    console.error("❌ Error al cargar usuarios:", error);
  }
}



// 🟢 Generar HTML para editar y eliminar
function accionesHTML(id) {
  return `
    <button onclick="editarUsuario('${id}')">✏️ Editar</button>
    <button class="btn-eliminar" onclick="eliminarUsuario('${id}')">🗑️ Eliminar</button>
  `;
}

// 🟢 Mostrar formulario para agregar
function mostrarFormularioAgregar() {
  $("#formTitulo").text("Añadir Usuario");
  $("#usuarioID, #nombreUsuario, #emailUsuario, #passwordUsuario").val("");
  $("#rolUsuario").val("usuario");
  $("#formularioUsuario").show();

  document.getElementById("formularioUsuario").scrollIntoView({ behavior: "smooth" });
}

// 🟢 Guardar (crear o actualizar)
async function guardarCambiosDesdeFormulario() {
  const id = $("#usuarioID").val();
  const nombre = $("#nombreUsuario").val();
  let password = $("#passwordUsuario").val();
  const email = $("#emailUsuario").val();
  const fechaRegistro = new Date().toISOString();
  const rol = $("#rolUsuario").val();


  if (!nombre || !email || !password) {
    alert("⚠️ Todos los campos son obligatorios.");
    return;
  }

  password = CryptoJS.SHA256(password).toString();

  const usuario = {
    nombre, 
    pass: password,
    email,
    fechaRegistro,
    rol,
   
  };

  try {
    if (id) {
      // PUT = actualizar
      const response = await fetch(`http://localhost:3000/api/usuarios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(usuario),
      });

      if (!response.ok) throw new Error("Error al actualizar usuario");
    } else {
      // POST = nuevo usuario
      const response = await fetch("http://localhost:3000/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(usuario),
      });

      if (!response.ok) throw new Error("Error al crear usuario");
    }

    await cargarUsuarios();
    cerrarFormulario();
  } catch (err) {
    console.error("❌ Error guardando usuario:", err);
  }
}

// 🟢 Editar usuario
function editarUsuario(id) {
  const usuario = usuariosCache.find((u) => u._id === id);
  if (!usuario) return;

  $("#formTitulo").text("Editar Usuario");
  $("#usuarioID").val(usuario._id);
  $("#nombreUsuario").val(usuario.nombre || "");
  $("#emailUsuario").val(usuario.email || "");
  $("#passwordUsuario").val(""); // nunca rellenamos password real
  $("#rolUsuario").val(usuario.rol || "usuario");
  $("#formularioUsuario").show();
}

// 🟢 Eliminar usuario
async function eliminarUsuario(id) {
  const confirmacion = confirm("¿Estás seguro de eliminar este usuario?");
  if (!confirmacion) return;

  try {
    const response = await fetch(`http://localhost:3000/api/usuarios/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Error al eliminar usuario");

    await cargarUsuarios();
  } catch (err) {
    console.error("❌ Error eliminando usuario:", err);
  }
}

// 🟢 Formatear fecha
function formatearFecha(fechaISO) {
  const fecha = new Date(fechaISO);
  if (isNaN(fecha.getTime())) return fechaISO; // Si es string no ISO, se devuelve tal cual
  return fecha.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}


// 🟢 Cerrar formulario
function cerrarFormulario() {
  $("#formularioUsuario").hide();
  $("#usuarioID, #nombreUsuario, #emailUsuario, #passwordUsuario").val("");
}

// 🟢 Volver atrás
function volverAtras() {
  window.location.href = "../html/intranet.html";
}

// 🟢 Exponer funciones globales
window.editarUsuario = editarUsuario;
window.eliminarUsuario = eliminarUsuario;
window.mostrarFormularioAgregar = mostrarFormularioAgregar;
window.guardarCambiosDesdeFormulario = guardarCambiosDesdeFormulario;
window.cerrarFormulario = cerrarFormulario;
window.volverAtras = volverAtras;
window.cargarUsuarios = cargarUsuarios;
