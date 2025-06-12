export const API_BASE = "http://localhost:3000";

export const ENDPOINTS = {
    // Productos
    productos: `${API_BASE}/api/productos`,
    // Para obtener un producto específico por ID, lo construirías como `${ENDPOINTS.productos}/${id}`

    // Precios
    precios: `${API_BASE}/api/precios`,

    // Descripciones
    descripcionProducto: `${API_BASE}/api/descripcion/producto`,

    // Supermercados
    supermercados: `${API_BASE}/api/supermercados`,

    // Proveedores
    proveedores: `${API_BASE}/api/proveedor`,

    // Usuarios
    usuarios: `${API_BASE}/api/usuarios`,

    //Datos Usuario
    datosUsuario: `${API_BASE}/api/datosUsuario`,

    //Historial Usuario
    historialUsuario: `${API_BASE}/api/historialUsuario`,

    //Opiniones
    opiniones: `${API_BASE}/api/opiniones`,
};