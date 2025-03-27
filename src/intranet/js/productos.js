// 🔹 Variables globales
let productosTable;
let productosCache = [];
let proveedoresCache = [];
let supermercadosCache = [];
let usuariosCache = [];

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
      { title: "Proveedor" },
      { title: "Supermercado" },
      { title: "Usuario" },
      { title: "Estado" },
      { title: "Acciones" },
    ],
  });

  cargarProductos();

  // ✨ Agregar limpieza automática de espacios en nombre y marca
  $("#nombreProducto, #marcaProducto").on("blur", function () {
    const valorSinEspacios = $(this).val().trim();
    $(this).val(valorSinEspacios);
  });
});

// 🟢 Cargar productos desde servidor Express
async function cargarProductos() {
  try {
    const respuesta = await fetch("http://localhost:3000/api/productos");
    const productos = await respuesta.json();

    productosCache = productos;
    productosTable.clear();

    productos.forEach((producto) => {
      const pesoConUnidad = `${producto.Peso} ${producto.UnidadPeso}`;

      productosTable.row.add([
        producto._id,
        `<img src="${producto.Imagen || ""}" alt="${
          producto.Nombre
        }" width="50" />`,
        producto.Nombre,
        producto.Marca,
        pesoConUnidad,
        producto.Proveedor_id || "N/A", // Nombre del proveedor
        producto.Supermercado_id || "N/A", // Nombre del supermercado
        producto.Usuario_id || "N/A", // Nombre del usuario
        producto.Estado,
        accionesHTML(producto._id),
      ]);
    });

    productosTable.draw();
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
async function mostrarFormularioAgregar() {
  $("#formTitulo").text("Añadir Producto");
  $("#productoID, #nombreProducto, #marcaProducto, #pesoProducto").val("");

  await cargarOpcionesSelects(); // 🟢 Asegurar que se llenan los selects

  // Asignar evento para guardar un nuevo producto
  $("#botonesFormulario button:first")
    .off("click")
    .on("click", guardarCambiosDesdeFormulario);

  $("#formularioProducto").show();
  document
    .getElementById("formularioProducto")
    .scrollIntoView({ behavior: "smooth" });
}

// 🟢 Guardar nuevo producto
async function guardarCambiosDesdeFormulario(event) {
  event.preventDefault();

  const formData = new FormData();
  formData.append("Nombre", $("#nombreProducto").val().trim());
  formData.append("Imagen", $("#imgProducto")[0].files[0]);
  formData.append("Marca", $("#marcaProducto").val().trim());
  formData.append("Peso", $("#pesoProducto").val());
  formData.append("UnidadPeso", $("#unidadPeso").val());
  formData.append("Estado", $("#Estado").val());
  formData.append("Proveedor_id", $("#idProveedor").val());
  formData.append("Supermercado_id", $("#idSupermercado").val());
  formData.append("Usuario_id", $("#idUsuario").val());

  // 🔍 Verificar qué datos estamos enviando
  console.log("📤 Enviando datos:", Object.fromEntries(formData.entries()));

  try {
    const response = await fetch("http://localhost:3000/api/productos", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.text(); // 🔍 Capturar respuesta del backend
      console.error("❌ Error del servidor:", errorData);
      throw new Error("Error al guardar producto: " + errorData);
    }

    const data = await response.json();
    if (!data.producto) throw new Error("No se recibió el producto creado");

    await cargarOpcionesSelects();

    const proveedorNombre = obtenerNombre(
      data.producto.Proveedor_id,
      proveedoresCache
    );
    const supermercadoNombre = obtenerNombre(
      data.producto.Supermercado_id,
      supermercadosCache
    );
    const usuarioNombre = obtenerNombre(
      data.producto.Usuario_id,
      usuariosCache
    );

    productosTable.row
      .add([
        data.producto._id,
        `<img src="${data.producto.Imagen || ""}" alt="${
          data.producto.Nombre
        }" width="50" />`,
        data.producto.Nombre,
        data.producto.Marca,
        `${data.producto.Peso} ${data.producto.UnidadPeso}`,
        proveedorNombre || "N/A",
        supermercadoNombre || "N/A",
        usuarioNombre || "N/A",
        data.producto.Estado,
        accionesHTML(data.producto._id),
      ])
      .draw();

    cerrarFormulario();
  } catch (err) {
    console.error("❌ Error guardando producto:", err);
  }
}

// 🟢 Editar producto
async function editarProducto(id) {
  const producto = productosCache.find((p) => p._id === id);
  if (!producto) return;

  $("#formTitulo").text("Editar Producto");
  $("#productoID").val(producto._id);
  $("#nombreProducto").val(producto.Nombre);
  $("#marcaProducto").val(producto.Marca);
  $("#pesoProducto").val(producto.Peso);
  $("#Estado").val(producto.Estado);

  await cargarOpcionesSelects();

  $("#idProveedor").val(producto.Proveedor_id);
  $("#idSupermercado").val(producto.Supermercado_id);
  $("#idUsuario").val(producto.Usuario_id);

  $("#botonesFormulario button:first")
    .off("click")
    .on("click", guardarEdicionProducto);

  $("#formularioProducto").show();
  document
    .getElementById("formularioProducto")
    .scrollIntoView({ behavior: "smooth" });
}

// 🟢 Guardar cambios en la edición
async function guardarEdicionProducto() {
  const id = $("#productoID").val();
  if (!id) return;

  const formData = new FormData();
  formData.append("nombre", $("#nombreProducto").val()?.trim() || "");
  formData.append("marca", $("#marcaProducto").val()?.trim() || "");
  formData.append("peso", $("#pesoProducto").val()?.trim() || "");
  formData.append("unidadPeso", $("#unidadPeso").val()?.trim() || "");
  formData.append("estado", $("#Estado").val()?.trim() || "");
  formData.append("proveedor_id", $("#idProveedor").val()?.trim() || "");
  formData.append("supermercado_id", $("#idSupermercado").val()?.trim() || "");
  formData.append("usuario_id", $("#idUsuario").val()?.trim() || "");

  try {
    const response = await fetch(`http://localhost:3000/api/productos/${id}`, {
      method: "PUT",
      body: formData,
    });

    if (!response.ok) throw new Error("Error al actualizar producto");

    await cargarProductos();
    cerrarFormulario();
  } catch (err) {
    console.error("❌ Error actualizando producto:", err);
  }
}

// 🟢 Cargar opciones de selects
async function cargarOpcionesSelects() {
  try {
    const [proveedores, supermercados, usuarios] = await Promise.all([
      fetch("http://localhost:3000/api/proveedor").then((res) => res.json()),
      fetch("http://localhost:3000/api/supermercados").then((res) =>
        res.json()
      ),
      fetch("http://localhost:3000/api/usuarios").then((res) => res.json()),
    ]);

    llenarSelect("#idProveedor", proveedores);
    llenarSelect("#idSupermercado", supermercados);
    llenarSelect("#idUsuario", usuarios);
  } catch (error) {
    console.error("❌ Error cargando opciones de selects:", error);
  }
}

// 🟢 Función para llenar selects
function llenarSelect(selector, datos) {
  const select = document.querySelector(selector);
  select.innerHTML = '<option value="">Seleccione una opción</option>';
  datos.forEach((item) => {
    select.innerHTML += `<option value="${item._id}">${
      item.Nombre || item.nombre
    }</option>`;
  });
}

async function eliminarProducto(id) {
  const result = await Swal.fire({
    title: "¿Estás seguro?",
    text: "Esta acción no se puede deshacer",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
  });

  if (!result.isConfirmed) return;

  try {
    const response = await fetch(`http://localhost:3000/api/productos/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Error al eliminar producto");

    await Swal.fire("Eliminado", "El producto ha sido eliminado.", "success");

    await cargarProductos();
  } catch (err) {
    console.error("❌ Error eliminando producto:", err);
    Swal.fire("Error", "No se pudo eliminar el producto.", "error");
  }
}

// 🟢 Cerrar formulario
function cerrarFormulario() {
  $("#formularioProducto").hide();
  $(
    "#productoID, #nombreProducto, #marcaProducto, #pesoProducto, #estadoProducto"
  ).val("");
}

// 🟢 Exponer funciones globales
window.editarProducto = editarProducto;
window.eliminarProducto = eliminarProducto;
window.mostrarFormularioAgregar = mostrarFormularioAgregar;
window.guardarCambiosDesdeFormulario = guardarCambiosDesdeFormulario;
window.guardarEdicionProducto = guardarEdicionProducto;
window.cerrarFormulario = cerrarFormulario;
window.cargarProductos = cargarProductos;
window.cargarOpcionesSelects = cargarOpcionesSelects;
