# Pymepedia Web

Micrositio estático e independiente de Pymepedia. No requiere instalar paquetes ni conectarse a Supabase. Sus imágenes son capturas y recursos locales de la app.

## Vista local

Desde la raíz del repositorio:

```sh
python3 -m http.server 8766 --directory Proyectos/PymepediaWeb
```

Abre `http://127.0.0.1:8766/`.

## Preparación para el subdominio

El destino definido es `https://pymepedia.ledexsoft.com/`. La página está preparada para servirse como contenido estático desde esta carpeta: raíz del proyecto `/Proyectos/PymepediaWeb`, sin comando de build y con salida estática `.`.

La zona DNS de `ledexsoft.com` responde a través de Cloudflare; este repositorio no incluye configuración del proveedor ni credenciales DNS. Para publicarla, conecta la carpeta a un proyecto de Cloudflare Pages, asigna `pymepedia.ledexsoft.com` como dominio personalizado de ese proyecto y verifica HTTPS antes de compartir el enlace. No se ha publicado ni se ha modificado DNS.

## Acceso a la beta

El proyecto OneBlink confirma que Pymepedia todavía usa una solicitud de beta dentro de la app anfitriona. El botón abre la ficha de OneBlink en Google Play; desde allí, el usuario instala OneBlink y solicita acceso a Pymepedia en su Centro de apps. No hay una ficha de Play Store independiente para Pymepedia en el código disponible.
