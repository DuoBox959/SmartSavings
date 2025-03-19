import { cargarHeaderFooter } from "../functions/global/funciones.js";
import { gestionarUsuarioAutenticado } from "../functions/global/header.js";
import { volverAtras } from "../functions/global/funciones.js";

// Asignar funciones a `window`
window.volverAtras = volverAtras;
window.cargarTiendas = cargarTiendas;
window.anadirSelectorTienda = anadirSelectorTienda;
window.compararPrecios = compararPrecios;

// URL de tu API de MongoDB
const API_URL = "http://localhost:3000/api";

// 🛠 Inicializar Select2 en los `<select>` de productos y tiendas
document.addEventListener("DOMContentLoaded", function () {
  $(".select-tiendas").select2({
    placeholder: "Selecciona una opción",
    allowClear: true,
  });

  cargarProductos();
  cargarHeaderFooter();

  // Esperar a que el header se cargue antes de ejecutar gestionarUsuarioAutenticado()
  const interval = setInterval(() => {
    if (document.getElementById("userMenu")) {
      gestionarUsuarioAutenticado();
      clearInterval(interval); // Detener la espera una vez que se ejecute la función
    }
  }, 100);
});

// 📋 Función para crear opciones en `<select>`
const crearOpciones = (elemento, opciones) => {
  elemento.innerHTML = '<option value="">Selecciona una opción</option>';
  opciones.forEach((opcion) => {
    const option = document.createElement("option");
    option.value = opcion;
    option.textContent = opcion;
    elemento.appendChild(option);
  });
};

// 📦 Cargar productos desde MongoDB
async function cargarProductos() {
  const productoSelect = document.getElementById("producto");
  try {
    const response = await fetch(`${API_URL}/productos`);
    const productos = await response.json();

    if (!productos.length) {
      console.warn("⚠️ No hay productos en la base de datos.");
      return;
    }

    const nombresProductos = [...new Set(productos.map((p) => p.Nombre))].sort();
    crearOpciones(productoSelect, nombresProductos);
  } catch (err) {
    console.error("❌ Error al cargar productos:", err);
  }
}

// 🏪 Cargar tiendas desde MongoDB según el producto seleccionado
async function cargarTiendas(selectElement = null) {
  const productoSeleccionado = document.getElementById("producto").value;
  if (!productoSeleccionado) return;

  const tienda1Select = document.getElementById("tienda1");
  const tienda2Select = document.getElementById("tienda2");
  const selects = selectElement ? [selectElement] : [tienda1Select, tienda2Select];

  try {
    const response = await fetch(`${API_URL}/productos`);
    const productos = await response.json();

    if (!productos.length) {
      console.warn("⚠️ No hay tiendas en la base de datos.");
      return;
    }

    // Filtrar tiendas según el producto
    const nombresTiendas = [
      ...new Set(productos.filter((p) => p.Nombre === productoSeleccionado).map((p) => p.Supermercado_id))
    ].sort();

    selects.forEach((select) => crearOpciones(select, nombresTiendas));
  } catch (err) {
    console.error("❌ Error al cargar tiendas:", err);
  }
}

// ➕ Añadir un selector de tienda extra
let contadorTiendas = 3;
const limiteTiendas = 10;

function anadirSelectorTienda() {
  if (contadorTiendas > limiteTiendas) return;

  const extraStoresDiv = document.getElementById("extraStores");
  const div = document.createElement("div");
  div.className = "extra-store";
  div.style.width = "100%";

  const label = document.createElement("label");
  label.textContent = `Tienda ${contadorTiendas}:`;
  label.setAttribute("for", `tienda${contadorTiendas}`);

  const select = document.createElement("select");
  select.id = `tienda${contadorTiendas}`;
  select.classList.add("select-tiendas");
  select.style.width = "100%";
  select.innerHTML = '<option value="">Selecciona una tienda</option>';

  div.appendChild(label);
  div.appendChild(select);
  extraStoresDiv.appendChild(div);

  $(`#${select.id}`).select2({
    placeholder: "Selecciona una opción",
    allowClear: true,
    width: "100%",
  });

  cargarTiendas(select);
  contadorTiendas++;

  if (contadorTiendas > limiteTiendas) {
    document.getElementById("addStoreButton").style.display = "none";
  }
}

// 📊 Comparar precios entre tiendas seleccionadas
async function compararPrecios() {
  const productoSeleccionado = document.getElementById("producto").value;
  const resultadoDiv = document.getElementById("resultadoComparacion");

  if (!productoSeleccionado) {
    resultadoDiv.innerHTML = '<p style="color:red;">Por favor, selecciona un producto.</p>';
    return;
  }

  const tiendasSeleccionadas = Array.from(document.querySelectorAll('select[id^="tienda"]'))
    .map((select) => select.value)
    .filter((value) => value);

  if (tiendasSeleccionadas.length < 2) {
    resultadoDiv.innerHTML = '<p style="color:red;">Por favor, selecciona al menos dos tiendas para comparar.</p>';
    return;
  }

  try {
    const response = await fetch(`${API_URL}/precios`);
    const precios = await response.json();

    if (!precios.length) {
      resultadoDiv.innerHTML = '<p style="color:red;">No hay precios en la base de datos.</p>';
      return;
    }

    const preciosFiltrados = tiendasSeleccionadas.map((tienda) => {
      const precio = precios.find((p) => p.producto_id === productoSeleccionado && p.Supermercado_id === tienda);
      return {
        tienda,
        precioActual: parseFloat(precio?.precioActual || 0),
        precioDescuento: parseFloat(precio?.precioDescuento || 0),
        unidadLote: precio?.unidadLote || "N/A",
      };
    });

    const precioMasBarato = Math.min(...preciosFiltrados.map((p) => p.precioActual));
    const tiendaMasBarata = preciosFiltrados.find((p) => p.precioActual === precioMasBarato);

    let resultadoHTML = `<h3 style="text-align: center;">Comparación de Precios para "${productoSeleccionado}"</h3><ul>`;
    preciosFiltrados.forEach(({ tienda, precioActual, precioDescuento, unidadLote }) => {
      resultadoHTML += `
        <li><strong>${tienda}</strong>: 
        <br>🔹 Precio Actual: <strong>${precioActual.toFixed(2)} €</strong>
        <br>🔹 Precio con Descuento: <strong>${precioDescuento.toFixed(2)} €</strong>
        <br>🔹 Unidad/Lote: <strong>${unidadLote}</strong>
        </li><br>`;
    });

    resultadoHTML += "</ul>";
    resultadoHTML += `<p>🎯 <strong>La tienda más barata</strong> es <strong>${tiendaMasBarata.tienda}</strong> con un precio de <strong>${tiendaMasBarata.precioActual.toFixed(2)} €</strong>.</p><br>`;
    resultadoDiv.innerHTML = resultadoHTML;
  } catch (err) {
    console.error("❌ Error al comparar precios:", err);
    resultadoDiv.innerHTML = '<p style="color:red;">Ocurrió un error al comparar precios.</p>';
  }
}
