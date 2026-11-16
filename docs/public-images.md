# Publicación de imágenes

GitHub Pages sirve copias públicas bajo `https://ledexsoft.com/images/`.
El catálogo nuevo `images/catalog.json` está vacío. Las imágenes del sitio ya existentes no se modifican ni se importan a ese catálogo automáticamente.

## Flujo
1. Conservar originales en el bucket local del SSD.
2. Seleccionar únicamente imágenes autorizadas para publicación, verificar identidad de producto y quitar metadatos privados.
3. Exportar un derivado optimizado a `images/products/<image-id>/<revision-sha256>/<filename>`.
4. Registrar ID estable, ruta relativa, tipo MIME, tamaño y SHA-256 en `images/catalog.json`, y vincular el producto mediante imageId. No reutilizar nombres comerciales como IDs.
5. Revisar diff, ejecutar pruebas, publicar a main y comprobar la URL HTTPS y hash remoto.

No subir el bucket completo: originales, staging, SQLite, documentos privados y credenciales permanecen fuera del repositorio.
El directorio images contiene archivos públicos; no es almacenamiento privado ni una API S3. No acepta subidas desde las apps.
No existe sincronización automática del SSD: las imágenes nuevas requieren publicación explícita. Una vez publicadas, las copias funcionan sin la Mac encendida.
`health.json` solo verifica entrega estática. No comprueba el SSD ni la integridad de futuras imágenes.
Conservar URLs versionadas mientras haya consumidores que las utilicen. No sobrescribir una revisión.
La web principal, DNS, túneles y servidor local no se alteraron en esta preparación.
