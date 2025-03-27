document.addEventListener("DOMContentLoaded", async function () {
  // 🔐 Verificar sesión y cargar datos reales
  async function cargarDatosUsuario() {
    try {
      const user = JSON.parse(sessionStorage.getItem("user"));
      if (!user) return (window.location.href = "../html/login.html");

      const res = await fetch(`http://localhost:3000/api/usuarios/${user._id}`);
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "No se pudieron obtener los datos");

      document.getElementById("username").value = data.nombre;
      document.getElementById("email").value = data.email;
      document.getElementById("2fa").checked = data.dosFactores || false;

      // Guardamos ID en memoria para los siguientes cambios
      sessionStorage.setItem("userIdReal", data._id);

      console.log("✅ Datos cargados:", data);
    } catch (err) {
      console.error("❌ Error al cargar datos:", err);
    }
  }

  // 🟢 Guardar NUEVA CONTRASEÑA
  document
    .getElementById("btnGuardarPerfil")
    .addEventListener("click", async function () {
      const nuevaPassword = document.getElementById("password").value.trim();
      if (!nuevaPassword) {
        return alert("⚠️ Ingresa una nueva contraseña.");
      }

      try {
        const id = sessionStorage.getItem("userIdReal");
        const res = await fetch(`http://localhost:3000/api/usuarios/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pass: nuevaPassword }),
        });

        const result = await res.json();
        if (!res.ok)
          throw new Error(result.error || "Error al actualizar contraseña");

        document.getElementById("password").value = "";
        alert("✅ Contraseña actualizada con éxito");
      } catch (err) {
        console.error("❌ Error actualizando contraseña:", err);
      }
    });

  // 🟢 Seguridad (2FA)
  document.getElementById("2fa").addEventListener("change", async function () {
    const userId = sessionStorage.getItem("userIdReal");
    try {
      const res = await fetch(`http://localhost:3000/api/usuarios/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dosFactores: this.checked }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cambiar seguridad");
      alert("🔐 Seguridad actualizada correctamente.");
    } catch (err) {
      console.error("❌ Error en seguridad:", err);
    }
  });

  // 🟢 Guardar Notificaciones
  document
    .querySelector(".config-section:last-child button")
    .addEventListener("click", async function () {
      const userId = sessionStorage.getItem("userIdReal");

      const notificacionesCorreo = document.querySelectorAll(
        ".config-section:last-child input[type='checkbox']"
      )[0].checked;
      const notificacionesPush = document.querySelectorAll(
        ".config-section:last-child input[type='checkbox']"
      )[1].checked;

      try {
        const res = await fetch(
          `http://localhost:3000/api/usuarios/${userId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notificacionesCorreo, notificacionesPush }),
          }
        );

        const result = await res.json();
        if (!res.ok)
          throw new Error(result.error || "Error al actualizar preferencias");

        alert("📩 Preferencias de notificación guardadas.");
      } catch (err) {
        console.error("❌ Error en notificaciones:", err);
      }
    });

  // 🚀 Al cargar la página
  cargarDatosUsuario();
});
