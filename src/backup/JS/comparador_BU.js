// Inicializa PouchDB para la base de datos local
const db = new PouchDB('comparacion_precios_2');

// Función genérica para crear opciones en un `<select>`
// - `elemento`: El elemento `<select>` donde se agregarán las opciones.
// - `opciones`: Un array de valores que se usarán para crear las opciones.
const crearOpciones = (elemento, opciones) => {
    // Limpia el contenido actual y agrega una opción por defecto
    elemento.innerHTML = '<option value="">Selecciona una opción</option>';
    opciones.forEach(opcion => {
        const option = document.createElement('option');
        option.value = opcion; // Asigna el valor de la opción
        option.textContent = opcion; // Asigna el texto visible de la opción
        elemento.appendChild(option); // Agrega la opción al `<select>`
    });
};

// Función para cargar los productos en el `<select>` de productos
// Se ejecuta al cargar la página para rellenar los productos disponibles
async function cargarProductos() {
    const productoSelect = document.getElementById('producto'); // `<select>` de productos

    try {
        // Obtiene todos los documentos de la base de datos
        const result = await db.allDocs({ include_docs: true });
        const productos = result.rows.map(row => row.doc); // Extrae los documentos

        // Extrae nombres de productos únicos y los ordena alfabéticamente
        const nombresProductos = [...new Set(productos.map(p => p.nombre))].sort();

        // Llena el `<select>` con las opciones de productos
        crearOpciones(productoSelect, nombresProductos);
    } catch (err) {
        console.error('Error al cargar productos:', err);
    }
}

// Función para cargar las tiendas en los selectores correspondientes (`tienda1` y `tienda2`)
// Se ejecuta cuando el usuario selecciona un producto
async function cargarTiendas() {
    const productoSeleccionado = document.getElementById('producto').value; // Producto seleccionado por el usuario
    const tienda1Select = document.getElementById('tienda1'); // Primer `<select>` de tiendas
    const tienda2Select = document.getElementById('tienda2'); // Segundo `<select>` de tiendas

    // Limpia las opciones existentes en ambos `<select>`
    [tienda1Select, tienda2Select].forEach(select => select.innerHTML = '<option value="">Selecciona una tienda</option>');

    // Si no hay un producto seleccionado, no se hace nada
    if (!productoSeleccionado) return;

    try {
        // Obtiene todos los documentos de la base de datos
        const result = await db.allDocs({ include_docs: true });
        const productos = result.rows.map(row => row.doc);

        // Filtra las tiendas que venden el producto seleccionado y obtiene sus nombres únicos
        const nombresTiendas = [...new Set(
            productos.filter(p => p.nombre === productoSeleccionado).map(p => p.supermercado)
        )].sort();

        // Llena ambos `<select>` con las opciones de tiendas
        [tienda1Select, tienda2Select].forEach(select => crearOpciones(select, nombresTiendas));
    } catch (err) {
        console.error('Error al cargar tiendas:', err);
    }
}

// Función para comparar precios entre las tiendas seleccionadas
// Se ejecuta cuando el usuario presiona el botón de comparación
async function compararPrecios() {
    const productoSeleccionado = document.getElementById('producto').value; // Producto seleccionado
    const tienda1 = document.getElementById('tienda1').value; // Tienda 1 seleccionada
    const tienda2 = document.getElementById('tienda2').value; // Tienda 2 seleccionada
    const resultadoDiv = document.getElementById('resultadoComparacion'); // Div donde se mostrarán los resultados

    // Validaciones básicas de los inputs
    if (!productoSeleccionado || !tienda1 || !tienda2) {
        resultadoDiv.innerHTML = '<p style="color:red;">Por favor, selecciona un producto y dos tiendas.</p>';
        return;
    }
    if (tienda1 === tienda2) {
        resultadoDiv.innerHTML = '<p style="color:red;">Por favor, selecciona dos tiendas diferentes.</p>';
        return;
    }

    try {
        // Obtiene todos los documentos de la base de datos
        const result = await db.allDocs({ include_docs: true });
        const productos = result.rows.map(row => row.doc);

        // Busca los precios del producto en las tiendas seleccionadas
        const obtenerPrecio = tienda => productos.find(p => p.nombre === productoSeleccionado && p.supermercado === tienda);
        const precioTienda1 = obtenerPrecio(tienda1); // Datos de la tienda 1
        const precioTienda2 = obtenerPrecio(tienda2); // Datos de la tienda 2

        // Validar que ambos precios estén disponibles
        if (!precioTienda1 || !precioTienda2) {
            resultadoDiv.innerHTML = '<p style="color:red;">No se encontraron precios en ambas tiendas seleccionadas para el producto.</p>';
            return;
        }

        // Convertir precios a números para realizar comparaciones
        const precioUnidad1 = parseFloat(precioTienda1.precioUnidad || 0);
        const precioUnidad2 = parseFloat(precioTienda2.precioUnidad || 0);

        // Determinar cuál tienda es más barata y calcular el ahorro
        let mensajeAhorro = '<p>Ambas tiendas tienen el mismo precio para este producto.</p>';
        if (precioUnidad1 < precioUnidad2) {
            mensajeAhorro = `<p>Es más barato en <strong>${tienda1}</strong> y te ahorrarías <strong>${(precioUnidad2 - precioUnidad1).toFixed(2)} €</strong>.</p>`;
        } else if (precioUnidad2 < precioUnidad1) {
            mensajeAhorro = `<p>Es más barato en <strong>${tienda2}</strong> y te ahorrarías <strong>${(precioUnidad1 - precioUnidad2).toFixed(2)} €</strong>.</p>`;
        }

        // Generar y mostrar los resultados en el div correspondiente
        resultadoDiv.innerHTML = `
            <h3>Comparación de Precios para "${productoSeleccionado}"</h3>
            <ul>
                <li>${tienda1}: ${precioUnidad1.toFixed(2)} € (Unidad), ${precioTienda1.precioLote || 'No disponible'} € (Lote)</li>
                <li>${tienda2}: ${precioUnidad2.toFixed(2)} € (Unidad), ${precioTienda2.precioLote || 'No disponible'} € (Lote)</li>
            </ul>
            ${mensajeAhorro}
        `;
    } catch (err) {
        console.error('Error al buscar precios:', err);
        resultadoDiv.innerHTML = '<p style="color:red;">Ocurrió un error al comparar precios.</p>';
    }
}

// Función para volver a la página anterior
// Se utiliza para retroceder en el historial del navegador
function volverAtras() {
    window.history.back();
}

// Carga inicial: Al cargar la página, se llama a la función para rellenar los productos
document.addEventListener('DOMContentLoaded', cargarProductos);
