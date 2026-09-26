/* Catálogo público de CumaShop. La clave es publicable; la seguridad depende de RLS en Supabase. */
(function () {
  'use strict';
  var SUPABASE = 'https://tmvqkpkbxagxxgmgqcpl.supabase.co';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtdnFrcGtieGFneHhnbWdxY3BsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE0ODYwNTcsImV4cCI6MjAzNzA2MjA1N30.Zx5G8Vnmy4ZW2dCKi8ScmcNa40KSqmWL4sEzZoMqwLM';
  var sections = [
    {name:'Alimentos',db:'Alimentos',icon:'✳',description:'Frescos, básicos y antojos de cada día'},
    {name:'Muebles y decoración',db:'Muebles y decoración',icon:'⌂',description:'Ideas para sentirte en casa'},
    {name:'Aseo y limpieza',db:'Aseo y limpieza',icon:'✦',description:'Cuida tu hogar y tu rutina'},
    {name:'Eléctricos',db:'Electrónicos',icon:'⌁',description:'Tecnología y equipos para tu día'},
    {name:'Moda',db:'Moda',icon:'✧',description:'Descubre tu próximo favorito'},
    {name:'Materiales de construcción',db:'Construcción',icon:'▥',description:'Materiales para tus proyectos'}
  ];
  var categories = [], offers = [], section = sections[0], category = '', search = '', visible = 12;
  var $ = function (id) { return document.getElementById(id); };
  var playUrl = 'https://play.google.com/store/apps/details?id=com.ledexsoft.oneblink';
  function node(tag, className, value) { var el=document.createElement(tag); if(className) el.className=className; if(value != null) el.textContent=value; return el; }
  function normalize(s) { return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es'); }
  function isDemo(p) { return /\b(simulad[oa]s?|demos?|pruebas?|tests?)\b/i.test(p.Titulo_Es || ''); }
  function api(path, params) {
    var query = new URLSearchParams(params);
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 12000);
    return fetch(SUPABASE + '/rest/v1/' + path + '?' + query.toString(), {
      headers:{apikey:ANON,Authorization:'Bearer '+ANON},signal:controller.signal
    }).then(function (response) { if (!response.ok) throw new Error('Catálogo no disponible'); return response.json(); })
      .finally(function () { clearTimeout(timeout); });
  }
  function loadOffers(offset, collected) {
    return api('Ofertas',{select:'id,Titulo_Es,Precio_base_UI,Moneda_base,Imagen_Portada,Seccion,Categoria',Activo:'eq.true',Stock_Disponible:'eq.true',Pais:'eq.Cuba',order:'id.desc',limit:'200',offset:String(offset)})
      .then(function (rows) { collected.push.apply(collected, rows); return rows.length === 200 ? loadOffers(offset + 200, collected) : collected; });
  }
  function renderSections() {
    var box = $('departments'); box.replaceChildren();
    sections.forEach(function (item, i) {
      var button=node('button','department'); button.type='button'; button.setAttribute('aria-pressed',String(section===item));
      var top=node('span','department-top'); top.append(node('span','',String(i+1).padStart(2,'0')+' / 06'),node('span','department-icon',item.icon));
      var bottom=node('span','department-bottom'); bottom.append(node('span','department-name',item.name),node('span','department-arrow','↗'));
      button.append(top,bottom); button.addEventListener('click',function () { section=item; category=''; visible=12; render(); $('catalogo').scrollIntoView({behavior:'smooth'}); }); box.append(button);
    });
  }
  function renderCategories() {
    var box=$('categories'); box.replaceChildren();
    var items=categories.filter(function (c) { return c.Seccion === section.db && c.Categoria; });
    var seen=new Set(); items=items.filter(function (c) { if(seen.has(c.Categoria)) return false; seen.add(c.Categoria); return true; });
    var all=[{Categoria:'Todas'}].concat(items);
    all.forEach(function (item) {
      var value=item.Categoria === 'Todas' ? '' : item.Categoria;
      var button=node('button','category',item.Categoria); button.type='button'; button.setAttribute('aria-pressed',String(category===value));
      button.addEventListener('click',function () { category=value; visible=12; renderResults(); renderCategories(); });box.append(button);
    });
    $('category-wrap').hidden=!items.length;
  }
  function safeImage(source) { try { var url=new URL(source); return url.protocol==='https:' ? url.href : ''; } catch (_) { return ''; } }
  function productCard(p) {
    var card=node('article','product-card'); var media=node('div','product-media'); var fallback=node('span','product-fallback','✳');
    var image=safeImage(p.Imagen_Portada);
    if(image){var img=node('img');img.src=image;img.alt=p.Titulo_Es || 'Producto CumaShop';img.loading='lazy';img.decoding='async';img.addEventListener('error',function(){img.replaceWith(fallback);});media.append(img);}else{media.append(fallback);}
    var body=node('div','product-body');body.append(node('span','product-category',p.Categoria || section.name),node('h3','',p.Titulo_Es || 'Producto'));
    var price=node('p','product-price');
    if(Number.isFinite(Number(p.Precio_base_UI)) && p.Precio_base_UI != null){
      price.append(node('span','',new Intl.NumberFormat('es-CU',{maximumFractionDigits:2}).format(Number(p.Precio_base_UI))+' '+(p.Moneda_base || 'CUP')));
      price.append(node('small','','Precio de referencia · confirma en la app'));
    }else{price.append(node('span','','Consultar precio en la app'));}
    body.append(price);
    var link=node('a','product-link','Ver detalles y abrir en la app ↗');link.href='p.html?id='+encodeURIComponent(String(p.id));link.setAttribute('aria-label','Ver '+(p.Titulo_Es || 'producto')+' en CumaShop');body.append(link);card.append(media,body);return card;
  }
  function renderResults() {
    var q=normalize(search);
    var rows=offers.filter(function(p){return p.Seccion===section.db && (!category || p.Categoria===category) && (!q || normalize(p.Titulo_Es+' '+(p.Categoria||'')).includes(q));});
    var box=$('products');box.replaceChildren();rows.slice(0,visible).forEach(function(p){box.append(productCard(p));});
    $('results-line').textContent=rows.length===1?'1 producto para explorar':rows.length+' productos para explorar';
    $('empty').hidden=!!rows.length;
    $('more').hidden=rows.length<=visible;
    if(!rows.length){
      $('empty-title').textContent=q?'No encontramos resultados':category?'Aún no hay ofertas en '+category:'Próximamente en '+section.name;
      $('empty-text').textContent=q?'Prueba otra búsqueda o explora las categorías de esta sección.':'Las categorías ya están listas. Las ofertas aparecerán aquí cuando se publiquen en CumaShop.';
      $('empty-reset').textContent=q?'Limpiar búsqueda ↗':'Ver todas las categorías ↗';
    }
  }
  function render() {
    $('current-title').textContent=section.name;$('current-subtitle').textContent=section.description;
    renderSections();renderCategories();renderResults();
  }
  function load() {
    $('error').hidden=true;$('empty').hidden=true;$('results-line').textContent='Cargando ofertas…';
    Promise.all([
      api('Categorias_de_seccion',{select:'Seccion,Categoria,Grupo,Orden',Activo:'eq.true',order:'Orden.asc',limit:'200'}),
      loadOffers(0,[])
    ]).then(function(data){
      categories=data[0];offers=data[1].filter(function(p){return !isDemo(p);});
      render();
    }).catch(function(){ $('results-line').textContent='';$('products').replaceChildren();$('empty').hidden=true;$('more').hidden=true;$('error').hidden=false; });
  }
  $('search-form').addEventListener('submit',function(e){e.preventDefault();search=$('search-input').value.trim();visible=12;renderResults();});
  $('search-input').addEventListener('input',function(){search=this.value.trim();visible=12;renderResults();});
  $('empty-reset').addEventListener('click',function(){category='';search='';visible=12;$('search-input').value='';renderCategories();renderResults();});
  $('retry').addEventListener('click',load);
  $('more').addEventListener('click',function(){visible+=12;renderResults();});
  renderSections();load();
}());
