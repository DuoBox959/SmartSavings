// Inicializa PouchDB para la base de datos local
const db = new PouchDB("comparacion_precios_2");
// Configuración de la base de datos remota con autenticación
const remoteDB = new PouchDB("http://127.0.0.1:5984/comparacion_precios_2", {
  auth: { username: "admin", password: "Dalma87" },
});
// Sincronización automática entre local y remoto
db.sync(remoteDB, {
  live: true, // Sincronización en tiempo real
  retry: true, // Reintentos automáticos en caso de error
});
// 📋 Función genérica para crear opciones en un `<select>`
const crearOpciones = (elemento, opciones) => {
  // Limpia el contenido del `<select>` y añade una opción predeterminada
  elemento.innerHTML = '<option value="">Selecciona una opción</option>';
  opciones.forEach((opcion) => {
    const option = document.createElement("option");
    option.value = opcion;
    option.textContent = opcion;
    elemento.appendChild(option);
  });
};

// 📦 Función para cargar los productos en el `<select>` de productos
async function cargarProductos() {
  const productoSelect = document.getElementById("producto");
  try {
    // Obtiene todos los documentos de la base de datos
    const result = await db.allDocs({ include_docs: true });
    const productos = result.rows.map((row) => row.doc);
    // Extrae y ordena los nombres únicos de productos
    const nombresProductos = [
      ...new Set(productos.map((p) => p.nombre)),
    ].sort();
    crearOpciones(productoSelect, nombresProductos);
  } catch (err) {
    console.error("Error al cargar productos:", err);
  }
}

// 🏪 Función para cargar las tiendas en los selectores de tiendas (`tienda1`, `tienda2`)
async function cargarTiendas() {
  const productoSeleccionado = document.getElementById("producto").value;
  const tienda1Select = document.getElementById("tienda1");
  const tienda2Select = document.getElementById("tienda2");

  // Reinicia el contenido de los selectores
  [tienda1Select, tienda2Select].forEach(
    (select) =>
      (select.innerHTML = '<option value="">Selecciona una tienda</option>')
  );

  // Si no hay producto seleccionado, no se cargan tiendas
  if (!productoSeleccionado) return;

  try {
    // Filtra las tiendas relacionadas con el producto seleccionado
    const result = await db.allDocs({ include_docs: true });
    const productos = result.rows.map((row) => row.doc);
    const nombresTiendas = [
      ...new Set(
        productos
          .filter((p) => p.nombre === productoSeleccionado)
          .map((p) => p.supermercado)
      ),
    ].sort();
    // Añade las tiendas a ambos selectores
    [tienda1Select, tienda2Select].forEach((select) =>
      crearOpciones(select, nombresTiendas)
    );
  } catch (err) {
    console.error("Error al cargar tiendas:", err);
  }
}

// 🏬 Función para cargar opciones en un selector adicional de tiendas
async function cargarTiendasAdicionales(selector) {
  const productoSeleccionado = document.getElementById("producto").value;

  if (!productoSeleccionado) {
    selector.innerHTML =
      '<option value="">Selecciona un producto primero</option>';
    return;
  }

  try {
    // Obtiene las tiendas relacionadas con el producto seleccionado
    const result = await db.allDocs({ include_docs: true });
    const productos = result.rows.map((row) => row.doc);
    const nombresTiendas = [
      ...new Set(
        productos
          .filter((p) => p.nombre === productoSeleccionado)
          .map((p) => p.supermercado)
      ),
    ].sort();
    crearOpciones(selector, nombresTiendas);
  } catch (err) {
    console.error("Error al cargar tiendas adicionales:", err);
  }
}

// ➕ Función para añadir un nuevo selector de tienda
let contadorTiendas = 3; // Inicializa el contador en "Tienda 3"
function añadirSelectorTienda() {
  const extraStoresDiv = document.getElementById("extraStores");

  const div = document.createElement("div");
  div.className = "extra-store";

  const label = document.createElement("label");
  label.textContent = `Tienda ${contadorTiendas}:`;
  label.setAttribute("for", `tienda${contadorTiendas}`);

  const select = document.createElement("select");
  select.id = `tienda${contadorTiendas}`;
  select.innerHTML = '<option value="">Selecciona una tienda</option>';

  // Carga las opciones del selector
  cargarTiendasAdicionales(select);

  div.appendChild(label);
  div.appendChild(select);
  extraStoresDiv.appendChild(div);

  contadorTiendas++;
}

