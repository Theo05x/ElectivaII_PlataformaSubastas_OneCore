# Electiva II - Plataforma de Subastas en Línea (OneCore)

**Materia:** Electiva II - Desarrollo  
**Proyecto:** Plataforma de Subastas en Línea (OneCore)  
**Equipo:** OneCore  
**Estudiante:** Yesid Mateo Hincapié Duque  
**Docente:** Ricardo José Montes Barba  
**Institución:** Tecnológico de Antioquia (2026-02)  
**Licencia:** MIT License

---

## 1. Descripción del Proyecto
Este proyecto es una API REST simplificada para una plataforma de subastas en línea. Permite a los usuarios registrarse, iniciar sesión, crear subastas, buscar artículos por categoría, pujar en tiempo real, auditar ofertas rechazadas y procesar pagos simulados de forma asíncrona.

---

## 2. Estructura del Repositorio (MVC + Config)
La organización física del código respeta las capas clásicas del MVC y la infraestructura de configuración de variables y compilador:

```text
.
├── config/         # Archivos de configuración general (entorno, tsconfig y setup).
├── data/           # Almacenamiento en memoria (arreglos planos para usuarios, subastas y pujas).
├── controllers/    # Controladores que reciben las peticiones HTTP y manejan entrada/salida.
├── routes/         # Enrutadores que mapean las URIs de la API REST v1.
├── app.ts          # Inicialización y configuración del servidor Express.
├── LICENSE         # Archivo de términos y condiciones bajo la Licencia MIT.
└── README.md       # Documento principal de especificaciones del proyecto.
```

---

## 3. Estrategia de Ramas (Git Flow) y Commits
El historial de Git del proyecto cuenta con un flujo ordenado de integración continua a través de las siguientes ramas de características (*features*) fusionadas mediante Pull Requests a `main`:

*   `feature/configuración-entorno`: Configuración inicial del entorno de desarrollo de Node.js, Express y TypeScript.
*   `feature/estructura-mvc`: Estructuración física de las carpetas de la aplicación bajo el patrón Modelo-Vista-Controlador.
*   `feature/modelo-usuarios`: Diseño del MVC para el módulo de identidad, registro e inicio de sesión.
*   `feature/modelo-subastas`: Diseño del MVC para creación de subastas, pujas, auditoría de pujas rechazadas y filtros.
*   `feature/modelo-pagos`: Implementación del enrutador y lógica de cobro para órdenes de pago y webhook bancario.
*   `feature/modelo-notificaciones`: Estructuración del controlador y almacenamiento simulado de alertas históricas.

**Formato de commits (Conventional Commits):**
*   `chore(<scope>): <descripción>` (ej. `chore(configuracion): configurar entorno...`)
*   `feat(<scope>): <descripción>` (ej. `feat(usuario): Implementar diseño de estructura mvc...`)

---

## 4. Requerimientos del Proyecto
*   **Entorno de ejecución:** Node.js (versión 18 o superior)
*   **Lenguaje:** TypeScript (ejecutado bajo modo estricto)
*   **Framework base:** Express.js

---

## 5. Contrato de la API REST (v1)

### Autenticación (`/auth`)
*   `POST /api/v1/auth/register` (Registrar Usuario)
    *   **Cuerpo (Body):** `{ "name": "Mateo", "email": "mateo@mail.com", "password": "123" }`
    *   **Respuesta (201):** `{ "status": "success", "user": { "id": "usr_1", "name": "Mateo" } }`
*   `POST /api/v1/auth/login` (Iniciar Sesión)
    *   **Cuerpo (Body):** `{ "email": "mateo@mail.com", "password": "123" }`
    *   **Respuesta (200):** `{ "status": "success", "token": "mock_token_jwt" }`

### Subastas y Ofertas (`/auctions`)
*   `GET /api/v1/auctions/categories` (Lista de Categorías para el Selector de la Interfaz)
    *   **Respuesta (200):** `{ "status": "success", "categories": ["Videojuegos", "Arte", "Joyas"] }`
*   `POST /api/v1/auctions` (Publicar Subasta)
    *   **Cuerpo (Body):** `{ "title": "Consola Retro", "basePrice": 100000, "category": "Videojuegos" }`
    *   **Respuesta (201):** `{ "status": "success", "auction": { "id": "auc_1", "title": "Consola Retro", "category": "Videojuegos" } }`
*   `GET /api/v1/auctions` (Listar con Filtro opcional por Query Parameter)
    *   **Ejemplo:** `GET /api/v1/auctions?category=Videojuegos`
    *   **Respuesta (200):** `{ "status": "success", "results": [...] }`
*   `GET /api/v1/auctions/:id` (Detalle por Path Parameter)
    *   **Respuesta (200):** Detalle de la subasta con su respectivo historial de pujas.
*   `POST /api/v1/auctions/:id/bids` (Registrar Puja)
    *   **Cuerpo (Body):** `{ "amount": 110000 }`
    *   **Respuesta (201):** `{ "status": "success", "bid": { "id": "bid_1", "amount": 110000 } }`
*   `GET /api/v1/auctions/:id/rejected-bids` (Auditoría de Pujas Rechazadas)
    *   **Respuesta (200):** Intentos de puja fallidos asociados a la subasta.

### Facturación y Notificaciones (`/payments`, `/notifications`)
*   `GET /api/v1/payments/orders/:id` (Consultar Cobro del Ganador)
    *   **Respuesta (200):** `{ "status": "success", "order": { "id": "pay_1", "totalAmount": 110000 } }`
*   `POST /api/v1/payments/webhook` (Evento Asíncrono de Pasarela)
    *   **Cuerpo (Body):** `{ "transactionId": "tx_abc", "orderId": "pay_1", "status": "APPROVED" }`
    *   **Respuesta (200):** `{ "status": "success", "message": "Pago procesado" }`
*   `GET /api/v1/notifications` (Bandeja de Alertas Históricas del Usuario)
    *   **Respuesta (200):** `{ "status": "success", "notifications": [...] }`

---

## 6. Instalación y Ejecución Local

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/Theo05x/ElectivaII_PlataformaSubastas_OneCore.git
    cd ElectivaII_PlataformaSubastas_OneCore
    ```
2.  **Instalar dependencias:**
    ```bash
    npm install 
4.  **Ejecutar servidor:**
    ```bash
    npm run build
    npm run app
    ```
