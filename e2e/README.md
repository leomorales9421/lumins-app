# Pruebas End-to-End (E2E) con Playwright

Este directorio contiene pruebas end-to-end para la aplicación frontend usando Playwright.

## Scripts Disponibles

- `npm run test:e2e` - Ejecuta todas las pruebas E2E
- `npm run test:e2e:ui` - Ejecuta pruebas con la interfaz de usuario de Playwright
- `npm run test:e2e:debug` - Ejecuta pruebas en modo debug
- `npm run test:e2e:headed` - Ejecuta pruebas con navegador visible
- `npm run playwright:install` - Instala los navegadores de Playwright
- `npm run playwright:show-report` - Muestra el reporte HTML de las pruebas

## Estructura de Pruebas

### `auth.spec.ts`
Pruebas de autenticación:
- Login exitoso con credenciales válidas
- Error con credenciales inválidas
- Redirección a login cuando no autenticado

### `board-flow.spec.ts`
Pruebas de flujo de tablero:
- Creación de nuevo tablero
- Creación de lista en tablero
- Creación de tarjeta en lista
- Navegación a pestaña de métricas

## Configuración

### Variables de Entorno
Las pruebas asumen que:
- El backend está ejecutándose en `http://localhost:3000`
- El frontend está ejecutándose en `http://localhost:5173`
- Existe un usuario de prueba con email `test@example.com` y password `password123`

### Datos de Prueba
Para que las pruebas funcionen correctamente, necesitas:
1. Tener el backend ejecutándose
2. Tener un usuario de prueba registrado
3. Tener el frontend ejecutándose en modo desarrollo

## Ejecución Local

1. Inicia el backend:
   ```bash
   cd ../lumins-api
   npm run dev
   ```

2. Inicia el frontend:
   ```bash
   npm run dev
   ```

3. Ejecuta las pruebas:
   ```bash
   npm run test:e2e:headed
   ```

## CI/CD

Las pruebas están configuradas para CI/CD:
- Se ejecutan en paralelo
- Se reintentan en CI si fallan
- Generan reportes HTML y trazas
- Toman screenshots en fallos
- Graban video en fallos

## Mejores Prácticas

1. **Selectores**: Usar selectores robustos (texto, roles, data-test-id)
2. **Esperas**: Usar `waitForURL`, `waitForSelector` en lugar de `sleep`
3. **Aislamiento**: Cada prueba debe ser independiente
4. **Limpiar**: Usar `beforeEach`/`afterEach` para limpiar estado
5. **Reportes**: Revisar reportes HTML para debugging

## Troubleshooting

### Problemas Comunes

1. **Timeout en login**: Verificar que el backend esté ejecutándose
2. **Selectores no encontrados**: Verificar que la UI coincida con los selectores
3. **Errores de red**: Verificar CORS y conectividad

### Debugging

```bash
# Ejecutar con UI para debugging visual
npm run test:e2e:ui

# Ejecutar con debugger
npm run test:e2e:debug

# Ver reporte después de ejecución
npm run playwright:show-report
```

## Próximos Pasos

1. Agregar más pruebas para:
   - Drag & drop de tarjetas
   - Modal de tarjeta (checklist, comentarios, adjuntos)
   - Sistema de notificaciones
   - Métricas avanzadas

2. Integrar con GitHub Actions para CI/CD
3. Agregar pruebas de rendimiento
4. Agregar pruebas de accesibilidad
