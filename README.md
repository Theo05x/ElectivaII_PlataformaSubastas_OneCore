# OneCore — Plataforma de Subastas

API REST para publicar subastas, registrar ofertas, consultar historiales y
notificar novedades en tiempo real mediante Socket.IO. La aplicación usa
MongoDB para persistencia y JWT para autenticar las solicitudes protegidas.

## Estado de las funcionalidades

- API REST v1 y reglas principales de subastas implementadas.
- Socket.IO de subastas implementado sobre el servidor HTTP.
- Webhook de pago: `POST /payment-events` verifica firma HMAC, registra eventos
  idempotentemente y actualiza pagos aprobados.

## Arquitectura

El proyecto separa las responsabilidades en tres capas:

```text
src/
├── application/
│   ├── controllers/       Adaptadores de entrada HTTP
│   ├── middlewares/       Autenticación, errores y registro de solicitudes
│   ├── routes/            Mapeo de recursos, URI y métodos HTTP
│   └── types/             Tipos de extensión de Express
├── domain/
│   ├── models/            Tipos del dominio y reglas de subastas/pagos
│   ├── ports/             Contratos de persistencia y servicios externos
│   └── services/          Casos de uso y lógica de negocio
├── infraestructure/
│   ├── db/                Modelos, conexión y adaptadores MongoDB
│   ├── jwt/               Implementación de tokens JWT
│   ├── security/          Hash de contraseñas y firma de pagos
│   ├── websocket/         Adaptador de eventos en tiempo real
│   └── services.ts        Composición de casos de uso con adaptadores
└── index.ts               Arranque y composición de la aplicación
```

Los controladores HTTP están en `application` y delegan los casos de uso a los
servicios de `domain/services`. Los contratos que estos servicios necesitan
están en `domain/ports`; los repositorios MongoDB y los adaptadores de JWT,
contraseñas y WebSocket los implementa `infraestructure`. `src/index.ts`
conecta esas dependencias. Así, la aplicación y la infraestructura conocen
las abstracciones del dominio, no al revés.

Los valores de dominio `EmailAddress`, `Money`, `AuctionStatus` y
`PaymentOrderStatus` son objetos inmutables que validan sus valores al crearse.
Los adaptadores convierten esos objetos a cadenas y números en los límites de
MongoDB y HTTP, manteniendo el formato de representación de la API.

El dominio mantiene sus identificadores en inglés de forma uniforme:
`Auction` representa una subasta, `Bid` una puja y `PaymentOrder` una orden de
pago. Los estados expuestos (`OPEN`, `CLOSED`, `CANCELLED`, `DESIERTA`, `PAID`,
`DEFAULTED`) conservan los valores definidos por las reglas del proyecto.

Las contraseñas no se cifran de forma reversible ni se guardan en texto plano:
se almacenan como hash derivado con scrypt y un salt aleatorio. Durante el
inicio de sesión se vuelve a calcular el hash para compararlo con el guardado.

## Requisitos

- Node.js `20.19.0` o superior.
- MongoDB Community instalado y ejecutándose localmente, o una instancia de
  MongoDB Atlas accesible por URI.
- npm.

## Configuración y ejecución

1. Instala dependencias:

   ```powershell
   npm install
   ```

2. Copia el archivo de ejemplo y ábrelo para configurar las variables:

   ```powershell
   Copy-Item .env.example .env
   notepad .env
   ```

   Configura `MONGODB_URI` con la URI de MongoDB local o de Atlas. Reemplaza el
   `JWT_SECRET` de ejemplo por un secreto aleatorio de al menos 32 caracteres.
   Puedes generar uno con:

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

   No compartas ni subas el archivo `.env` al repositorio.

3. Compila e inicia el servidor:

   ```powershell
   npm run build
   npm start
   ```

   Para desarrollo, usa `npm run dev`.

Antes de arrancar la API, inicia el servicio local de MongoDB o confirma que el
URI de Atlas sea accesible. El servidor HTTP escucha en el puerto `5000` por
defecto. Si la resolución DNS de Atlas lo requiere, define
`MONGODB_DNS_SERVERS` con direcciones separadas por comas. La API y el
WebSocket comparten el mismo servidor HTTP.

