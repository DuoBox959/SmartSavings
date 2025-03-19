document.addEventListener("DOMContentLoaded", function () {
  // ✅ Comprobar si el usuario tiene sesión y es admin
  const user = JSON.parse(sessionStorage.getItem("user"));

  if (!user || user.rol !== "admin") {
    // ❌ Si no hay usuario o no es admin, redirigir al login
    window.location.href = "../html/login.html";
    return; // 🔴 Detener la ejecución del resto del script
  }

  console.log(`✅ Bienvenido, ${user.name} (${user.rol})`);

  // ✅ Mostrar el nombre del usuario en la barra superior
  const userWelcome = document.getElementById("userWelcome");
  if (userWelcome) {
    userWelcome.innerHTML = `<strong>Bienvenido, ${user.name}</strong>`;
  }

  // 🕒 Función de cuenta regresiva
  function iniciarCuentaRegresiva() {
    const countdownElement = document.querySelector(".countdown");
    let tiempo = 12 * 3600 + 3 * 60 + 19; // 12 horas, 3 minutos, 19 segundos

    setInterval(() => {
      if (tiempo >= 0) {
        let horas = Math.floor(tiempo / 3600);
        let minutos = Math.floor((tiempo % 3600) / 60);
        let segundos = tiempo % 60;
        countdownElement.innerHTML = `${horas}:${minutos}:${segundos}`;
        tiempo--;
      }
    }, 1000);
  }

  iniciarCuentaRegresiva();

  // 🔴 Cerrar sesión (Maneja múltiples botones "Cerrar Sesión")
  document.querySelectorAll(".logout").forEach((btn) => {
    btn.addEventListener("click", function () {
      sessionStorage.removeItem("user"); // 🗑 Eliminar sesión
      window.location.href = "../html/login.html"; // 🔄 Redirigir al login
    });
  });
});
