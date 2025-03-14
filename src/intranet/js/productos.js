// 🔹 Variables globales
let productosTable;
let productosCache = [];

// 🔹 Iniciar DataTable y cargar productos cuando el documento esté listo
$(document).ready(() => {
  productosTable = $("#productosTable").DataTable({
    destroy: true,
    autoWidth: false,
    columns: [
      { title: "ID" },
      { title: "Imagen" },
      { title: "Nombre" },
      { title: "Marca" },
      { title: "Peso" }, // Solo una columna para el peso y su unidad
      { title: "Proveedor_id" },
      { title: "Supermercado_id" },
      { title: "Usuario_id" }, // Aseguramos que la columna de Usuario_id esté en la posición correcta
      { title: "Estado" }, // Aseguramos que la columna de Estado esté en la posición correcta
      { title: "Acciones" }, // La columna de Acciones es la última
    ],
  });

  cargarProductos(); // ✅ Llama la nueva función fetch
});

// 🟢 Cargar productos desde servidor Express
async function cargarProductos() {
  try {
    const respuesta = await fetch("http://localhost:3000/api/productos");
    const productos = await respuesta.json();

    productosCache = productos; // 👈 ACTUALIZAMOS EL CACHE GLOBAL

    productosTable.clear(); // ✅ Limpiamos tabla antes de cargar nuevos
    productos.forEach((producto) => {
      const pesoConUnidad = `${producto.Peso} ${producto.UnidadPeso}`; // Combinamos peso y unidad
      productosTable.row.add([
        producto._id,
        `<img src="${producto.Imagen || ""}" alt="${
          producto.Nombre
        }" width="50" />`, // ✅ Asegurarse de que la imagen esté disponible
        producto.Nombre,
        producto.Marca,
        pesoConUnidad, // Mostramos peso + unidad en una sola celda
        producto.Proveedor_id
          ? producto.Proveedor_id.$oid || producto.Proveedor_id
          : "",
        producto.Supermercado_id
          ? producto.Supermercado_id.$oid || producto.Supermercado_id
          : "",
        producto.Usuario_id
          ? producto.Usuario_id.$oid || producto.Usuario_id
          : "", // Aseguramos que el campo Usuario_id esté en su columna
        producto.Estado, // Aseguramos que el estado esté en su columna correspondiente
        accionesHTML(producto._id), // Los botones de acciones
      ]);
    });

    productosTable.draw(); // ✅ Renderizar cambios
  } catch (error) {
    console.error("❌ Error al cargar productos:", error);
  }
}

// 🟢 Generar HTML para editar y eliminar
function accionesHTML(id) {
  return `
    <button onclick="editarProducto('${id}')">✏️ Editar</button>
    <button class="btn-eliminar" onclick="eliminarProducto('${id}')">🗑️ Eliminar</button>
  `;
}

// 🟢 Mostrar formulario para agregar producto
function mostrarFormularioAgregar() {
  $("#formTitulo").text("Añadir Producto");
  $(
    "#productoID, #nombreProducto, #marcaProducto, #pesoProducto, #estadoProducto"
  ).val("");
  $("#imagenProducto").val("");

  // ✅ Cambiar la función del botón Guardar para CREAR producto
  $("#botonesFormulario button:first")
    .off("click")
    .on("click", guardarCambiosDesdeFormulario);

  $("#formularioProducto").show();
  document
    .getElementById("formularioProducto")
    .scrollIntoView({ behavior: "smooth" });
}

