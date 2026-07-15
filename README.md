# MAGG Dashboard

Repositorio del CRM MAGG. La versión pública de GitHub Pages queda limitada a una página neutra sin datos privados.

## Arquitectura activa

- `src/domain/` — schemas y migración canónica.
- `src/data/` — carga de base privada generada localmente.
- `src/services/` — selectores comunes para Pipeline, Control y herramientas.
- `src/views/` — frontend sin datos embebidos.
- `server/` — API autenticada, CORS allowlist, herramientas Hermes y auditoría.
- `scripts/` — migración, auditoría, build, escaneo y email diario.
- `private/` — input legacy y base generada; no se versiona.

## Comandos

```bash
npm install
npm run migrate
npm run build
MAGG_CRM_PASSWORD="<server-secret>" npm start
npm test
npm run scan:bundle
npm run verify:reconstruction
```