TypeScript se compila con `strict: true`; no hay usos explícitos de `any` en el
código de `src`.

## API REST v1

Base URL local: `http://localhost:5000/api/v1`.

Las rutas protegidas requieren:

```http
Authorization: Bearer <token>
```

El token se obtiene al crear una sesión y expira en 24 horas. `GET /users/me`
consulta el perfil del usuario identificado por el token.

| Método  | Recurso                       | Auth       | Descripción                                          |
| ------- | ----------------------------- | ---------- | ---------------------------------------------------- |
| `GET`   | `/health`                     | No         | Estado básico de la API                              |
| `POST`  | `/users`                      | No         | Registra un usuario                                  |
| `POST`  | `/sessions`                   | No         | Inicia sesión y entrega un JWT                       |
| `GET`   | `/users/me`                   | Sí         | Consulta perfil, subastas publicadas y participación |
| `GET`   | `/auctions/categories`        | No         | Lista categorías                                     |
| `GET`   | `/auctions`                   | No         | Lista y filtra subastas                              |
| `POST`  | `/auctions`                   | Sí         | Publica una subasta                                  |
| `GET`   | `/auctions/:id`               | Sí         | Consulta subasta e historial de pujas                |
| `PATCH` | `/auctions/:id`               | Vendedor   | Cambia el estado de la subasta a `CANCELLED`         |
| `POST`  | `/auctions/:id/bids`          | Sí         | Crea una puja                                        |
| `GET`   | `/auctions/:id/rejected-bids` | Sí         | Consulta intentos de puja rechazados                 |
| `GET`   | `/payment-orders/:id`         | Ganador    | Consulta una orden propia                            |
| `POST`  | `/payment-events`             | Firma HMAC | Registra un evento autenticado de la pasarela        |
| `GET`   | `/notifications`              | Sí         | Lista notificaciones del usuario autenticado         |

Las rutas de la tabla son relativas a `/api/v1`. Por ejemplo:
`GET /api/v1/auctions`.

### Usuarios y sesiones

Registrar un usuario:

```http
POST /api/v1/users
Content-Type: application/json
```

```json
{
  "name": "Mateo",
  "email": "mateo@example.com",
  "password": "una-clave-segura"
}
```

Respuesta `201 Created`:

```json
{
  "status": "success",
  "data": {
    "id": "ID_DE_USUARIO",
    "name": "Mateo",
    "email": "mateo@example.com"
  }
}
```

Iniciar sesión con `POST /api/v1/sessions` y el cuerpo
`{"email":"mateo@example.com","password":"una-clave-segura"}`. La respuesta
`200 OK` contiene `data.token`. Usa ese valor como Bearer token en las
solicitudes protegidas.

### Subastas y pujas

Publicar una subasta con `POST /api/v1/auctions`:

```json
{
  "article": {
    "title": "Consola retro",
    "description": "Consola en buen estado",
    "conservationState": "Bueno"
  },
  "category": "Videojuegos",
  "basePrice": 100000,
  "minimumIncrement": 5000,
  "endDate": "2026-11-01T18:00:00.000Z"
}
```

La fecha debe estar entre una hora y 30 días en el futuro. Los precios e
incrementos son enteros positivos en COP.

Listar subastas acepta `page`, `limit`, `status` y `category`, por ejemplo:

```http
GET /api/v1/auctions?page=1&limit=10&status=OPEN&category=Videojuegos
```

`limit` admite valores entre 1 y 100. Los estados disponibles son `OPEN`,
`CLOSED`, `CANCELLED`, `DESIERTA`, `PAID` y `DEFAULTED`.

Pujar con `POST /api/v1/auctions/:id/bids`:

```json
{
  "amount": 105000
}
```

Cancelar sin pujas una subasta propia con
`PATCH /api/v1/auctions/:id` y el cuerpo:

```json
{
  "status": "CANCELLED"
}
```

### Órdenes y notificaciones

