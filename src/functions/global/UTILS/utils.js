// /src/functions/global/UTILS/utils.js

// Base de la API (permite sobreescribir con window.__API_BASE si quieres)
export const API_BASE = (window.__API_BASE ?? "http://localhost:3000").replace(/\/+$/, "");

// Rutas de colecciones
export const ENDPOINTS = Object.freeze({
  productos:           `${API_BASE}/api/productos`,
  productosCompletos:  `${API_BASE}/api/productos-completos`,
  precios:             `${API_BASE}/api/precios`,
  descripcion:         `${API_BASE}/api/descripcion`,    
  supermercados:       `${API_BASE}/api/supermercados`,
  proveedor:           `${API_BASE}/api/proveedor`,       
  proveedores:         `${API_BASE}/api/proveedor`,      
  usuarios:            `${API_BASE}/api/usuarios`,
  datosUsuario:        `${API_BASE}/api/datosUsuario`,
  historialUsuario:    `${API_BASE}/api/historialUsuario`,
  opiniones:           `${API_BASE}/api/opiniones`,
});

// Builders para recursos concretos
export const URLS = Object.freeze({
  producto:              (id) => `${ENDPOINTS.productos}/${id}`,
  productoCompleto:      (id) => `${ENDPOINTS.productosCompletos}/${id}`,
  precioPorProducto:     (id) => `${ENDPOINTS.precios}/por-producto/${id}`,
  supermercadoUbicacion: (id) => `${ENDPOINTS.supermercados}/${id}/ubicacion`,
});

// Headers comunes
export const jsonHeaders = Object.freeze({ "Content-Type": "application/json" });

// Resolver URL de imagen desde /uploads o devolver un fallback
export const imgURL = (path) =>
  path?.startsWith("/uploads")
    ? `${API_BASE}${path}`
    : (path || "../assets/img/default.webp");
