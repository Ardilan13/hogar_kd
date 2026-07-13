# Nuestra Libreta 💌

App sencilla para pareja: mercado compartido, deudas del uno al otro, deseos a futuro, fechas especiales, citas/pendientes y notitas tipo post-it. Backend en Node.js + Express, frontend en React + Tailwind.

## Estructura del proyecto

```
pareja-app/
├── backend/              API en Express
│   ├── server.js         Punto de entrada (arranca el servidor)
│   ├── db.js             "Base de datos": guarda todo en data/db.json
│   ├── middleware/
│   │   └── auth.js       Verifica el token (JWT) en rutas protegidas
│   ├── routes/
│   │   ├── crudFactory.js  Crea listar/crear/editar/borrar reutilizable
│   │   ├── auth.js         Login por perfil + PIN
│   │   ├── shopping.js     Mercado
│   │   ├── debts.js        Deudas + balance
│   │   ├── wishlist.js     Deseos a futuro
│   │   ├── events.js       Fechas especiales (calendario)
│   │   ├── appointments.js Citas y pendientes
│   │   └── notes.js        Notitas
│   ├── data/              Aqui se guarda db.json (se crea solo)
│   └── .env.example       Copialo a .env y ajusta tus datos
│
└── frontend/             App en React (Vite + Tailwind)
    └── src/
        ├── api/client.js       Llama a la API
        ├── context/AuthContext.jsx
        ├── components/         Layout, Modal, tarjetas, etc.
        └── pages/
            ├── Login.jsx
            ├── Dashboard.jsx
            ├── Shopping.jsx     (Mercado)
            ├── Debts.jsx        (Deudas)
            ├── Wishlist.jsx     (Deseos)
            ├── Calendar.jsx     (Fechas especiales)
            ├── Appointments.jsx (Citas)
            └── Notes.jsx        (Notitas)
```

### ¿Por qué no lleva MySQL/Postgres?

Para que corra en **cualquier** plan de Hostinger con Node.js sin configurar nada extra, los datos se guardan en un archivo `backend/data/db.json`. Para dos usuarios es más que suficiente y no depende de librerías nativas que a veces fallan en hosting compartido. Si más adelante quieres MySQL (Hostinger lo da gratis en casi todos los planes), es cuestión de cambiar `backend/db.js`; el resto del código no se entera.

## 1. Probarlo en tu computador

Necesitas [Node.js](https://nodejs.org) 18 o superior instalado. Abre dos terminales.

**Terminal 1 — Backend**
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```
Debe decir `🚀 Servidor corriendo en http://localhost:4000` y te mostrará los dos perfiles que creó automáticamente con sus PIN (los mismos que pusiste en `.env`).

**Terminal 2 — Frontend**
```bash
cd frontend
npm install
npm run dev
```
Abre **http://localhost:5173**. Elige un perfil, entra con el PIN, y ya puedes probar todo.

> El frontend en desarrollo (puerto 5173) le pasa las llamadas `/api` al backend (puerto 4000) automáticamente — no tienes que configurar nada más.

### Personalizar los perfiles

Antes de tu primer `npm run dev` en el backend, edita `backend/.env`:
```env
USER1_NAME=Dilan
USER1_PIN=9013
USER2_NAME=Karen
USER2_PIN=1704
```
Los perfiles solo se crean **una vez** (la primera vez que arranca el servidor). Si ya arrancaste y quieres cambiarlos, borra `backend/data/db.json` y vuelve a arrancar.

### Otros ajustes rápidos

- **Moneda:** `frontend/src/utils/format.js` (por defecto COP).
- **Colores/tipografía:** `frontend/tailwind.config.js` e `index.html` (Google Fonts).
- **Secreto de sesión:** cambia `JWT_SECRET` en `backend/.env` por algo largo y aleatorio antes de publicarla.

## 2. Desplegar en Hostinger (plan con Node.js)

Hostinger corre Node.js en planes Business o Cloud (no en hosting compartido básico). El backend está preparado para servir el frontend ya compilado desde el mismo proceso, así que en producción **es una sola app Node**, ideal para el panel de Hostinger.

### Paso 1 — Compila el frontend en tu computador

```bash
cd frontend
npm install
npm run build
```
Esto genera `frontend/dist/`. El backend ya está configurado para servir esa carpeta automáticamente (mira el final de `backend/server.js`).

### Paso 2 — Prepara los archivos a subir

Sube solo esto (evita `node_modules`, Hostinger instala las dependencias por ti):
```
backend/            (todo, incluyendo package.json)
frontend/dist/       (la carpeta que generó el build)
```
Puedes comprimir la carpeta `pareja-app` completa en un .zip (sin `node_modules` de ninguno de los dos lados) — es la forma más simple.

### Paso 3 — Crea la app en hPanel

1. En hPanel: **Websites → Add website → Node.js Web App** (o "Deploy Web App").
2. Elige **"Upload website files"** y sube tu `.zip`.
3. Cuando te pida el **Application root**, apunta a la carpeta `backend` (ahí está su `package.json`).
4. **Startup file:** `server.js`.
5. Elige una versión de **Node.js 18 o superior**.

### Paso 4 — Variables de entorno

En la sección **Environment Variables** del panel de tu app, agrega:
```
JWT_SECRET=algo-largo-y-aleatorio-diferente-al-de-pruebas
USER1_NAME=Dilan
USER1_PIN=1234
USER2_NAME=Tu pareja
USER2_PIN=5678
NODE_ENV=production
```
No definas `PORT` a mano — Hostinger lo asigna solo y el servidor ya lo respeta (`process.env.PORT`).

### Paso 5 — Instalar dependencias y arrancar

Desde el mismo panel: botón de **NPM Install** (instala lo que hay en `backend/package.json`) y luego **Deploy/Restart**. Cuando termine, entra a la URL que te asignó Hostinger — deberías ver la pantalla de login.

### Notas importantes para producción

- **Los datos viven en `backend/data/db.json`.** Si vuelves a subir un .zip nuevo para actualizar el código, **no sobrescribas esa carpeta** o perderás lo guardado — sube solo los archivos que cambiaste, o haz backup de `db.json` antes de redeploy.
- Si prefieres desplegar desde GitHub (auto-deploy en cada push), Hostinger también lo soporta conectando el repo desde el mismo asistente; en ese caso agrega un comando de build tipo `cd frontend && npm install && npm run build && cd ../backend && npm install` y como start `node server.js` con Application root en la raíz del repo.
- Cuando conectes tu dominio, actívale HTTPS (Hostinger lo hace con un clic) — es importante porque el login viaja con el PIN.

## Qué incluye cada sección

- **Mercado:** lista de compras con categoría y cantidad, marca lo ya comprado.
- **Deudas:** registra quién le debe a quién y cuánto; ve el balance neto arriba y marca como pagada cuando corresponda.
- **Deseos:** cosas que quieren comprarse a futuro, con prioridad, precio estimado y enlace.
- **Fechas especiales:** calendario mensual + cuenta regresiva a la próxima fecha; puedes marcar cumpleaños/aniversarios como "se repite cada año".
- **Citas y pendientes:** agenda con fecha, hora y lugar, con lista de pendientes y completadas.
- **Notitas:** mensajitos cortos estilo post-it entre los dos.
- **Inicio:** resumen rápido de todo lo anterior en un solo vistazo.

## Ideas para seguir creciendo esto

- Notificaciones push o por correo para citas/fechas próximas.
- Fotos adjuntas en deseos o notitas.
- Exportar el balance de deudas a PDF.
- Un modo "solo lectura" para compartir con alguien más (ej. familia).
