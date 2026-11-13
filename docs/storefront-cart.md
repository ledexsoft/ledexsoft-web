# Tienda y transferencia de carrito (v1)

La tienda es HTML/CSS/JS estático. No crea pedidos, reserva inventario, procesa pagos ni solicita datos personales. Solo consulta el catálogo público y conserva favoritos/carrito en localStorage del navegador; si está bloqueado, funciona durante la sesión y avisa.

## Catálogo

Consulta `Ofertas` con `Activo=true`, `Pais` seleccionado y `Stock_Disponible=true`; mantiene las exclusiones documentadas de simulaciones 45–103. Luego consulta `catalogo_variantes` en lotes de hasta 100 ofertas. Usa `Oferta_Items.id` (campo `id` de la respuesta), `Oferta`, `Precio_Final_del_cliente`, `Moneda_base` y `Stock_Virtual_Disoponibilidad_a_venta`. No usa el ID `Variante` como identidad del carrito. Se excluyen variantes con moneda incompatible con el receptor v1 (CUP para Cuba, BRL para Brasil), mayoristas, sin stock entero positivo o sin precio positivo verificable. Sin variantes utilizables no se presenta el producto como disponible.

Los precios son orientativos, con el regulador horario local de la app si `Modo_Regulador=true`. Los subtotales se separan por moneda; no se compara ni suma CUP con USD/BRL. El orden por precio agrupa monedas. No se calcula envío ni un total pagadero en la web. La app revalida todos los importes y existencias.

## Contrato

`https://ledexsoft.com/tienda.html?carrito=BASE64URL`

BASE64URL es JSON UTF-8 (los valores del contrato son ASCII), sin padding, con esta forma:

```json
{"v":1,"country":"Cuba","items":[{"offerId":31,"offerItemId":57,"quantity":2}]}
```

- País: `Cuba` o `Brasil`.
- Hasta 50 filas, IDs enteros positivos seguros en JS, cantidades enteras de 1 a 99.
- El emisor combina duplicados y rechaza sumas mayores de 99; el receptor web rechaza filas duplicadas/no canónicas.
- URL máxima de 16.384 caracteres. No incluye precios, usuario, destinatario ni secretos.
- Un enlace recibido no reemplaza el carrito sin confirmación. No habilita compras en la web.
- Se copia mediante acción explícita. Si falla Clipboard API, se ofrece campo seleccionable; no se lee el clipboard en la web.
- La app debe reconocer este contrato, pedir confirmación y revalidar país, oferta, variante, precio y stock antes de mezclarlo con el carrito. Una app antigua que solo reconoce enlaces de producto no importará estos carritos; la UI lo explica.

## Pruebas

`node --test tests/*.test.cjs` cubre reglas puras, límites/enlaces, integración DOM/red simulada con scripts reales y catálogo directo. `node --check js/tienda.js`, `node --check js/store-rules.js`, `git diff --check`. La prueba de navegador real es independiente y no debe inferirse de pruebas DOM simuladas.

## Fotografías pendientes

La revisión visual del 13 de noviembre confirmó cuatro URLs concretas de fotografías con marcas de agua o contenido que no representa el producto (aguacate, cebolla, zanahoria y piña). `unsuitablePhotos` identifica esas URLs exactas, no todo Unsplash ni categorías. Se sustituyen visualmente por «Foto pendiente» sin modificar la base de datos. La portada incorrecta conocida de oferta 44 conserva su bloqueo previo. Cuando el vendedor cambie la URL por una foto correcta, se mostrará automáticamente. No se generaron fotos de productos inexistentes.
