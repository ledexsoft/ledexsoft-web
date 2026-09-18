# LedexSoft — Sitio corporativo

Sitio estático de LedexSoft S.R.L. (HTML + CSS + JS, sin framework ni build). Publicado con GitHub Pages en https://ledexsoft.github.io/ledexsoft-web/

## Estructura

```
├── index.html                  # Landing corporativa LedexSoft
├── cumashop.html               # Landing del producto CumaShop
├── privacidad.html             # Política de Privacidad
├── terminos-clientes.html      # Términos y condiciones para clientes
├── terminos-vendedores.html    # Términos y condiciones para vendedores
├── css/
│   ├── index.css               # Estilos de la landing corporativa
│   ├── cumashop.css            # Estilos de CumaShop
│   └── legal.css              # Estilos compartidos de las páginas legales
├── js/
│   ├── index.js                # Interacciones de la landing (GSAP + Lenis)
│   ├── cumashop.js             # Interacciones de CumaShop
│   └── legal.js               # TOC, scroll-spy, impresión (páginas legales)
└── docs/                       # Documentación del proyecto
```

## Convenciones

- Cada página es autónoma: su CSS y JS viven en `css/` y `js/` con el mismo nombre base que el HTML.
- Sistema de diseño compartido: tokens (`--ink`, `--paper`, `--mango`, `--petrol`...), tipografías Fraunces (display) y Plus Jakarta Sans (body), grano de textura y barra de progreso.
- Librerías por CDN: GSAP 3.12.5 + ScrollTrigger, Lenis 1.1.18. Cargan antes del JS de página (con `defer`).
- Respeta `prefers-reduced-motion` en todas las páginas.

## Publicación

GitHub Pages sirve desde `main` (raíz). Para publicar un cambio: commit + push a `main` y el build de Pages se dispara solo.
