# LedexSoft — Sitio corporativo

Sitio estático de LedexSoft S.R.L. (HTML + CSS + JS, sin framework ni build). Publicado con GitHub Pages en https://ledexsoft.github.io/ledexsoft-web/

## Estructura

```
├── index.html                  # Landing corporativa LedexSoft
├── cumashop.html               # Landing del producto CumaShop
├── estatutos-ledexsoft.html    # Borrador de estatutos sociales (documento interno)
├── css/
│   ├── index.css               # Estilos de la landing corporativa
│   ├── cumashop.css            # Estilos de CumaShop
│   └── estatutos-ledexsoft.css # Estilos del documento de estatutos
├── js/
│   ├── index.js                # Interacciones de la landing (GSAP + Lenis)
│   ├── cumashop.js             # Interacciones de CumaShop
│   └── estatutos-ledexsoft.js  # TOC, scroll-spy, impresión del documento
└── docs/                       # Documentación del proyecto
```

## Convenciones

- Cada página es autónoma: su CSS y JS viven en `css/` y `js/` con el mismo nombre base que el HTML.
- Sistema de diseño compartido: tokens (`--ink`, `--paper`, `--mango`, `--petrol`...), tipografías Fraunces (display) y Plus Jakarta Sans (body), grano de textura y barra de progreso.
- Librerías por CDN: GSAP 3.12.5 + ScrollTrigger, Lenis 1.1.18. Cargan antes del JS de página (con `defer`).
- Respeta `prefers-reduced-motion` en todas las páginas.

## Publicación

GitHub Pages sirve desde `main` (raíz). Para publicar un cambio: commit + push a `main` y el build de Pages se dispara solo.
