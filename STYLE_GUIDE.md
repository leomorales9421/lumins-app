# Guía de estilos visuales (tokens Stitch)

## Colores
- `primary`: #13a4ec
- `background-light`: #f6f7f8
- `background-dark`: #101c22
- `surface-dark`: #18242b
- `surface-light`: #ffffff
- Grises: `text-slate-900`, `text-slate-500`, `border-slate-200`, `dark:border-slate-800`

## Tipografía
- Familia: `Inter, sans-serif`
- Pesos: 400, 500, 600, 700

## Border radius
- `DEFAULT`: 0.25rem
- `lg`: 0.5rem
- `xl`: 0.75rem
- `full`: 9999px

## Sombra
- `shadow-md`, `shadow-lg`, `shadow-primary/20`

## Scrollbar
- Estrecho, thumb oscuro, track transparente

## Componentes base
### Botones
- `rounded-lg`, `bg-primary`, `hover:bg-primary/90`, `text-white`, `shadow-md`, `text-sm font-semibold`
### Inputs
- `rounded-lg`, `ring-1 ring-inset ring-slate-200`, `dark:ring-slate-700`, `focus:ring-primary`, `bg-white dark:bg-surface-dark`, `text-slate-900 dark:text-white`
### Tarjetas
- `rounded-xl`, `bg-white dark:bg-surface-dark`, `border border-slate-200 dark:border-slate-800`, `shadow-sm`, `hover:shadow-lg`, `transition-all`
### Navegación lateral
- `w-64`, `bg-white dark:bg-surface-dark`, `border-r`, `flex flex-col`, `gap-1`, `hover:bg-slate-100 dark:hover:bg-slate-800`, `text-slate-600 dark:text-slate-400`, `hover:text-primary`
### Headers
- `text-2xl font-bold tracking-tight`, `text-slate-900 dark:text-white`

## Iconografía
- Material Symbols Outlined, tamaño variable (`text-[20px]`, `text-[24px]`)

## Animaciones
- `transition-colors`, `transition-all`, `active:scale-95`

## Dark mode
- Usa la clase `dark` en el `<html>` y aplica variantes `dark:` en todos los componentes.

## Espaciados
- `px-3`, `py-2.5`, `gap-3`, `mb-8`, `pt-4`, etc.

## Reglas
- No inventes clases ni colores nuevos: solo usa los definidos aquí.
- Si creas un nuevo componente, revisa primero el HTML de las plantillas y copia la estructura de clases.
- Para iconos, usa Material Symbols Outlined y los tamaños indicados.
- Aplica los mismos paddings, gaps y border-radius.
- Usa la fuente Inter y los mismos pesos.