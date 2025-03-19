document.addEventListener("DOMContentLoaded", function () {
    // Cargar el sidebar dinámicamente
    fetch("global/sidebar.html")
      .then((response) => response.text())
      .then((data) => {
        document.body.insertAdjacentHTML("afterbegin", data); // Agrega el sidebar al inicio del <body>
  
        // Activar funcionalidad del botón
        const toggleSidebarBtn = document.getElementById("toggleSidebar");
        const sidebar = document.getElementById("sidebar");
        const mainContent = document.getElementById("main-content");
  
        toggleSidebarBtn.addEventListener("click", function () {
          sidebar.classList.toggle("hidden");
          toggleSidebarBtn.classList.toggle("hidden");
          mainContent.classList.toggle("full-width");
  
          // Guardar estado del sidebar en localStorage
          localStorage.setItem("sidebarState", sidebar.classList.contains("hidden") ? "hidden" : "visible");
        });
  
        if (localStorage.getItem("sidebarState") === "hidden") {
          sidebar.classList.add("hidden");
          toggleSidebarBtn.classList.add("hidden");
          mainContent.classList.add("full-width");
        }
      })
      .catch((error) => console.error("Error cargando el sidebar:", error));
  });
  