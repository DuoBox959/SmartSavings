// Seleccionamos elementos del formulario
const loginForm = document.querySelector("form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

// Evento de submit
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert("⚠️ Por favor, completa todos los campos.");
    return;
  }

  console.log("📤 Enviando datos al servidor...", { email, password });

  try {
    const response = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    console.log("📥 Respuesta del servidor:", data);

    if (!response.ok) {
      console.error("❌ Error en login:", data.error || "Error desconocido");
      Swal.fire({
        icon: 'error',
        title: '¡Error!',
        text: data.error || "Error en el inicio de sesión",
        confirmButtonText: 'Aceptar'
      }).then(() => {
        // Después de que el usuario cierre la alerta, puedes redirigirlo si es necesario
        // Aquí puedes redirigir al usuario si el inicio de sesión falla, si lo deseas.
        window.location.href = "../../pages/index.html"; // Por ejemplo, redirigir a una página de error
      });
      return;
    }

    if (!data.user || !data.user.rol) {
      console.error("⚠️ Usuario sin rol definido:", data);
      Swal.fire({
        icon: 'error',
        title: '¡Error!',
        text: "Error: No se recibió un rol válido.",
        confirmButtonText: 'Aceptar'
      }).then(() => {
        // Redirigir al usuario si no tiene rol válido
        window.location.href = "../../pages/index.html"; // Redirige a una página específica
      });
      return;
    }

    console.log("🔎 Usuario autenticado:", data.user);

    // ✅ Guardar sesión del usuario
    sessionStorage.setItem(
      "user",
      JSON.stringify({
        name: data.user.nombre,
        email: data.user.email,
        rol: data.user.rol.toLowerCase(), // Normalizamos rol
      })
    );

    // ✅ Muestra el mensaje de bienvenida usando SweetAlert2
    Swal.fire({
      icon: 'success',
      title: `¡Bienvenido, ${data.user.nombre}!`,
      text: 'Inicio de sesión exitoso.',
      confirmButtonText: 'Aceptar'
    }).then(() => {
      // Luego de cerrar la alerta, redirige al usuario según el rol
      if (data.user.rol.toLowerCase() === "admin") {
        console.log("🚀 Redirigiendo a intranet...");
        window.location.href = "../html/intranet.html"; // Redirigir a la página de intranet
      } else {
        console.log("🚀 Redirigiendo a página de usuario...");
        window.location.href = "../../pages/index.html"; // Redirigir a la página de usuario
      }
    });
  } catch (error) {
    console.error("❌ Error en la solicitud:", error);
    Swal.fire({
      icon: 'error',
      title: '¡Error!',
      text: "Ocurrió un error al intentar iniciar sesión.",
      confirmButtonText: 'Aceptar'
    }).then(() => {
      // Redirigir en caso de error de conexión
      window.location.href = "../../pages/index.html"; // Redirigir a la página principal o de error
    });
  }
});
