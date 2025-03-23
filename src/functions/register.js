import { volverAtras } from "../functions/global/funciones.js";

// Obtener el botón y agregarle el event listener
const backButton = document.querySelector(".back-button");

backButton.addEventListener("click", volverAtras);

const registerForm = document.getElementById("register-form");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const roleSelect = document.getElementById("role");

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = usernameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const role = roleSelect.value;  // Obtener el rol seleccionado

  // Validación de campos
  if (!username || !email || !password) {
    alert("Por favor, completa todos los campos.");
    return;
  }

  // Crear objeto para el nuevo usuario
  const newUser = {
    nombre: username,
    pass: password,
    email: email,
    rol: role,  // Asignar el rol seleccionado
  };

  try {
    // Enviar los datos al servidor usando fetch
    const response = await fetch("http://localhost:3000/api/usuarios", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newUser),
    });

    const data = await response.json();

    if (response.ok) {
      Swal.fire({
        icon: "success",
        title: "Registro exitoso",
        text: "Usuario registrado correctamente. Redirigiendo al inicio...",
        confirmButtonText: "Aceptar",
      }).then(() => {
        window.location.href = "index.html";
      });
    } else {
      throw new Error(data.error || "Error al registrar el usuario.");
    }
    
    } catch (error) {
      console.error("Error al registrar el usuario:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al registrar el usuario. Por favor, inténtalo de nuevo.",
        confirmButtonText: "Intentar de nuevo",
      });
    }
});
