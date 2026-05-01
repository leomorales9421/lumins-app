# Plan de Implementacion: Fondos Personalizados de Tablero

## Objetivo
Habilitar carga de imagen personalizada desde configuracion de tablero, convertirla a WebP para optimizar peso, cachearla para evitar re-render visible al entrar al tablero y mantener transiciones fluidas entre fondos.

## Alcance
1. Upload de imagen en configuracion de tablero.
2. Conversion a WebP y variantes de tamano.
3. Persistencia del fondo en modelo de tablero.
4. Cache persistente en cliente para evitar flicker.
5. Transicion visual suave entre fondo actual y nuevo.

## No Alcance
1. Editor avanzado de imagen (crop manual, filtros, rotacion).
2. CDN multi-region y optimizaciones edge avanzadas.
3. Versionado historico de fondos por tablero.

## Arquitectura Objetivo
1. Frontend selecciona archivo y valida tipo/peso.
2. Frontend comprime de forma preventiva a WebP usando utilitario existente.
3. Backend recibe archivo, revalida y convierte de forma canonica a WebP.
4. Backend guarda URL versionada de imagen final en entidad board.
5. Frontend precarga la imagen y usa cache persistente.
6. MainLayout aplica crossfade entre fondo anterior y nuevo cuando la nueva imagen esta lista.

## Contrato de Datos Propuesto
1. Mantener compatibilidad temporal con background string existente.
2. Agregar campos de fondo tipado en board:
- backgroundType: SOLID_OR_GRADIENT | IMAGE
- backgroundValue: string | null
- backgroundImageUrl: string | null
- backgroundImageThumbUrl: string | null
- backgroundVersion: number | null

## PR1: Backend y Modelo de Datos
Objetivo: recibir fondo personalizado y persistir URL WebP versionada.

Tareas
1. Crear migracion para campos de fondo tipado en tabla de boards.
2. Crear endpoint de upload, por ejemplo POST /api/boards/:id/background-image.
3. Validar permisos de tablero y rol del usuario.
4. Validar MIME y tamano maximo de upload.
5. Convertir a WebP en backend y generar al menos dos variantes: thumb y full.
6. Subir archivos al storage configurado y devolver URLs publicas versionadas.
7. Guardar backgroundType=IMAGE y URLs en board.
8. Crear endpoint de limpieza opcional DELETE /api/boards/:id/background-image.
9. Mantener PATCH /api/boards/:id para gradientes/colores legacy.

Criterios de aceptacion
1. Imagen subida siempre queda en WebP.
2. Se rechazan formatos no permitidos.
3. URL cambia cuando el usuario reemplaza imagen.
4. Board detail devuelve metadatos de fondo sin romper clientes legacy.

## PR2: Frontend de Configuracion y Flujo de Upload
Objetivo: permitir carga desde ajustes del tablero con update optimista y rollback.

Tareas
1. Extender tipos de board en src/types/board.ts para soportar fondo tipado.
2. En src/components/BoardSettingsSlideOver.tsx agregar seccion Subir imagen.
3. Integrar input type=file con validaciones de cliente.
4. Reutilizar src/lib/image-utils.ts para compresion WebP preventiva.
5. Subir archivo al nuevo endpoint y manejar progreso.
6. Hacer update optimista del board y rollback ante error.
7. Mantener seleccion de gradientes actual sin regresion.
8. Mostrar estado de procesamiento y errores claros para usuario.

Criterios de aceptacion
1. Usuario puede subir imagen y verla aplicada en el tablero.
2. Si falla upload, se restaura fondo anterior.
3. Fondos de gradiente actuales siguen funcionando.

## PR3: Cache Persistente y Transiciones Suaves
Objetivo: que el usuario no vea el fondo recargando al entrar al tablero y que el cambio sea fluido.

Tareas
1. Extender src/lib/image-cache.ts para cache dedicada de fondos:
- getCachedBoardBackground
- invalidateBoardBackground
- clearBoardBackgroundCache
2. Usar Cache Storage con nombre de cache versionado para fondos.
3. Integrar precarga de fondo en src/components/layout/MainLayout.tsx antes de aplicar visualmente.
4. Implementar doble capa de fondo con crossfade.
5. Conservar fondo anterior hasta que el nuevo este listo.
6. Invalidar cache del fondo previo cuando se reemplaza imagen.
7. Evitar background-attachment fixed en mobile para reducir jank.
8. Mantener la sincronizacion por evento set-board-background.

Criterios de aceptacion
1. Al entrar al tablero, no hay parpadeo visible del fondo en casos cacheados.
2. Cambio de fondo entre tableros se percibe suave.
3. No aparecen estados en blanco entre transiciones.

## PR4: Hardening, Observabilidad y Limpieza
Objetivo: robustecer la solucion para produccion.

Tareas
1. Agregar telemetria minima:
- cache hit ratio de fondos
- tiempo de primer render de fondo
- errores de upload/conversion
2. Definir politica de limpieza de cache para evitar crecimiento infinito.
3. Agregar fallback en caso de fallo de Cache Storage.
4. Revisar headers cache-control en backend para imagenes.
5. Limpiar deuda de modo legacy cuando se confirme estabilidad.

Criterios de aceptacion
1. Se puede medir si la optimizacion realmente mejora UX.
2. Cache no crece indefinidamente.
3. Fallback funcional sin romper render de tablero.

## Riesgos y Mitigaciones
1. Riesgo: doble conversion (frontend y backend) degrade calidad.
Mitigacion: frontend solo compresion preventiva, backend define calidad final canonica.
2. Riesgo: cache desactualizada tras reemplazo de fondo.
Mitigacion: versionado de URL y invalidacion explicita de clave anterior.
3. Riesgo: lag en mobile por imagenes pesadas.
Mitigacion: limite de resolucion, variante optimizada y desactivar fixed en mobile.

## Orden de Ejecucion Recomendado
1. PR1 Backend y modelo.
2. PR2 UI de configuracion y upload.
3. PR3 cache persistente y transicion.
4. PR4 hardening y observabilidad.

## Checklist de Go Live
1. Migracion aplicada en entorno de staging.
2. Upload y conversion WebP validados con imagenes reales.
3. Navegacion entre tableros probada en desktop y mobile.
4. Reemplazo de fondo invalida cache correctamente.
5. No hay regresiones en fondos por gradiente existentes.
6. Monitoreo de errores habilitado en produccion.
