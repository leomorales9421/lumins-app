# Plan de Implementacion: Fondos Personalizados de Tablero

## Objetivo
Permitir que un usuario suba una imagen propia para usarla como fondo del tablero, optimizarla automaticamente a WebP para que cargue rapido, mantener compatibilidad con los fondos actuales por color y gradiente, y evitar flashes visuales durante carga, recarga o navegacion entre tableros.

## Estado Actual
### Frontend
1. El flujo actual de fondos ya esta centralizado en src/lib/board-backgrounds.ts.
2. La app ya distingue entre preset e imagen remota.
3. MainLayout ya precarga imagenes antes de aplicarlas.
4. BoardDetailPage ya restaura el ultimo fondo conocido al reingresar para evitar fondos vacios.
5. Falta la subida de imagen personalizada y un flujo visible de procesamiento y aplicacion.

### API
1. La tabla Board ya tiene background String? con default bg-[#F4F6F9].
2. Las rutas de tableros ya existen en el modulo boards con GET, POST, PATCH, DELETE y control de permisos.
3. La API ya usa multer con memoryStorage en src/middleware/upload.ts.
4. La API ya tiene infraestructura de almacenamiento local y Google Drive.
5. La API aun no tiene transformacion de imagenes ni endpoint especifico para fondos personalizados.
6. La API aun no tiene metadatos tipados para fondos de imagen.

## Decisiones de Diseno
### Compatibilidad
1. Mantener board.background como campo compatible con el frontend actual.
2. Si el fondo es un preset, board.background seguira siendo el valor CSS del preset.
3. Si el fondo es una imagen, board.background pasara a ser la URL final del fondo full.
4. Agregar metadatos nuevos en Board para soportar gestion correcta del fondo sin romper clientes actuales.

### Modelo de datos propuesto
Agregar a Board:
1. backgroundType: PRESET | IMAGE
2. backgroundImageUrl: string | null
3. backgroundThumbUrl: string | null
4. backgroundStorageKey: string | null
5. backgroundVersion: int con default 1

Notas:
1. board.background se mantiene como campo canonico de compatibilidad inmediata.
2. backgroundImageUrl sera la imagen full optimizada.
3. backgroundThumbUrl servira para preview y loader suave en configuracion.
4. backgroundStorageKey servira para borrar o reemplazar recursos en Drive o disco local.
5. backgroundVersion permitira invalidar cache cliente con query string o URL versionada.

## Arquitectura Objetivo
1. Usuario selecciona una imagen en la configuracion del tablero.
2. Frontend valida tipo y tamano, genera preview local y muestra estado Subiendo o Procesando.
3. Frontend envia el archivo al backend via multipart.
4. Backend valida permisos, MIME y peso.
5. Backend transforma la imagen a WebP canonico.
6. Backend genera dos variantes:
   1. full: 1920x1080 max, quality 76-82
   2. thumb: 480x270 max, quality 65-72
7. Backend sube ambas variantes al storage activo.
8. Backend actualiza Board con backgroundType=IMAGE, URLs, version y background=backgroundImageUrl.
9. Frontend aplica update optimista controlado, conserva el fondo anterior hasta que la nueva imagen este precargada y luego hace swap.
10. Mientras la imagen se procesa o precarga, el usuario ve un loader pequeno y no bloqueante.

## Dependencias Nuevas
### API
1. Agregar sharp para conversion y resize a WebP.

Razon:
1. Ya existe multer memoryStorage, asi que sharp encaja bien trabajando en memoria.
2. Permite generar variantes consistentes y reducir peso real del fondo antes de subirlo a Drive o storage local.

## Fase 1: Backend - Modelo y Contrato
Objetivo: extender el modelo Board y dejar listo el contrato compatible.

### Tareas
1. Crear migracion Prisma para agregar los campos nuevos en Board.
2. Mantener background existente y no romper lecturas actuales.
3. Mantener createBoardSchema y updateBoardSchema simples para presets y datos basicos, dejando la imagen en un endpoint separado.
4. Ajustar createBoard en boards.controller para seguir creando el board con preset por defecto.
5. Ajustar getBoards y getBoardById para devolver los nuevos metadatos de fondo.

### Recomendacion
1. No mezclar la subida de archivo dentro de PATCH /api/boards/:id.
2. Mantener PATCH /api/boards/:id para nombre, descripcion, visibilidad y presets.
3. Crear endpoints especificos para imagen personalizada.

### Endpoints propuestos
1. POST /api/boards/:id/background-image
2. DELETE /api/boards/:id/background-image

## Fase 2: Backend - Upload y Procesamiento WebP
Objetivo: recibir imagen, transformarla y almacenarla de forma consistente.

### Tareas
1. Crear nuevo middleware uploadBoardBackground basado en memoryStorage.
2. Limitar tipo a jpeg, jpg, png y webp.
3. Limitar tamano inicial razonable, por ejemplo 15 MB.
4. Crear un servicio nuevo, por ejemplo BoardBackgroundImageService, que:
   1. reciba req.file.buffer
   2. lea metadata con sharp
   3. normalice orientacion
   4. genere variante full en WebP
   5. genere variante thumb en WebP
   6. devuelva buffers, mime image/webp y nombres finales
5. Versionar nombres de archivo por boardId y timestamp.
6. Organizar uploads por carpeta board-backgrounds o boards/{boardId}/backgrounds.

### Decision importante sobre storage
La API actual tiene GoogleDriveStorageService e IStorageService orientados a Express.Multer.File y retorno de URL.

Para soportar variantes generadas por sharp, hay dos opciones:
1. Extender IStorageService con uploadBuffer.
2. Adaptar los buffers generados a objetos tipo Express.Multer.File y reutilizar upload.

### Recomendacion
Implementar uploadBuffer en la abstraccion de storage.

Ventajas:
1. Evita hacks con objetos Multer simulados.
2. Sirve para full y thumb sin duplicar logica.
3. Deja la API lista para otros flujos de imagen en el futuro.

### Interfaz sugerida
1. upload(file, folder)
2. uploadBuffer({ buffer, mimeType, fileName, folder })
3. delete(fileUrlOrStorageKey)

### Resultado esperado del endpoint POST
1. backgroundType = IMAGE
2. background = imageUrl final
3. backgroundImageUrl = imageUrl final
4. backgroundThumbUrl = thumbUrl
5. backgroundStorageKey = clave o ruta base para futura limpieza
6. backgroundVersion = version + 1

## Fase 3: Backend - Limpieza y Reemplazo Seguro
Objetivo: que reemplazar una imagen no deje basura ni rompa a usuarios concurrentes.

### Tareas
1. Al subir nueva imagen, conservar primero la actual hasta terminar la nueva.
2. Solo despues de persistir el nuevo estado del board, borrar la imagen anterior.
3. Si falla el upload o el update en DB, no borrar el recurso previo.
4. Implementar DELETE /api/boards/:id/background-image para volver al preset por defecto.
5. Al eliminar imagen personalizada:
   1. borrar full y thumb del storage
   2. dejar board.background en DEFAULT_BOARD_BACKGROUND
   3. dejar backgroundType=PRESET
   4. limpiar URLs y storageKey

## Fase 4: Frontend - Ajustes del Tablero
Objetivo: agregar UI util y clara para subir imagenes personalizadas.

### Tareas
1. Extender src/types/board.ts con:
   1. backgroundType
   2. backgroundImageUrl
   3. backgroundThumbUrl
   4. backgroundVersion
2. En src/components/BoardSettingsSlideOver.tsx agregar una nueva seccion Imagen personalizada.
3. Incluir input file con accept image/jpeg,image/png,image/webp.
4. Mostrar preview inmediata de la imagen seleccionada.
5. Validar tamano y tipo en cliente antes de enviar.
6. Reutilizar src/lib/image-utils.ts para una compresion preventiva opcional, sin reemplazar la conversion canonica del backend.
7. Subir via multipart usando apiClient.
8. Mientras sube o procesa:
   1. deshabilitar nuevas selecciones de fondo
   2. mostrar loader pequeno y texto Procesando fondo...
   3. mantener fondo actual visible
9. Si todo sale bien:
   1. actualizar board optimistamente con los nuevos campos
   2. disparar precarga de la imagen full
   3. hacer swap solo cuando este lista
10. Si falla:
   1. mostrar error claro
   2. mantener fondo anterior

### Loader propuesto
No usar overlay full screen.

Usar dos puntos de feedback:
1. En el panel de configuracion:
   1. thumbnail con skeleton
   2. spinner pequeno
   3. texto Subiendo... o Procesando fondo...
2. En el tablero:
   1. badge flotante discreto en el header o esquina superior
   2. texto Aplicando fondo...
   3. conservar el fondo previo hasta el swap final

## Fase 5: Frontend - Render, Cache y Experiencia Visual
Objetivo: que la experiencia sea rapida y sin flashes.

### Tareas
1. Extender src/lib/board-backgrounds.ts para resolver backgroundImageUrl y thumbUrl si existen.
2. Extender src/lib/image-cache.ts con cache de fondos, no solo avatars.
3. Guardar por boardId la ultima URL valida y su version.
4. En MainLayout:
   1. conservar ultimo fondo visible mientras la nueva imagen carga
   2. si existe thumb, usar thumb como puente mientras carga full
   3. cambiar a full cuando preload termine
5. Evitar backgroundAttachment fixed en mobile para reducir jank.
6. Invalidar cache cuando cambie backgroundVersion.

### Recomendacion de render
1. Para presets: aplicar instantaneo.
2. Para imagen personalizada:
   1. thumb primero si existe
   2. loader discreto mientras llega full
   3. crossfade suave entre thumb y full o entre previous y full

## Fase 6: Seguridad, Limites y Robustez
Objetivo: evitar abusos, errores silenciosos y deuda operativa.

### Tareas
1. Verificar permisos con requireBoardAdmin en los endpoints de imagen.
2. Limitar uploads por usuario o ruta si hace falta.
3. Validar dimensiones maximas admitidas.
4. Rechazar archivos corruptos o no decodificables por sharp.
5. Registrar logs estructurados de:
   1. upload recibido
   2. conversion WebP
   3. subida storage
   4. limpieza de recurso previo
6. Devolver mensajes de error entendibles para cliente.

## Orden de Implementacion Recomendado
1. API: migracion Prisma y contrato Board.
2. API: uploadBoardBackground + servicio sharp + storage uploadBuffer.
3. API: endpoints POST y DELETE de fondo personalizado.
4. Frontend: tipos y UI de BoardSettingsSlideOver.
5. Frontend: precarga, cache y loader no bloqueante.
6. Hardening: invalidacion, mobile, errores y limpieza.

## Criterios de Aceptacion
1. Un usuario puede subir una imagen PNG, JPG o WebP desde ajustes del tablero.
2. Si la imagen es pesada, el backend la convierte a WebP y reduce peso antes de persistirla.
3. El board devuelve la URL full y thumb del fondo personalizado.
4. Al aplicar una imagen nueva no hay pantalla negra, blanca ni fondo vacio.
5. Al salir y volver al tablero se ve inmediatamente el ultimo fondo conocido.
6. Si la carga falla, el fondo anterior permanece intacto.
7. Reemplazar una imagen no deja basura huerfana en el storage.
8. Los presets actuales siguen funcionando sin regresiones.

## Riesgos y Mitigaciones
1. Riesgo: Google Drive no es ideal como CDN de imagen de fondo.
Mitigacion: mantener URLs proxy actuales, generar WebP liviano y versionar para cache control; a futuro migrar a storage o CDN dedicado si hace falta.

2. Riesgo: el storage service actual no soporta buffers transformados.
Mitigacion: introducir uploadBuffer como extension pequena y reutilizable.

3. Riesgo: doble compresion frontend + backend degrade calidad.
Mitigacion: frontend solo compresion preventiva opcional; backend define la salida canonica final.

4. Riesgo: flashes visuales entre tablero A y tablero B.
Mitigacion: mantener ultimo fondo valido, thumb de puente y preload antes del swap.

5. Riesgo: imagenes gigantes consumen mucha memoria en memoryStorage.
Mitigacion: limitar peso inicial y dimensiones, y rechazar archivos fuera de rango.

## Entregables
1. Endpoints nuevos de fondo personalizado en la API.
2. Migracion Prisma de Board.
3. Servicio de conversion a WebP.
4. Extensiones de storage para buffers.
5. UI de subida y eliminacion de fondo personalizado.
6. Loader discreto y flujo visual estable.
7. Cache de fondos y restauracion inmediata al reingresar.

## Nota Final
La forma mas segura de implementar esto sin romper lo que ya funciona es tratar el fondo personalizado como una extension del flujo actual, no como un reemplazo total. El stack ya tiene buena base: board.background, boards.routes, multer memoryStorage, storage local y Drive, y el manejo robusto de fondo en frontend ya mejorado. La pieza que falta es cerrar bien el pipeline de imagen: validar, convertir a WebP, persistir variantes y aplicar el swap visual sin quitar el fondo anterior antes de tiempo.
