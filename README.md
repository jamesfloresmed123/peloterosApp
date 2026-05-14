# Sistema Web de Gestión de Responsabilidades para Peloteros

Esta versión está preparada para **GitHub Pages** y funciona sin backend.

## ¿Por qué antes se veía solo el README?
GitHub Pages publica archivos estáticos del repositorio. La app estaba dentro de `public/` y dependía de APIs de Express (`/api/...`), que Pages no ejecuta.

## Solución aplicada
- Se agregó `index.html`, `app.js` y `styles.css` en la raíz para que Pages cargue la app directamente.
- La lógica ahora guarda datos en `localStorage` del navegador.
- Se mantienen módulos: registro, responsabilidades del día, calendario, historial y estadísticas.

## Publicar en GitHub Pages
1. Ve a **Settings > Pages**.
2. En **Build and deployment** selecciona:
   - **Source:** Deploy from a branch
   - **Branch:** tu rama principal
   - **Folder:** `/ (root)`
3. Guarda y espera el despliegue.

## Nota
Los datos quedan guardados por navegador/dispositivo (localStorage).
