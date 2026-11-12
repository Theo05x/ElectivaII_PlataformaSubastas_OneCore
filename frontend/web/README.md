# OneCore Web

Aplicación SPA de subastas para la entrega académica 3. Está separada del backend de la raíz y consume únicamente su API REST v1 y Socket.IO.

## Requisitos

- Node.js 24 LTS (o la versión mínima indicada por Angular CLI 22) y npm.
- API OneCore y MongoDB iniciados según el [README principal](../../README.md).

## Instalación y ejecución local

Desde la raíz del repositorio:

```powershell
npm --prefix frontend/web install
npm --prefix frontend/web run start
```

Abre `http://localhost:4200`. El proxy de desarrollo (`proxy.conf.json`) reenvía `/api` y `/socket.io` a `http://localhost:3000`; el backend puede cambiar de puerto actualizando el `target` del proxy. El navegador no se conecta directamente a MongoDB.

Configuración no secreta del frontend: `src/environments/environment.ts` define `apiBaseUrl` y `socketUrl`. Déjalo en cadena vacía para Socket.IO en el mismo origen, o configura el origen del servidor si se usa una API remota. El proxy es exclusivo de `ng serve`; un despliegue en orígenes distintos necesita que el backend permita el origen web mediante CORS y que se configure HTTPS. No compiles secretos en la aplicación.

PrimeNG 22 requiere una clave válida de PrimeUI. Los estudiantes pueden solicitar la Community License gratuita en [primeui.dev/licenses/community](https://primeui.dev/licenses/community). Configura la clave localmente en `primeUiLicenseKey` dentro de `src/environments/environment.ts`; no uses una clave comercial ajena ni la compartas en capturas o commits. Sin clave válida, PrimeNG muestra su aviso de licencia.

## Validación

```powershell
npm --prefix frontend/web run build
npm --prefix frontend/web test
```

## Recorrido implementado y contratos consumidos

- Acceso y registro: `POST /api/v1/sessions`, `POST /api/v1/users`; perfil `GET /api/v1/users/me`.
- Catálogo: `GET /api/v1/auctions/categories` y `GET /api/v1/auctions?page=&limit=&status=&category=`.
- Detalle, cancelación y ofertas: `GET /api/v1/auctions/:id`, `PATCH /api/v1/auctions/:id` (solo vendedor, sin ofertas) y `POST /api/v1/auctions/:id/bids`.
- Perfil: `GET /api/v1/users/me`, que ya entrega publicaciones y subastas en que participó.
- Notificaciones: `GET /api/v1/notifications`. Solo consulta; el backend no ofrece marcar como leído.
- Orden conocida: `GET /api/v1/payment-orders/:id`. El identificador se obtiene desde una notificación; el backend permite la consulta únicamente al ganador y no tiene listado/creación de órdenes para el frontend.

En cada detalle se carga primero el snapshot REST y después se autentica Socket.IO con el JWT, se suscribe con `subscribe` y se envía `unsubscribe` al salir. Se atienden `bid.accepted`, `bid.outbid`, `auction.closed`, `participants.updated` y desconexiones; pujas y cancelaciones se confirman exclusivamente por REST. No se simulan eventos que el servidor no emite.

## Sesión y límites

El JWT se guarda en `localStorage` para sobrevivir recargas y solo se adjunta a rutas `/api/v1/`; la conexión Socket.IO recibe el mismo JWT mediante `authenticate`. Cerrar sesión o recibir `401` limpia el token. Como el token es accesible para JavaScript, existe riesgo ante XSS: usar solo datos de prueba en este proyecto académico. Una aplicación de producción requiere revisar la estrategia de sesión y HTTPS.

La aplicación no implementa checkout, no captura información financiera y no llama `POST /api/v1/payment-events`. El webhook es una comunicación firmada servidor a servidor al backend; `PAYMENT_WEBHOOK_SECRET` nunca se configura en el frontend. Una orden queda pagada cuando el backend recibe y valida el webhook externo. La consulta en esta SPA solo refleja el estado que REST ya persistió.

Los errores muestran tanto una explicación guiada para códigos de negocio conocidos como el mensaje recibido del servidor. El servidor conserva la autoridad para las reglas y permisos.
