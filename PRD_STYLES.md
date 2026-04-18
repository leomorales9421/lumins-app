# PRD: Replicación del Diseño "Vibrant Matte" (Desde el Login al Resto del Sistema)

## Objetivo Principal
Extrapolar de manera exacta el lenguaje visual, paleta cromática, tipografía y geometría establecidos en la nueva pantalla de `LoginPage.tsx` hacia **toda la plataforma**. 
**REGLA DE ORO:** Bajo ningún concepto se deben modificar los estilos actuales del Login. El objetivo es copiar y pegar visualmente sus propiedades hacia el interior de la app.

---

## Ecosistema Visual "Vibrant Matte" (Referencia del Login)
- **Fondo de Plataforma (Opcional por contexto):** Gradientes vibrantes (Púrpura `#6e45e2`, Violeta `#8e2de2`, Rosa/Naranja `#ff9a9e`).
- **Superficies (Cards, Modales, Formularios):** Blanco Puro (`#ffffff`) con sombras controladas (`shadow-md` a `shadow-2xl`).
- **Inputs de Formulario:** Fondo púrpura muy suave (`bg-[#f3e5f5]`), sin bordes (`border-none`), radio de borde medio (`rounded-md`), texto en `zinc-700` y placeholders translúcidos.
- **Geometría Estándar:** `rounded-md` (8px) para todos los elementos interactivos y contenedores. Tamaños compactos (ej. altura de inputs/botones `h-10` o `h-11`).
- **Tipografía:** Fuerte uso de `font-black` y `font-extrabold` en títulos y botones. Letras mayúsculas espaciadas (`uppercase tracking-[0.3em]`) para sobretítulos y etiquetas.
- **Acciones Primarias:** Botones con gradiente (`from-[#6e45e2] to-[#ff9a9e]`), texto blanco.
- **Acciones Secundarias:** Botones blancos con bordes definidos (`border-zinc-300`).
- **Iconografía:** SVGs de trazo limpio integrados.

---

## Plan de Implementación en 3 Fases

### Fase 1: Estandarización de Componentes Base e Inputs
**Objetivo:** Asegurar que los ladrillos de construcción de la UI compartan el ADN del login.
1. **Actualizar `index.css` y `tailwind.config.js`:**
   - Asegurar que los colores base (Púrpura Vibrante, Rosa, Naranja) estén disponibles globalmente sin interferir con las clases estáticas del login.
   - Definir variables globales para las sombras y los radios de borde si es necesario.
2. **Refactorizar `<Button />`:**
   - Variante `primary`: Gradiente de púrpura a rosa (`bg-gradient-to-r from-[#6e45e2] to-[#ff9a9e]`), `font-black`, `uppercase`, `rounded-md`.
   - Variante `secondary`: Fondo blanco, `border-zinc-300`, texto en `zinc-700`.
   - Altura estándar `h-11` (tamaño compacto).
3. **Refactorizar `<Input />`:**
   - Eliminar el estilo oscuro "Liquid-Glass".
   - Aplicar el estilo del login: `bg-[#f3e5f5]`, `border-none`, `rounded-md`, tipografía en `zinc-700`.
   - Cambiar el estilo del foco a `focus:ring-2 focus:ring-[#6e45e2]/20`.
4. **Refactorizar `<Card />` y Modales:**
   - Cambiar los fondos translúcidos grises por fondos **blancos puros**.
   - Bordes `rounded-md` y sombras limpias (`shadow-lg`).

### Fase 2: Reestructuración de la Navegación y Vistas Generales (Mis Proyectos)
**Objetivo:** Llevar la estética al Dashboard principal sin romper la estructura de datos.
1. **Reescribir `<NavBar />`:**
   - Eliminar los fondos negros translúcidos.
   - Opción A: NavBar blanca pura con borde inferior gris claro (`border-zinc-200`) e iconos/texto en Púrpura oscuro.
   - Opción B: NavBar con el gradiente vibrante del login y texto blanco. (Sugerido: Opción A para mayor limpieza operativa).
2. **Refactorizar `BoardsPage.tsx`:**
   - Cambiar el fondo global oscuro (`bg-zinc-950`) a un fondo que haga juego con el nuevo sistema (ej. `bg-zinc-50` o un gradiente muy sutil pastel).
   - Adaptar los textos "Hola, [Usuario]" y encabezados a la nueva tipografía (`text-[#6e45e2]`, `font-extrabold`).
3. **Actualizar `<BoardCard />`:**
   - Modificar las tarjetas de los proyectos para que sean contenedores blancos (`bg-white`), con bordes suaves o sombras, manteniendo la barra de acento superior pero ahora con el gradiente Púrpura-Rosa.

### Fase 3: Detalle de Tablero (Drag & Drop) y Flujos Complejos
**Objetivo:** Adaptar las herramientas de trabajo intensivo (Tableros, Listas, Tareas) para que ofrezcan máximo contraste y legibilidad bajo la nueva paleta.
1. **Vista de Tablero (`BoardDetailPage.tsx`):**
   - El fondo del tablero puede mantener el gradiente vibrante (similar a la imagen del login) para dar identidad visual, mientras que las listas flotan por encima.
2. **Listas y Columnas (`SortableList.tsx`):**
   - Cabeceras de listas en blanco sólido o Púrpura Suave (`#f3e5f5`).
   - Geometría `rounded-md`.
3. **Tarjetas de Tareas (`SortableCard.tsx`):**
   - Fondos blancos puros, sombras elevadas al arrastrar (`hover:shadow-lg`).
   - Etiquetas y badges utilizando los tonos vibrantes de la nueva paleta.
4. **Testing Sintáctico:**
   - Revisar exhaustivamente todos los archivos modificados para evitar el error común de importaciones nombradas vs. exportaciones por defecto, y asegurar que la compilación de Vite pase correctamente.

---
*Fin del PRD. Documento listo para el inicio de la Fase 1 cuando se apruebe su ejecución.*
