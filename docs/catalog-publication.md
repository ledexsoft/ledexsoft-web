# Catálogo público: aislamiento temporal de simulaciones

## Evidencia y alcance

Revisión de solo lectura del proyecto Supabase `tmvqkpkbxagxxgmgqcpl`, 11 de noviembre de 2026. Las 59 ofertas con IDs 45 a 103 están activas, pero cada una declara en su descripción que fue creada para pruebas internas y que no representa disponibilidad comercial real. Los IDs 45 a 48 tienen títulos comerciales normales, por lo que filtrar palabras del título no sería suficiente.

Consulta usada para comprobarlo:

```sql
select id, "Titulo_Es", "Descripcion_Es"
from public."Ofertas"
where "Activo" is true
  and ("Descripcion_Es" ilike 'SIMULACIÓN:%'
    or "Descripcion_Es" ilike 'SIMULACION:%')
order by id;
```

La consulta es evidencia del conjunto revisado, no una regla de filtrado de producción. No se infiere que una oferta sea de prueba por su nombre, precio, categoría o vendedor. No se modificó ninguna oferta ni política de la base de datos.

## Corrección en este repositorio

`js/cumashop-catalog.js` mantiene una lista explícita y congelada de los 59 IDs comprobados. El catálogo y los relacionados envían la exclusión a la API y vuelven a filtrar la respuesta antes de renderizar. Los contadores, destacados, categorías y búsqueda se calculan sobre ese mismo conjunto. Las fichas directas de esos IDs muestran «Producto no disponible» sin consultar la oferta ni ofrecer abrirla en la app.

La ficha y la tienda comparten `js/cumashop-config.js`; no hay una segunda copia de la configuración de Supabase. Las páginas cargan configuración y regla de catálogo antes de su script de interacción.

## Límite importante

Esto corrige la presentación pública de esta web. **No es control de acceso**: el cliente puede omitir su propio filtro. La tabla no tiene un marcador explícito de pruebas/publicación verificado en la revisión, y los otros clientes de la base no consumen esta lista.

Antes de considerar la separación definitiva:

1. Definir y aprobar en la fuente compartida del backend un estado explícito de publicación/pruebas, con valores seguros por defecto.
2. Separar la visibilidad de administración y la de clientes en el servidor, con pruebas de roles y lectura anónima.
3. Clasificar las ofertas existentes con evidencia y decisión de negocio. No desactivar ofertas mediante inferencias por texto.
4. Hacer que web y app consuman el mismo contrato, y retirar la lista temporal solo después de verificar ese cambio.

## Verificación sin compilación

```sh
node --test tests/*.test.cjs
node --check js/cumashop-catalog.js
node --check js/tienda.js
node --check js/producto.js
git diff --check
```

Las pruebas ejecutan los scripts reales en el orden de sus páginas HTML y reemplazan solo las fronteras DOM/red. Cubren las 59 fichas excluidas, ceros iniciales, búsqueda, destacados, contadores, recomendaciones, consultas, errores de carga y precios no utilizables. No prueban el layout en un navegador ni las políticas RLS reales.

## Indexación

La ruta `p.html` sin ID no representa un producto. Se retiró del sitemap y las fichas dinámicas quedan temporalmente en `noindex,follow`, sin canonical común que mezcle todos los productos. Para habilitar su indexación hace falta generar URLs, metadatos y canonicals por producto publicable, no inventar URLs en un sitemap estático.
