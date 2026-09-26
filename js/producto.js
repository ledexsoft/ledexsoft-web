/* Ficha de ofertas activas de CumaShop. Usa únicamente la clave pública de Supabase. */
(function(){
  'use strict';
  var SUPABASE='https://tmvqkpkbxagxxgmgqcpl.supabase.co';
  var ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtdnFrcGtieGFneHhnbWdxY3BsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE0ODYwNTcsImV4cCI6MjAzNzA2MjA1N30.Zx5G8Vnmy4ZW2dCKi8ScmcNa40KSqmWL4sEzZoMqwLM';
  var PLAY='https://play.google.com/store/apps/details?id=com.ledexsoft.oneblink';
  var slugs={'Alimentos':'alimentos','Muebles y decoración':'muebles','Aseo y limpieza':'aseo','Electrónicos':'electricos','Moda':'moda','Construcción':'construccion'};
  var labels={'Electrónicos':'Eléctricos','Construcción':'Materiales de construcción'};
  var $=function(id){return document.getElementById(id);};
  var id=new URLSearchParams(location.search).get('id');
  var money=function(n,currency){return new Intl.NumberFormat('es-CU',{maximumFractionDigits:2}).format(Number(n))+' '+(currency||'CUP');};
  function node(tag,className,value){var el=document.createElement(tag);if(className)el.className=className;if(value!=null)el.textContent=value;return el;}
  function state(name){['loading','notfound','loaderror','product'].forEach(function(key){$(key).hidden=key!==name;});}
  function safeImage(value){try{var url=new URL(value);return url.protocol==='https:'?url.href:'';}catch(_){return '';}}
  function sectionUrl(p){return 'tienda.html?seccion='+encodeURIComponent(slugs[p.Seccion]||'alimentos')+'#catalogo';}
  function categoryUrl(p,withSub,withThird){
    if(!slugs[p.Seccion])return 'tienda.html#catalogo';
    var q=new URLSearchParams({seccion:slugs[p.Seccion],categoria:p.Categoria||''});
    if(withSub&&p.Categoria2)q.set('sub',p.Categoria2);
    if(withThird&&p.Categoria3)q.set('sub3',p.Categoria3);
    return 'tienda.html?'+q+'#catalogo';
  }
  function api(path,params){
    var controller=new AbortController();var timer=setTimeout(function(){controller.abort();},12000);
    return fetch(SUPABASE+'/rest/v1/'+path+'?'+new URLSearchParams(params),{headers:{apikey:ANON,Authorization:'Bearer '+ANON},signal:controller.signal})
      .then(function(response){if(!response.ok)throw Error('No disponible');return response.json();})
      .finally(function(){clearTimeout(timer);});
  }
  function load(){
    if(!id||!/^\d{1,10}$/.test(id)){state('notfound');return;}
    state('loading');
    api('Ofertas',{select:'id,Titulo_Es,Descripcion_Es,Precio_base_UI,Precio_Min,Precio_Max,Moneda_base,Imagen_Portada,Imagen_1,Imagen_2,Imagen_3,Imagen_4,Seccion,Categoria,Categoria2,Categoria3,Stock_Disponible,EnOferta,PorcentajeDescuento,Unidad_de_Medidas,Cantidad_por_Unidad,Garantia_Dias,Envio_Incluido,Pais',id:'eq.'+id,Activo:'eq.true',limit:'1'})
      .then(function(rows){var p=rows[0];if(!p){state('notfound');return;}render(p);state('product');loadRelated(p);})
      .catch(function(){state('loaderror');});
  }
  function renderGallery(p,title){
    // Oferta 44: la foto de portada guardada en la base representa un portátil, no una piña.
    var sources=['Imagen_Portada','Imagen_1','Imagen_2','Imagen_3','Imagen_4'].map(function(key){return key==='Imagen_Portada'&&Number(p.id)===44?'':safeImage(p[key]);}).filter(Boolean);
    sources=[...new Set(sources)];var gallery=$('p-gallery');gallery.replaceChildren();gallery.hidden=sources.length<2;
    function show(url,index){
      $('p-img').src=url;$('p-img').alt='Imagen '+(index+1)+' de '+title;$('p-img').hidden=false;$('p-placeholder').hidden=true;
      [...gallery.children].forEach(function(button,i){button.setAttribute('aria-pressed',String(i===index));});
    }
    $('p-img').onerror=function(){$('p-img').hidden=true;$('p-placeholder').hidden=false;};
    sources.forEach(function(url,index){
      var thumb=node('button','detail-thumb');thumb.type='button';thumb.setAttribute('aria-label','Ver imagen '+(index+1)+' de '+title);
      thumb.append(node('img'));thumb.firstChild.src=url;thumb.firstChild.alt='';thumb.firstChild.loading='lazy';
      thumb.addEventListener('click',function(){show(url,index);});gallery.append(thumb);
    });
    if(sources.length)show(sources[0],0);
    else{$('p-img').removeAttribute('src');$('p-img').hidden=true;$('p-placeholder').hidden=false;}
  }
  function render(p){
    var title=p.Titulo_Es||'Producto';$('p-name').textContent=title;document.title=title+' | CumaShop';
    var sectionLabel=labels[p.Seccion]||p.Seccion||'Tienda';var sectionLink=sectionUrl(p);
    $('breadcrumb-section').textContent=sectionLabel;$('breadcrumb-section').href=sectionLink;
    $('p-section').textContent=sectionLabel;$('p-section').href=sectionLink;
    [['p-category','Categoria',false,false],['p-subcategory','Categoria2',true,false],['p-subcategory3','Categoria3',true,true]].forEach(function(item){
      var el=$(item[0]),value=p[item[1]];el.hidden=!value;if(value){el.textContent=value;el.href=categoryUrl(p,item[2],item[3]);}
    });
    var low=Number(p.Precio_Min),high=Number(p.Precio_Max),base=Number(p.Precio_base_UI);
    if(p.Precio_Min!=null&&p.Precio_Max!=null&&high>low&&low>=0)$('p-price').textContent=money(low,p.Moneda_base)+' – '+money(high,p.Moneda_base);
    else $('p-price').textContent=p.Precio_base_UI!=null&&Number.isFinite(base)&&base>0?money(base,p.Moneda_base):'Consultar precio en la app';
    $('p-availability').hidden=p.Stock_Disponible!==false;
    $('p-availability').textContent='Sin stock en este momento · consulta la app para novedades';
    $('p-delivery').hidden=p.Pais!=='Cuba';
    var facts=$('p-facts');facts.replaceChildren();
    function fact(icon,label,value){var el=node('div','detail-fact');el.append(node('span','detail-fact-icon',icon),node('span','detail-fact-label',label),node('strong','',value));facts.append(el);}
    if(p.Unidad_de_Medidas&&p.Cantidad_por_Unidad)fact('▤','Presentación',Number(p.Cantidad_por_Unidad)+' '+p.Unidad_de_Medidas);
    if(p.EnOferta===true)fact('✦','Promoción',Number(p.PorcentajeDescuento)>0&&Number(p.PorcentajeDescuento)<100?Number(p.PorcentajeDescuento)+'% de descuento':'Marcada como oferta');
    if(Number(p.Garantia_Dias)>0)fact('◇','Garantía',Number(p.Garantia_Dias)+' días');
    if(p.Envio_Incluido===true)fact('↗','Envío','Incluido');
    if(p.Pais&&p.Pais!=='Cuba')fact('⌖','País',p.Pais);
    facts.hidden=!facts.children.length;
    var description=(p.Descripcion_Es||'').trim();$('description-wrap').hidden=!description;$('p-desc').textContent=description;
    renderGallery(p,title);
    var android=/Android/i.test(navigator.userAgent);
    $('p-open').hidden=!android;$('p-play').textContent=android?'Obtenerla en Google Play ↗':'Descargar para Android ↗';
    $('device-note').textContent=android?'Si aún no tienes la app, descárgala desde Google Play.':'CumaShop está disponible en Android. Abre este enlace en tu teléfono para consultar el producto en la app.';
    $('related-link').href=sectionLink;
  }
  function loadRelated(p){
    api('Ofertas',{select:'id,Titulo_Es,Precio_base_UI,Moneda_base,Imagen_Portada,Categoria,Stock_Disponible',Activo:'eq.true',Seccion:'eq.'+p.Seccion,order:'id.desc',limit:'12'})
      .then(function(rows){
        var box=$('related-grid');box.replaceChildren();
        rows.filter(function(item){return String(item.id)!==String(p.id);}).slice(0,4).forEach(function(item){
          var card=node('a','related-card');card.href='p.html?id='+encodeURIComponent(String(item.id));
          var media=node('span','related-media');var image=Number(item.id)===44?'':safeImage(item.Imagen_Portada);
          if(image){var img=node('img');img.src=image;img.alt='';img.loading='lazy';img.onerror=function(){img.replaceWith(node('span','related-fallback','✳'));};media.append(img);}
          else media.append(node('span','related-fallback','✳'));
          var body=node('span','related-content');body.append(node('span','related-category',item.Categoria||'CumaShop'),node('strong','',item.Titulo_Es||'Producto'));
          var price=item.Precio_base_UI!=null&&Number(item.Precio_base_UI)>0?money(item.Precio_base_UI,item.Moneda_base):'Consultar precio';
          body.append(node('span','related-price',price));if(item.Stock_Disponible===false)body.append(node('span','related-unavailable','Sin stock'));
          card.append(media,body);box.append(card);
        });
        $('related').hidden=!box.children.length;
      }).catch(function(){$('related').hidden=true;});
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
