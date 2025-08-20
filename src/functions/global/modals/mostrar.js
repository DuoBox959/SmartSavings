import { API_BASE } from "../UTILS/utils.js";

// ==============================
// ➕ ABRIR FORMULARIO DE AGREGAR PRODUCTO
// ==============================
export function mostrarFormularioAgregar() {
  const modal = document.getElementById("modal-agregar");
  if (!modal) return;
  modal.style.display = "flex";
  modal.setAttribute("aria-hidden", "false");

  // 🧹 Reiniciar dinámicos (ubicaciones de supermercado)
  const cont = document.getElementById("selector-ubicacion-dinamico");
  const selPais = document.getElementById("add-pais-existente");
  const inpPais = document.getElementById("add-nuevo-pais");
  const selCiudad = document.getElementById("add-ciudad-existente");
  const inpCiudad = document.getElementById("add-nueva-ciudad");
  const selUbic = document.getElementById("add-ubicacion-existente");
  const inpUbic = document.getElementById("add-nueva-ubicacion");

  if (cont) cont.style.display = "none";
  if (selPais) selPais.innerHTML = "";
  if (selCiudad) { selCiudad.style.display = "none"; selCiudad.innerHTML = ""; }
  if (selUbic)   { selUbic.style.display   = "none"; selUbic.innerHTML   = ""; }

  if (inpPais)   { inpPais.value = "";   inpPais.style.display = "none"; }
  if (inpCiudad) { inpCiudad.value = ""; inpCiudad.style.display = "none"; }
  if (inpUbic)   { inpUbic.value = "";   inpUbic.style.display = "none"; }

  // 👇 NO añadimos grupos dinámicos aquí (agregarUbicacionAdd) porque este modal no los usa.
}

// =======================================
// 🧱 FUNCIÓN PARA MOSTRAR PRODUCTOS EN PANTALLA
// =======================================
export function renderizarProductos(productos, precios = [], supermercados = []) {
  const cont = document.getElementById("productos-container");
  cont.innerHTML = "";

  // Mapa id -> nombre para lookup O(1)
  const supById = new Map(
    (supermercados || []).map(s => [String(s._id), s.Nombre])
  );

  const getSupName = (prod) => {
    // 1) Si ya viene populado con objeto
    if (prod.Supermercado?.Nombre) return prod.Supermercado.Nombre;

    // 2) Extrae un posible id desde varias claves/formas
    let sid =
      prod.Supermercado_id ??
      prod.supermercado_id ??
      prod.supermercado ??     // a veces guardas el id aquí
      prod.Supermercado;       // o incluso el nombre

    // Si es un objeto (ObjectId, {_id}, {$oid}, etc), intenta sacar la cadena
    if (sid && typeof sid === "object") {
      if (sid._id) sid = sid._id;
      else if (sid.$oid) sid = sid.$oid;
      else sid = String(sid);
    }

    // 3) Si lo que viene ya es el nombre, úsalo
    if (sid && typeof sid === "string" && !/^[a-f0-9]{24}$/i.test(sid)) {
      return sid; // parece un nombre, no un ObjectId
    }

    // 4) Busca en el mapa
    return supById.get(String(sid)) ?? "—";
  };

  productos.forEach((p) => {
    const precio = precios.find(x => String(x.producto_id) === String(p._id));
    const precioActual = precio?.precioActual ?? "N/D";
    const supNombre = getSupName(p);

    cont.insertAdjacentHTML(
      "beforeend",
      `
      <div class="product-card">
        <a href="detalle-producto.html?id=${p._id}">
          <img src="${
            p.Imagen?.startsWith('/uploads')
              ? `http://localhost:3000${p.Imagen}`
              : '../assets/img/default.webp'
          }" alt="${p.Nombre}">
          <h3>${p.Nombre}</h3>
        </a>
        <div class="info-producto">
          <p class="supermercado">Supermercado: ${supNombre}</p>
          <p class="precio">Precio: ${precioActual} €</p>
          <p class="peso">Peso: ${p.Peso ?? "?"} ${p.UnidadPeso ?? ""}</p>
          <p class="marca">Marca: ${p.Marca?.trim() || "Marca desconocida"}</p>
          <p class="estado">Estado: ${p.Estado?.trim() || "No especificado"}</p>
        </div>
        <div class="acciones">
          <button class="btn-editar" data-product-id="${p._id}">✏️ Editar</button>
          <button class="btn-eliminar" data-product-id="${p._id}">🗑️ Eliminar</button>
        </div>
      </div>`
    );
  });
}
