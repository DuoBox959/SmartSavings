### Tareas Pendientes

1. **Añadir Cesta de Ahorro**
   - Implementar una cesta de ahorro para que el cliente pueda ver cuánto ha ahorrado en su compra.
   - Realizar un cálculo comparativo con los precios de otras tiendas.
   - Mostrar el ahorro por producto (ejemplo: "Te has ahorrado 1€").
   - Añadir botón opcional para incluir comparaciones sin sobrecargar la lista.
   - Al final de la compra, mostrar:
     - Total ahorrado (verde).
     - Precio que hubiera costado en otras tiendas (rojo).
     - Comparación de qué tienda tiene los precios más altos.

2. **Actualizar Interfaz `productos.html`**
   - Mejorar el diseño para que sea más atractivo e intuitivo.
   - Optimizar la organización de la información.
   - Implementar una experiencia superior a la de Idealo.

3. **Hacer la Base de Datos Pública**
   - Permitir acceso a Rube y a mí.
   - Crear un sistema de login para la intranet con usuarios autorizados.
   - Evaluar la implementación de roles en la tabla de usuarios.
   - Implementar un CAPTCHA (Google o uno propio más creativo).

4. **Añadir Login en la Intranet**
   - Permitir acceso solo a administradores.
   - Definir roles de usuario (administrador, usuario estándar).

5. **Añadir Descripción en la BD de Productos**
   - Incluir campo de descripción para etiquetas como:
     - Gluten
     - Lactosa
     - Otros alérgenos

6. **Historial de Precios y Peso de los Productos**
   - Mostrar cuánto costaba un producto en años anteriores.
   - Incluir información del peso de los productos para evitar engaños.
   - Detectar estrategias de "reduflación" (ejemplo: Doritos redujo 100g sin bajar el precio).

7. **Añadir `creadoPor` a la Base de Datos**
   - Relacionar cada producto con el usuario que lo registró.

8. **Página de Configuración de Cuenta**
   - Permitir modificar datos personales.
   - Opción para cambiar la contraseña.
   - Ajustes de preferencias.
   - Rediseñar configuracion cuenta
   - Programar configuracion cuenta

9. **Correcciones en la Intranet**
   - Revisar botón "Ver Historial" en la intranet (corregir en el JS).
   - Solucionar error del comparador de precios al agregar una nueva tienda (no permite comparar en Tienda 3).