# SELLO Backend

API REST desarrollada con Node.js + Express para la aplicación SELLO, una PWA de fidelización digital para negocios.

## Tecnologías

- **Node.js** + **Express** — servidor y enrutamiento
- **PostgreSQL** (Supabase) — base de datos relacional
- **jose** — verificación de tokens JWT (ECC P-256)
- **pg** — cliente PostgreSQL para Node.js
- **Render.com** — hosting del backend

## URLs

- **Backend en producción:** https://sello-backend-1su3.onrender.com
- **Frontend en producción:** https://sello-app.vercel.app

## Estructura del proyecto
sello-backend/
├── src/
│   ├── index.js           # Entry point, configuración Express
│   ├── db.js              # Conexión a PostgreSQL
│   ├── middleware/
│   │   └── auth.js        # Verificación JWT de Supabase
│   └── routes/
│       ├── negocios.js    # Endpoints de negocios
│       ├── clientes.js    # Endpoints de clientes
│       └── tarjetas.js    # Endpoints de tarjetas
├── .env.example
├── package.json
└── render.yaml

## Autenticación

Todos los endpoints (excepto `/` y `/health`) requieren un token JWT en el header:
Authorization: Bearer <token>

El token lo genera Supabase Auth al hacer login. El backend lo verifica usando la clave pública ECC P-256 del proyecto Supabase.

## Base de datos

### Tablas

**negocios**
| Campo | Tipo | Descripción |
|---|---|---|
| id | uuid | Identificador único |
| user_id | uuid | ID del usuario propietario |
| nombre | text | Nombre del negocio |
| tipo | text | Tipo de negocio |
| num_sellos | integer | Sellos necesarios para el premio |
| premio | text | Descripción del premio |
| premios | jsonb | Array de premios intermedios |
| diseno | jsonb | Configuración visual de la tarjeta |
| caducidad_meses | integer | Meses de caducidad de la tarjeta |
| telefono | text | Teléfono de contacto |
| direccion | text | Dirección del negocio |

**clientes**
| Campo | Tipo | Descripción |
|---|---|---|
| id | uuid | Identificador único |
| user_id | uuid | ID del negocio propietario |
| nombre | text | Nombre del cliente |
| email | text | Email del cliente |

**tarjetas**
| Campo | Tipo | Descripción |
|---|---|---|
| id | uuid | Identificador único |
| cliente_id | uuid | ID del cliente |
| negocio_id | uuid | ID del negocio |
| sellos_actuales | integer | Sellos acumulados actualmente |
| total_canjes | integer | Total de premios canjeados |
| created_at | timestamp | Fecha de creación |
| updated_at | timestamp | Última actualización |

## Endpoints

### Health check
GET /health
Respuesta:
```json
{
  "status": "ok",
  "service": "sello-backend",
  "timestamp": "2026-05-13T17:40:01.984Z"
}
```

---

### Negocios
GET /api/negocios
Devuelve todos los negocios del usuario autenticado.
GET /api/negocios/:id
Devuelve un negocio por ID.
POST /api/negocios
Crea un nuevo negocio.

Body:
```json
{
  "nombre": "Mi Cafetería",
  "tipo": "Cafetería",
  "num_sellos": 10,
  "premio": "Café gratis",
  "caducidad_meses": 12
}
```
PUT /api/negocios/:id
Actualiza un negocio existente. Acepta los mismos campos que POST (todos opcionales).
DELETE /api/negocios/:id
Elimina un negocio.

---

### Clientes
GET /api/clientes
Devuelve todos los clientes del usuario autenticado.
GET /api/clientes/:id
Devuelve un cliente por ID.
POST /api/clientes
Crea un nuevo cliente.

Body:
```json
{
  "nombre": "Juan García",
  "email": "juan@email.com"
}
```
PUT /api/clientes/:id
Actualiza un cliente. Acepta nombre y email (ambos opcionales).
DELETE /api/clientes/:id
Elimina un cliente.

---

### Tarjetas
GET /api/tarjetas
Devuelve todas las tarjetas del usuario autenticado con datos del cliente y negocio.
GET /api/tarjetas/:id
Devuelve una tarjeta por ID.
POST /api/tarjetas
Crea una nueva tarjeta de fidelización.

Body:
```json
{
  "cliente_id": "uuid-del-cliente",
  "negocio_id": "uuid-del-negocio"
}
```
POST /api/tarjetas/:id/sello
Añade un sello a la tarjeta. Si se alcanzan los sellos necesarios, activa el canje automáticamente.

Respuesta:
```json
{
  "tarjeta": { "sellos_actuales": 3, "total_canjes": 0 },
  "canje_activado": false,
  "mensaje": "Sello añadido. 7 sellos para el premio"
}
```
DELETE /api/tarjetas/:id
Elimina una tarjeta.

## Instalación local

```bash
git clone https://github.com/Saeed269/sello-backend.git
cd sello-backend
npm install
cp .env.example .env
# Rellenar las variables en .env
npm run dev
```

## Variables de entorno
DATABASE_URL=postgresql://...
SUPABASE_JWT_SECRET=...
PORT=3001
FRONTEND_URL=https://sello-app.vercel.app