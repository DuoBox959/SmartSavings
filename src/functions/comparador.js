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
    const response = await fetch(`${API_URL}/comparador-precios`);
    const productos = await response.json();

    const nombresTiendas = [
      ...new Set(productos.filter((p) => p.Nombre === productoSeleccionado).map((p) => p.Supermercado))
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
    const response = await fetch(`${API_URL}/comparador-precios`);
    const precios = await response.json();

    if (!precios.length) {
      resultadoDiv.innerHTML = '<p style="color:red;">No hay precios en la base de datos.</p>';
      return;
    }

    const preciosFiltrados = precios
      .filter(p => p.Nombre === productoSeleccionado && tiendasSeleccionadas.includes(p.Supermercado))
      .map(p => ({
        tienda: p.Supermercado,
        precioActual: parseFloat(p.precioActual || 0),
        precioDescuento: parseFloat(p.precioDescuento || 0),
        unidadLote: p.unidadLote || "N/A",
        peso: parseFloat(p.Peso || 1),
        unidadPeso: p.UnidadPeso || "KG"
      }));

    // ✅ Usamos Math.min y find como prefieres
    const precioMasBarato = Math.min(...preciosFiltrados.map((p) => p.precioActual));
    const tiendaMasBarata = preciosFiltrados.find((p) => p.precioActual === precioMasBarato);

    let tiendaMasEconomica = null;
    let precioPorUnidadMin = Infinity;

    let resultadoHTML = `
      <h3 style="text-align: center; margin-bottom: 20px;">Comparación de Precios para "${productoSeleccionado}"</h3>
      <table style="width:100%; border-collapse: collapse; text-align: center;">
        <thead style="background-color: #f5f5f5;">
          <tr>
            <th style="border: 1px solid #ccc; padding: 8px;">Tienda</th>
            <th style="border: 1px solid #ccc; padding: 8px;">Precio Actual</th>
            <th style="border: 1px solid #ccc; padding: 8px;">Descuento</th>
            <th style="border: 1px solid #ccc; padding: 8px;">Unidad/Lote</th>
            <th style="border: 1px solid #ccc; padding: 8px;">Peso (KG)</th>
            <th style="border: 1px solid #ccc; padding: 8px;">€/KG</th>
          </tr>
        </thead>
        <tbody>
    `;

    preciosFiltrados.forEach(({ tienda, precioActual, precioDescuento, unidadLote, peso, unidadPeso }) => {
      // Extraer peso
      let pesoEnKG;
      const match = unidadLote.match(/([\d.,]+)\s*(KG|kg|L|l|UN|un|u)/);
      if (match) {
        pesoEnKG = parseFloat(match[1].replace(",", ".")) || peso;
      } else {
        pesoEnKG = peso;
      }


      const precioPorUnidad = precioActual / pesoEnKG;

      // Determinar opción más económica por €/KG
      if (precioPorUnidad < precioPorUnidadMin) {
        precioPorUnidadMin = precioPorUnidad;
        tiendaMasEconomica = { tienda, precioPorUnidad };
      }

      resultadoHTML += `
        <tr>
          <td style="border: 1px solid #ccc; padding: 8px;"><strong>${tienda}</strong></td>
          <td style="border: 1px solid #ccc; padding: 8px;"><u>${precioActual.toFixed(2)} €</u></td>
          <td style="border: 1px solid #ccc; padding: 8px;"><u>${precioDescuento.toFixed(2)} €</u></td>
          <td style="border: 1px solid #ccc; padding: 8px;"><u>${unidadLote}</u></td>
          <td style="border: 1px solid #ccc; padding: 8px;">${peso.toFixed(2)} ${unidadPeso}</td>
          <td style="border: 1px solid #ccc; padding: 8px;">${precioPorUnidad.toFixed(2)} €/kg</td>
        </tr>
      `;
    });

    resultadoHTML += `
        </tbody>
      </table>
      <p style="margin-top: 20px; font-size: 1.05em; color: #2c3e50;">
        🎯 <strong>La opción más económica</strong> es <strong>${tiendaMasEconomica.tienda}</strong>, con un mejor rendimiento en relación €/kg (${tiendaMasEconomica.precioPorUnidad.toFixed(2)} €/kg).
      </p>
      <p style="font-size: 1.05em; color: #2c3e50;">
        💰 <strong>La tienda más barata</strong> es <strong>${tiendaMasBarata.tienda}</strong> con un precio total de <strong>${tiendaMasBarata.precioActual.toFixed(2)} €</strong>.
      </p>
    `;

    resultadoDiv.innerHTML = resultadoHTML;

  } catch (err) {
    console.error("❌ Error al comparar precios:", err);
    resultadoDiv.innerHTML = '<p style="color:red;">Ocurrió un error al comparar precios.</p>';
  }
}
