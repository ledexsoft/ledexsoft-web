/* Shared, side-effect-free storefront rules. Prices in links are never trusted. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.CumaShopStore = api;
})(typeof window === "object" ? window : globalThis, function () {
  "use strict";
  const normalize = (s) =>
    String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const validId = (n) => Number.isSafeInteger(n) && n > 0;
  function cartItems(items) {
    if (!Array.isArray(items) || items.length > 50)
      throw Error("El carrito admite hasta 50 variantes.");
    const out = new Map();
    items.forEach((i) => {
      if (!i || !validId(i.offerId) || !validId(i.offerItemId))
        throw Error("Identificador no válido.");
      if (!Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > 99)
        throw Error("Cantidad no válida.");
      const key = i.offerId + ":" + i.offerItemId;
      const quantity = (out.get(key)?.quantity || 0) + i.quantity;
      if (quantity > 99) throw Error("Cantidad no válida.");
      out.set(key, {
        offerId: i.offerId,
        offerItemId: i.offerItemId,
        quantity,
      });
    });
    return [...out.values()];
  }
  function encodeCart(country, items) {
    if (!["Cuba", "Brasil"].includes(country))
      throw Error("Selecciona un país.");
    const clean = cartItems(items);
    if (!clean.length) throw Error("Añade productos al carrito.");
    const data = JSON.stringify({ v: 1, country, items: clean });
    const encoded = btoa(data)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const url = "https://ledexsoft.com/tienda.html?carrito=" + encoded;
    if (url.length > 16384) throw Error("Carrito demasiado grande.");
    return url;
  }
  function decodeCart(value) {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.hostname !== "ledexsoft.com" ||
      url.pathname !== "/tienda.html" ||
      url.href.length > 16384 ||
      url.username ||
      url.password ||
      url.port ||
      url.hash ||
      url.searchParams.getAll("carrito").length !== 1
    )
      throw Error("Enlace no válido.");
    const raw = url.searchParams.get("carrito");
    if (!raw || !/^[A-Za-z0-9_-]+$/.test(raw))
      throw Error("Carrito no válido.");
    const data = JSON.parse(atob(raw.replace(/-/g, "+").replace(/_/g, "/")));
    if (data.v !== 1 || !["Cuba", "Brasil"].includes(data.country))
      throw Error("Versión no compatible.");
    const items = cartItems(data.items);
    if (!items.length || items.length !== data.items.length)
      throw Error("Carrito no válido.");
    return { v: 1, country: data.country, items };
  }
  function filterOffers(rows, f) {
    const q = normalize(f.q);
    return rows.filter(
      (p) =>
        (!f.country || p.Pais === f.country) &&
        (!f.section || p.Seccion === f.section) &&
        (!f.category || p.Categoria === f.category) &&
        (!f.sub || p.Categoria2 === f.sub) &&
        (!f.sub3 || p.Categoria3 === f.sub3) &&
        (!f.sale || p.EnOferta === true) &&
        (!f.currency || p.Moneda_base === f.currency) &&
        (!f.available || p.Stock_Disponible === true) &&
        (!q ||
          normalize(
            [
              p.Titulo_Es,
              p.Categoria,
              p.Categoria2,
              p.Categoria3,
              p.Seccion,
            ].join(" "),
          ).includes(q)),
    );
  }
  function sortOffers(rows, sort) {
    return rows.slice().sort((a, b) => {
      if (sort === "name")
        return (
          String(a.Titulo_Es || "").localeCompare(
            String(b.Titulo_Es || ""),
            "es",
          ) || a.id - b.id
        );
      if (sort === "price-low" || sort === "price-high") {
        const currency = String(a.Moneda_base || "").localeCompare(
          String(b.Moneda_base || ""),
        );
        if (currency) return currency;
        const av = Number(a.Precio_base_UI),
          bv = Number(b.Precio_base_UI),
          am = !Number.isFinite(av) || av <= 0,
          bm = !Number.isFinite(bv) || bv <= 0;
        if (am !== bm) return am ? 1 : -1;
        return (sort === "price-low" ? av - bv : bv - av) || a.id - b.id;
      }
      return b.id - a.id;
    });
  }
  return Object.freeze({
    normalize,
    cartItems,
    encodeCart,
    decodeCart,
    filterOffers,
    sortOffers,
  });
});
