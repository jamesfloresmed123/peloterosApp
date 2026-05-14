# Sistema Web de Gestión de Responsabilidades para Peloteros

## Importante
Esta aplicación ahora usa **API + archivo JSON (`data.json`)** para registrar, actualizar y consultar datos compartidos.

## Cómo funciona la “BD JSON”
- `server.js` expone endpoints `/api/*`.
- Cada operación de la app (crear, marcar cumplió, consultar calendario/historial/estadísticas) lee/escribe en `data.json`.
- Por eso, los cambios se ven para todos los usuarios que entren al mismo despliegue del servidor.

## Roles
- **Invitado** (sin login):
  - Ve **Responsabilidades del día** (sin botón `Cumplió`).
  - Ve **Calendario de responsabilidades**.
- **Admin** (login):
  - Usuario: `admin`
  - Clave: `PeloteroMenorca`
  - Ve todos los módulos y sí puede usar `Cumplió`.

## Ejecutar local
```bash
npm install
npm start
```
Abrir: `http://localhost:3000`

## Nota sobre GitHub Pages
GitHub Pages no ejecuta Node.js ni actualiza `data.json` del servidor.
Para usar BD JSON compartida debes desplegar en un hosting con Node.js (Render, Railway, VPS, etc.).
