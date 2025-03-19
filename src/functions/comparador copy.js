import { db } from "../libs/db.js";
import { cargarHeaderFooter } from "../functions/global/funciones.js";
import { gestionarUsuarioAutenticado } from "../functions/global/header.js";
import { cerrarSesion } from "../functions/global/funciones.js";
import { volverAtras } from "../functions/global/funciones.js";

// Asignar funciones a `window`
window.volverAtras = volverAtras;
window.cargarTiendas = cargarTiendas;
window.anadirSelectorTienda = anadirSelectorTienda;
window.compararPrecios = compararPrecios;

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
  }, 100); // Revisa cada 100ms si el header ya está cargado
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

// 📦 Función para cargar productos en `<select>`
async function cargarProductos() {
  const productoSelect = document.getElementById("producto");
  try {
    const result = await db.allDocs({ include_docs: true });
    const productos = result.rows.map((row) => row.doc);
    const nombresProductos = [
      ...new Set(productos.map((p) => p.nombre)),
    ].sort();
    crearOpciones(productoSelect, nombresProductos);
  } catch (err) {
    console.error("Error al cargar productos:", err);
  }
}

// 🏪 Función para cargar tiendas en los selectores
async function cargarTiendas(selectElement = null) {
  const productoSeleccionado = document.getElementById("producto").value;

  // Si no hay producto seleccionado, no hacemos nada
  if (!productoSeleccionado) return;

  // Si no se pasa un selector específico, seleccionamos los dos primeros
  const tienda1Select = document.getElementById("tienda1");
  const tienda2Select = document.getElementById("tienda2");

  // Si se pasa un parámetro (el select dinámico de tienda), lo usamos
  const selects = selectElement ? [selectElement] : [tienda1Select, tienda2Select];

  try {
    const result = await db.allDocs({ include_docs: true });
    const productos = result.rows.map((row) => row.doc);
    const nombresTiendas = [
      ...new Set(
        productos
          .filter((p) => p.nombre === productoSeleccionado)
          .map((p) => p.supermercado)
      ),
    ].sort();

    // Crear las opciones para cada select pasado como argumento
    selects.forEach((select) => crearOpciones(select, nombresTiendas));
  } catch (err) {
    console.error("Error al cargar tiendas:", err);
  }
}


// ➕ Añadir un selector de tienda extra
let contadorTiendas = 3; // Inicia en "Tienda 3"
const limiteTiendas = 10; // Máximo de 10 tiendas

function anadirSelectorTienda() {
  if (contadorTiendas > limiteTiendas) {
    return; // No permite agregar más de 10 tiendas
  }

  const extraStoresDiv = document.getElementById("extraStores");

  // 📌 Contenedor de la nueva tienda
  const div = document.createElement("div");
  div.className = "extra-store";
  div.style.width = "100%"; // 🔹 Hace que el contenedor ocupe el 100% del formulario

  // 🏷 Crear la etiqueta numerada
  const label = document.createElement("label");
  label.textContent = `Tienda ${contadorTiendas}:`;
  label.setAttribute("for", `tienda${contadorTiendas}`);

  // 🔽 Crear el select con la misma clase
  const select = document.createElement("select");
  select.id = `tienda${contadorTiendas}`;
  select.classList.add("select-tiendas"); // Asegura que tenga la misma clase
  select.style.width = "100%"; // 🔹 Asegura el mismo ancho que los otros select
  select.innerHTML = '<option value="">Selecciona una tienda</option>';

  // 📌 Agregar elementos al formulario
  div.appendChild(label);
  div.appendChild(select);
  extraStoresDiv.appendChild(div);

  // 🔄 Aplicar Select2 al nuevo select para mantener el estilo
  $(`#${select.id}`).select2({
    placeholder: "Selecciona una opción",
    allowClear: true,
    width: "100%", // 🔹 Asegura que mantenga el mismo tamaño que los otros selects
  });

  // 📦 Cargar tiendas en el nuevo select
  cargarTiendas(select);

  contadorTiendas++; // Incrementar el contador

  // 🚫 Ocultar el botón si se llega al límite de tiendas
  if (contadorTiendas > limiteTiendas) {
    document.getElementById("addStoreButton").style.display = "none";
  }
}