Cuando una subasta vence con pujas, la consulta o el intento de puja que
detecta el vencimiento la cierra y crea una orden de pago para el ganador. La
orden vence 48 horas después. Al consultar una orden vencida, la expiración se
registra y la subasta pasa a `DEFAULTED`. Actualmente no existe un endpoint
para listar órdenes; el ganador puede consultar una orden conocida con
`GET /api/v1/payment-orders/:id`.

El estado de cierre se evalúa de forma perezosa al consultar una subasta,
listar subastas o intentar pujar. Por este requisito, una solicitud `GET`
puede producir cambios de estado y notificaciones si detecta que la subasta
venció.

## Respuestas de error

Los errores siguen esta estructura:

```json
{
  "status": "error",
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Descripción del error."
  }
}
```

Se usan códigos HTTP como `400` para solicitudes inválidas, `401` para falta
de autenticación o token inválido, `403` para operaciones no autorizadas,
`404` para rutas o recursos inexistentes y `409` para conflictos con reglas
del negocio. Las rutas inexistentes incluyen el método y la URI en el mensaje.

## Reglas principales del dominio

- Correo único; las contraseñas se almacenan con hash, no en texto plano.
- El vendedor no puede pujar en su subasta ni cancelar una subasta que ya tenga
  pujas.
- Solo se aceptan pujas de subastas abiertas antes de su cierre. La primera
  oferta debe alcanzar el precio base; las siguientes deben respetar el
  incremento mínimo. Un postor no puede superar su propia oferta vigente.
- Los intentos rechazados quedan registrados para auditoría.
- El monto de un intento rechazado conserva el número enviado por el cliente
  (o `0` cuando no es un número finito), para poder auditar también valores
  inválidos; no se trata como una oferta aceptada ni como `Money`.
- Al cierre, gana la oferta más alta; sin ofertas, la subasta queda `DESIERTA`.
- La adjudicación crea una orden de pago con vencimiento a 48 horas. Cuando se
  evalúa una orden vencida, queda `EXPIRED` y la subasta pasa a `DEFAULTED`.

## Socket.IO de subastas

El servidor usa Socket.IO en el mismo host y puerto que la API, con el path
`/socket.io`. Socket.IO no es compatible con el cliente WebSocket nativo ni con
la librería `ws`; el cliente debe usar `socket.io-client`:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', { path: '/socket.io' });

socket.on('connected', () => {
  socket.emit('authenticate', { token: 'TOKEN_JWT' });
});

socket.on('authenticated', () => {
  socket.emit('subscribe', { auctionId: 'ID_DE_SUBASTA' });
});

socket.on('subscribed', data => console.log('Suscripción:', data));
socket.on('bid.accepted', data => console.log('Puja aceptada:', data));
socket.on('bid.outbid', data => console.log('Fuiste superado:', data));
socket.on('auction.closed', data => console.log('Subasta cerrada:', data));
socket.on('participants.updated', data => console.log('Participantes:', data));
socket.on('error', error => console.error(error.message));

// Para dejar de recibir novedades de esa subasta:
// socket.emit('unsubscribe', { auctionId: 'ID_DE_SUBASTA' });
```

El cliente primero recibe `connected`, luego se autentica con el mismo JWT de
la API y finalmente se suscribe a una subasta existente. Las pujas se crean
por HTTP; Socket.IO distribuye las novedades. Los eventos de puja y cierre
incluyen `auctionId` y `data`; los mensajes de suscripción entregan sus datos
directamente. Los errores se envían como evento `error` con un objeto
`{ message }`.

### Probar Socket.IO desde Postman Desktop

1. Inicia la API (`npm run dev`) y confirma el puerto en la terminal. El servidor
   usa `PORT` del `.env`; si no está definido, usa `5000`.
2. En Postman, crea una solicitud **Socket.IO** (no una solicitud WebSocket
   genérica). Conecta a `ws://localhost:5000` o al puerto que indique la API.
   Usa el path `/socket.io` si Postman muestra ese ajuste. No necesitas agregar
   parámetros ni encabezados para esta prueba.
