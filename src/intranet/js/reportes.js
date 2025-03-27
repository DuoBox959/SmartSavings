document.addEventListener("DOMContentLoaded", async function () {
  try {
    const response = await fetch("http://localhost:3000/api/reportes");
    const data = await response.json();

    if (!data) throw new Error("No se recibieron datos");

    // 📌 Insertar datos en el Dashboard
    document.getElementById("totalUsuarios").textContent = data.totalUsuarios;
    document.getElementById("usuariosActivos").textContent =
      data.usuariosActivos;
    document.getElementById("totalProductos").textContent = data.totalProductos;
    document.getElementById("totalSupermercados").textContent =
      data.totalSupermercados;
    document.getElementById("productosMasComparados").textContent =
      data.productoMasComparado;

    // 📈 Generar gráfico de comparaciones por categoría
    new Chart(document.getElementById("comparacionesChart"), {
      type: "bar",
      data: {
        labels: data.comparacionesPorCategoria.map((c) => c._id),
        datasets: [
          {
            label: "Comparaciones",
            data: data.comparacionesPorCategoria.map((c) => c.total),
            backgroundColor: ["#007BFF", "#28A745", "#FFC107", "#DC3545"],
          },
        ],
      },
    });

    // 📊 Generar gráfico de usuarios activos
    new Chart(document.getElementById("usuariosChart"), {
      type: "pie",
      data: {
        labels: ["Usuarios Activos", "Usuarios Inactivos"],
        datasets: [
          {
            label: "Distribución de Usuarios",
            data: [
              data.usuariosActivos,
              data.totalUsuarios - data.usuariosActivos,
            ],
            backgroundColor: ["#17A2B8", "#6C757D"],
          },
        ],
      },
    });

    // 📝 Llenar historial de actividad
    const historialTbody = document.getElementById("historial-tbody");
    historialTbody.innerHTML = "";
    data.historial.forEach((item) => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
          <td>${new Date(item.fecha).toLocaleDateString()}</td>
          <td>${item.usuario}</td>
          <td>${item.accion}</td>
        `;
      historialTbody.appendChild(fila);
    });

    console.log("✅ Reportes cargados con datos reales");
  } catch (error) {
    console.error("❌ Error cargando reportes:", error);
  }
});
