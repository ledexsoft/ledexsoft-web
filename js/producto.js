/* Ficha pública de una oferta: nunca expone credenciales privadas. */
(function(){
  'use strict';
  var SUPABASE='https://tmvqkpkbxagxxgmgqcpl.supabase.co';
  var ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtdnFrcGtieGFneHhnbWdxY3BsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE0ODYwNTcsImV4cCI6MjAzNzA2MjA1N30.Zx5G8Vnmy4ZW2dCKi8ScmcNa40KSqmWL4sEzZoMqwLM';
  var PLAY='https://play.google.com/store/apps/details?id=com.ledexsoft.oneblink';
  var slugs={'Alimentos':'alimentos','Muebles y decoración':'muebles','Aseo y limpieza':'aseo','Electrónicos':'electricos','Moda':'moda','Construcción':'construccion'};
  var labels={'Electrónicos':'Eléctricos','Construcción':'Materiales de construcción'};
  var $=function(id){return document.getElementById(id);};
  var id=new URLSearchParams(location.search).get('id');
  function state(name){['loading','notfound','loaderror','product'].forEach(function(key){$(key).hidden=key!==name;});}
  function safeImage(value){try{var url=new URL(value);return url.protocol==='https:'?url.href:'';}catch(_){return '';}}
  function demo(p){return /\b(simulad[oa]s?|demos?|pruebas?|tests?)\b/i.test(p.Titulo_Es||'') || /simulacion|simulad[oa]|pruebas internas|no representa disponibilidad comercial/i.test((p.Descripcion_Es||'').normalize('NFD').replace(/[\u0300-\u036f]/g,''));}
  function load(){
    if(!id || !/^\d{1,10}$/.test(id)){state('notfound');return;}
    state('loading');var controller=new AbortController();var timeout=setTimeout(function(){controller.abort();},12000);
    var q=new URLSearchParams({select:'id,Titulo_Es,Descripcion_Es,Precio_base_UI,Moneda_base,Imagen_Portada,Seccion,Categoria',id:'eq.'+id,Activo:'eq.true',Stock_Disponible:'eq.true',Pais:'eq.Cuba',limit:'1'});
    fetch(SUPABASE+'/rest/v1/Ofertas?'+q,{headers:{apikey:ANON,Authorization:'Bearer '+ANON},signal:controller.signal})
      .then(function(response){if(!response.ok)throw Error('No disponible');return response.json();})
      .then(function(rows){var p=rows[0];if(!p || demo(p) || !slugs[p.Seccion]){state('notfound');return;}render(p);state('product');})
      .catch(function(){state('loaderror');}).finally(function(){clearTimeout(timeout);});
  }
  function render(p){
    var title=p.Titulo_Es||'Producto';$('p-name').textContent=title;document.title=title+' | CumaShop';
    var sectionLabel=labels[p.Seccion]||p.Seccion;
    var sectionUrl='tienda.html?seccion='+encodeURIComponent(slugs[p.Seccion])+'#catalogo';
    $('breadcrumb-section').textContent=sectionLabel;$('breadcrumb-section').href=sectionUrl;
    $('p-section').textContent=sectionLabel;$('p-section').href=sectionUrl;
    if(p.Categoria){$('p-category').textContent=p.Categoria;$('p-category').href='tienda.html?seccion='+encodeURIComponent(slugs[p.Seccion])+'&categoria='+encodeURIComponent(p.Categoria)+'#catalogo';$('p-category').hidden=false;}else $('p-category').hidden=true;
    if(p.Precio_base_UI!=null && Number.isFinite(Number(p.Precio_base_UI)) && Number(p.Precio_base_UI)>0){$('p-price').textContent=new Intl.NumberFormat('es-CU',{maximumFractionDigits:2}).format(Number(p.Precio_base_UI))+' '+(p.Moneda_base||'CUP');}
    else $('p-price').textContent='Consultar precio en la app';
    var description=(p.Descripcion_Es||'').trim();$('description-wrap').hidden=!description;$('p-desc').textContent=description;
    // En origen la oferta 44 (piña) tiene asociada una imagen de un portátil.
    var image=Number(p.id)===44?'':safeImage(p.Imagen_Portada);
    if(image){$('p-img').src=image;$('p-img').alt='Imagen de '+title;$('p-img').hidden=false;$('p-placeholder').hidden=true;
      $('p-img').onerror=function(){$('p-img').hidden=true;$('p-placeholder').hidden=false;};
    }else{$('p-img').removeAttribute('src');$('p-img').hidden=true;$('p-placeholder').hidden=false;}
    var android=/Android/i.test(navigator.userAgent);
    $('p-open').hidden=!android;
    $('p-play').textContent=android?'Obtenerla en Google Play ↗':'Descargar para Android ↗';
    $('device-note').textContent=android?'Si aún no tienes la app, descárgala desde Google Play.':'CumaShop está disponible en Android. Abre este enlace en tu teléfono para consultar el producto en la app.';
  }
  $('p-open').addEventListener('click',function(){
    var timer=setTimeout(function(){if(!document.hidden)location.href=PLAY;},1700);
    function cancel(){clearTimeout(timer);document.removeEventListener('visibilitychange',onVisibility);window.removeEventListener('pagehide',cancel);}
    function onVisibility(){if(document.hidden)cancel();}
    document.addEventListener('visibilitychange',onVisibility);window.addEventListener('pagehide',cancel,{once:true});
    location.href='cumashop://producto/'+id;
  });
  $('retry').addEventListener('click',load);
  load();
}());
