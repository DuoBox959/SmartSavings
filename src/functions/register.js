import { db } from "../libs/dbuser.js";
import { volverAtras } from "../functions/global/funciones.js";

const registerForm = document.querySelector("form");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

window.volverAtras = volverAtras;

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = usernameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  // Validación de campos
  if (!username || !email || !password) {
    alert("Por favor, completa todos los campos.");
    return;
  }

  try {
    // Crear un nuevo usuario en la base de datos
    const newUser = {
      _id: new Date().toISOString(),
      name: username,
      email: email,
      password: password,
    };

    await db.put(newUser);

    // Guardar el usuario en sessionStorage para mantenerlo autenticado
    sessionStorage.setItem("user", JSON.stringify(newUser));

    alert("Usuario registrado correctamente. Redirigiendo al inicio...");

    // Redirigir al index ya logueado
    window.location.href = "index.html";
  } catch (error) {
    console.error("Error al registrar el usuario:", error);
    alert("Error al registrar el usuario. Por favor, inténtalo de nuevo.");
  }
});
