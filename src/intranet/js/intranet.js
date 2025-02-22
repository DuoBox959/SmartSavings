document.addEventListener("DOMContentLoaded", function () {
  // 🕒 Función de cuenta regresiva
  function iniciarCuentaRegresiva() {
    const countdownElement = document.getElementById("countdown");
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

  // 🎭 Sidebar: Ocultar/Mostrar con deslizamiento
  const toggleSidebarBtn = document.getElementById("toggleSidebar");
  const sidebar = document.getElementById("sidebar");
  const mainContent = document.getElementById("main-content");

  // Evento para alternar la visibilidad del sidebar
  toggleSidebarBtn.addEventListener("click", function () {
    sidebar.classList.toggle("hidden");
    toggleSidebarBtn.classList.toggle("hidden");
    mainContent.classList.toggle("full-width");

    // Guardar estado del sidebar en localStorage
    if (sidebar.classList.contains("hidden")) {
      localStorage.setItem("sidebarState", "hidden");
    } else {
      localStorage.setItem("sidebarState", "visible");
    }
  });

  // Mantener el estado del sidebar después de recargar la página
  if (localStorage.getItem("sidebarState") === "hidden") {
    sidebar.classList.add("hidden");
    toggleSidebarBtn.classList.add("hidden");
    mainContent.classList.add("full-width");
  }
});
