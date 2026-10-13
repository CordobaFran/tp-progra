# R12 — Estadísticas y Premios

Responsable: Thomas Keib Elizondo. Team configurado: `hulk`.

## Implementación

R12 consulta estadísticas y decisiones oficiales de premios. No calcula ganadores, altera reglas ni escribe estado del juego. Angular usa exclusivamente el BFF NestJS; el BFF obtiene el Team desde `TEAM_ID` y el idioma desde `APP_LANG`.

- Vista Angular: `/results/awards`.
- Torneo histórico: `/results/awards?attemptId=<id>`.
- BFF actual: `GET /gameCore/results/awards`.
- BFF histórico: `GET /gameCore/results/awards/:attemptId`.
- API oficial: `GET /game/teams/{TEAM_ID}/journeys/current/statistics` o `GET /game/teams/{TEAM_ID}/journeys/{attemptId}/statistics`, con `lang`.

La respuesta conserva las estadísticas oficiales y agrega `configuredTeamId`, `heroNames` y `teamNames` para presentación. Los modelos propios están separados de la API de la cátedra.

La pantalla muestra resultado, fecha, cierre, encuentros, turnos finales, cuatro premios con ganador/razón/criterio y el caso sin ganador. Incluye todas las métricas de equipo y héroe publicadas por el contrato; permite filtrar por equipo, elegir totales/camino/final y ordenar héroes por métrica. La identidad de un héroe es la combinación de equipo y héroe: un mismo personaje puede aparecer en varios equipos.

## Integración con las otras funciones

- R1 y R4: sus archivos no se modifican. Se usan sus patrones de modelos, servicio, componente y BFF.
- R3–R11: R12 lee el resultado de sus acciones a través de la API. No tiene que importar sus componentes ni compartir estado local.
- R9: al finalizar por `VICTORY`, `DEFEAT` o `ABANDON`, la API publica las estadísticas. Al entrar a R12 o pulsar Actualizar se vuelve a consultar.
- R13: cada entrada del historial tiene un enlace a R12 con su `attemptId`. El BFF mantiene el Team configurado; un intento de otro Team no es accesible mediante este endpoint.
- Rutas, menú lateral y módulos ya incluían R12; no requieren cambios.

Sin torneo, `JOURNEY_REQUIRED` produce una pantalla informativa. Antes del cierre, `STATISTICS_UNAVAILABLE` indica que falta terminar la final. Errores de red, versión o intento inexistente se muestran como error con reintento. Al actualizar se eliminan resultados anteriores y se cancelan solicitudes pendientes para evitar datos de otro torneo.

## Ejecutar y probar

Usar la versión oficial de la Game API y sus instrucciones de inicio. En el BFF copiar `.env.example` a `.env` si aún no existe y verificar `TEAM_ID=hulk`, `APP_LANG=es`, puerto 4102 y Game API en 5102. No sobrescribir un `.env` existente sin revisar sus valores.

En terminales independientes:

```bash
# Backend
cd backend/avengers-back
npm ci
npm run build
npm run start:dev
```

```bash
# Frontend
cd frontend/avengers-front
npm ci
npm run build
npm start
```

Abrir `http://localhost:3102/results/awards`.

Pruebas del servicio Angular (con Chrome instalado):

```bash
cd frontend/avengers-front
npm test -- --browsers=ChromeHeadless --include='src/app/features/results/awards/service/awards.service.spec.ts'
```

### Lista de pruebas del equipo

1. Sin torneo: R12 debe explicar que primero se debe simular un torneo.
2. Simular con R4: R12 debe informar que todavía no terminó la final.
3. Completar R9: actualizar R12 y comparar datos con Swagger de la API.
4. Revisar los cuatro premios, incluidas decisiones sin ganador si la API las devuelve.
5. Filtrar por Hulk, cambiar la etapa y el orden; los premios oficiales deben permanecer iguales.
6. Abrir R13 y usar «Ver estadísticas y premios»; debe mostrar el torneo seleccionado.
7. Simular otro torneo: el enlace histórico anterior debe seguir consultando su propio ID.
8. Detener la API y actualizar: debe mostrarse un error; reiniciar y reintentar.
9. Revisar en navegador escritorio y móvil; las tablas se desplazan horizontalmente.

Si R9 todavía está pendiente, se puede probar un cierre usando Swagger de la API en una base de prueba: simular, enviar `{"type":"START"}` y luego `{"type":"ABANDON"}` a `POST /game/teams/hulk/journeys/current/final-stage/play`. Esto cierra de verdad ese torneo de prueba por abandono; no hacerlo sobre una partida que se quiera conservar en curso. No hace falta editar la API para probar R12.

## Verificación realizada sobre el ZIP recibido

- `npm ci` y `npm run build`: frontend y backend correctos.
- ESLint de los archivos R12: sin errores.
- TypeScript de los tests frontend: sin errores.
- Seis tests del servicio Angular ejecutados con Jasmine en Node: correctos (actual, histórico, dos estados pendientes, reintento, cancelación). La ejecución estándar de Karma en Chrome queda disponible con el comando anterior.
- Integración HTTP contra el código de Game API incluido, sin modificarlo, sobre una base SQLite de prueba creada con sus SQL oficiales: sin torneo, simulación por BFF R4, cierre real por abandono, comparación de todos los campos oficiales, cuatro premios, consulta histórica, historial R13, rechazo de intento ajeno/inexistente y actualización de solo lectura: correctos.
- El test de integración recorrió START → ABANDON; no simula una victoria o derrota completa desde la interfaz.
- No se pudo ejecutar la inspección visual en navegador: el entorno no dispone de Chromium y falló su descarga. La compilación de las plantillas sí pasó.
- Persiste una advertencia previa de presupuesto CSS en R1 (`hero-roster.component.css`, aproximadamente 9,86 kB frente a 8,19 kB). No impide compilar y no se modificó R1.

El ZIP original contiene pantallas pendientes de R5, R7, R8, R9 y R11. R12 no completa esas funciones. Esto impide afirmar que el TP completo sea jugable de punta a punta en esa versión. Las pruebas de R12 se hicieron contra los contratos reales disponibles; si la cátedra cambia la API, deben volver a verificarse.