// 📊 Función para comparar precios entre tiendas seleccionadas
async function compararPrecios() {
  const productoSeleccionado = document.getElementById("producto").value;
  const resultadoDiv = document.getElementById("resultadoComparacion");

  if (!productoSeleccionado) {
    resultadoDiv.innerHTML =
      '<p style="color:red;">Por favor, selecciona un producto.</p>';
    return;
  }

  // Obtiene las tiendas seleccionadas
  const tiendasSeleccionadas = Array.from(
    document.querySelectorAll('select[id^="tienda"]')
  )
    .map((select) => select.value)
    .filter((value) => value); // Filtra valores no seleccionados

  if (tiendasSeleccionadas.length < 2) {
    resultadoDiv.innerHTML =
      '<p style="color:red;">Por favor, selecciona al menos dos tiendas para comparar.</p>';
    return;
  }

  if (new Set(tiendasSeleccionadas).size !== tiendasSeleccionadas.length) {
    resultadoDiv.innerHTML =
      '<p style="color:red;">Por favor, selecciona tiendas diferentes.</p>';
    return;
  }

  try {
    // Busca los precios de las tiendas seleccionadas
    const result = await db.allDocs({ include_docs: true });
    const productos = result.rows.map((row) => row.doc);

    const precios = tiendasSeleccionadas.map((tienda) => {
      const producto = productos.find(
        (p) => p.nombre === productoSeleccionado && p.supermercado === tienda
      );
      return {
        tienda,
        precioUnidad: parseFloat(producto?.precioUnidad || 0),
        precioLote: producto?.precioLote || "No disponible",
        peso: producto?.peso || 0,
        unidadPeso: producto?.unidadPeso || "kg",
        ubicacion: producto?.ubicacion || "Ubicación no disponible",
      };
    });

    const precioMasBarato = Math.min(...precios.map((p) => p.precioUnidad));
    const tiendasMasBaratas = precios.filter(
      (p) => p.precioUnidad === precioMasBarato
    );

    let resultadoHTML = `<h3>Comparación de Precios para "${productoSeleccionado}"</h3><ul>`;
    precios.forEach(
      ({ tienda, precioUnidad, precioLote, peso, unidadPeso }) => {
        resultadoHTML += `<li>${tienda}: ${precioUnidad.toFixed(
          2
        )} € (Unidad), ${precioLote} € (Lote), Peso: ${peso} ${unidadPeso}</li>`;
      }
    );
    resultadoHTML += "</ul>";

    if (tiendasMasBaratas.length === 1) {
      resultadoHTML += `<p>La tienda más barata es <strong>${
        tiendasMasBaratas[0].tienda
      }</strong> con un precio de <strong>${tiendasMasBaratas[0].precioUnidad.toFixed(
        2
      )} €</strong>.</p>`;
    } else {
      resultadoHTML += `<p>Las tiendas más baratas son:</p><ul>`;
      tiendasMasBaratas.forEach(({ tienda, precioUnidad }) => {
        resultadoHTML += `<li>${tienda}: <strong>${precioUnidad.toFixed(
          2
        )} €</strong></li>`;
      });
      resultadoHTML += "</ul>";
    }

    resultadoDiv.innerHTML = resultadoHTML;
  } catch (err) {
    console.error("Error al comparar precios:", err);
    resultadoDiv.innerHTML =
      '<p style="color:red;">Ocurrió un error al comparar precios.</p>';
  }
}

// 🔙 Función para regresar a la página anterior
function volverAtras() {
  window.history.back();
}

// 📦 Carga inicial: Rellenar productos al cargar la página
document.addEventListener("DOMContentLoaded", cargarProductos);
