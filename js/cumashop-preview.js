/* CumaShop phone preview: live Cuba catalog and OneBlink-style routes. */
(() => {
  'use strict';

  const config = window.CumaShopConfig;
  if (!config) return;

  const $ = (id) => document.getElementById(id);
  const main = $('appMain');
  const homeTitle = $('homeTitle');
  const homeDate = $('homeDate');
  const homeCollections = $('homeCollections');
  const searchSearch = $('searchSearch');
  const searchGrid = $('searchGrid');
  const productDialog = $('productDialog');
  const cartDialog = $('cartDialog');
  const cartCount = $('cartCount');
  const toast = $('toast');
  const announcement = $('appAnnouncement');
  const storageKey = 'cumashop-preview-state-v2';
  const ASSET = 'images/cumashop-app/';
  const PAGE_SIZE = 20;
  const OFFER_FIELDS = [
    'id', 'Titulo_Es', 'Descripcion_Es', 'Precio_base_UI', 'Precio_Min', 'Precio_Max',
    'Moneda_base', 'Imagen_Portada', 'Seccion', 'Categoria', 'Categoria2', 'Categoria3',
    'Stock_Disponible', 'EnOferta', 'PorcentajeDescuento', 'Unidad_de_Medidas',
    'Cantidad_por_Unidad', 'Pais', 'Ventas'
  ].join(',');
  const sections = [
    {name:'Alimentos', db:'Alimentos', slug:'alimentos', tag:'ALIMENTOS SELECTOS', title:'Alimentos\nselectos', subtitle:'Frescos, básicos y antojos de cada día.', image:'alimentos.webp', accent:'#f4b400', icon:'✳'},
    {name:'Muebles y decoración', db:'Muebles y decoración', slug:'muebles', tag:'MUEBLES Y DECORACIÓN', title:'Mobiliario y\ndecoración', subtitle:'Ideas para sentirte en casa.', image:'muebles.webp', accent:'#8b5cf6', icon:'⌂'},
    {name:'Aseo y limpieza', db:'Aseo y limpieza', slug:'aseo', tag:'ASEO Y LIMPIEZA', title:'Aseo y\nlimpieza', subtitle:'Cuida tu hogar y tu rutina.', image:'aseo.webp', accent:'#00a86b', icon:'✦'},
    {name:'Eléctricos', db:'Electrónicos', slug:'electronicos', tag:'ELECTRÓNICOS', title:'Electrónicos\navanzados', subtitle:'Tecnología y equipos para tu día.', image:'electronicos.webp', accent:'#0d6efd', icon:'⌁'},
    {name:'Moda', db:'Moda', slug:'moda', tag:'MODA Y TENDENCIAS', title:'Moda y\ntendencias', subtitle:'Descubre tu próximo favorito.', image:'moda.webp', accent:'#d63384', icon:'✧'},
    {name:'Materiales de construcción', db:'Construcción', slug:'construccion', tag:'CONSTRUCCIÓN', title:'Materiales de\nconstrucción', subtitle:'Acabados y materiales para tus proyectos.', image:'construccion.webp', accent:'#185abc', icon:'▥'},
    {name:'Herramientas', db:'Herramientas', slug:'herramientas', tag:'ÚTILES DE TRABAJO', title:'Herramientas\nprofesionales', subtitle:'Equipos para el trabajo diario.', image:'herramientas.webp', accent:'#e67e22', icon:'⚒'},
    {name:'Transporte', db:'Transporte', slug:'transporte', tag:'TRANSPORTE', title:'Transporte y\nvehículos', subtitle:'Opciones para moverte y trabajar.', image:'transporte.webp', accent:'#dc3545', icon:'↗'},
    {name:'Casas y Propiedades', db:null, slug:'propiedades', tag:'PROPIEDADES', title:'Casas y\npropiedades', subtitle:'Explora opciones en tu localidad.', image:'casas.webp', accent:'#6c757d', icon:'⌂', property:true}
  ];
  const bannerStoreNames = {
    'Muebles y decoración':'Muebles',
    'Aseo y limpieza':'Aceo',
    Herramientas:'Útiles de trabajo'
  };
  const fallbackBannerMap = {
    Alimentos:'alimentos', 'Muebles y decoración':'muebles', 'Aseo y limpieza':'aseo',
    Electrónicos:'electronicos', Moda:'moda', Construcción:'construccion',
    Herramientas:'herramientas', Transporte:'transporte'
  };
  const towns = [
    'Todas','Cumanayagua','Barajagua','Arimao','Breñas','Brisas','Cafetal','Camilo Cienfuegos',
    'Crespo','Crucecitas','Cuatro Vientos','El Mamey','El Naranjo','El Nicho','El Sopapo',
    'Entronque de Minas','Guaos','La Cidra','La Parra','La Sierra','La Sierrita','Las Moscas',
    'Mayarí','Nuevo Arimao','Rafaelito','San Blas','San Juan','Seibabo','Vega Vieja','Vila',
    'Yaguanabo Arriba','Yaguanabo Playa'
  ];
  const propertyCategories = [
    {name:'Casas en venta', image:'casas_venta.jpg'}, {name:'Hostales', image:'hostales.jpg'},
    {name:'Espacios de eventos', image:'eventos.jpg'}, {name:'Apartamentos', image:'apartamentos.jpg'},
    {name:'Terrenos', image:'terrenos.jpg'}, {name:'Locales comerciales', image:'locales_comerciales.jpg'}
  ];
  const propertyBanners = [
    {title:'Encuentra tu próximo hogar', subtitle:'Casas y espacios para vivir en Cumanayagua.', image:'banner_viviendas.jpg'},
    {title:'Hospedaje local', subtitle:'Conoce hostales y espacios para recibir visitas.', image:'banner_hostales.jpg'},
    {title:'Celebra cerca de casa', subtitle:'Espacios para reuniones y eventos.', image:'banner_eventos.jpg'}
  ];
  const categoryAssets = {
    'alimentos|ofertas variadas':'surtidos.webp','alimentos|frutas':'frutas.jpg','alimentos|hortalizas':'hortalizas.jpg',
    'alimentos|carnes':'carnes.jpg','alimentos|huevos y lacteos':'huevos_lacteos.jpg','alimentos|bebidas':'bebidas.jpg',
    'alimentos|granos':'granos.jpg','alimentos|condimentos':'condimentos.jpg','alimentos|pastas':'pastas.jpg',
    'alimentos|dulces':'dulces.jpg','alimentos|grasas y salsas':'grasas_y_salsas.jpg',
    'construccion|encofrados':'encofrados.jpg','construccion|bloques y ladrillos':'bloques_ladrillos.jpg',
    'construccion|aridos':'aridos.jpg','construccion|cemento':'cemento.jpg','construccion|cabillas y acero':'cabillas_acero.jpg','construccion|pinturas':'pinturas.webp',
    'aseo y limpieza|insecticidas y repelentes':'insecticidas.jpg','aseo y limpieza|aromatizantes y ambientadores':'aromatizantes.webp',
    'aseo y limpieza|utiles de limpieza':'utiles_limpieza.jpg','aseo y limpieza|basura y reciclaje':'basura_reciclaje.jpg',
    'aseo y limpieza|higiene corporal':'higiene_corporal.jpg','aseo y limpieza|higiene dental':'higiene_dental.png',
    'aseo y limpieza|accesorios y toallas':'accesorios_toallas.jpg','aseo y limpieza|perfumes y fragancias':'perfumes_fragancias.jpg',
    'aseo y limpieza|cuidado de la piel':'cuidado_piel.jpg','aseo y limpieza|productos de papel':'productos_papel.jpg',
    'aseo y limpieza|depilacion':'depilacion.jpg','aseo y limpieza|cuidado del cabello':'cuidado_cabello.jpg',
    'aseo y limpieza|detergentes y desinfectantes':'detergentes_desinfectantes.webp',
    'transporte|bicicletas':'bicicletas.jpg','transporte|autos ligeros':'autos_ligeros.jpg','transporte|accesorios':'accesorios.jpg',
    'transporte|motos':'motos.jpg','transporte|repuestos':'repuestos.jpg','transporte|camiones':'camiones.jpg',
    'transporte|llantas y neumaticos':'llantas_neumaticos.jpg','transporte|triciclos electricos':'triciclos_electricos.jpg','transporte|baterias':'baterias.jpg',
    'muebles y decoracion|salas y living':'salas_y_living.webp','muebles y decoracion|comedores':'comedores.webp',
    'muebles y decoracion|dormitorios':'dormitorios.webp','muebles y decoracion|colchones y descanso':'colchones_descanso.webp',
    'muebles y decoracion|almacenamiento':'almacenamiento_muebles.webp','muebles y decoracion|oficina y estudio':'oficina_estudio.webp',
    'muebles y decoracion|exterior y jardin':'exterior_jardin.webp','muebles y decoracion|cocina':'cocina_muebles.webp',
    'muebles y decoracion|iluminacion':'iluminacion.webp','muebles y decoracion|textiles':'textiles.webp',
    'muebles y decoracion|plantas y macetas':'plantas_macetas.webp','muebles y decoracion|pared':'pared.webp',
    'muebles y decoracion|organizacion':'organizacion.webp','muebles y decoracion|bano':'bano_muebles.webp',
    'muebles y decoracion|accesorios':'accesorios_muebles.webp',
    'herramientas|herramientas de construccion':'herramientas_construccion_square.jpg',
    'herramientas|belleza profesional':'belleza_profesional_square.jpg','herramientas|escuela y oficina':'escuela_oficina_square.jpg','herramientas|agricultura':'agricultura_square.jpg',
    'moda|ropa para ninos':'ropa_ninos.jpg','moda|joyeria':'joyeria.jpg','moda|calzado':'calzado.jpg','moda|relojes':'relojes.webp',
    'moda|vestidos':'vestidos.jpg','moda|pulovers':'pulovers.jpg','moda|blusas':'blusas.jpg','moda|camisas largas':'camisas_largas.jpg',
    'moda|pantalones':'pantalones.jpg','moda|abrigos':'abrigos.jpg','moda|bolsos':'bolsos.jpg','moda|paraguas':'paraguas.jpg',
    'moda|ropa interior':'ropa_interior.jpg','moda|sayas':'sayas.jpg','moda|shorts':'shorts.jpg','moda|maquillaje':'maquillaje.jpg',
    'moda|gafas':'gafas.jpg','moda|conjuntos':'conjuntos.jpg',
    'electronicos|tablets':'tablets.webp','electronicos|computadoras':'computadoras.webp','electronicos|powerbank':'powerbank.webp',
    'electronicos|relojes':'relojes.webp','electronicos|accesorios de pc':'accesorios_pc.webp','electronicos|estaciones de carga':'estaciones_carga.webp',
    'electronicos|aspiradoras':'aspiradoras.webp','electronicos|hornos':'hornos.webp','electronicos|lavadoras':'lavadoras.webp',
    'electronicos|splits y aires':'splits_aires.jpg','electronicos|chapiadoras':'chapiadoras.webp','electronicos|batidoras':'batidoras.webp',
    'electronicos|cafeteras':'cafeteras.webp','electronicos|ventiladores':'ventiladores.webp','electronicos|ollas':'ollas.webp',
    'electronicos|almacenamiento':'almacenamiento.webp','electronicos|camaras':'camaras.webp','electronicos|neveras':'neveras.webp',
    'electronicos|tv, video y audio':'tv_audio_video.webp','electronicos|altavoces':'altavoces.webp','electronicos|impresoras':'impresoras.webp',
    'electronicos|videojuegos':'videojuegos.webp','electronicos|audifonos inalambricos':'audifonos_inalambricos.webp','electronicos|telefonos':'telefonos.webp'
  };

  function normalize(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('es');
  }
  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }
  function safeImage(value) {
    try { const url = new URL(String(value || '')); return url.protocol === 'https:' ? url.href : ''; }
    catch (_) { return ''; }
  }
  function money(value, currency) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return '';
    const formatted = new Intl.NumberFormat('es-ES', {maximumFractionDigits:2}).format(amount);
    return formatted + ' ' + (String(currency || 'CUP').trim().slice(0,8) || 'CUP');
  }
  function priceFor(product) {
    const currency = product.Moneda_base || 'CUP';
    const base = Number(product.Precio_base_UI);
    const min = Number(product.Precio_Min);
    const max = Number(product.Precio_Max);
    if (Number.isFinite(base) && base > 0) return {label:money(base,currency), currency, value:base};
    if (Number.isFinite(min) && min > 0 && Number.isFinite(max) && max > 0 && max !== min) {
      return {label:money(min,currency)+' – '+money(max,currency), currency, value:min};
    }
    if (Number.isFinite(min) && min > 0) return {label:money(min,currency), currency, value:min};
    if (Number.isFinite(max) && max > 0) return {label:money(max,currency), currency, value:max};
    return {label:'Consultar precio', currency, value:null};
  }

  const saved = (() => {
    try { const value = JSON.parse(sessionStorage.getItem(storageKey) || 'null'); return value && typeof value === 'object' ? value : {}; }
    catch (_) { return {}; }
  })();
  const state = {
    // Always open on the local home UI. Catalog requests begin only when a
    // user opens Search or a section, never as part of the initial iframe boot.
    view: 'home',
    category: typeof saved.category === 'string' ? saved.category : '',
    query: typeof saved.query === 'string' ? saved.query.slice(0,100) : '',
    cart: saved.cart && typeof saved.cart === 'object' ? saved.cart : {},
    orders: Array.isArray(saved.orders) ? saved.orders.slice(0,12) : []
  };
  let route = {type:'home'};
  let routeStack = [];
  let routeVersion = 0;
  let toastTimer = 0;
  let searchOffers = [];
  let searchLoaded = false;
  let searchLoading = false;
  let searchError = false;
  let sectionCache = new Map();
  let categoryProducts = [];
  let categoryOffset = 0;
  let categoryHasMore = false;
  let categoryLoadingMore = false;

  const dynamicView = document.createElement('section');
  dynamicView.id = 'dynamicRouteView';
  dynamicView.className = 'view route-view';
  dynamicView.hidden = true;
  dynamicView.setAttribute('aria-live','polite');
  main.append(dynamicView);

  async function api(table, params, signal) {
    const url = new URL(config.url + '/rest/v1/' + table);
    Object.entries(params).forEach(([key,value]) => url.searchParams.set(key,String(value)));
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(),25000);
    if(signal)signal.addEventListener('abort',()=>controller.abort(),{once:true});
    try {
      const response = await fetch(url, {
        method:'GET',
        headers:{apikey:config.anonKey, Authorization:'Bearer '+config.anonKey, Accept:'application/json'},
        signal:controller.signal
      });
      if (!response.ok) throw new Error('Catálogo no disponible ('+response.status+')');
      return await response.json();
    } finally { clearTimeout(timeout); }
  }
  function publicOfferParams(extra = {}) {
    return Object.assign({
      select:OFFER_FIELDS,
      Activo:'eq.true',
      Pais:'eq.Cuba',
      Stock_Disponible:'eq.true',
      order:'Ventas.desc,id.asc',
      limit:200
    },extra);
  }
  async function loadAllOffers(extra = {}, cap = 1000) {
    const all = [];
    for (let offset = 0; offset < cap; offset += 200) {
      const rows = await api('Ofertas',publicOfferParams({offset,...extra}));
      all.push(...rows);
      if (rows.length < 200) break;
    }
    return all;
  }
  async function loadCategories(section) {
    const fields = {select:'Categoria,Grupo,Descripcion,Orden',Seccion:'eq.'+section,Activo:'eq.true',Pais:'eq.Cuba',order:'Orden.asc',limit:200};
    let rows = await api('Categorias_de_seccion',fields);
    if (!rows.length) rows = await api('Categorias_de_seccion',{...fields,Pais:'is.null'});
    return rows.filter((row) => typeof row.Categoria === 'string' && row.Categoria.trim())
      .sort((a,b) => (Number(a.Orden)||0) - (Number(b.Orden)||0));
  }
  async function loadBanners(section) {
    const store = bannerStoreNames[section] || section;
    const fields = {select:'ImagenURL,Fecha_Fin,Tienda',Tienda:'eq.'+store,order:'id.asc',limit:20};
    let rows = await api('Publicidad_Banner',{...fields,Pais:'eq.Cuba'});
    if (!rows.length) rows = await api('Publicidad_Banner',{...fields,Pais:'is.null'});
    const now = Date.now();
    const valid = rows.map((row) => ({url:safeImage(row.ImagenURL),end:row.Fecha_Fin}))
      .filter((row) => row.url && !row.url.includes('images.template.net'))
      .filter((row) => { const end = Date.parse(row.end || ''); return !Number.isFinite(end) || end >= now; });
    if (valid.length) return valid;
    const slug = fallbackBannerMap[section];
    return slug ? [1,2,3,4].map((i) => ({url:ASSET+'banners/'+slug+'_'+i+(slug==='alimentos'||slug==='muebles'?'.webp':'.jpg')})) : [];
  }
  async function loadSectionData(sectionName, force) {
    const entry = sectionCache.get(sectionName);
    if (!force && entry && Date.now()-entry.loadedAt < 90000) return entry.data;
    const section = sections.find((item) => item.name === sectionName);
    if (!section || !section.db) throw new Error('Sección no disponible');
    const tasks = await Promise.allSettled([
      loadAllOffers({Seccion:'eq.'+section.db}),
      loadCategories(section.db),
      loadBanners(section.db)
    ]);
    const data = {
      offers:tasks[0].status==='fulfilled'?tasks[0].value:[],
      categories:tasks[1].status==='fulfilled'?tasks[1].value:[],
      banners:tasks[2].status==='fulfilled'?tasks[2].value:[],
      errors:tasks.map((result,index) => result.status==='rejected'?index:-1).filter((index) => index>=0)
    };
    if (!data.banners.length) {
      const slug = fallbackBannerMap[section.db];
      if (slug) data.banners = [1,2,3,4].map((i) => ({url:ASSET+'banners/'+slug+'_'+i+(slug==='alimentos'||slug==='muebles'?'.webp':'.jpg')}));
    }
    sectionCache.set(sectionName,{loadedAt:Date.now(),data});
    return data;
  }
  async function loadCategoryPage(section, category, offset) {
    const params = publicOfferParams({Seccion:'eq.'+section,Categoria:'eq.'+category,limit:PAGE_SIZE,offset});
    return api('Ofertas',params);
  }
  function saveState() {
    try { sessionStorage.setItem(storageKey,JSON.stringify(state)); } catch (_) {}
  }
  function safeText(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined && text !== null) element.textContent = String(text);
    return element;
  }
  function sectionFor(screen) { return sections.find((item) => item.name === screen.name); }
  function announce(message) { announcement.textContent = message; }
  function sendToHost(type,payload) {
    if (window.parent !== window) window.parent.postMessage({type,payload},location.origin==='null'?'*':location.origin);
  }
  function cartEntries() {
    const known = new Map(searchOffers.map((item) => [String(item.id),item]));
    sectionCache.forEach(({data}) => data.offers.forEach((item) => known.set(String(item.id),item)));
    return Object.entries(state.cart).map(([id,quantity]) => ({product:known.get(id),quantity:Number(quantity)||0}))
      .filter((item) => item.product && item.quantity > 0);
  }
  function cartQuantity() { return cartEntries().reduce((sum,item) => sum+item.quantity,0); }
  function cartTotal() { return cartEntries().reduce((sum,item) => sum+(priceFor(item.product).value||0)*item.quantity,0); }
  function cardPrice(product) { return priceFor(product).label; }
  function productImage(product) { return safeImage(product.Imagen_Portada); }

  function renderHome() {
    const hour = new Date().getHours();
    homeTitle.textContent = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
    homeDate.textContent = new Intl.DateTimeFormat('es-ES',{weekday:'long',day:'numeric',month:'long'}).format(new Date());
    homeCollections.replaceChildren();
    sections.forEach((item,index) => {
      const button = safeText('button','home-collection');
      button.type = 'button';
      button.dataset.collection = String(index);
      button.style.setProperty('--accent',item.accent);
      button.setAttribute('aria-label','Explorar '+item.name);
      const image = document.createElement('img');
      image.className='collection-background'; image.src='images/cumashop-home/'+item.image;
      image.alt=''; image.loading=index<2?'eager':'lazy';
      const copy=safeText('span','collection-copy');
      copy.append(safeText('span','collection-tag',item.tag),safeText('strong','collection-title',item.title),safeText('span','collection-subtitle',item.subtitle));
      const footer=safeText('span','collection-footer');
      const icon=safeText('span','collection-icon',item.icon); icon.setAttribute('aria-hidden','true');
      const footerCopy=safeText('span','collection-footer-copy');
      footerCopy.append(safeText('strong','',item.name),safeText('small','',item.property?'Propiedades':'Explorar sección'));
      footer.append(icon,footerCopy); button.append(image,copy,footer); homeCollections.append(button);
    });
  }

  function staticView(type) {
    document.querySelectorAll('.view[data-view]').forEach((view) => { view.hidden = view.dataset.view !== type; });
    dynamicView.hidden = true;
    document.querySelectorAll('[data-nav]').forEach((button) => button.setAttribute('aria-current',String(button.dataset.nav===type)));
    if (type === 'home') renderHome();
    if (type === 'search') renderSearch();
    if (type === 'orders') renderOrders();
    if (type === 'profile') renderProfile();
    main.scrollTop=0;
  }
  function updateHeader() {
    const quantity=cartQuantity();
    cartCount.hidden=quantity===0; cartCount.textContent=quantity>99?'99+':String(quantity);
    $('openCart').setAttribute('aria-label',quantity?'Abrir carrito, '+quantity+' productos':'Abrir carrito, vacío');
  }
  function renderScreen() {
    routeVersion++;
    if (route.type === 'static') {
      state.view=route.view;
      staticView(route.view);
      if (route.view === 'search') ensureSearchLoaded();
    } else {
      document.querySelectorAll('.view[data-view]').forEach((view) => { view.hidden=true; });
      dynamicView.hidden=false;
      document.querySelectorAll('[data-nav]').forEach((button) => button.setAttribute('aria-current','false'));
      main.scrollTop=0;
      loadRoute(route,routeVersion);
    }
    updateHeader(); saveState();
    sendToHost('cumashop:state',{view:route.type==='static'?route.view:route.type,viewLabel:route.type==='static'?route.view:'CumaShop',cartCount:cartQuantity(),action:'view'});
  }
  function navigate(next,replace) {
    if (!replace) routeStack.push(route);
    route=next; renderScreen();
  }
  function goBack() {
    route=routeStack.pop() || {type:'static',view:'home'};
    renderScreen();
  }
  function setStaticView(view) {
    routeStack=[]; route={type:'static',view}; renderScreen();
    if (view==='search') requestAnimationFrame(() => searchSearch.focus({preventScroll:true}));
  }
  function makeBackToolbar(title,subtitle) {
    const toolbar=safeText('header','route-toolbar');
    const back=safeText('button','route-back','‹'); back.type='button'; back.setAttribute('aria-label','Volver'); back.addEventListener('click',goBack);
    const heading=safeText('div','route-heading'); heading.append(safeText('h1','',title),safeText('p','',subtitle||'CumaShop · Cuba'));
    toolbar.append(back,heading); return toolbar;
  }
  function makeEmpty(title,message,actionLabel,action) {
    const box=safeText('div','empty-state'); box.append(safeText('strong','',title),safeText('p','',message));
    if (actionLabel && action) { const button=safeText('button','secondary-button',actionLabel); button.type='button'; button.addEventListener('click',action); box.append(button); }
    return box;
  }
  function makeError(title,message,retry) {
    const box=safeText('div','route-error'); box.append(safeText('strong','',title),safeText('p','',message));
    const button=safeText('button','secondary-button','Reintentar'); button.type='button'; button.addEventListener('click',retry); box.append(button); return box;
  }
  function renderLoading(title,version) {
    dynamicView.replaceChildren(makeBackToolbar(title,'CumaShop · Cuba'));
    const wrap=safeText('div','loading-screen');
    const spinner=safeText('span','loading-spinner');spinner.setAttribute('role','status');spinner.setAttribute('aria-label','Cargando');
    const message=safeText('p','loading-message','Preparando '+title.toLocaleLowerCase('es')+'…');
    wrap.append(spinner,message); dynamicView.append(wrap);
    const started=Date.now();
    const update=() => {
      if (version!==routeVersion || !message.isConnected) return;
      const elapsed=(Date.now()-started)/1000;
      message.textContent=elapsed>=11?'La carga está tardando más de lo habitual.':elapsed>=7?'La conexión parece lenta; seguimos buscando ofertas.':elapsed>=4?'Conectando con el catálogo de Cuba…':'Preparando '+title.toLocaleLowerCase('es')+'…';
    };
    const timer=setInterval(update,500);
    return () => clearInterval(timer);
  }
  function addRowHeading(parent,title,meta) {
    const row=safeText('div','route-section-head'); row.append(safeText('h2','',title));
    if (meta) row.append(safeText('span','',meta)); parent.append(row);
  }
  function makeProductCard(product) {
    const card=safeText('button','product-card'); card.type='button'; card.dataset.product=String(product.id);
    card.setAttribute('aria-label','Ver '+(product.Titulo_Es||'producto')+', '+cardPrice(product));
    const art=safeText('span','product-art route-product-image');
    const src=productImage(product);
    if (src) {
      const image=document.createElement('img'); image.src=src; image.alt=product.Titulo_Es||'Producto'; image.loading='lazy'; image.referrerPolicy='no-referrer';
      image.addEventListener('error',() => { image.remove(); art.append(safeText('span','image-fallback','◈')); },{once:true}); art.append(image);
    } else art.append(safeText('span','image-fallback','◈'));
    if (product.EnOferta===true) art.append(safeText('span','route-product-badge','Oferta'));
    const copy=safeText('span','product-copy');
    copy.append(safeText('strong','',product.Titulo_Es||'Producto'));
    const category=[product.Categoria,product.Unidad_de_Medidas].filter(Boolean).join(' · ');
    if (category) copy.append(safeText('small','',category));
    copy.append(safeText('span','product-price',cardPrice(product)));
    card.append(art,copy); card.addEventListener('click',() => openProduct(product));
    return card;
  }
  function renderRail(parent,title,products) {
    if (!products.length) return;
    addRowHeading(parent,title,products.length+' productos');
    const rail=safeText('div','route-rail'); products.forEach((product) => rail.append(makeProductCard(product))); parent.append(rail);
  }
  function bannerCarousel(banners,sectionName) {
    if (!banners.length) return null;
    const wrap=document.createElement('div');
    const slide=safeText('button','route-banner'); slide.type='button'; slide.setAttribute('aria-label','Promoción de '+sectionName);
    const image=document.createElement('img'); image.alt=''; image.loading='lazy'; image.referrerPolicy='no-referrer';
    slide.append(image); wrap.append(slide);
    if (banners.length>1) {
      const dots=safeText('div','banner-dots'); let index=0;
      const set=(next) => { index=(next+banners.length)%banners.length; image.src=banners[index].url; dots.querySelectorAll('button').forEach((dot,i)=>dot.setAttribute('aria-current',String(i===index))); };
      banners.forEach((_,i)=>{const dot=safeText('button','banner-dot');dot.type='button';dot.setAttribute('aria-label','Ver promoción '+(i+1));dot.addEventListener('click',()=>set(i));dots.append(dot);});
      slide.addEventListener('click',()=>set(index+1)); wrap.append(dots); set(0);
    } else image.src=banners[0].url;
    return wrap;
  }
  function renderCategoryTiles(parent,sectionName,categories,offers) {
    if (!categories.length) { parent.append(makeEmpty('No hay categorías disponibles','Inténtalo de nuevo más tarde.')); return; }
    const section=sectionFor({name:sectionName});
    const categorySection=section?.db || sectionName;
    const categorySectionKey=normalize(categorySection);
    const bannerSlug=fallbackBannerMap[categorySection];
    const bannerExtension=categorySection==='Alimentos'||categorySection==='Muebles y decoración'?'.webp':'.jpg';
    const sectionFallbackImage=bannerSlug ? ASSET+'banners/'+bannerSlug+'_1'+bannerExtension : '';
    const categoryCounts=new Map();
    offers.forEach((product)=>{const key=String(product.Categoria||'');if(key)categoryCounts.set(key,(categoryCounts.get(key)||0)+1);});
    const groups=new Map();
    categories.forEach((category)=>{const group=String(category.Grupo||'').trim();if(!groups.has(group))groups.set(group,[]);groups.get(group).push(category);});
    groups.forEach((items,groupName)=>{
      if(groupName) parent.append(safeText('h3','route-group',groupName));
      const grid=safeText('div','route-categories');
      items.forEach((item)=>{
        const button=safeText('button','route-category');button.type='button';
        const style=categoryStyle(categorySection,item.Categoria);if(style)button.classList.add(style);
        const imageFile=categoryAssets[categorySectionKey+'|'+normalize(item.Categoria)];
        const image=document.createElement('img');image.src=imageFile ? ASSET+'categorias/'+imageFile : sectionFallbackImage;image.alt='';image.loading='lazy';
        image.addEventListener('error',()=>{
          if(sectionFallbackImage && image.dataset.fallbackApplied!=='true'){
            image.dataset.fallbackApplied='true';image.src=sectionFallbackImage;return;
          }
          image.remove();button.classList.add('route-category--image-fallback');
        });
        button.append(image);
        const copy=safeText('span','route-category-copy');copy.append(safeText('strong','',item.Categoria));
        const count=categoryCounts.get(item.Categoria)||0;copy.append(safeText('small','',count===1?'1 oferta':count+' ofertas'));
        if(item.Descripcion)copy.append(safeText('small','',item.Descripcion));
        button.append(copy);button.addEventListener('click',()=>navigate({type:'category',section:sectionName,category:item.Categoria,total:count}));grid.append(button);
      });
      parent.append(grid);
    });
  }
  function categoryStyle(sectionName,category) {
    const section=normalize(sectionName),cat=normalize(category);
    if(section==='moda')return 'route-category--portrait';
    if(section==='electronicos')return 'route-category--padded';
    if(section==='alimentos'&&cat==='ofertas variadas')return 'route-category--full';
    return '';
  }
  function renderSection(data,sectionName) {
    const section=sectionFor({name:sectionName});
    dynamicView.replaceChildren(makeBackToolbar(section.name,'Sección · Cuba'));
    if(data.errors.length && !data.offers.length && !data.categories.length) {
      dynamicView.append(makeError('No pudimos cargar esta sección','Revisa tu conexión y vuelve a intentarlo.',()=>loadRoute(route,++routeVersion,true)));return;
    }
    const banner=bannerCarousel(data.banners,section.name);if(banner)dynamicView.append(banner);
    if(data.errors.length) dynamicView.append(safeText('div','route-notice','Algunas partes no cargaron. Puedes seguir explorando lo disponible o volver a intentar.'));
    const offers=data.offers;
    const onSale=offers.filter((product)=>product.EnOferta===true).slice(0,12);
    const best=[...offers].sort((a,b)=>(Number(b.Ventas)||0)-(Number(a.Ventas)||0)).slice(0,12);
    renderRail(dynamicView,'En oferta',onSale);
    renderRail(dynamicView,'Más vendidos',best);
    if(section.db==='Transporte')dynamicView.append(specialCard('Servicios de transporte','Opciones locales para llevar tus compras a casa.','↗'));
    if(section.db==='Alimentos')dynamicView.append(specialCard('Pizzería a domicilio','Encuentra opciones preparadas en tu zona.','⌂'));
    addRowHeading(dynamicView,'Categorías',data.categories.length+' categorías');
    renderCategoryTiles(dynamicView,section.name,data.categories,offers);
    if(!offers.length && !data.categories.length)dynamicView.append(makeEmpty('Aún no hay ofertas en esta sección','Cuando haya productos disponibles en Cuba, aparecerán aquí.'));
    if(data.errors.length){const retry=safeText('button','secondary-button','Actualizar sección');retry.type='button';retry.addEventListener('click',()=>loadRoute(route,++routeVersion,true));dynamicView.append(retry);}
  }
  function specialCard(title,description,icon) {
    const box=safeText('div','special-card');box.append(safeText('span','special-card-icon',icon));
    const copy=safeText('span','');copy.append(safeText('strong','',title),safeText('small','',description));box.append(copy);return box;
  }
  async function renderCategoryScreen(screen,version) {
    const section=sectionFor({name:screen.section});
    dynamicView.replaceChildren(makeBackToolbar(screen.category,screen.section+' · Cuba'));
    const loadingCleanup=renderLoading(screen.category,version);
    try {
      const first=await loadCategoryPage(section.db,screen.category,0);
      if(version!==routeVersion){loadingCleanup();return;}
      loadingCleanup();
      categoryProducts=first;categoryOffset=first.length;categoryHasMore=first.length===PAGE_SIZE;categoryLoadingMore=false;
      const toolbar=makeBackToolbar(screen.category,screen.section+' · '+(screen.total||first.length)+' ofertas');
      dynamicView.replaceChildren(toolbar);
      dynamicView.append(safeText('p','route-intro','Productos disponibles en Cuba. Los precios publicados son orientativos y pueden variar según la presentación.'));
      const grid=safeText('div','route-grid');categoryProducts.forEach((product)=>grid.append(makeProductCard(product)));dynamicView.append(grid);
      if(first.length===0)dynamicView.append(makeEmpty('Aún no hay ofertas en esta categoría','La categoría existe, pero ahora mismo no tiene productos disponibles en Cuba.'));
      if(categoryHasMore)dynamicView.append(safeText('div','route-pagination','Desplázate para cargar más productos'));
    } catch (_) {
      if(version!==routeVersion){loadingCleanup();return;}
      loadingCleanup();dynamicView.replaceChildren(makeBackToolbar(screen.category,screen.section+' · Cuba'));
      dynamicView.append(makeError('No pudimos cargar los productos','El catálogo no respondió. Puedes volver a intentarlo.',()=>loadRoute(route,++routeVersion,true)));
    }
  }
  async function loadMoreCategory() {
    if(categoryLoadingMore||!categoryHasMore||route.type!=='category')return;
    categoryLoadingMore=true;
    const screen=route;
    try {
      const rows=await loadCategoryPage(sectionFor({name:screen.section}).db,screen.category,categoryOffset);
      if(route!==screen)return;
      categoryProducts.push(...rows);categoryOffset+=rows.length;categoryHasMore=rows.length===PAGE_SIZE;
      const grid=dynamicView.querySelector('.route-grid');rows.forEach((product)=>grid.append(makeProductCard(product)));
      const note=dynamicView.querySelector('.route-pagination');if(note)note.textContent=categoryHasMore?'Desplázate para cargar más productos':'';
    } catch (_) {
      const note=dynamicView.querySelector('.route-pagination');if(note)note.textContent='No se pudieron cargar más productos. Desplázate para reintentar.';
      categoryHasMore=true;
    } finally { categoryLoadingMore=false; }
  }
  async function renderSectionRoute(screen,version,force) {
    const section=sectionFor(screen);
    const cleanup=renderLoading(section.name,version);
    try {
      const data=await loadSectionData(section.name,force);
      if(version!==routeVersion){cleanup();return;}
      cleanup();renderSection(data,section.name);
    } catch (_) {
      if(version!==routeVersion)return;
      cleanup();dynamicView.replaceChildren(makeBackToolbar(section.name,'Sección · Cuba'));
      dynamicView.append(makeError('No pudimos cargar esta sección','El catálogo no respondió. Vuelve a intentarlo.',()=>loadRoute(route,++routeVersion,true)));
    }
  }
  function renderProductScreen(screen) {
    const product=screen.product;
    const price=priceFor(product);
    dynamicView.replaceChildren(makeBackToolbar('Producto','Detalle de la oferta'));
    const detail=safeText('article','route-detail');
    const imageBox=safeText('div','route-detail-art');
    const src=productImage(product);
    if(src){const image=document.createElement('img');image.src=src;image.alt=product.Titulo_Es||'Producto';image.referrerPolicy='no-referrer';image.addEventListener('error',()=>{image.remove();imageBox.append(safeText('span','image-fallback','◈'));},{once:true});imageBox.append(image);}
    else imageBox.append(safeText('span','image-fallback','◈'));
    const copy=safeText('div','route-detail-copy');
    copy.append(safeText('h2','',product.Titulo_Es||'Producto'));
    const category=[product.Seccion,product.Categoria].filter(Boolean).join(' · ');if(category)copy.append(safeText('span','route-chip',category));
    copy.append(safeText('strong','route-detail-price',price.label));
    copy.append(safeText('p','price-note','Precio orientativo. El precio final depende de la presentación disponible y se confirma en la app.'));
    const description=String(product.Descripcion_Es||'').trim();
    copy.append(safeText('p','',description||'Consulta los detalles y la disponibilidad actual en CumaShop.'));
    if(product.Unidad_de_Medidas)copy.append(safeText('p','',String(product.Cantidad_por_Unidad||'')+' '+product.Unidad_de_Medidas));
    if(product.EnOferta===true&&Number(product.PorcentajeDescuento)>0)copy.append(safeText('span','route-chip','Ahorra '+Number(product.PorcentajeDescuento)+'%'));
    const add=safeText('button','primary-button','Añadir al carrito');add.type='button';add.addEventListener('click',()=>addToCart(product));
    detail.append(imageBox,copy,add);dynamicView.append(detail);
  }
  function renderLocations(version) {
    dynamicView.replaceChildren(makeBackToolbar('Elige tu localidad','Casas y Propiedades'));
    dynamicView.append(specialCard('Zona inmobiliaria','Explora propiedades por pueblo o localidad.','⌂'));
    const allBanner=propertyBanners[0];
    const banner=document.createElement('div');banner.className='property-banner';
    const image=document.createElement('img');image.src=ASSET+'categorias/propiedades/'+allBanner.image;image.alt='';image.loading='lazy';
    const copy=safeText('div','property-banner-copy');copy.append(safeText('strong','',allBanner.title),safeText('small','',allBanner.subtitle));banner.append(image,copy);dynamicView.append(banner);
    dynamicView.append(safeText('p','route-intro','Selecciona un pueblo para ver las categorías disponibles.'));
    const grid=safeText('div','property-town-grid');
    towns.forEach((town)=>{const button=safeText('button','property-town',town);button.type='button';button.dataset.town=town;button.addEventListener('click',()=>navigate({type:'property-categories',town}));grid.append(button);});
    dynamicView.append(grid);
  }
  function renderPropertyCategories(screen) {
    const title=screen.town==='Todas'?'Propiedades':screen.town;
    dynamicView.replaceChildren(makeBackToolbar(title,'Categorías inmobiliarias'));
    const carousel=safeText('div','property-banner');
    const image=document.createElement('img');image.src=ASSET+'categorias/propiedades/'+propertyBanners[0].image;image.alt='';image.loading='lazy';
    const copy=safeText('div','property-banner-copy');copy.append(safeText('strong','',propertyBanners[0].title),safeText('small','',propertyBanners[0].subtitle));carousel.append(image,copy);dynamicView.append(carousel);
    const grid=safeText('div','property-category-grid');
    propertyCategories.forEach((item)=>{const button=safeText('button','property-category');button.type='button';const art=document.createElement('img');art.src=ASSET+'categorias/propiedades/'+item.image;art.alt='';art.loading='lazy';button.append(art,safeText('strong','',item.name));button.addEventListener('click',()=>navigate({type:'property-results',town:screen.town,category:item.name}));grid.append(button);});
    dynamicView.append(grid);
  }
  function renderPropertyResults(screen) {
    dynamicView.replaceChildren(makeBackToolbar(screen.category,screen.town==='Todas'?'Todas las localidades':'Localidad · '+screen.town));
    dynamicView.append(specialCard(screen.category,'Propiedades publicadas para '+(screen.town==='Todas'?'Cuba':screen.town)+'.','⌂'));
    dynamicView.append(makeEmpty('No hay anuncios en esta vista web','El catálogo inmobiliario se consulta desde la app CumaShop.', 'Volver a categorías',goBack));
  }
  async function loadRoute(screen,version,force) {
    if(screen.type==='section'){await renderSectionRoute(screen,version,force);return;}
    if(screen.type==='category'){await renderCategoryScreen(screen,version);return;}
    if(screen.type==='product'){renderProductScreen(screen);return;}
    if(screen.type==='locations'){renderLocations(version);return;}
    if(screen.type==='property-categories'){renderPropertyCategories(screen);return;}
    if(screen.type==='property-results'){renderPropertyResults(screen);return;}
  }
  function openProduct(product) {
    const item={...product};
    searchOffers=searchOffers.filter((entry)=>String(entry.id)!==String(item.id));searchOffers.push(item);
    sectionCache.forEach((entry)=>{if(entry.data.offers.some((offer)=>String(offer.id)===String(item.id)))return;});
    navigate({type:'product',product:item});
  }

  async function ensureSearchLoaded(force) {
    if(searchLoading||(!force&&searchLoaded))return;
    searchLoading=true;searchError=false;
    $('searchResultCount').textContent='Cargando ofertas…';
    searchGrid.replaceChildren(makeEmpty('Conectando con el catálogo','Buscando productos disponibles en Cuba…'));
    try { searchOffers=await loadAllOffers({},1000);searchLoaded=true;searchError=false; }
    catch (_) { searchError=true;searchLoaded=false; }
    finally { searchLoading=false;renderSearch(); }
  }
  function renderSearch() {
    if(searchSearch.value!==state.query)searchSearch.value=state.query;
    searchGrid.replaceChildren();
    if(searchLoading){$('searchResultCount').textContent='Cargando…';searchGrid.append(makeEmpty('Conectando con el catálogo','Buscando ofertas de Cuba…'));return;}
    if(searchError){$('searchResultCount').textContent='';searchGrid.append(makeError('No pudimos cargar las ofertas','Revisa tu conexión e inténtalo de nuevo.',()=>ensureSearchLoaded(true)));return;}
    const query=normalize(state.query);
    const filtered=searchOffers.filter((product)=>{
      const matchesSection=!state.category||product.Seccion===state.category;
      const haystack=normalize([product.Titulo_Es,product.Seccion,product.Categoria,product.Categoria2].join(' '));
      return matchesSection&&(!query||haystack.includes(query));
    });
    $('searchResultCount').textContent=filtered.length+' ofertas';
    if(!filtered.length){searchGrid.append(makeEmpty('No encontramos ofertas','Prueba con otro término o cambia el filtro.'));return;}
    filtered.forEach((product)=>searchGrid.append(makeProductCard(product)));
  }
  function renderSearchFilters() {
    const group=document.querySelector('[data-category-group]');
    const choices=[{label:'Todo',value:''},{label:'Alimentos',value:'Alimentos'},{label:'Electrónicos',value:'Electrónicos'},{label:'Moda',value:'Moda'}];
    group.replaceChildren();
    choices.forEach((choice)=>{const button=safeText('button','category',choice.label);button.type='button';button.dataset.category=choice.value;button.setAttribute('aria-pressed',String(state.category===choice.value));group.append(button);});
  }
  function renderOrders() {
    const container=$('ordersContent');container.replaceChildren();
    if(!state.orders.length){container.append(makeEmpty('Aún no tienes pedidos','Las solicitudes de compra no se envían desde esta vista previa.'));return;}
    state.orders.forEach((order)=>{const card=safeText('article','order-card');const head=safeText('div','order-head');head.append(safeText('strong','','Pedido #'+order.number),safeText('span','order-status',order.status));card.append(head,safeText('p','',order.summary),safeText('small','',order.date+' · Total orientativo '+money(order.total,'CUP')));container.append(card);});
  }
  function renderProfile() {
    $('profileTitle').textContent='Tu perfil';
  }
  function renderCart() {
    const entries=cartEntries();const container=$('cartContent');container.replaceChildren();
    if(!entries.length){container.append(makeEmpty('Tu carrito está vacío','Explora las ofertas disponibles en Cuba.', 'Explorar ofertas',()=>{cartDialog.close();setStaticView('home');}));updateHeader();return;}
    const list=safeText('div','cart-list');
    entries.forEach(({product,quantity})=>{const row=safeText('div','cart-item');const copy=safeText('span','cart-item-copy');copy.append(safeText('strong','',product.Titulo_Es||'Producto'),safeText('small','',cardPrice(product)+' · '+(product.Seccion||'CumaShop')));const count=safeText('span','quantity');const minus=safeText('button','', '−');minus.type='button';minus.dataset.quantity='-1';minus.dataset.product=String(product.id);const output=safeText('output','',quantity);const plus=safeText('button','','+');plus.type='button';plus.dataset.quantity='1';plus.dataset.product=String(product.id);count.append(minus,output,plus);row.append(copy,count);list.append(row);});
    container.append(list);
    const total=safeText('div','cart-total');total.append(safeText('span','','Total orientativo'),safeText('span','',money(cartTotal(),'CUP')));container.append(total);
    const note=safeText('p','cart-note','Vista previa · no se procesa ningún pago ni se crea un pedido real.');container.append(note);updateHeader();
  }
  function addToCart(product) {
    const id=String(product.id);state.cart[id]=Math.min(99,(Number(state.cart[id])||0)+1);saveState();updateHeader();renderCart();
    if(productDialog.open)productDialog.close();toast.textContent=(product.Titulo_Es||'Producto')+' se añadió al carrito';toast.hidden=false;announce(toast.textContent);clearTimeout(toastTimer);toastTimer=setTimeout(()=>{toast.hidden=true;},2300);
  }
  function changeQuantity(id,delta) {
    const next=(Number(state.cart[id])||0)+delta;if(next<1)delete state.cart[id];else state.cart[id]=Math.min(99,next);saveState();renderCart();
  }

  homeCollections.addEventListener('click',(event)=>{
    const card=event.target.closest('[data-collection]');if(!card)return;
    const section=sections[Number(card.dataset.collection)];if(!section)return;
    if(section.property)navigate({type:'locations'});else navigate({type:'section',name:section.name});
  });
  document.querySelectorAll('[data-nav]').forEach((button)=>button.addEventListener('click',()=>setStaticView(button.dataset.nav)));
  renderSearchFilters();
  document.querySelector('[data-category-group]').addEventListener('click',(event)=>{
    const button=event.target.closest('[data-category]');if(!button)return;state.category=button.dataset.category||'';renderSearchFilters();renderSearch();saveState();
  });
  searchSearch.addEventListener('input',()=>{state.query=searchSearch.value.trim().slice(0,100);renderSearch();saveState();});
  $('openCart').addEventListener('click',()=>{renderCart();cartDialog.showModal();sendToHost('cumashop:state',{view:route.view||route.type,cartCount:cartQuantity(),action:'open-cart'});});
  searchGrid.addEventListener('click',(event)=>{const card=event.target.closest('[data-product]');if(!card)return;const product=searchOffers.find((item)=>String(item.id)===card.dataset.product);if(product)openProduct(product);});
  document.addEventListener('click',(event)=>{
    const quantity=event.target.closest('[data-quantity]');if(quantity){changeQuantity(quantity.dataset.product,Number(quantity.dataset.quantity));return;}
    const close=event.target.closest('[data-close]');if(close){$(close.dataset.close).close();return;}
    const go=event.target.closest('[data-go]');if(go){cartDialog.close();setStaticView(go.dataset.go);return;}
    const action=event.target.closest('[data-profile-action]');if(action){toast.textContent=action.dataset.profileAction+' estará disponible próximamente';toast.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.hidden=true,2200);}
  });
  document.querySelectorAll('[data-store]').forEach((button)=>button.addEventListener('click',()=>{state.query=button.dataset.store||'';setStaticView('search');}));
  document.addEventListener('keydown',(event)=>{if(event.key==='Escape'&&route.type!=='static')goBack();});
  main.addEventListener('scroll',()=>{
    if(route.type==='category'&&main.scrollTop+main.clientHeight>=main.scrollHeight-240)loadMoreCategory();
  },{passive:true});
  window.addEventListener('message',(event)=>{
    if(event.origin!==location.origin||event.source!==window.parent)return;
    const message=event.data;
    if(!message||message.type!=='cumashop:host')return;
    if(message.action==='scroll-mode'&&(message.owner==='app'||message.owner==='page'))relayWheelToPage=message.owner==='page';
    if(message.action==='init')sendToHost('cumashop:state',{view:route.view||route.type,cartCount:cartQuantity(),action:'ready'});
  });
  let relayWheelToPage=false;
  window.addEventListener('wheel',(event)=>{
    if(!relayWheelToPage||window.parent===window)return;
    event.preventDefault();
    let deltaY=event.deltaY;
    if(event.deltaMode===WheelEvent.DOM_DELTA_LINE)deltaY*=16;
    else if(event.deltaMode===WheelEvent.DOM_DELTA_PAGE)deltaY*=innerHeight;
    if(Number.isFinite(deltaY)&&deltaY!==0)sendToHost('cumashop-preview-wheel',{deltaY});
  },{capture:true,passive:false});
  window.addEventListener('pointermove',(event)=>{
    if(window.parent===window)return;
    sendToHost('cumashop-preview-pointer',{x:event.clientX/innerWidth,y:event.clientY/innerHeight});
  },{passive:true});
  document.documentElement.addEventListener('pointerleave',()=>{
    if(window.parent!==window)sendToHost('cumashop-preview-pointer-leave');
  },{passive:true});

  route={type:'static',view:state.view};
  staticView(state.view);
  updateHeader();
  if(window.parent!==window)sendToHost('cumashop:ready',{version:2});
})();
