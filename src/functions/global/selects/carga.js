import { renderizarProductos} from "../modals/mostrar.js";

// 📥 Cargar datos dinámicos en los selects (tipo, marca, etc.)

export async function cargarOpcionesEnSelects(configs) { 

    try {
      const fetchPromises = configs.map(({ campo, endpoint }) =>
        fetch(`http://localhost:3000/api/${endpoint}`).then((response) => {
          if (!response.ok) throw new Error(`No se pudo cargar ${campo}`);
          return response.json();
        })
      );
  
      const datosArray = await Promise.all(fetchPromises);
  
      configs.forEach(({ campo, usarId }, index) => {
        const datos = datosArray[index];
        const modos = ["add", "edit"];
  
        modos.forEach((modo) => {
          const select = document.getElementById(`${modo}-${campo}-select`);
          if (!select) return;
  
          select.innerHTML = `<option value="">Selecciona una opción</option>`;
  
          datos.forEach((item) => {
            const option = document.createElement("option");
            option.value = usarId ? item._id : item.Nombre || item;
            option.textContent = item.Nombre || item;
            select.appendChild(option);
          });
  
          // ➕ Opción para escribir un nuevo valor manualmente
          const optionOtro = document.createElement("option");
          optionOtro.value = "nuevo";
          optionOtro.textContent = "Otro (escribir nuevo)";
          select.appendChild(optionOtro);
        });
      });
    } catch (err) {
      console.error("❌ Error cargando selects dinámicos:", err);
    }
  

 }

 // ==============================
// 📥 FUNCIONES DE CARGA Y LISTADO
// ==============================

// 📥 Cargar productos y precios para renderizar en el listado principal
export async function cargarProductos() {
  try {
    const [productosRes, preciosRes] = await Promise.all([
      fetch("http://localhost:3000/api/productos"),
      fetch("http://localhost:3000/api/precios"),
    ]);
    const productos = await productosRes.json();
    const precios = await preciosRes.json();

    renderizarProductos(productos, precios);
  } catch (err) {
    console.error("Error cargando productos:", err);
  }
}



export function cargarUbicaciones(supermercado, pais, ciudad) {
  const ubicacionSelect = document.getElementById("add-ubicacion-existente");
  const nuevaUbicacionInput = document.getElementById("add-nueva-ubicacion");
  const labelNuevaUbicacion = document.getElementById("label-add-nueva-ubicacion");

  if (!supermercado || !pais || !ciudad) {
    ubicacionSelect.style.display = "none";
    if (nuevaUbicacionInput) nuevaUbicacionInput.style.display = "inline-block";
    if (labelNuevaUbicacion) labelNuevaUbicacion.style.display = "inline-block";
    return;
  }

  const ubicaciones = supermercado.Ubicaciones
    .filter((u) => u.Pais === pais && u.Ciudad === ciudad && typeof u.Ubicacion === "string")
    .map((u) => u.Ubicacion);

  if (ubicaciones.length === 0) {
    ubicacionSelect.style.display = "none";
    if (nuevaUbicacionInput) nuevaUbicacionInput.style.display = "inline-block";
    if (labelNuevaUbicacion) labelNuevaUbicacion.style.display = "inline-block";
    return;
  }

  // Mostrar select con opciones existentes + opción de nueva
  ubicacionSelect.innerHTML = `<option value="">Selecciona una ubicación</option>`;
  ubicaciones.forEach((u) => {
    ubicacionSelect.innerHTML += `<option value="${u}">${u}</option>`;
  });
  ubicacionSelect.innerHTML += `<option value="nuevo">Otra (nueva ubicación)</option>`;
  ubicacionSelect.style.display = "inline-block";

  // Ocultar input manual hasta que se seleccione "nuevo"
  if (nuevaUbicacionInput) nuevaUbicacionInput.style.display = "none";
  if (labelNuevaUbicacion) labelNuevaUbicacion.style.display = "none";
}

export function obtenerUbicacionesGenerico(prefijo) {
  const ubicaciones = [];

  const pais = document.getElementById(`${prefijo}-pais-existente`)?.value === "nuevo"
    ? document.getElementById(`${prefijo}-nuevo-pais`).value.trim()
    : document.getElementById(`${prefijo}-pais-existente`).value;

  const ciudad = document.getElementById(`${prefijo}-ciudad-existente`)?.value === "nuevo"
    ? document.getElementById(`${prefijo}-nueva-ciudad`).value.trim()
    : document.getElementById(`${prefijo}-ciudad-existente`).value;

  let ubicacion = "";
  const ubicacionSelect = document.getElementById(`${prefijo}-ubicacion-existente`);

  if (ubicacionSelect?.value === "nuevo") {
    ubicacion = document.getElementById(`${prefijo}-nueva-ubicacion`).value.trim();
  } else {
    ubicacion = ubicacionSelect?.value;
  }

  if (pais && ciudad && ubicacion) {
    ubicaciones.push({ pais, ciudad, ubicacion });
  }

  return ubicaciones;
}

//OBTENER SUPERMERCADOS

// ==============================
// 🧠 CACHÉ LOCAL DE SUPERMERCADOS
// ==============================
let cacheSupermercados = [];

export async function obtenerSupermercados() {
  if (cacheSupermercados.length > 0) return cacheSupermercados;

  const res = await fetch("http://localhost:3000/api/supermercados");
  if (!res.ok) throw new Error("Error al cargar supermercados");
  const data = await res.json();
  cacheSupermercados = data;
  return data;
}

export function limpiarCacheSupermercados() {
  cacheSupermercados = [];
}


window.renderizarProductos = renderizarProductos;
