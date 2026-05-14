# Luminoa Inventory Backend

Backend para la aplicacion de inventario de Luminoa, construido con Next.js API routes, TypeScript, Prisma ORM y PostgreSQL.

## Requisitos

- Node.js
- PostgreSQL
- Una base de datos creada, por ejemplo `luminoa_inventory`

## Configuracion

Crear un archivo `.env` en la raiz del proyecto:

```env
DATABASE_URL="postgresql://postgres:luminoa123@localhost:5432/luminoa_inventory?schema=public"
JWT_SECRET="cambiar-por-un-secreto-largo"
```

`DATABASE_URL` debe apuntar a tu base PostgreSQL local o remota.

## Comandos utiles

Instalar dependencias:

```bash
npm install
```

Crear/aplicar migraciones:

```bash
npm run prisma:migrate -- --name init
```

Cargar datos iniciales:

```bash
npm run seed
```

Ver datos en Prisma Studio:

```bash
npm run prisma:studio
```

Levantar la API en desarrollo:

```bash
npm run dev
```

Verificar TypeScript y build:

```bash
npm run typecheck
npm run build
```

## Usuario inicial

El seed crea un administrador:

```text
Email: admin@luminoa.local
Password: Admin123!
Role: ADMIN
```

## Autenticacion

Login:

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@luminoa.local",
  "password": "Admin123!"
}
```

La respuesta incluye un `token`. Para consumir rutas protegidas:

```http
Authorization: Bearer <token>
```

## Endpoints

Auth:

```text
POST /api/auth/register
POST /api/auth/login
```

Usuarios, solo ADMIN:

```text
GET    /api/users
POST   /api/users
PUT    /api/users
DELETE /api/users
```

Categorias:

```text
GET    /api/categories
POST   /api/categories        ADMIN
GET    /api/categories/:id
PUT    /api/categories/:id    ADMIN
DELETE /api/categories/:id    ADMIN
```

Productos:

```text
GET    /api/products?page=1&limit=20&search=led
POST   /api/products          ADMIN
GET    /api/products/:id
PUT    /api/products/:id      ADMIN
DELETE /api/products/:id      ADMIN, desactiva el producto
```

Stock:

```text
POST /api/stock/entries
POST /api/stock/exits
GET  /api/stock/history?productId=&userId=&from=&to=&page=1&limit=50
GET  /api/stock/summary
```

Las salidas validan stock suficiente antes de crear el movimiento.