3. En **Events**, agrega los eventos que quieras escuchar: `connected`,
   `authenticated`, `subscribed` y `error`. Para observar cambios de la subasta,
   agrega también `bid.accepted`, `bid.outbid`, `participants.updated` y
   `auction.closed`. No envíes `connect`: el botón **Connect** abre la conexión;
   `connected` es el evento de bienvenida que envía el servidor.
4. Cuando recibas `connected`, ve a **Messages** y envía el evento
   `authenticate` con este payload:

   ```json
   {
     "token": "TOKEN_JWT"
   }
   ```

   Obtén el JWT iniciando sesión con `POST /api/v1/sessions`. El nombre del
   evento `authenticate` se selecciona/escribe aparte del JSON. Espera el evento
   `authenticated`, que confirma que el token fue aceptado.
5. Envía el evento `subscribe` con un ID de subasta existente:

   ```json
   {
     "auctionId": "ID_DE_SUBASTA"
   }
   ```

   También puedes guardar el ID en una variable de entorno de Postman llamada
   `Auctionid` y usar `"auctionId": "{{Auctionid}}"`. El nombre de variable debe
   coincidir exactamente. Espera `subscribed`; su payload incluye
   `auctionId` y `participantCount`.
6. Para probar `bid.accepted`, deja la conexión abierta y crea una puja válida
   por HTTP con `POST /api/v1/auctions/:id/bids`. Para `bid.outbid`, conecta dos
   usuarios distintos a la misma subasta y haz que el segundo supere la puja
   del primero. `participants.updated` informa cambios en el número de usuarios
   distintos suscritos; dos conexiones con el mismo usuario cuentan como uno.

Los eventos `authenticate` y `subscribe` se envían desde **Messages**; los
eventos de respuesta y novedades se observan en **Events**. Si Postman informa
que no puede conectarse, confirma que la API está activa y que usas el puerto
correcto. Si recibes `Autentícate antes de suscribirte`, primero envía
`authenticate` y espera `authenticated`; no envíes el evento de respuesta
`authenticated` desde el cliente.

## Webhook de pagos

Configura `PAYMENT_WEBHOOK_SECRET` con un secreto aleatorio de al menos
32 caracteres en `.env`. La pasarela y la API deben compartir ese secreto.
La ruta no usa JWT: autentica la solicitud con el encabezado
`X-Payment-Signature`, que contiene la firma HMAC-SHA256 hexadecimal del cuerpo
JSON exacto enviado.

El cuerpo esperado tiene esta forma:

```json
{
  "providerEventId": "evento-unico-del-proveedor",
  "orderId": "ID_DE_ORDEN_DE_PAGO",
  "transactionId": "transaccion-del-proveedor",
  "result": "APPROVED"
}
```

`result` puede ser `APPROVED` o `DECLINED`. Una aprobación marca la orden como
`PAID`, marca la subasta como `PAID` y crea notificaciones para el ganador y
el vendedor. Un rechazo se registra y deja la orden pendiente. Los
`providerEventId` duplicados no vuelven a aplicar el evento.

Para probar desde Postman, configura una variable de entorno secreta
`WebhookSecret`. Envía `POST /api/v1/payment-events` con
`Content-Type: application/json` y el cuerpo raw anterior. En la pestaña
**Pre-request Script**, genera el encabezado a partir del mismo cuerpo:

```javascript
const secret = pm.environment.get("WebhookSecret");
if (!secret) {
  throw new Error("Configura WebhookSecret en el entorno de Postman.");
}

const signature = CryptoJS.HmacSHA256(pm.request.body.raw, secret).toString(
  CryptoJS.enc.Hex,
);

pm.request.headers.upsert({
  key: "X-Payment-Signature",
  value: signature,
});
```

Una entrega nueva y una repetida responden `200`; la respuesta incluye
`data.duplicate: false` o `true`. Una firma inválida o ausente responde `401`,
un cuerpo inválido `400`, una orden inexistente `404`, y la falta de secreto
configurado en el servidor `503`. No envíes credenciales ni datos de pago
reales a una instancia de demostración.
