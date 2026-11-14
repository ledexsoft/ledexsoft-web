# LedexSoft — Sitio corporativo

Sitio estático de LedexSoft S.R.L. (HTML + CSS + JS, sin framework ni build). Publicado con GitHub Pages en https://ledexsoft.github.io/ledexsoft-web/

## Estructura

```
├── index.html                  # Landing corporativa LedexSoft
├── cumashop.html               # Landing del producto CumaShop
├── privacidad.html             # Política de Privacidad
├── pymepedia-privacidad.html   # Política de privacidad de Pymepedia para Google Play
├── terminos-clientes.html      # Términos y condiciones para clientes
├── terminos-vendedores.html    # Términos y condiciones para vendedores
├── css/
│   ├── index.css               # Estilos de la landing corporativa
│   ├── cumashop.css            # Estilos de CumaShop
│   ├── legal.css              # Estilos compartidos de las páginas legales
│   └── pymepedia-privacidad.css # Estilos de la política de Pymepedia
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

## Comprobaciones ligeras

Sin framework, instalaciones ni compilación: `node --test tests/*.test.cjs` (Node 18 o posterior). Las pruebas del catálogo usan scripts reales con fronteras DOM/red controladas; no sustituyen una comprobación visual en navegador ni la validación del backend.

Consulta `docs/catalog-publication.md` para el aislamiento temporal de ofertas de prueba y `docs/privacy-review.md` para las diferencias de privacidad pendientes de aprobación.

## Publicación

GitHub Pages sirve desde `main` (raíz). Para publicar un cambio: commit + push a `main` y el build de Pages se dispara solo.

## Luma (prototipo)

`luma.html`, `css/luma.css` y `js/luma.js`: página pública conceptual del asistente personal Luma. Incluye una ilustración CSS original del wearable y una demo local de tres conversaciones ficticias con resúmenes y tareas. No captura audio ni utiliza servicios de IA. El contacto abre el correo; no existe lista de espera ni venta. Accesos desde la portada, el panel de aplicaciones y el pie. Imagen social: `images/luma-social.png`.

Referencia de categoría: https://www.omi.me/ (voz, memoria y tareas). Identidad, textos e ilustración propios; no implica afiliación ni incorpora código o recursos de Omi.

### Presentación de utilidad de Luma

La página presenta problemas cotidianos, cinco casos de uso (reuniones, clientes, estudio, pendientes personales e ideas), el flujo de captura/revisión/consulta y una jornada ilustrativa. Cada caso enlaza a su conversación en la demo. Los cinco ejemplos tienen un fragmento fuente, resumen, tareas y pregunta con respuesta preparada (15 estados). Los resultados distinguen acuerdos de propuestas y explicitan cuándo no se conocen responsables. La demo sigue siendo local: no graba, no hace consultas de IA ni ejecuta tareas. Mantener esta distinción al actualizar textos. La portada comunica los mismos beneficios concretos.
