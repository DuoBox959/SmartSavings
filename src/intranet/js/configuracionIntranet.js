document.addEventListener("DOMContentLoaded", async function () {
    // 🟢 Obtener datos del usuario
    async function cargarDatosUsuario() {
      try {
        const user = JSON.parse(sessionStorage.getItem("user"));
        if (!user) {
          window.location.href = "../html/login.html"; // 🔴 Redirigir si no hay sesión
          return;
        }
  
        // 🟢 Obtener datos reales del usuario
        const response = await fetch(`http://localhost:3000/api/usuarios/${user._id}`);
        const data = await response.json();
  
        if (!response.ok) throw new Error(data.error || "Error al obtener datos");
  
        // 🟢 Llenar los campos con los datos reales
        document.getElementById("username").value = data.nombre;
        document.getElementById("email").value = data.email;
        document.getElementById("2fa").checked = data.dosFactores || false;
  
        console.log("✅ Datos de usuario cargados:", data);
      } catch (error) {
        console.error("❌ Error cargando datos del usuario:", error);
      }
    }
  
    // 🟢 Guardar cambios en perfil
    document.querySelector(".config-section button").addEventListener("click", async function () {
      try {
        const user = JSON.parse(sessionStorage.getItem("user"));
        if (!user) return;
  
        const nombreInput = document.getElementById("username");
        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");
        
        // Limpieza automática en tiempo real
        [nombreInput, emailInput, passwordInput].forEach((input) => {
          input.addEventListener("input", () => {
            if (input.value.startsWith(" ")) {
              input.value = input.value.trimStart();
            }
          });
          input.addEventListener("blur", () => {
            input.value = input.value.trim();
          });
        });
        
        const nombre = nombreInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        const updateData = { nombre, email };
        if (password.trim() !== "") updateData.pass = password; // 🔐 Solo enviar si cambia la contraseña
  
        const response = await fetch(`http://localhost:3000/api/usuarios/${user._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });
  
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Error al actualizar usuario");
  
        alert("✅ Perfil actualizado correctamente.");
        document.getElementById("password").value = ""; // 🔒 Limpiar campo de contraseña
  
        console.log("✅ Usuario actualizado:", result);
      } catch (error) {
        console.error("❌ Error actualizando usuario:", error);
      }
    });
  
    // 🟢 Actualizar Seguridad (2FA)
    document.getElementById("2fa").addEventListener("change", async function () {
      try {
        const user = JSON.parse(sessionStorage.getItem("user"));
        if (!user) return;
  
        const response = await fetch(`http://localhost:3000/api/usuarios/${user._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dosFactores: this.checked }),
        });
  
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Error al actualizar seguridad");
  
        alert("🔐 Seguridad actualizada correctamente.");
        console.log("✅ Seguridad actualizada:", result);
      } catch (error) {
        console.error("❌ Error actualizando seguridad:", error);
      }
    });
  
    // 🟢 Guardar Preferencias de Notificaciones
    document.querySelector(".config-section:last-child button").addEventListener("click", async function () {
      try {
        const user = JSON.parse(sessionStorage.getItem("user"));
        if (!user) return;
  
        const notificacionesCorreo = document.querySelector(".config-section:last-child input[type='checkbox']:nth-child(1)").checked;
        const notificacionesPush = document.querySelector(".config-section:last-child input[type='checkbox']:nth-child(2)").checked;
  
        const response = await fetch(`http://localhost:3000/api/usuarios/${user._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificacionesCorreo, notificacionesPush }),
        });
  
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Error al actualizar notificaciones");
  
        alert("📩 Notificaciones actualizadas correctamente.");
        console.log("✅ Notificaciones actualizadas:", result);
      } catch (error) {
        console.error("❌ Error actualizando notificaciones:", error);
      }
    });
  
    // 📌 Cargar los datos al abrir la página
    cargarDatosUsuario();
  });
  