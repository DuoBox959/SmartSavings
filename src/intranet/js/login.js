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
      alert(data.error || "Error en el inicio de sesión");
      return;
    }

    if (!data.user || !data.user.rol) {
      console.error("⚠️ Usuario sin rol definido:", data);
      alert("Error: No se recibió un rol válido.");
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

    alert(`✅ Inicio de sesión exitoso. Bienvenido, ${data.user.nombre}!`);

    // 🔄 Redirección según el rol
    if (data.user.rol.toLowerCase() === "admin") {
      console.log("🚀 Redirigiendo a intranet...");
      window.location.href = "../html/intranet.html";
    } else {
      console.log("🚀 Redirigiendo a página de usuario...");
      window.location.href = "../../pages/index.html";
    }
  } catch (error) {
    console.error("❌ Error en la solicitud:", error);
    alert("Ocurrió un error al intentar iniciar sesión.");
  }
});
