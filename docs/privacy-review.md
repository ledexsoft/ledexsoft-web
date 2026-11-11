# Reconciliación pendiente de privacidad

Revisión técnica de fuentes al 11 de noviembre de 2026. Este documento no certifica cumplimiento legal ni las prácticas de una versión distribuida.

## Documentos existentes

- Documento corporativo: https://ledexsoft.com/privacidad.html, fuente en `ledexsoft/ledexsoft-web`, base `4570b6bb3e8e19d3599a31c76ce2c2138bd9a9b8`.
- Política enlazada desde Google Play en la revisión: https://ledexsoft.github.io/OneBlinkWeb/privacidad.html, fuente consultada con blob `4d620eff04f12e0b69836dd3c003c3963d6ef476`.
- Centro de políticas: https://ledexsoft.com/privacidad-apps.html.

Se añadieron enlaces informativos entre el documento corporativo, el centro y la política de Google Play. Se conservan el contenido histórico, la URL y los contactos existentes; no hay redirección, sustitución de términos ni afirmación de que los dos textos sean equivalentes. No se cambiaron Google Play ni `OneBlinkWeb`.

## Diferencias que requieren validación

| Tema | Documento corporativo | Política enlazada desde Google Play |
| --- | --- | --- |
| Ámbito | Introducción que también menciona «nuestras demás aplicaciones» | CumaShop, paquete `com.ledexsoft.oneblink` |
| Identidad | Afirma HMAC-SHA256, Vault fuera de copias de seguridad, eliminación inmediata y ausencia de recuperación | Declara documento de identidad cuando corresponde, sin esas garantías técnicas absolutas |
| Proveedores | Stripe, Turnstile e ip-api | Mercado Pago, Google, Cloudflare R2 y Decart, además de Supabase |
| Cámara | No identifica Anywear | Describe cámara y vídeo en vivo a Decart con permiso |
| Retención y eliminación | Eliminación automática y solicitud por correo | Borrado desde ajustes, bloqueo temporal por pedidos/pagos y enlace de borrado de cuenta |
| Sitio web | Carga Google Analytics en el HTML corporativo | Declara que su propia página web no usa cookies analíticas |

Los textos pertenecen a sitios diferentes: la frase sobre cookies de `OneBlinkWeb` no prueba qué ocurre en `ledexsoft.com`. Tampoco el código actual demuestra qué versión está instalada por los usuarios.

## Antes de publicar una política unificada

1. Identificar el `versionCode`, commit y configuración de cada versión realmente distribuida, así como SDK, proveedores y rutas de datos activas.
2. Verificar las garantías de identidad, copias de seguridad y retención con el backend desplegado; evitar promesas absolutas no demostradas.
3. Confirmar con el responsable de la empresa el contacto de privacidad operativo, responsables, plazos, finalidades y ámbito de cada app. No inventar direcciones de correo ni validar que existen solo porque aparecen en HTML.
4. Revisar analítica y consentimiento del sitio corporativo por separado de la aplicación.
5. Aprobar el texto concreto y el destino antes de sustituir una política pública o una declaración de Google Play; conservar acceso a versiones anteriores cuando corresponda.

La revisión técnica puede preparar la comparación, pero estos puntos siguen pendientes. Los enlaces de navegación añadidos no resuelven por sí solos esas diferencias.
