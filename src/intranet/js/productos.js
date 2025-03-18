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
      { title: "Peso" },
      { title: "Proveedor_id" },
      { title: "Supermercado_id" },
      { title: "Usuario_id" },
      { title: "Estado" },
      { title: "Acciones" },
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

// 🟢 Guardar cambios y agregar producto
async function guardarCambiosDesdeFormulario(event) {
  event.preventDefault();

  const formData = new FormData();
  formData.append("Nombre", $("#nombreProducto").val());
  formData.append("Imagen", $("#imgProducto")[0].files[0]); // 📌 Obtener el archivo
  formData.append("Marca", $("#marcaProducto").val());
  formData.append("Peso", $("#pesoProducto").val());
  formData.append("UnidadPeso", $("#unidadPeso").val());
  formData.append("Estado", $("#Estado").val());
  formData.append("Proveedor_id", $("#idProveedor").val());
  formData.append("Supermercado_id", $("#idSupermercado").val());
  formData.append("Usuario_id", $("#idUsuario").val());

  try {
    const response = await fetch("http://localhost:3000/api/productos", {
      method: "POST",
      body: formData, // 📌 No incluir `Content-Type`, fetch lo asigna automáticamente
    });

    if (!response.ok) {
      const errorData = await response.text(); // 📌 Leer la respuesta como texto
      console.error("❌ Error del servidor:", errorData);
      throw new Error("Error al guardar producto");
    }

    const data = await response.json();
    if (!data.producto)
      throw new Error("El backend no devolvió el producto creado");

    // ✅ Agregar la nueva fila a DataTable
    productosTable.row
      .add([
        data.producto._id,
        `<img src="${data.producto.Imagen}" alt="${data.producto.Nombre}" width="50" />`,
        data.producto.Nombre,
        data.producto.Marca,
        `${data.producto.Peso} ${data.producto.UnidadPeso}`,
        data.producto.Proveedor_id || "",
        data.producto.Supermercado_id || "",
        data.producto.Usuario_id || "",
        data.producto.Estado,
        accionesHTML(data.producto._id),
      ])
      .draw();

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

  // ✅ Obtener los valores originales del producto desde productosCache
  const productoOriginal = productosCache.find((p) => p._id === id);
  if (!productoOriginal) {
    console.error("❌ Producto no encontrado en caché.");
    return;
  }

  // ✅ Crear FormData para enviar imágenes correctamente
  const formData = new FormData();
  formData.append("nombre", $("#nombreProducto").val().trim());
  formData.append("marca", $("#marcaProducto").val().trim());
  formData.append("peso", $("#pesoProducto").val().trim());
  formData.append("unidadPeso", $("#unidadPeso").val().trim());
  formData.append("estado", $("#Estado").val());
  formData.append("proveedor_id", $("#idProveedor").val().trim());
  formData.append("supermercado_id", $("#idSupermercado").val().trim());
  formData.append("usuario_id", $("#idUsuario").val().trim());

  // 📌 Obtener la imagen correctamente del input file
  const imagenInput = $("#imgProducto")[0].files[0];
  if (imagenInput) {
    formData.append("Imagen", imagenInput);
  }

  try {
    const response = await fetch(`http://localhost:3000/api/productos/${id}`, {
      method: "PUT",
      body: formData, // 📝 Enviamos `FormData`, no JSON
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Error en respuesta del servidor:", errorData);
      throw new Error(errorData.error || "Error al actualizar producto");
    }

    console.log("✅ Producto actualizado correctamente");

    // 🟢 Volver a cargar los productos sin recargar la página
    await cargarProductos();
    cerrarFormulario();
  } catch (err) {
    console.error("❌ Error actualizando producto:", err);
  }
}

// 🟢 Editar producto
function editarProducto(id) {
  const producto = productosCache.find((p) => p._id === id);

  if (!producto) {
    console.error("❌ Producto no encontrado en productosCache");
    return;
  }

  console.log("📌 Producto encontrado para editar:", producto);

  $("#formTitulo").text("Editar Producto");
  $("#productoID").val(producto._id);
  $("#nombreProducto").val(producto.Nombre || "");
  $("#marcaProducto").val(producto.Marca || "");
  $("#pesoProducto").val(producto.Peso || "");
  $("#unidadPeso").val(producto.UnidadPeso || "KG");
  $("#idProveedor").val(producto.Proveedor_id || "");
  $("#idSupermercado").val(producto.Supermercado_id || "");
  $("#idUsuario").val(producto.Usuario_id || "");
  $("#Estado").val(producto.Estado || "En Stock");

  // 📌 Mostrar imagen previa si existe
  if (producto.Imagen) {
    $("#vistaPreviaImagen").attr("src", producto.Imagen).show();
  } else {
    $("#vistaPreviaImagen").hide();
  }

  $("#botonesFormulario button:first")
    .off("click")
    .on("click", guardarEdicionProducto);

  $("#formularioProducto").show();
  document
    .getElementById("formularioProducto")
    .scrollIntoView({ behavior: "smooth" });
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