// 🟢 Guardar (crear) producto
async function guardarCambiosDesdeFormulario() {
  const id = $("#productoID").val();
  const nombre = $("#nombreProducto").val();
  const imagen = $("#imagenProducto").val();
  const marca = $("#marcaProducto").val();
  const peso = $("#pesoProducto").val();
  const estado = $("#estadoProducto").val();

  // ✅ Validar que todos los campos estén llenos
  // if (!nombre || !marca || !peso || !estado) {
  //   alert("⚠️ Todos los campos son obligatorios.");
  //   return;
  // }

  // Separar peso y unidad de peso
  const [pesoValor, unidadPeso] = peso.split(" ");

  const producto = {
    Nombre: nombre,
    Imagen: imagen,
    Marca: marca,
    Peso: pesoValor, // Guardamos solo el número
    UnidadPeso: unidadPeso || "", // Guardamos solo la unidad
    Estado: estado,
  };

  console.log("📤 Enviando datos al backend:", producto); // 🔍 Ver qué se envía

  try {
    let response;
    if (id) {
      // PUT = actualizar producto
      response = await fetch(`http://localhost:3000/api/productos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(producto),
      });
    } else {
      // POST = nuevo producto
      response = await fetch("http://localhost:3000/api/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(producto),
      });
    }

    if (!response.ok) throw new Error("Error al guardar producto");

    const data = await response.json();
    console.log("✅ Respuesta del backend:", data); // 🔍 Ver respuesta del servidor

    if (!data.producto) {
      console.error("❌ Error: El backend no devolvió el producto creado.");
      return;
    }

    // ✅ Si el producto fue creado, actualizar la tabla sin recargar la página
    if (!id) {
      const pesoConUnidad = `${data.producto.Peso} ${data.producto.UnidadPeso}`; // Combinamos el peso y la unidad
      productosTable.row
        .add([
          data.producto._id,
          `<img src="${data.producto.Imagen}" alt="${data.producto.Nombre}" width="50" />`, // ✅ Muestra la imagen del producto
          data.producto.Nombre,
          data.producto.Marca,
          pesoConUnidad, // Mostramos peso + unidad en una sola celda
          data.producto.Proveedor_id ? data.producto.Proveedor_id.$oid : "",
          data.producto.Supermercado_id
            ? data.producto.Supermercado_id.$oid
            : "",
          data.producto.Usuario_id ? data.producto.Usuario_id.$oid : "", // Aseguramos que Usuario_id esté en su columna
          data.producto.Estado, // Aseguramos que Estado esté en su columna
          accionesHTML(data.producto._id),
        ])
        .draw();
    }

    cerrarFormulario();
  } catch (err) {
    console.error("❌ Error guardando producto:", err);
  }
}

// 🟢 Guardar cambios en la edición de un producto existente
async function guardarEdicionProducto() {
  const id = $("#productoID").val();
  if (!id) {
    console.error("❌ No hay un ID de producto válido.");
    return;
  }

  const nombre = $("#nombreProducto").val();
  const imagen = $("#imagenProducto").val();
  const marca = $("#marcaProducto").val();
  const peso = $("#pesoProducto").val();
  const estado = $("#estadoProducto").val();

  const productoActualizado = {};
  if (nombre) productoActualizado.Nombre = nombre;
  if (imagen) productoActualizado.Imagen = imagen;
  if (marca) productoActualizado.Marca = marca;

  // Separar el campo de peso y unidad
  if (peso) {
    const [pesoValor, unidadPeso] = peso.split(" ");
    productoActualizado.Peso = pesoValor;
    productoActualizado.UnidadPeso = unidadPeso || "";
  }

  if (estado) productoActualizado.Estado = estado;

  console.log("📤 Enviando datos para editar producto:", productoActualizado);

  try {
    const response = await fetch(`http://localhost:3000/api/productos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productoActualizado),
    });

    if (!response.ok) throw new Error("Error al actualizar producto");

    console.log("✅ Producto actualizado correctamente");

    await cargarProductos();
    cerrarFormulario();
  } catch (err) {
    console.error("❌ Error actualizando producto:", err);
  }
}

// 🟢 Editar producto
function editarProducto(id) {
  const producto = productosCache.find((p) => p._id === id);
  if (!producto) return;

  $("#formTitulo").text("Editar Producto");
  $("#productoID").val(producto._id);
  $("#nombreProducto").val(producto.Nombre || "");
  $("#marcaProducto").val(producto.Marca || "");
  $("#imagenProducto").val(producto.Imagen || "");
  $("#pesoProducto").val(`${producto.Peso} ${producto.UnidadPeso}` || "");
  $("#estadoProducto").val(producto.Estado || "En Stock");

  $("#botonesFormulario button:first")
    .off("click")
    .on("click", guardarEdicionProducto);

  $("#formularioProducto").show();
}

// 🟢 Eliminar producto
async function eliminarProducto(id) {
  const confirmacion = confirm("¿Estás seguro de eliminar este producto?");
  if (!confirmacion) return;

  try {
    const response = await fetch(`http://localhost:3000/api/productos/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Error al eliminar producto");

    await cargarProductos();
  } catch (err) {
    console.error("❌ Error eliminando producto:", err);
  }
}

// 🟢 Cerrar formulario
function cerrarFormulario() {
  $("#formularioProducto").hide();
  $(
    "#productoID, #nombreProducto, #marcaProducto, #pesoProducto, #estadoProducto"
  ).val("");
}

// 🟢 Volver atrás
function volverAtras() {
  window.location.href = "../html/intranet.html";
}

// 🟢 Exponer funciones globales
window.editarProducto = editarProducto;
window.eliminarProducto = eliminarProducto;
window.mostrarFormularioAgregar = mostrarFormularioAgregar;
window.guardarCambiosDesdeFormulario = guardarCambiosDesdeFormulario;
window.cerrarFormulario = cerrarFormulario;
window.volverAtras = volverAtras;
window.cargarProductos = cargarProductos;
