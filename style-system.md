# Liquid-Glass Neutro - Design System

## 1. Paleta de Colores
*   **Fondo Base (Void)**: Zinc-800 / Slate-850 (`#1E1E21`). Sin negros puros.
*   **Fondo de Capas (Surface)**: `rgba(39, 39, 42, 0.6)`.
*   **Acentos "Pop"**: Gradiente Electric Cyan a Violet (`from-[#00f2fe] to-[#4facfe]`).

## 2. Efecto Liquid-Glass
*   **Contenedores**: 
    *   `backdrop-filter: blur(20px) saturate(180%)`.
    *   Fondo: `rgba(39, 39, 42, 0.6)`.
*   **Bordes Refractivos**: `1px solid rgba(255, 255, 255, 0.1)` (preferiblemente simular luz desde arriba/izquierda).

## 3. Layout Edge-to-Edge
*   **Tableros y Dashboards**: Sin restricciones de `max-w-*`. Ocupan `100vw` y `100vh`.
*   **Header**: Sticky y traslúcido (`backdrop-filter`) para que el contenido fluya por detrás.
*   **Scroll**: Columnas de alto total (`100%`) con scroll horizontal nativo y fluido a nivel de tablero.

## 4. Estabilidad Visual (Anti-CLS)
*   **Iconos**: Material Symbols deben tener dimensiones fijas (ej. `w-6 h-6`, `aspect-square`, `block` o `inline-block`) para evitar saltos de layout durante la carga de la fuente.
