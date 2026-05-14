# Sistema Web de Gestión de Responsabilidades para Peloteros

Aplicación web con Node.js + Express (sin dependencias nativas) para registrar, consultar y dar seguimiento a responsabilidades.

## Funcionalidades
- Registro de responsabilidades con validaciones y estado inicial `Pendiente`.
- Gestión de tipos de responsabilidad (inicialmente: `Cables`, `Cobro`).
- Vista de responsabilidades del día con acción `Cumplió`.
- Calendario mensual con colores por estado.
- Historial con filtros por nombre, fecha, responsabilidad y estado.
- Panel básico de estadísticas.

## Persistencia
Los datos se guardan automáticamente en `data.json` en la raíz del proyecto.

## Ejecutar
```bash
npm install
npm start
```
Abrir: http://localhost:3000
