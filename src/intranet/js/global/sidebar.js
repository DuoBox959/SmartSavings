document.addEventListener("DOMContentLoaded", function () {
  // Cargar el sidebar dinámicamente
  fetch("global/sidebar.html")
    .then((response) => response.text())
    .then((data) => {
      document.body.insertAdjacentHTML("afterbegin", data); // Agrega el sidebar al inicio del <body>

      // Obtener elementos
      const toggleSidebarBtn = document.getElementById("toggleSidebar");
      const sidebar = document.getElementById("sidebar");

      // Asegurar que el sidebar siempre inicie oculto
      sidebar.classList.add("hidden");
      toggleSidebarBtn.style.position = "absolute";
      toggleSidebarBtn.style.left = "0px"; // Posición inicial del botón
      toggleSidebarBtn.style.transition = "left 0.3s ease-in-out"; // Animación suave

      // Activar funcionalidad del botón
      toggleSidebarBtn.addEventListener("click", function () {
        sidebar.classList.toggle("hidden");

        // Mover el botón según el estado del sidebar
        if (sidebar.classList.contains("hidden")) {
          toggleSidebarBtn.style.left = "0px"; // Botón a la izquierda cuando el sidebar está oculto
        } else {
          toggleSidebarBtn.style.left = "250px"; // Ajusta esto según el ancho del sidebar
        }
      });
    })
    .catch((error) => console.error("Error cargando el sidebar:", error));
});
