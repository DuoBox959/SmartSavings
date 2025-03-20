document.addEventListener("DOMContentLoaded", function () {
  // ✅ Verificar usuario en sesión
  const user = JSON.parse(sessionStorage.getItem("user"));

  if (!user || user.rol !== "admin") {
    window.location.href = "../html/login.html"; // ❌ Redirigir si no es admin
    return;
  }

  console.log(`✅ Bienvenido, ${user.name} (${user.rol})`);

  // ✅ Mostrar nombre del usuario en la barra superior
  const userWelcome = document.getElementById("userWelcome");
  if (userWelcome) {
    userWelcome.innerHTML = `<strong>Bienvenido, ${user.name}</strong>`;
  }

  // 🕒 Iniciar cuenta regresiva para el evento
  function iniciarCuentaRegresiva() {
    const countdownElement = document.querySelector(".countdown");
    let tiempo = 12 * 3600 + 3 * 60 + 19; // 12 horas, 3 minutos, 19 segundos

    setInterval(() => {
      if (tiempo >= 0) {
        let horas = String(Math.floor(tiempo / 3600)).padStart(2, '0');
        let minutos = String(Math.floor((tiempo % 3600) / 60)).padStart(2, '0');
        let segundos = String(tiempo % 60).padStart(2, '0');
        countdownElement.innerHTML = `${horas}:${minutos}:${segundos}`;
        tiempo--;
      }
    }, 1000);
  }

  iniciarCuentaRegresiva();

  // 🔴 Función para cerrar sesión
  document.querySelectorAll(".logout").forEach((btn) => {
    btn.addEventListener("click", function () {
      sessionStorage.removeItem("user");
      window.location.href = "../html/login.html";
    });
  });

  // 🔽 Expandir cada sección de tareas por separado
  function toggleCollapsible(buttonId, collapsibleClass) {
    const button = document.getElementById(buttonId);
    const collapsible = document.querySelector(`.${collapsibleClass}`);

    if (button && collapsible) {
      button.addEventListener("click", function () {
        if (collapsible.style.maxHeight === "150px") {
          collapsible.style.maxHeight = "none";
          button.innerText = "Ver menos";
        } else {
          collapsible.style.maxHeight = "150px";
          button.innerText = "Ver más";
        }
      });
    }
  }

  // Aplicamos la función a cada botón
  toggleCollapsible("verMasBackend", "collapsible-backend");
  toggleCollapsible("verMasFrontend", "collapsible-frontend");

  // 📊 MÉTRICAS Y ESTADÍSTICAS - Gráficos con Chart.js
  if (typeof Chart !== "undefined") {
    const usoSistemaData = {
      labels: ["Inicio de Sesión", "Consultas de Productos", "Comparaciones", "Reportes Generados"],
      datasets: [{
        label: "Uso del Sistema",
        data: [50, 120, 80, 40], // Datos simulados
        backgroundColor: ["#007BFF", "#28A745", "#FFC107", "#DC3545"]
      }]
    };

    const actividadUsuariosData = {
      labels: ["Semana 1", "Semana 2", "Semana 3", "Semana 4"],
      datasets: [{
        label: "Usuarios Activos",
        data: [200, 180, 220, 190], // Datos simulados
        backgroundColor: "#17A2B8"
      }]
    };

    new Chart(document.getElementById("usoSistemaChart"), {
      type: "bar",
      data: usoSistemaData
    });

    new Chart(document.getElementById("actividadUsuariosChart"), {
      type: "line",
      data: actividadUsuariosData
    });
  } else {
    console.error("❌ Error: Chart.js no está cargado.");
  }
});
