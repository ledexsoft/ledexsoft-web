const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

// Only browser/network boundaries are replaced; every query, filter and render
// below runs the same scripts and script order as the public HTML page.
class Element {
  constructor(tag = 'div') { this.tagName = tag; this.children = []; this.attributes = {}; this.listeners = {}; this.hidden = false; this.value = ''; this.textContent = ''; this.classList = {add() {}}; }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  setAttribute(key, value) { this.attributes[key] = value; }
  getAttribute(key) { return this.attributes[key]; }
  removeAttribute(key) { delete this.attributes[key]; }
  addEventListener(name, handler) { this.listeners[name] = handler; }
  scrollIntoView() {}
  get firstChild() { return this.children[0]; }
  fire(name) { this.listeners[name]?.call(this, {preventDefault() {}}); }
}
const real = {id: 44, Titulo_Es: 'Piña', Seccion: 'Alimentos', Categoria: 'Frutas', Precio_base_UI: 20, Moneda_base: 'CUP', Pais: 'Cuba', Stock_Disponible: true};
const simulated = {id: 69, Titulo_Es: 'Producto simulado - Aspiradoras', Seccion: 'Electrónicos', Categoria: 'Aspiradoras', Precio_base_UI: 100, Moneda_base: 'CUP', Pais: 'Cuba', Stock_Disponible: true};
const simulatedFashion = {...simulated, id: 103, Seccion: 'Moda', Categoria: 'Ropa para niños'};

async function page(name, {search = '', offers = [simulatedFashion, simulated, real], fail = false} = {}) {
  const html = fs.readFileSync(path.join(root, name), 'utf8');
  const elements = new Map();
  for (const match of html.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)) {
    const element = new Element(); element.hidden = /\bhidden\b/.test(match[0]); elements.set(match[1], element);
  }
  const requests = [];
  const document = {getElementById: id => elements.get(id), createElement: tag => new Element(tag), title: '', hidden: false, addEventListener() {}, removeEventListener() {}};
  const location = {search, href: 'https://ledexsoft.com/' + name + search};
  const sandbox = {document, location, URL, URLSearchParams, AbortController, Intl, setTimeout, clearTimeout,
    navigator: {userAgent: 'desktop'}, history: {replaceState() {}},
    fetch: async url => {
      requests.push(new URL(url));
      if (fail) throw Error('offline');
      return {ok: true, json: async () => url.includes('Categorias_de_seccion') ? [{Seccion: 'Alimentos', Categoria: 'Frutas', Orden: 1}] : offers};
    }, matchMedia: () => ({matches: true}), addEventListener() {}, removeEventListener() {}};
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const match of html.matchAll(/<script\b[^>]*\bsrc="(js\/[^"?]+)(?:\?[^"]*)?"[^>]*>/g)) {
    vm.runInContext(fs.readFileSync(path.join(root, match[1]), 'utf8'), sandbox, {filename: match[1]});
  }
  await new Promise(resolve => setImmediate(resolve));
  return {get: id => elements.get(id), requests, sandbox};
}
function links(element) {
  return [element.href, ...element.children.flatMap(links)].filter(Boolean);
}

test('catalog counts and featured cards exclude confirmed simulation offers', async () => {
  const p = await page('tienda.html');
  assert.equal(p.get('catalog-summary').textContent, '1 oferta activa en 1 sección');
  assert.deepEqual(links(p.get('featured-grid')), ['p.html?id=44']);
  assert.deepEqual(links(p.get('products')), ['p.html?id=44']);
});

test('search does not bring excluded offers back into results', async () => {
  const p = await page('tienda.html', {search: '?q=simulado'});
  assert.equal(p.get('products').children.length, 0);
  assert.equal(p.get('empty').hidden, false);
});

test('catalog requests exclude every confirmed simulation ID at the API boundary', async () => {
  const p = await page('tienda.html');
  const filter = p.requests.find(url => url.pathname.endsWith('/Ofertas')).searchParams.get('id');
  assert.ok(filter?.startsWith('not.in.('), 'missing query exclusion');
  assert.deepEqual(filter.slice(8, -1).split(',').map(Number), Array.from({length: 59}, (_, i) => i + 45));
});

test('all 59 confirmed simulations are blocked from direct links before fetching', async () => {
  for (let id = 45; id <= 103; id++) {
    const p = await page('p.html', {search: '?id=' + id, offers: [{...simulated, id}]});
    assert.equal(p.get('notfound').hidden, false, 'ID ' + id);
    assert.equal(p.get('product').hidden, true, 'ID ' + id);
    assert.equal(p.requests.length, 0, 'ID ' + id);
  }
});

test('leading zeros cannot bypass a blocked ID', async () => {
  const p = await page('p.html', {search: '?id=00069', offers: [simulated]});
  assert.equal(p.get('notfound').hidden, false);
  assert.equal(p.requests.length, 0);
});

test('detail and related cards keep real offers and exclude simulations from the response', async () => {
  const p = await page('p.html', {search: '?id=44', offers: [real, simulated, simulatedFashion, {...real, id: 104}]});
  assert.equal(p.get('product').hidden, false);
  assert.equal(p.get('p-name').textContent, 'Piña');
  assert.deepEqual(links(p.get('related-grid')), ['p.html?id=104']);
});

test('real products with similar words are not classified by title or description', async () => {
  const legitimate = {...real, id: 104, Titulo_Es: 'Simulador de vuelo', Descripcion_Es: 'Prueba de simulación interactiva'};
  const p = await page('p.html', {search: '?id=104', offers: [legitimate]});
  assert.equal(p.get('product').hidden, false);
  assert.equal(p.get('p-name').textContent, 'Simulador de vuelo');
});

test('invalid IDs are not sent to the API', async () => {
  for (const search of ['', '?id=abc', '?id=-1', '?id=1%26Activo=eq.false']) {
    const p = await page('p.html', {search});
    assert.equal(p.get('notfound').hidden, false);
    assert.equal(p.requests.length, 0);
  }
});

test('a failed catalog load has an error, not a successful empty catalog', async () => {
  const p = await page('tienda.html', {fail: true});
  assert.equal(p.get('error').hidden, false);
  assert.equal(p.get('empty').hidden, true);
  assert.equal(p.get('retry').disabled, false);
});

test('product failures are retryable and never expose stale details', async () => {
  const p = await page('p.html', {search: '?id=44', fail: true});
  assert.equal(p.get('loaderror').hidden, false);
  assert.equal(p.get('product').hidden, true);
});

test('non-finite price ranges fall back to the valid base price', async () => {
  const p = await page('p.html', {search: '?id=44', offers: [{...real, Precio_Min: 10, Precio_Max: 'Infinity'}]});
  assert.equal(p.get('p-price').textContent, '20 CUP');
});

test('prices that cannot be displayed sort after usable prices in both directions', async () => {
  const offers = [{...real, id: 104, Precio_base_UI: 0}, {...real, id: 105, Precio_base_UI: -1}, {...real, id: 106, Precio_base_UI: null}, real];
  for (const order of ['price-low', 'price-high']) {
    const p = await page('tienda.html', {search: '?orden=' + order, offers});
    assert.equal(links(p.get('products'))[0], 'p.html?id=44');
  }
});
