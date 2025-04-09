import * as validaciones from "../../valid/validaciones.js";

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

      const imagenURL = producto.Imagen
      ? `http://localhost:3000${producto.Imagen}?t=${Date.now()}`
      : "";
      
      productosTable.row.add([
        producto._id,
        `<img src="${imagenURL}" alt="${producto.Nombre}" width="50" />`,
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

  // Capturar valores del formulario
  const nombre = $("#nombreProducto").val().trim();
  const marca = $("#marcaProducto").val().trim();
  const peso = $("#pesoProducto").val();
  const unidadPeso = $("#unidadPeso").val();
  const estado = $("#Estado").val();
  const proveedorID = $("#idProveedor").val();
  const supermercadoID = $("#idSupermercado").val();
  const usuarioID = $("#idUsuario").val();
  const imagen = $("#imgProducto")[0].files[0];

  // 🛑 Validaciones
  if (!validaciones.esTextoValido(nombre)) {
    Swal.fire("Error", "El nombre del producto no puede estar vacío.", "error");
    return;
  }
  
  if (!validaciones.esTextoValido(marca)) {
    Swal.fire("Error", "La marca no puede estar vacía.", "error");
    return;
  }

  if (!validaciones.esNumeroValido(peso)) {
    Swal.fire("Error", "El peso debe ser un número mayor que 0.", "error");
    return;
  }

  if (!proveedorID || !supermercadoID || !usuarioID) {
    Swal.fire("Error", "Debe seleccionar un proveedor, supermercado y usuario.", "error");
    return;
  }

  if (imagen && !validaciones.esImagenValida(imagen)) {
    Swal.fire("Error", "La imagen debe ser un archivo JPG, PNG o WEBP.", "error");
    return;
  }

  // Si todo está correcto, construir FormData y enviar
  const formData = new FormData();
  formData.append("Nombre", nombre);
  formData.append("Imagen", imagen);
  formData.append("Marca", marca);
  formData.append("Peso", peso);
  formData.append("UnidadPeso", unidadPeso);
  formData.append("Estado", estado);
  formData.append("Proveedor_id", proveedorID);
  formData.append("Supermercado_id", supermercadoID);
  formData.append("Usuario_id", usuarioID);

  try {
    const response = await fetch("http://localhost:3000/api/productos", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Error al guardar producto.");

    Swal.fire("Éxito", "Producto guardado correctamente.", "success");
    await cargarProductos();
    cerrarFormulario();
  } catch (error) {
    console.error("❌ Error al guardar producto:", error);
    Swal.fire("Error", "No se pudo guardar el producto.", "error");
  }
}

// 🟢 Editar producto
async function editarProducto(id) {
  try {
    // Obtener el producto completo desde el backend con sus IDs reales
    const response = await fetch(`http://localhost:3000/api/productos/${id}`);
    const producto = await response.json();

    $("#formTitulo").text("Editar Producto");

    // Rellenar inputs básicos
    $("#productoID").val(producto._id);
    $("#nombreProducto").val(producto.Nombre);
    $("#marcaProducto").val(producto.Marca);
    $("#pesoProducto").val(producto.Peso);
    $("#unidadPeso").val(producto.UnidadPeso);
    $("#Estado").val(producto.Estado);

    // ⚠️ Muy importante: esperar a que los selects se llenen antes de asignar el valor
    await cargarOpcionesSelects();

    $("#idProveedor").val(producto.Proveedor_id);
    $("#idSupermercado").val(producto.Supermercado_id);
    $("#idUsuario").val(producto.Usuario_id);

    // Imagen previa
    if (producto.Imagen) {
      const nombreArchivo = producto.Imagen.split("/").pop(); // Extraer solo el nombre
      $("#previewImagen").html(
        `<img src="http://localhost:3000${producto.Imagen}" alt="Imagen actual" width="100" />
         <input type="hidden" id="imagenAnterior" value="${nombreArchivo}" />`
      );
    }
     else {
      $("#previewImagen").html("");
    }
    $("#imgProducto").val(""); // Limpia el campo de input file
    $("#vistaPreviaImagen").hide(); // Oculta vista previa anterior si la usas
    
    $("#botonesFormulario button:first")
      .off("click")
      .on("click", guardarEdicionProducto);

    $("#formularioProducto").show();
    document
      .getElementById("formularioProducto")
      .scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    console.error("❌ Error cargando producto para editar:", error);
    Swal.fire("Error", "No se pudo cargar el producto para editar", "error");
  }
}

// 🟢 Guardar cambios en la edición con validaciones
async function guardarEdicionProducto(event) {
  event.preventDefault();

  const id = $("#productoID").val();
  if (!id) return;

  const nombre = $("#nombreProducto").val().trim();
  const marca = $("#marcaProducto").val().trim();
  const peso = $("#pesoProducto").val();
  const unidadPeso = $("#unidadPeso").val();
  const estado = $("#Estado").val();
  const proveedorID = $("#idProveedor").val();
  const supermercadoID = $("#idSupermercado").val();
  const usuarioID = $("#idUsuario").val();
  const imagen = $("#imgProducto")[0]?.files[0]; // Nueva imagen (opcional)

  // ✅ Validaciones antes de enviar los datos
  if (!validaciones.esTextoValido(nombre)) {
    Swal.fire("Error", "El nombre del producto no puede estar vacío.", "error");
    return;
  }

  if (!validaciones.esTextoValido(marca)) {
    Swal.fire("Error", "La marca no puede estar vacía.", "error");
    return;
  }

  if (!validaciones.esNumeroValido(peso)) {
    Swal.fire("Error", "El peso debe ser un número mayor que 0.", "error");
    return;
  }

  if (!proveedorID || !supermercadoID || !usuarioID) {
    Swal.fire("Error", "Debe seleccionar un proveedor, supermercado y usuario.", "error");
    return;
  }

  if (imagen && !validaciones.esImagenValida(imagen)) {
    Swal.fire("Error", "La imagen debe ser un archivo JPG, PNG o WEBP.", "error");
    return;
  }

  // 📝 Construcción de FormData para enviar datos actualizados
  const formData = new FormData();
  formData.append("nombre", nombre);
  formData.append("marca", marca);
  formData.append("peso", peso);
  formData.append("unidadPeso", unidadPeso);
  formData.append("estado", estado);
  formData.append("proveedor_id", proveedorID);
  formData.append("supermercado_id", supermercadoID);
  formData.append("usuario_id", usuarioID);

  if (imagen) formData.append("Imagen", imagen); // Agregar imagen si se seleccionó una nueva
  const imagenAnterior = $("#imagenAnterior").val();
  if (imagen && imagenAnterior) {
    formData.append("imagenAnterior", imagenAnterior);
  }
  
  try {
    const response = await fetch(`http://localhost:3000/api/productos/${id}`, {
      method: "PUT",
      body: formData,
    });

    if (!response.ok) throw new Error("Error al actualizar producto");

    Swal.fire("Éxito", "Producto actualizado correctamente.", "success");
    await cargarProductos();
    cerrarFormulario();
  } catch (err) {
    console.error("❌ Error actualizando producto:", err);
    Swal.fire("Error", "No se pudo actualizar el producto.", "error");
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

// Función para eliminar los espacios antes del texto en los campos de entrada
function eliminarEspaciosPrincipio(event) {
  // Obtener el valor del campo
  let valor = event.target.value;

  // Eliminar los espacios solo al principio del texto
  event.target.value = valor.replace(/^\s+/, '');
}

// Añadir el evento a los campos de texto
document.getElementById('nombreProducto').addEventListener('input', eliminarEspaciosPrincipio);
document.getElementById('marcaProducto').addEventListener('input', eliminarEspaciosPrincipio);
document.getElementById('pesoProducto').addEventListener('input', eliminarEspaciosPrincipio);

// También puedes agregarlo a los campos 'select' si necesitas evitar la selección de un valor vacío
document.getElementById('unidadPeso').addEventListener('change', eliminarEspaciosPrincipio);
document.getElementById('idProveedor').addEventListener('change', eliminarEspaciosPrincipio);
document.getElementById('idSupermercado').addEventListener('change', eliminarEspaciosPrincipio);
document.getElementById('idUsuario').addEventListener('change', eliminarEspaciosPrincipio);
document.getElementById('Estado').addEventListener('change', eliminarEspaciosPrincipio);


// 🟢 Exponer funciones globales
window.editarProducto = editarProducto;
window.eliminarProducto = eliminarProducto;
window.mostrarFormularioAgregar = mostrarFormularioAgregar;
window.guardarCambiosDesdeFormulario = guardarCambiosDesdeFormulario;
window.guardarEdicionProducto = guardarEdicionProducto;
window.cerrarFormulario = cerrarFormulario;
window.cargarProductos = cargarProductos;
window.cargarOpcionesSelects = cargarOpcionesSelects;