// 📊 Comparar precios entre tiendas seleccionadas
async function compararPrecios() {
  const productoSeleccionado = document.getElementById("producto").value;
  const resultadoDiv = document.getElementById("resultadoComparacion");

  if (!productoSeleccionado) {
    resultadoDiv.innerHTML =
      '<p style="color:red;">Por favor, selecciona un producto.</p>';
    return;
  }

  const tiendasSeleccionadas = Array.from(
    document.querySelectorAll('select[id^="tienda"]')
  )
    .map((select) => select.value)
    .filter((value) => value);

  if (tiendasSeleccionadas.length < 2) {
    resultadoDiv.innerHTML =
      '<p style="color:red;">Por favor, selecciona al menos dos tiendas para comparar.</p>';
    return;
  }

  try {
    const result = await db.allDocs({ include_docs: true });
    const productos = result.rows.map((row) => row.doc);

    const precios = tiendasSeleccionadas.map((tienda) => {
      const producto = productos.find(
        (p) => p.nombre === productoSeleccionado && p.supermercado === tienda
      );
      return {
        tienda,
        precioUnidad: parseFloat(producto?.precioUnidad || 0),
        precioLote: parseFloat(producto?.precioLote || 0),
        peso: parseFloat(producto?.peso || 1),
        unidadPeso: producto?.unidadPeso || "kg",
      };
    });

    // Encontrar el precio más barato por unidad
    const precioMasBarato = Math.min(...precios.map((p) => p.precioUnidad));
    const tiendaMasBarata = precios.find(
      (p) => p.precioUnidad === precioMasBarato
    );

    // Calcular rentabilidad (precio por kilo o por unidad de peso)
    precios.forEach((p) => {
      p.precioPorPeso = p.peso > 0 ? p.precioUnidad / p.peso : Infinity;
    });

    const mejorRelacionCalidadPrecio = precios.reduce((mejor, actual) => {
      return actual.precioPorPeso < mejor.precioPorPeso ? actual : mejor;
    }, precios[0]);

    // Generar HTML con los datos comparativos
    let resultadoHTML = `<h3 style="text-align: center;">Comparación de Precios para "${productoSeleccionado}"</h3><ul>`;
    precios.forEach(
      ({
        tienda,
        precioUnidad,
        precioLote,
        peso,
        unidadPeso,
        precioPorPeso,
      }) => {
        resultadoHTML += `
                <li><strong>${tienda}</strong>: 
                <br>🔹 Precio Unidad: <strong>${precioUnidad.toFixed(
                  2
                )} €</strong>
                <br>🔹 Precio Lote: <strong>${precioLote.toFixed(2)} €</strong>
                <br>🔹 Peso: <strong>${peso} ${unidadPeso}</strong>
                <br>🔹 Precio por ${unidadPeso}: <strong>${precioPorPeso.toFixed(
          2
        )} €/ ${unidadPeso}</strong>
                </li><br>`;
      }
    );

    resultadoHTML += "</ul>";

    resultadoHTML += `<p>🎯 <strong>La tienda más barata</strong> es <strong>${
      tiendaMasBarata.tienda
    }</strong> con un precio de <strong>${tiendaMasBarata.precioUnidad.toFixed(
      2
    )} €</strong> por unidad.</p><br>`;

    // Reflexión sobre cuál opción es más rentable
    resultadoHTML += `<p>💡 <strong>Mejor relación calidad-precio</strong>: La mejor compra según el precio por peso es en <strong>${
      mejorRelacionCalidadPrecio.tienda
    }</strong> con un costo de <strong>${mejorRelacionCalidadPrecio.precioPorPeso.toFixed(
      2
    )} €/ ${mejorRelacionCalidadPrecio.unidadPeso}</strong>.</p>`;

    resultadoDiv.innerHTML = resultadoHTML;
  } catch (err) {
    console.error("Error al comparar precios:", err);
    resultadoDiv.innerHTML =
      '<p style="color:red;">Ocurrió un error al comparar precios.</p>';
  }
}
