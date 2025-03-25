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
    usuarios.forEach((usuario) => {
      // ✅ Ahora 'usuario' está definido
      usuariosTable.row.add([
        usuario._id,
        usuario.nombre,
        "********",
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

  // ✅ Mostrar fecha actual en el campo de fecha (formato DD/MM/AAAA)
  const fechaActual = new Date();
  $("#fechaRegistroUsuario").val(
    fechaActual.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  );

  // ✅ Cambiar la función del botón Guardar para CREAR usuario
  $("#botonesFormulario button:first")
    .off("click")
    .on("click", guardarCambiosDesdeFormulario);

  $("#formularioUsuario").show();
  document
    .getElementById("formularioUsuario")
    .scrollIntoView({ behavior: "smooth" });
}

// 🟢 Guardar (crear)
async function guardarCambiosDesdeFormulario() {
  const id = $("#usuarioID").val();
  const nombre = $("#nombreUsuario").val();
  let password = $("#passwordUsuario").val();
  const email = $("#emailUsuario").val();
  const rol = $("#rolUsuario").val();

  // ✅ Validar que todos los campos estén llenos
  if (!nombre || !email || !password) {
    alert("⚠️ Todos los campos son obligatorios.");
    return;
  }

  const usuario = {
    nombre,
    pass: password,
    email,
    rol,
  };

  console.log("📤 Enviando datos al backend:", usuario); // 🔍 Ver qué se envía

  try {
    let response;
    if (id) {
      // PUT = actualizar usuario
      response = await fetch(`http://localhost:3000/api/usuarios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(usuario),
      });
    } else {
      // POST = nuevo usuario
      response = await fetch("http://localhost:3000/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(usuario),
      });
    }

    if (!response.ok) throw new Error("Error al guardar usuario");

    const data = await response.json();
    console.log("✅ Respuesta del backend:", data); // 🔍 Ver respuesta del servidor

    // ❗ Posible problema: si `data.usuario` es undefined, evitar el error
    if (!data.usuario) {
      console.error("❌ Error: El backend no devolvió el usuario creado.");
      return;
    }

    // ✅ Si el usuario fue creado, actualizar la tabla sin recargar la página
    if (!id) {
      usuariosTable.row
        .add([
          data.usuario._id, // 🔹 Aquí es donde el error podría ocurrir
          data.usuario.nombre,
          "********", // 🔹 No mostrar la contraseña
          data.usuario.email,
          formatearFecha(data.usuario.fechaRegistro), // ✅ Ahora la fecha viene del backend
          data.usuario.rol,
          accionesHTML(data.usuario._id),
        ])
        .draw();
    }

    cerrarFormulario();
  } catch (err) {
    console.error("❌ Error guardando usuario:", err);
  }
}

// 🟢 Guardar cambios en la edición de un usuario existente
async function guardarEdicionUsuario() {
  const id = $("#usuarioID").val();
  if (!id) {
    console.error("❌ No hay un ID de usuario válido.");
    return;
  }

  const nombre = $("#nombreUsuario").val();
  const password = $("#passwordUsuario").val();
  const email = $("#emailUsuario").val();
  const rol = $("#rolUsuario").val();

  // ✅ Solo enviar los campos que se han modificado
  const usuarioActualizado = {};
  if (nombre) usuarioActualizado.nombre = nombre;
  if (password) usuarioActualizado.pass = password;
  if (email) usuarioActualizado.email = email;
  if (rol) usuarioActualizado.rol = rol;

  console.log("📤 Enviando datos para editar usuario:", usuarioActualizado);

  try {
    const response = await fetch(`http://localhost:3000/api/usuarios/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(usuarioActualizado),
    });

    if (!response.ok) throw new Error("Error al actualizar usuario");

    console.log("✅ Usuario actualizado correctamente");

    await cargarUsuarios();
    cerrarFormulario();
  } catch (err) {
    console.error("❌ Error actualizando usuario:", err);
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
  $("#passwordUsuario").val(usuario.password || ""); // 🔹val(""); No mostrar la contraseña real
  $("#rolUsuario").val(usuario.rol || "usuario");

  // ✅ Cambia la función del botón Guardar para edición
  $("#botonesFormulario button:first")
    .off("click")
    .on("click", guardarEdicionUsuario);

  $("#formularioUsuario").show();
  document
    .getElementById("formularioUsuario")
    .scrollIntoView({ behavior: "smooth" });
}

// 🟢 Eliminar usuario
async function eliminarUsuario(id) {
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
    const response = await fetch(`http://localhost:3000/api/usuarios/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Error al eliminar usuario");

    await Swal.fire("Eliminado", "El usuario ha sido eliminado.", "success");

    await cargarUsuarios();
  } catch (err) {
    console.error("❌ Error eliminando usuario:", err);
    Swal.fire("Error", "No se pudo eliminar el usuario.", "error");
  }
}

function mostrarMensajeInicioSesion(usuarioNombre) {
  Swal.fire({
    title: "¡Bienvenido! 🎉",
    html: `
      <h3 style="color:#333">Inicio de sesión exitoso</h3>
      <p style="font-size:18px;">Hola, <b>${usuarioNombre}</b>, nos alegra verte de nuevo. 😊</p>
    `,
    icon: "success",
    confirmButtonText: "Ir al Panel",
    confirmButtonColor: "#3085d6",
    timer: 4000, // Se cierra en 4 segundos automáticamente
    timerProgressBar: true,
    backdrop: `
      rgba(0,0,0,0.7)
      url("https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif")
      center center
      no-repeat
    `
  }).then(() => {
    window.location.href = "/src/intranet/html/intranet.html"; // Redirigir tras aceptar
  });
}


async function iniciarSesion() {
  const email = document.getElementById("emailUsuario").value;
  const password = document.getElementById("passwordUsuario").value;

  try {
    const response = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Error al iniciar sesión");
    }
    console.log("Datos recibidos del backend:", data);

    // ✅ Si el login es exitoso, mostramos SweetAlert2
    mostrarMensajeInicioSesion(data.nombre);

  } catch (error) {
    console.error("❌ Error al iniciar sesión:", error);
    Swal.fire({
      title: "Error",
      text: "Correo o contraseña incorrectos",
      icon: "error",
      confirmButtonText: "Intentar de nuevo",
    });
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


// 🟢 Exponer funciones globales
window.editarUsuario = editarUsuario;
window.eliminarUsuario = eliminarUsuario;
window.mostrarFormularioAgregar = mostrarFormularioAgregar;
window.guardarCambiosDesdeFormulario = guardarCambiosDesdeFormulario;
window.cerrarFormulario = cerrarFormulario;
window.cargarUsuarios = cargarUsuarios;
window,mostrarMensajeInicioSesion = mostrarMensajeInicioSesion;