const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm");
class El {
  constructor() {
    this.children = [];
    this.listeners = {};
    this.attributes = {};
    this.value = "";
    this.hidden = false;
    this.dataset = {};
    this.classList = { add() {} };
  }
  append(...v) {
    this.children.push(...v);
  }
  prepend(...v) {
    this.children.unshift(...v);
  }
  replaceChildren(...v) {
    this.children = v;
  }
  setAttribute(k, v) {
    this.attributes[k] = v;
  }
  addEventListener(k, fn) {
    (this.listeners[k] ??= []).push(fn);
  }
  fire(k) {
    for (const fn of this.listeners[k] || [])
      fn({ preventDefault() {}, target: this });
  }
  showModal() {
    this.open = true;
  }
  close() {
    this.open = false;
  }
  focus() {}
  scrollIntoView() {}
  getBoundingClientRect() {
    return { left: 0, top: 0, right: 100, bottom: 100 };
  }
}
async function boot({
  fail = false,
  noVariants = false,
  currency = "CUP",
} = {}) {
  const html = fs.readFileSync("tienda.html", "utf8"),
    els = {};
  for (const m of html.matchAll(/id="([^"]+)"/g)) els[m[1]] = new El();
  const req = [],
    offer = {
      id: 31,
      Titulo_Es: "Aguacate",
      Pais: "Cuba",
      Activo: true,
      Stock_Disponible: true,
      Seccion: "Alimentos",
      Categoria: "Frutas",
      Moneda_base: "CUP",
    },
    variant = {
      id: 57,
      Oferta: 31,
      Nombre_es: "Aguacate",
      Moneda_base: currency,
      Precio_Final_del_cliente: 90,
      Stock_Virtual_Disoponibilidad_a_venta: 8,
      Es_Mayorista: false,
    };
  const doc = {
    getElementById: (id) => els[id],
    querySelectorAll: () => [],
    createElement: () => new El(),
    activeElement: null,
  };
  const ctx = {
    document: doc,
    URL,
    URLSearchParams,
    AbortController,
    Intl,
    setTimeout,
    clearTimeout,
    btoa,
    atob,
    localStorage: { getItem: () => null, setItem() {} },
    location: { href: "https://ledexsoft.com/tienda.html", search: "" },
    history: { replaceState() {} },
    navigator: {},
    fetch: async (url, options) => {
      req.push({ url, options });
      if (fail) throw Error("offline");
      return {
        ok: true,
        json: async () =>
          url.includes("catalogo_variantes")
            ? noVariants
              ? []
              : [variant]
            : [offer, { ...offer, id: 69 }],
      };
    },
    addEventListener() {},
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const m of html.matchAll(/src="(js\/[^?]+)\?/g))
    vm.runInContext(fs.readFileSync(m[1], "utf8"), ctx);
  await new Promise((r) => setTimeout(r, 25));
  return { els, req, ctx };
}
test("store uses real RPC prices and excludes simulations even in returned data", async () => {
  const { els, req } = await boot();
  assert.equal(els.products.children.length, 1);
  assert.equal(els["results-line"].textContent, "1 producto disponible");
  const query = new URL(req[0].url);
  assert.equal(query.searchParams.get("Pais"), "eq.Cuba");
  assert.equal(query.searchParams.get("Stock_Disponible"), "eq.true");
  assert.match(query.searchParams.get("id"), /^not.in/);
  assert.deepEqual(JSON.parse(req[1].options.body), {
    p_oferta_ids: [31],
    p_pais: "Cuba",
  });
  const price = els.products.children[0].children[0].children[1].children[3];
  assert.equal(price.textContent, "90 CUP");
});
test("failed catalog request remains retryable, never claims empty success", async () => {
  const { els } = await boot({ fail: true });
  assert.equal(els.error.hidden, false);
  assert.equal(els.empty.hidden, true);
  assert.equal(els.retry.disabled, false);
  assert.equal(els.products.children.length, 0);
});
test("product detail selection adds canonical offer item and cart link", async () => {
  const { els } = await boot();
  els.products.children[0].children[0].fire("click");
  assert.equal(els["product-dialog"].open, true);
  const main = els["detail-content"].children[0],
    actions = main.children.find((el) => el.className === "detail-actions");
  actions.children[1].fire("click");
  els["header-cart"].fire("click");
  const payload = JSON.parse(
    Buffer.from(
      new URL(els["cart-link"].value).searchParams.get("carrito"),
      "base64url",
    ).toString(),
  );
  assert.deepEqual(payload, {
    v: 1,
    country: "Cuba",
    items: [{ offerId: 31, offerItemId: 57, quantity: 1 }],
  });
});

test("offers without a purchasable public variant are not presented as available", async () => {
  const { els } = await boot({ noVariants: true });
  assert.equal(els.products.children.length, 0);
  assert.equal(els.empty.hidden, false);
});

test("variants in a currency unsupported by the app cannot be exported", async () => {
  const { els } = await boot({ currency: "USD" });
  assert.equal(els.products.children.length, 0);
});
test("cart quantity updates subtotal and shared link without replacing the input", async () => {
  const { els } = await boot();
  els.products.children[0].children[0].fire("click");
  els["detail-content"].children[0].children
    .find((el) => el.className === "detail-actions")
    .children[1].fire("click");
  els["header-cart"].fire("click");
  const row = els["cart-items"].children[0],
    quantity = row.children[1].children.find(
      (el) => el.className === "quantity",
    );
  quantity.children[2].fire("click");
  assert.equal(els["cart-items"].children[0], row);
  const payload = JSON.parse(
    Buffer.from(
      new URL(els["cart-link"].value).searchParams.get("carrito"),
      "base64url",
    ).toString(),
  );
  assert.equal(payload.items[0].quantity, 2);
  assert.equal(
    els["cart-summary"].children[0].children[1].textContent,
    "180 CUP",
  );
});
