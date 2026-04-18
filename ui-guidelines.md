# SaaS Matte Liquid-Glass - UI Guidelines

## 1. Estética y Filosofía
*   **Minimalismo Geométrico**: Menos es más. Diseño inspirado en plataformas B2B de alta gama.
*   **Geometría Estricta**: Uso de esquinas casi cuadradas. El `border-radius` máximo es de `4px` (`rounded-sm` en Tailwind). Eliminar todos los `rounded-xl` o `rounded-full` en contenedores e inputs.
*   **Sin Resplandores (No-Glow)**: Queda prohibido el uso de colores fluorescentes, neon, o sombras proyectadas con color (glow). Todo se define por contraste duro y sobrio.

## 2. Paleta de Colores Mate
*   **Fondo Base (Ambient)**: Gris Zinc Profundo (`#18181b` / `zinc-900`). Se permite un radial muy sutil (`#27272a` a `#18181b`) en lugar de colores planos.
*   **Elementos Activos (Primary Button)**: Se busca contraste alto sin saturación. Usar `bg-zinc-100` con `text-zinc-900` (Blanco/Gris muy claro sobre oscuro).
*   **Bordes**: Trazos finos y sólidos de 1px. `border-zinc-700` para componentes flotantes y `border-zinc-800` para inputs inactivos o botones secundarios.
*   **Textos**: Jerarquía basada en grises. `text-zinc-100` (Títulos), `text-zinc-400` (Labels y Secundarios), `text-zinc-500` (Placeholders e Iconos).

## 3. Efecto Frosted Matte (Vidrio Esmerilado)
*   Las tarjetas flotantes o modales deben usar:
    *   `background: rgba(24, 24, 27, 0.8)` (`bg-zinc-900/80`).
    *   `backdrop-filter: blur(20px)`.
*   Cero bordes blancos brillantes (Rim light eliminado). El límite se define por `border-zinc-700`.

## 4. Componentes y Formularios
*   **Inputs**:
    *   Fondo mate oscuro `bg-zinc-950`.
    *   Sin outline (`outline-none focus:ring-0`).
    *   Estado "Focus": El borde muta a `border-zinc-500` de forma limpia y plana.
*   **Iconos**:
    *   **Prohibido** el uso de fuentes web como Material Symbols por riesgos de CLS y problemas de alineación.
    *   Uso estricto de **SVGs inline** puros con dimensiones consistentes (`w-4 h-4`), stroke o fill limpio (`currentColor`) y tonos mate (`text-zinc-500`).
*   **Botones Sociales / Secundarios**:
    *   Fondo transparente (`bg-transparent`) con `border-zinc-800`.
    *   Hover: `bg-zinc-800/50`.
    *   Estructura: `flex items-center justify-center gap-2`.
