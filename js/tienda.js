/* Catálogo público de CumaShop: solo usa la clave pública y las políticas RLS de Supabase. */
(function () {
  'use strict';
  var SUPABASE = 'https://tmvqkpkbxagxxgmgqcpl.supabase.co';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtdnFrcGtieGFneHhnbWdxY3BsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE0ODYwNTcsImV4cCI6MjAzNzA2MjA1N30.Zx5G8Vnmy4ZW2dCKi8ScmcNa40KSqmWL4sEzZoMqwLM';
  var sections = [
    {name:'Alimentos',db:'Alimentos',slug:'alimentos',icon:'✳',description:'Frescos, básicos y antojos de cada día'},
    {name:'Muebles y decoración',db:'Muebles y decoración',slug:'muebles',icon:'⌂',description:'Ideas para sentirte en casa'},
    {name:'Aseo y limpieza',db:'Aseo y limpieza',slug:'aseo',icon:'✦',description:'Cuida tu hogar y tu rutina'},
    {name:'Eléctricos',db:'Electrónicos',slug:'electricos',icon:'⌁',description:'Tecnología y equipos para tu día'},
    {name:'Moda',db:'Moda',slug:'moda',icon:'✧',description:'Descubre tu próximo favorito'},
    {name:'Materiales de construcción',db:'Construcción',slug:'construccion',icon:'▥',description:'Materiales para tus proyectos'}
  ];
  var params = new URLSearchParams(location.search);
  var categories = [], offers = [], section = sections.find(function(s){return s.slug===params.get('seccion');}) || sections[0];
  var category = params.get('categoria') || '', subcategory = params.get('sub') || '', subcategory3 = params.get('sub3') || '';
  var search = (params.get('q') || '').trim().slice(0,100), visible = 12, loaded = false, requestId = 0;
  var sort = ['recent','price-low','price-high','name'].includes(params.get('orden')) ? params.get('orden') : 'recent';
  var $ = function (id) { return document.getElementById(id); };
  $('search-input').value=search;
  $('sort-select').value=sort;
  function node(tag, className, value) { var el=document.createElement(tag); if(className) el.className=className; if(value != null) el.textContent=value; return el; }
  function normalize(s) { return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es'); }
  function syncUrl() {
    var url = new URL(location.href);
    ['seccion','categoria','sub','sub3','q','orden'].forEach(function(key){url.searchParams.delete(key);});
    if(search) url.searchParams.set('q',search);
    else {if(section!==sections[0]) url.searchParams.set('seccion',section.slug);if(category) url.searchParams.set('categoria',category);if(subcategory)url.searchParams.set('sub',subcategory);if(subcategory3)url.searchParams.set('sub3',subcategory3);}
    if(sort!=='recent')url.searchParams.set('orden',sort);
    history.replaceState(null,'',url.pathname+url.search+url.hash);
  }
  function api(path, params) {
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 12000);
    return fetch(SUPABASE + '/rest/v1/' + path + '?' + new URLSearchParams(params), {
      headers:{apikey:ANON,Authorization:'Bearer '+ANON},signal:controller.signal
    }).then(function (response) { if (!response.ok) throw new Error('Catálogo no disponible'); return response.json(); })
      .finally(function () { clearTimeout(timeout); });
  }
  function loadOffers(offset, collected) {
    return api('Ofertas',{select:'id,Titulo_Es,Precio_base_UI,Precio_Min,Precio_Max,Moneda_base,Imagen_Portada,Seccion,Categoria,Categoria2,Categoria3,Stock_Disponible,EnOferta,PorcentajeDescuento,Unidad_de_Medidas,Cantidad_por_Unidad,Pais',Activo:'eq.true',order:'id.desc',limit:'200',offset:String(offset)})
      .then(function (rows) { collected.push.apply(collected, rows); return rows.length === 200 ? loadOffers(offset + 200, collected) : collected; });
  }
  function chooseSection(item) {
    section=item; category='';subcategory='';subcategory3='';search=''; $('search-input').value=''; visible=12; syncUrl(); render();
    $('catalogo').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  }
  function renderSections() {
    var box=$('departments');box.replaceChildren();
    sections.forEach(function (item, i) {
      var count=offers.filter(function(p){return p.Seccion===item.db;}).length;
      var button=node('button','department');button.type='button';button.setAttribute('aria-pressed',String(!search && section===item));
      var top=node('span','department-top');top.append(node('span','',String(i+1).padStart(2,'0')+' / 06'),node('span','department-icon',item.icon));
      var bottom=node('span','department-bottom');bottom.append(node('span','department-name',item.name),node('span','department-arrow','↗'));
      var status=node('span','department-count',!loaded?'Cargando…':count===0?'Próximamente':count===1?'1 producto':count+' productos');
      button.append(top,bottom,status);button.addEventListener('click',function(){chooseSection(item);});box.append(button);
    });
  }
  function renderCategories() {
    var box=$('categories');box.replaceChildren();
    var items=categories.filter(function(c){return c.Seccion===section.db && c.Categoria;});
    var seen=new Set();items=items.filter(function(c){if(seen.has(c.Categoria)) return false;seen.add(c.Categoria);return true;});
    if(category && !seen.has(category)){category='';subcategory='';subcategory3='';}
    function addButton(parent,label,value) {
      var button=node('button','category');button.type='button';button.setAttribute('aria-pressed',String(category===value));
      var count=value?offers.filter(function(p){return p.Seccion===section.db && p.Categoria===value;}).length:offers.filter(function(p){return p.Seccion===section.db;}).length;
      button.append(node('span','',label));if(count)button.append(node('span','category-count',String(count)));
      if(value && !count)button.classList.add('is-empty');
      button.addEventListener('click',function(){category=value;subcategory='';subcategory3='';visible=12;syncUrl();renderCategories();renderResults();});parent.append(button);
    }
    addButton(box,'Todas','');
    var groups=new Map();items.forEach(function(item){var key=item.Grupo || '';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(item);});
    groups.forEach(function(group,name){
      var wrap=node('div','category-group');if(name)wrap.append(node('span','category-group-title',name));
      var choices=node('div','category-choices');group.forEach(function(item){addButton(choices,item.Categoria,item.Categoria);});wrap.append(choices);box.append(wrap);
    });
    $('category-wrap').hidden=!loaded || !!search || !items.length;
    renderSubcategories();
  }
  function renderSubcategories(){
    [['Categoria2','subcategory','subcategory-wrap','subcategories','Todas las subcategorías'],['Categoria3','subcategory3','subcategory3-wrap','subcategories3','Todos los tipos']].forEach(function(level){
      var field=level[0],current=level[1]==='subcategory'?subcategory:subcategory3;
      var scope=offers.filter(function(p){return p.Seccion===section.db && p.Categoria===category && (field==='Categoria2'||!subcategory||p.Categoria2===subcategory);});
      var options=[...new Set(scope.map(function(p){return p[field];}).filter(Boolean))];
      var box=$(level[3]);box.replaceChildren();
      if(!category||!options.length||search){$(level[2]).hidden=true;return;}
      if(current&&!options.includes(current)){if(field==='Categoria2'){subcategory='';subcategory3='';}else subcategory3='';current='';}
      var all=[''].concat(options);
      all.forEach(function(value){
        var count=value?scope.filter(function(p){return p[field]===value;}).length:scope.length;
        var button=node('button','category',value||level[4]);button.type='button';button.setAttribute('aria-pressed',String(current===value));
        if(count)button.append(node('span','category-count',String(count)));
        button.addEventListener('click',function(){if(field==='Categoria2'){subcategory=value;subcategory3='';}else subcategory3=value;visible=12;syncUrl();renderSubcategories();renderResults();});box.append(button);
      });
      $(level[2]).hidden=false;
    });
  }
  function safeImage(source){try{var url=new URL(source);return url.protocol==='https:'?url.href:'';}catch(_){return '';}}
  function productCard(p){
    var card=node('article','product-card');var link=node('a','product-card-link');link.href='p.html?id='+encodeURIComponent(String(p.id));link.setAttribute('aria-label','Ver detalles de '+(p.Titulo_Es || 'producto'));
    var media=node('div','product-media');var fallback=node('span','product-fallback',sections.find(function(s){return s.db===p.Seccion;})?.icon || '✳');fallback.setAttribute('aria-hidden','true');
    // Oferta 44: la imagen guardada es un portátil aunque el producto sea una piña.
    var image=Number(p.id)===44?'':safeImage(p.Imagen_Portada);
    if(image){var img=node('img');img.src=image;img.alt='';img.loading='lazy';img.decoding='async';img.addEventListener('error',function(){img.replaceWith(fallback);});media.append(img);}else media.append(fallback);
    if(p.Stock_Disponible===false)media.append(node('span','product-badge is-unavailable','Sin stock'));
    else if(p.EnOferta===true){
      var reduction=Number(p.PorcentajeDescuento);
      media.append(node('span','product-badge',reduction>0&&reduction<100?'-'+reduction+'%':'Oferta'));
    }
    var body=node('div','product-body');body.append(node('span','product-category',p.Categoria || p.Seccion),node('h3','',p.Titulo_Es || 'Producto'));
    var price=node('p','product-price');
    if(p.Precio_base_UI!=null && Number.isFinite(Number(p.Precio_base_UI)) && Number(p.Precio_base_UI)>0){
      price.append(node('span','',new Intl.NumberFormat('es-CU',{maximumFractionDigits:2}).format(Number(p.Precio_base_UI))+' '+(p.Moneda_base || 'CUP')));
      price.append(node('small','','Precio orientativo · confirma en la app'));
    }else price.append(node('span','','Consultar precio en la app'));
    if(p.Unidad_de_Medidas && p.Cantidad_por_Unidad)body.append(node('span','product-unit',Number(p.Cantidad_por_Unidad)+' '+p.Unidad_de_Medidas));
    body.append(price,node('span','product-link','Ver detalles ↗'));link.append(media,body);card.append(link);return card;
  }
  function renderFeatured(){
    var picks=sections.map(function(s){return offers.find(function(p){return p.Seccion===s.db && p.Stock_Disponible!==false;});}).filter(Boolean).slice(0,3);
    var box=$('featured-grid');box.replaceChildren();picks.forEach(function(p){box.append(productCard(p));});
    $('destacados').hidden=!picks.length;
  }
  function renderResults(){
    if(!loaded)return;
    var q=normalize(search);
    var rows=offers.filter(function(p){return (q?normalize((p.Titulo_Es||'')+' '+(p.Categoria||'')+' '+(p.Categoria2||'')+' '+(p.Categoria3||'')+' '+(p.Seccion||'')).includes(q):p.Seccion===section.db && (!category || p.Categoria===category) && (!subcategory||p.Categoria2===subcategory) && (!subcategory3||p.Categoria3===subcategory3));});
    if(sort==='price-low'||sort==='price-high')rows.sort(function(a,b){
      var av=Number(a.Precio_base_UI),bv=Number(b.Precio_base_UI),aMissing=a.Precio_base_UI==null||!Number.isFinite(av),bMissing=b.Precio_base_UI==null||!Number.isFinite(bv);
      if(aMissing!==bMissing)return aMissing?1:-1;
      return sort==='price-low'?av-bv:bv-av;
    });
    else if(sort==='name')rows.sort(function(a,b){return String(a.Titulo_Es||'').localeCompare(String(b.Titulo_Es||''),'es');});
    var box=$('products');box.replaceChildren();rows.slice(0,visible).forEach(function(p){box.append(productCard(p));});
    $('results-line').textContent=rows.length===1?'1 producto para explorar':rows.length+' productos para explorar';
    $('empty').hidden=!!rows.length;$('more').hidden=rows.length<=visible;
    if(!rows.length){
      var anyHere=offers.some(function(p){return p.Seccion===section.db;});
      $('empty-title').textContent=q?'No encontramos productos para «'+search+'»':category?'Todavía no hay ofertas en '+category:'Próximamente en '+section.name;
      $('empty-text').textContent=q?'Prueba otra palabra o navega por las secciones.':category?'Explora otra categoría de '+section.name+'.':'Esta sección ya tiene sus categorías listas. Las ofertas aparecerán cuando se publiquen en CumaShop.';
      var firstAvailable=sections.find(function(s){return offers.some(function(p){return p.Seccion===s.db;});});
      $('empty-reset').textContent=q?'Limpiar búsqueda ↗':anyHere?'Ver toda la sección ↗':firstAvailable?'Explorar '+firstAvailable.name+' ↗':'Volver a la tienda ↗';
    }
  }
  function render(){
    $('current-title').textContent=search?'Resultados de búsqueda':section.name;
    $('current-subtitle').textContent=search?'Buscando «'+search+'» en todas las secciones':section.description;
    $('search-scope').textContent=search?'Búsqueda en todas las secciones':'Busca en todas las secciones';
    renderSections();renderCategories();renderResults();
  }
  function load(){
    var current=++requestId;loaded=false;$('retry').disabled=true;$('error').hidden=true;$('empty').hidden=true;$('more').hidden=true;$('products').replaceChildren();$('results-line').textContent='Cargando ofertas…';
    Promise.all([
      api('Categorias_de_seccion',{select:'Seccion,Categoria,Grupo,Orden',Activo:'eq.true',order:'Orden.asc',limit:'200'}),
      loadOffers(0,[])
    ]).then(function(data){
      if(current!==requestId)return;
      categories=data[0];offers=data[1].filter(function(p){return sections.some(function(s){return s.db===p.Seccion;});});loaded=true;
      $('catalog-summary').textContent=offers.length+' ofertas activas en '+sections.filter(function(s){return offers.some(function(p){return p.Seccion===s.db;});}).length+' secciones';
      renderFeatured();
      render();
    }).catch(function(){if(current!==requestId)return;$('results-line').textContent='';$('products').replaceChildren();$('empty').hidden=true;$('more').hidden=true;$('error').hidden=false;})
      .finally(function(){if(current===requestId)$('retry').disabled=false;});
  }
  function updateSearch(){search=$('search-input').value.trim().slice(0,100);category='';subcategory='';subcategory3='';visible=12;syncUrl();render();}
  $('search-form').addEventListener('submit',function(e){e.preventDefault();updateSearch();});
  $('search-input').addEventListener('input',updateSearch);
  $('sort-select').addEventListener('change',function(){sort=this.value;visible=12;syncUrl();renderResults();});
  $('empty-reset').addEventListener('click',function(){
    if(search){search='';$('search-input').value='';}
    else if(!offers.some(function(p){return p.Seccion===section.db;}))section=sections.find(function(s){return offers.some(function(p){return p.Seccion===s.db;});}) || sections[0];
    category='';subcategory='';subcategory3='';visible=12;syncUrl();render();
  });
  $('retry').addEventListener('click',load);
  $('more').addEventListener('click',function(){visible+=12;renderResults();});
  renderSections();load();
}());
