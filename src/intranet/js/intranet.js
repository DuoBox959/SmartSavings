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

  // 📊 Cargar métricas dinámicamente desde la API
  async function cargarMetricas() {
    try {
      const response = await fetch("http://localhost:3000/api/metricas");
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (!data) throw new Error("No se recibieron datos");

      // 📊 Extraer datos de la API
      const categorias = data.usoSistema.map((item) => item.categoria);
      const valores = data.usoSistema.map((item) => item.cantidad);

      const semanas = data.actividadUsuarios.map((item) => item.semana);
      const usuarios = data.actividadUsuarios.map((item) => item.usuarios);

      // 🔹 Crear los gráficos con datos reales
      new Chart(document.getElementById("usoSistemaChart"), {
        type: "bar",
        data: {
          labels: categorias,
          datasets: [
            {
              label: "Uso del Sistema",
              data: valores,
              backgroundColor: ["#007BFF", "#28A745", "#FFC107", "#DC3545"],
            },
          ],
        },
      });

      new Chart(document.getElementById("actividadUsuariosChart"), {
        type: "line",
        data: {
          labels: semanas,
          datasets: [
            {
              label: "Usuarios Activos",
              data: usuarios,
              backgroundColor: "#17A2B8",
              borderColor: "#17A2B8",
              fill: false,
            },
          ],
        },
      });

      console.log("✅ Gráficos cargados con datos reales");
    } catch (error) {
      console.error("❌ Error cargando métricas:", error);
    }
  }

  // 📢 Llamar a la función para obtener métricas
  cargarMetricas();
});
