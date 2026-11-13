/* CumaShop storefront. Public reads only: no orders, checkout or payments. */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id),
    rules = window.CumaShopStore,
    config = window.CumaShopConfig,
    publication = window.CumaShopCatalog;
  const sections = [
    ["Alimentos", "Alimentos", "alimentos", "✳"],
    ["Muebles y decoración", "Muebles", "muebles", "⌂"],
    ["Aseo y limpieza", "Aseo", "aseo", "✦"],
    ["Electrónicos", "Tecnología", "electricos", "⌁"],
    ["Moda", "Moda", "moda", "◇"],
    ["Construcción", "Construcción", "construccion", "▥"],
  ];
  const params = new URLSearchParams(location.search),
    storageKey = "cumashop.store.v1";
  let stored = {};
  try {
    stored = JSON.parse(localStorage.getItem(storageKey) || "{}") || {};
  } catch (_) {}
  let state = {
    country: ["Cuba", "Brasil"].includes(stored.country)
      ? stored.country
      : "Cuba",
    q: (params.get("q") || "").slice(0, 100),
    section: sections.find((s) => s[2] === params.get("seccion"))?.[0] || "",
    category: params.get("categoria") || "",
    sub: params.get("sub") || "",
    sub3: params.get("sub3") || "",
    currency: "",
    sale: false,
    sort: ["recent", "price-low", "price-high", "name"].includes(
      params.get("orden"),
    )
      ? params.get("orden")
      : "recent",
    favorites: false,
  };
  let cart = [];
  try {
    cart = rules.cartItems(stored.cart || []);
  } catch (_) {}
  let favorites = new Set(
      Array.isArray(stored.favorites)
        ? stored.favorites.filter(Number.isSafeInteger)
        : [],
    ),
    offers = [],
    variants = new Map(),
    loaded = false,
    visible = 16,
    generation = 0,
    detailGeneration = 0,
    toastTimer,
    lastDialogTrigger;
  let incoming = null;
  try {
    if (params.has("carrito")) {
      incoming = rules.decodeCart(location.href);
    }
  } catch (_) {
    setTimeout(
      () =>
        toast(
          "El enlace de carrito no es válido. Tu selección guardada no ha cambiado.",
        ),
      0,
    );
  }
  function node(tag, cls, text) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text != null) el.textContent = text;
    return el;
  }
  function button(text, cls, action) {
    const el = node("button", cls, text);
    el.type = "button";
    el.addEventListener("click", action);
    return el;
  }
  function save() {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          country: state.country,
          cart,
          favorites: [...favorites],
        }),
      );
    } catch (_) {
      toast(
        "El navegador no permite guardar. Tu selección durará mientras esta página siga abierta.",
      );
    }
  }
  function toast(text) {
    $("toast").textContent = text;
    $("toast").hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => ($("toast").hidden = true), 4500);
  }
  // Visual review 2026-11-13: these source photographs are watermarked or
  // show mixed produce/drinks rather than the listed item. Keep backend untouched.
  const unsuitablePhotos = new Set([
    "https://plus.unsplash.com/premium_photo-1724250043016-81ae56238026",
    "https://plus.unsplash.com/premium_photo-1675798983878-604c09f6d154",
    "https://images.unsplash.com/photo-1579113800032-c38bd7635818",
    "https://plus.unsplash.com/premium_photo-1720552289056-6f9b15b8cc54",
  ]);
  function photoPlaceholder() {
    const el = node("span", "photo-pending");
    el.append(node("span", "", "▧"), node("small", "", "Foto pendiente"));
    return el;
  }
  function image(source, alt, cls) {
    const img = node("img", cls);
    try {
      const url = new URL(source);
      if (
        url.protocol !== "https:" ||
        unsuitablePhotos.has(url.origin + url.pathname)
      )
        throw Error();
      img.src = url.href;
      img.alt = alt;
      img.loading = "lazy";
      img.addEventListener("error", () => img.replaceWith(photoPlaceholder()));
      return img;
    } catch (_) {
      return photoPlaceholder();
    }
  }
  function money(value, currency) {
    return (
      new Intl.NumberFormat("es-CU", { maximumFractionDigits: 2 }).format(
        value,
      ) +
      " " +
      currency
    );
  }
  function price(v, p) {
    const n = Number(v.Precio_Final_del_cliente);
    if (!Number.isFinite(n) || n <= 0) return null;
    const d = new Date(),
      day = d.getDay(),
      hour = d.getHours();
    const active =
      day === 5 ||
      day === 6 ||
      day === 0 ||
      (day === 4 && hour >= 20) ||
      (day === 1 && hour < 6);
    return p.Modo_Regulador === true && active
      ? Math.round(n * 1.035 * 100) / 100
      : n;
  }
  function stock(v) {
    const n = Number(v.Stock_Virtual_Disoponibilidad_a_venta);
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  }
  function usable(v, p) {
    return (
      Number.isSafeInteger(Number(v.id)) &&
      Number(v.id) > 0 &&
      v.Es_Mayorista !== true &&
      v.Moneda_base === (p.Pais === "Brasil" ? "BRL" : "CUP") &&
      stock(v) > 0 &&
      price(v, p) !== null
    );
  }
  function choices(p) {
    return (variants.get(Number(p.id)) || []).filter((v) => usable(v, p));
  }
  function label(v) {
    return (
      [v.Nombre_es, v.Color, v.Talla_Valor]
        .filter((x) => typeof x === "string" && x.trim())
        .join(" · ") || "Presentación disponible"
    );
  }
  function api(path, query, body) {
    const controller = new AbortController(),
      timer = setTimeout(() => controller.abort(), 15000);
    return fetch(
      config.url +
        "/rest/v1/" +
        path +
        (query ? "?" + new URLSearchParams(query) : ""),
      {
        method: body ? "POST" : "GET",
        headers: {
          apikey: config.anonKey,
          Authorization: "Bearer " + config.anonKey,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      },
    )
      .then((r) => {
        if (!r.ok) throw Error("No disponible");
        return r.json();
      })
      .finally(() => clearTimeout(timer));
  }
  async function load() {
    const current = ++generation;
    loaded = false;
    $("error").hidden = true;
    $("empty").hidden = true;
    $("more").hidden = true;
    $("retry").disabled = true;
    $("products").setAttribute("aria-busy", "true");
    $("products").replaceChildren(
      ...Array.from({ length: 8 }, () => node("div", "skeleton")),
    );
    $("results-line").textContent = "Buscando productos disponibles…";
    $("country").value = state.country;
    renderCounts();
    try {
      let rows = [];
      for (let offset = 0; offset < 10000; offset += 200) {
        const batch = await api("Ofertas", {
          select:
            "id,Titulo_Es,Descripcion_Es,Moneda_base,Imagen_Portada,Imagen_1,Imagen_2,Imagen_3,Imagen_4,Seccion,Categoria,Categoria2,Categoria3,Stock_Disponible,EnOferta,Unidad_de_Medidas,Cantidad_por_Unidad,Pais,Modo_Regulador",
          Activo: "eq.true",
          Pais: "eq." + state.country,
          Stock_Disponible: "eq.true",
          id: publication.exclusionFilter,
          order: "id.desc",
          limit: "200",
          offset: String(offset),
        });
        if (!Array.isArray(batch)) throw Error();
        rows.push(...batch);
        if (batch.length < 200) break;
        if (offset === 9800) throw Error("El catálogo es demasiado grande.");
      }
      if (current !== generation) return;
      rows = rows.filter(
        (p) =>
          publication.isPublicOffer(p) &&
          p.Pais === state.country &&
          p.Stock_Disponible === true,
      );
      const variantMap = new Map();
      for (let i = 0; i < rows.length; i += 100) {
        const group = await api("rpc/catalogo_variantes", null, {
          p_oferta_ids: rows.slice(i, i + 100).map((p) => p.id),
          p_pais: state.country,
        });
        if (!Array.isArray(group)) throw Error();
        group.forEach((v) => {
          const id = Number(v.ID_Oferta ?? v.Oferta ?? v.oferta_id);
          if (!variantMap.has(id)) variantMap.set(id, []);
          variantMap.get(id).push(v);
        });
      }
      if (current !== generation) return;
      variants = variantMap;
      offers = rows
        .map((p) => {
          const vv = choices(p);
          const prices = vv.map((v) => price(v, p));
          const currency = vv[0]?.Moneda_base || p.Moneda_base;
          const same = vv.filter((v) => v.Moneda_base === currency);
          return {
            ...p,
            Moneda_base: currency,
            Precio_base_UI: same.length
              ? Math.min(...same.map((v) => price(v, p)))
              : null,
            _choices: vv,
          };
        })
        .filter((p) => p._choices.length > 0);
      loaded = true;
      visible = 16;
      render();
      if (incoming) {
        const payload = incoming;
        incoming = null;
        showIncoming(payload);
      }
      renderCounts();
    } catch (error) {
      if (current !== generation) return;
      $("products").replaceChildren();
      $("error").hidden = false;
      $("results-line").textContent = "Catálogo no disponible";
      $("catalog-summary").textContent = "NO SE PUDO ACTUALIZAR";
      $("error-text").textContent =
        "No pudimos verificar precios y disponibilidad. Reintenta cuando tengas conexión.";
    } finally {
      if (current === generation) {
        $("retry").disabled = false;
        $("products").setAttribute("aria-busy", "false");
      }
    }
  }
  function syncUrl() {
    const url = new URL(location.href);
    ["q", "seccion", "categoria", "sub", "sub3", "orden", "carrito"].forEach(
      (k) => url.searchParams.delete(k),
    );
    if (state.q) url.searchParams.set("q", state.q);
    const section = sections.find((s) => s[0] === state.section);
    if (section) url.searchParams.set("seccion", section[2]);
    [
      ["categoria", "category"],
      ["sub", "sub"],
      ["sub3", "sub3"],
      ["orden", "sort"],
    ].forEach(([k, v]) => {
      if (state[v] && state[v] !== "recent") url.searchParams.set(k, state[v]);
    });
    history.replaceState(null, "", url.pathname + url.search);
  }
  function setFilter(key, value) {
    state[key] = value;
    visible = 16;
    if (key === "section") {
      state.category = "";
      state.sub = "";
      state.sub3 = "";
    }
    if (key === "category") {
      state.sub = "";
      state.sub3 = "";
    }
    if (key === "sub") state.sub3 = "";
    syncUrl();
    render();
  }
  function selectOptions(id, values, current, all) {
    const select = $(id);
    select.replaceChildren();
    const blank = node("option", "", all);
    blank.value = "";
    select.append(blank);
    [...new Set(values.filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "es"))
      .forEach((value) => {
        const option = node("option", "", value);
        option.value = value;
        select.append(option);
      });
    select.value = current;
  }
  function renderFilters() {
    let scope = offers.filter(
      (p) => !state.section || p.Seccion === state.section,
    );
    selectOptions(
      "category",
      scope.map((p) => p.Categoria),
      state.category,
      "Todas las categorías",
    );
    scope = scope.filter(
      (p) => !state.category || p.Categoria === state.category,
    );
    selectOptions(
      "subcategory",
      scope.map((p) => p.Categoria2),
      state.sub,
      "Todas",
    );
    scope = scope.filter((p) => !state.sub || p.Categoria2 === state.sub);
    selectOptions(
      "subcategory3",
      scope.map((p) => p.Categoria3),
      state.sub3,
      "Todos",
    );
    selectOptions(
      "currency",
      offers.map((p) => p.Moneda_base),
      state.currency,
      "Todas las monedas",
    );
    $("subcategory").disabled = !state.category;
    $("subcategory3").disabled = !state.sub;
    $("sale").checked = state.sale;
    const active = [
      ["section", state.section],
      ["category", state.category],
      ["sub", state.sub],
      ["sub3", state.sub3],
      ["currency", state.currency],
      ["sale", state.sale ? "Ofertas" : ""],
      ["q", state.q],
    ].filter((x) => x[1]);
    $("filter-count").textContent = active.length
      ? "(" + active.length + ")"
      : "";
    $("active-filters").replaceChildren(
      ...active.map(([key, value]) =>
        button(value + " ×", "", () => {
          if (key === "q") $("search-input").value = "";
          setFilter(key, key === "sale" ? false : "");
        }),
      ),
    );
  }
  function renderSections() {
    $("departments").replaceChildren(
      ...sections.map((s) => {
        const count = offers.filter((p) => p.Seccion === s[0]).length;
        const b = button("", "department", () => {
          state.favorites = false;
          setFilter("section", state.section === s[0] ? "" : s[0]);
        });
        b.setAttribute("aria-pressed", String(state.section === s[0]));
        b.append(
          node("span", "department-icon", s[3]),
          node("span", "", s[1]),
          node("small", "", count ? count + " productos" : "Sin productos"),
        );
        return b;
      }),
    );
  }
  function card(p) {
    const article = node("article", "product-card");
    const open = button("", "product-open", () => openProduct(p));
    open.setAttribute("aria-label", "Ver " + p.Titulo_Es);
    const media = node("div", "product-media");
    media.append(image(Number(p.id) === 44 ? "" : p.Imagen_Portada, "", ""));
    if (p.EnOferta === true) media.append(node("span", "badge", "Oferta"));
    const body = node("div", "product-body");
    body.append(
      node("span", "product-category", p.Categoria || p.Seccion),
      node("h3", "", p.Titulo_Es || "Producto"),
    );
    const count = p._choices.length;
    body.append(
      node(
        "span",
        "product-unit",
        count > 1
          ? count + " presentaciones"
          : count === 1
            ? [p.Cantidad_por_Unidad, p.Unidad_de_Medidas]
                .filter(Boolean)
                .join(" ") || label(p._choices[0])
            : "Consultar en la app",
      ),
    );
    const priceEl = node(
      "p",
      "product-price",
      p.Precio_base_UI
        ? money(p.Precio_base_UI, p.Moneda_base || "CUP")
        : "Sin precio",
    );
    if (count > 1) priceEl.prepend(node("small", "", "Desde "));
    body.append(priceEl);
    open.append(media, body);
    const fav = button(
      favorites.has(Number(p.id)) ? "♥" : "♡",
      "favorite",
      () => {
        favorites.has(Number(p.id))
          ? favorites.delete(Number(p.id))
          : favorites.add(Number(p.id));
        save();
        render();
      },
    );
    fav.setAttribute(
      "aria-label",
      (favorites.has(Number(p.id)) ? "Quitar de" : "Guardar en") +
        " favoritos: " +
        p.Titulo_Es,
    );
    fav.setAttribute("aria-pressed", String(favorites.has(Number(p.id))));
    const bottom = node("div", "card-bottom");
    bottom.append(
      node(
        "span",
        "stock-text",
        count ? "Disponible" : "Consulta disponibilidad",
      ),
    );
    const add = button("+", "add-button", () => openProduct(p));
    add.setAttribute("aria-label", "Elegir presentación de " + p.Titulo_Es);
    add.disabled = !count;
    bottom.append(add);
    article.append(open, fav, bottom);
    return article;
  }
  function render() {
    if (!loaded) return;
    $("search-input").value = state.q;
    $("sort-select").value = state.sort;
    $("delivery-note").textContent =
      state.country === "Cuba"
        ? "Catálogo de Cuba · Entregas en Cumanayagua y sus pueblos."
        : "Catálogo de Brasil · Confirma cobertura de entrega en la app.";
    $("catalog-summary").textContent =
      state.country.toUpperCase() + " · PRECIOS ORIENTATIVOS";
    $("catalog-title").textContent = state.favorites
      ? "Tus guardados"
      : state.q
        ? "Resultados para «" + state.q + "»"
        : state.section || "Para ti";
    renderSections();
    renderFilters();
    let rows = rules.sortOffers(rules.filterOffers(offers, state), state.sort);
    if (state.favorites) rows = rows.filter((p) => favorites.has(Number(p.id)));
    $("products").replaceChildren(...rows.slice(0, visible).map(card));
    $("results-line").textContent =
      rows.length +
      " producto" +
      (rows.length === 1 ? "" : "s") +
      " disponible" +
      (rows.length === 1 ? "" : "s");
    $("empty").hidden = rows.length > 0;
    $("more").hidden = rows.length <= visible;
    $("sort-note").hidden =
      !state.sort.startsWith("price-") || !!state.currency;
    $("nav-home").setAttribute(
      "aria-current",
      state.favorites ? "false" : "page",
    );
    $("nav-favorites").setAttribute(
      "aria-current",
      state.favorites ? "page" : "false",
    );
  }
  function showDialog(id) {
    lastDialogTrigger = document.activeElement;
    $(id).showModal();
  }
  function closeDialog(id) {
    $(id).close();
    lastDialogTrigger?.focus?.();
  }
  function quantityControl(value, max, onChange) {
    const box = node("div", "quantity"),
      input = node("input");
    input.type = "number";
    input.min = "1";
    input.max = String(max);
    input.step = "1";
    input.value = String(value);
    input.setAttribute("aria-label", "Cantidad");
    const minus = button("−", "", () => change(Number(input.value) - 1)),
      plus = button("+", "", () => change(Number(input.value) + 1));
    minus.setAttribute("aria-label", "Restar una unidad");
    plus.setAttribute("aria-label", "Añadir una unidad");
    function change(n) {
      n = Math.max(1, Math.min(max, Number.isFinite(n) ? Math.floor(n) : 1));
      input.value = String(n);
      minus.disabled = n <= 1;
      plus.disabled = n >= max;
      onChange(n);
    }
    input.addEventListener("change", () => change(Number(input.value)));
    box.append(minus, input, plus);
    input.value = String(value);
    minus.disabled = value <= 1;
    plus.disabled = value >= max;
    return box;
  }
  function openProduct(p) {
    const token = ++detailGeneration;
    const main = node("div", "detail-main");
    const photo = image(
      Number(p.id) === 44 ? "" : p.Imagen_Portada,
      p.Titulo_Es,
      "detail-image",
    );
    main.append(photo);
    const thumbs = node("div", "detail-thumbs");
    [p.Imagen_Portada, p.Imagen_1, p.Imagen_2, p.Imagen_3, p.Imagen_4]
      .filter(Boolean)
      .filter((x, i, a) => a.indexOf(x) === i)
      .forEach((src, i) => {
        if (Number(p.id) === 44 && i === 0) return;
        const b = button("", "", () => {
          if (photo.tagName === "IMG") {
            const url = new URL(src);
            if (url.protocol === "https:") photo.src = url.href;
          }
        });
        b.setAttribute("aria-label", "Ver imagen " + (i + 1));
        b.append(image(src, "", ""));
        thumbs.append(b);
      });
    main.append(thumbs);
    const title = node("h2", "", p.Titulo_Es);
    title.id = "detail-title";
    main.append(title, node("p", "product-category", p.Categoria || p.Seccion));
    const vv = choices(p),
      priceEl = node("p", "product-price");
    let selected = vv[0],
      qty = 1;
    const desc = node(
      "p",
      "description",
      p.Descripcion_Es || "Consulta los detalles de este producto en la app.",
    );
    main.append(desc);
    const select = node("select");
    select.id = "variant-select";
    vv.forEach((v, i) => {
      const opt = node(
        "option",
        "",
        label(v) +
          " · " +
          money(price(v, p), v.Moneda_base || p.Moneda_base || "CUP"),
      );
      opt.value = String(i);
      select.append(opt);
    });
    const lab = node("label", "", "Elige una presentación");
    lab.htmlFor = "variant-select";
    main.append(lab, select, priceEl);
    const stockEl = node("p", "hint");
    main.append(stockEl);
    const actions = node("div", "detail-actions");
    function update() {
      if (token !== detailGeneration) return;
      actions.replaceChildren();
      if (!selected) {
        priceEl.textContent = "Sin presentación disponible";
        stockEl.textContent =
          "No se puede añadir ahora. Consulta el producto en la app.";
        select.disabled = true;
        return;
      }
      const max = Math.min(stock(selected), 99);
      priceEl.textContent = money(
        price(selected, p),
        selected.Moneda_base || p.Moneda_base || "CUP",
      );
      stockEl.textContent =
        "Disponible · Máximo " + max + " unidades por selección";
      actions.append(
        quantityControl(Math.min(qty, max), max, (n) => (qty = n)),
        button("Añadir al carrito", "primary", () => {
          addToCart(p, selected, qty);
          closeDialog("product-dialog");
        }),
      );
    }
    select.addEventListener("change", () => {
      selected = vv[Number(select.value)];
      qty = 1;
      update();
    });
    main.append(
      actions,
      node(
        "p",
        "hint",
        "El carrito no reserva stock. Precio, entrega y disponibilidad se validan otra vez en CumaShop.",
      ),
    );
    const permanent = node("a", "text-button", "Enlace del producto ↗");
    permanent.href = "p.html?id=" + p.id;
    main.append(permanent);
    $("detail-content").replaceChildren(main);
    update();
    showDialog("product-dialog");
  }
  function addToCart(p, v, qty) {
    const found = cart.find(
      (i) => i.offerId === Number(p.id) && i.offerItemId === Number(v.id),
    );
    const next = (found?.quantity || 0) + qty;
    if (next > Math.min(stock(v), 99)) {
      toast("Ya tienes el máximo disponible de esta presentación.");
      return;
    }
    if (!found && cart.length >= 50) {
      toast("Puedes guardar hasta 50 presentaciones.");
      return;
    }
    if (found) found.quantity = next;
    else
      cart.push({
        offerId: Number(p.id),
        offerItemId: Number(v.id),
        quantity: qty,
      });
    save();
    renderCounts();
    toast("Añadido a tu carrito");
  }
  function renderCounts() {
    const count = cart.reduce((n, i) => n + i.quantity, 0);
    document
      .querySelectorAll("[data-cart-count]")
      .forEach((el) => (el.textContent = String(count)));
  }
  function resolveItem(i) {
    const p = offers.find((p) => Number(p.id) === i.offerId),
      v = p && choices(p).find((v) => Number(v.id) === i.offerItemId);
    return { p, v, valid: !!(v && stock(v) >= i.quantity) };
  }
  function renderCart() {
    const box = $("cart-items");
    box.replaceChildren();
    cart.forEach((i, index) => {
      const { p, v, valid: ok } = resolveItem(i);
      const row = node("div", "cart-row" + (ok ? "" : " invalid"));
      row.append(
        image(p && Number(p.id) !== 44 ? p.Imagen_Portada : "", "", ""),
      );
      const info = node("div");
      info.append(
        node("h3", "", p?.Titulo_Es || "Producto no disponible"),
        node(
          "p",
          "",
          v ? label(v) : "Presentación no disponible en " + state.country,
        ),
      );
      if (v)
        info.append(
          node(
            "p",
            "",
            money(price(v, p), v.Moneda_base || p.Moneda_base || "CUP"),
          ),
        );
      const warning = node(
        "p",
        "cart-warning",
        "Revisa o elimina este artículo antes de copiar.",
      );
      warning.hidden = ok;
      info.append(
        quantityControl(i.quantity, v ? Math.min(stock(v), 99) : 99, (n) => {
          i.quantity = n;
          save();
          renderCounts();
          warning.hidden = resolveItem(i).valid;
          row.className = "cart-row" + (resolveItem(i).valid ? "" : " invalid");
          updateCartSummary();
        }),
      );
      info.append(warning);
      const remove = button("×", "remove", () => {
        cart.splice(index, 1);
        save();
        renderCounts();
        renderCart();
      });
      remove.setAttribute(
        "aria-label",
        "Eliminar " + (p?.Titulo_Es || "producto"),
      );
      row.append(info, remove);
      box.append(row);
    });
    if (!cart.length) {
      const empty = node("div", "state-card");
      empty.append(
        node("span", "", "▱"),
        node("h3", "", "Tu carrito está esperando"),
        node(
          "p",
          "",
          "Explora la tienda y elige las presentaciones que te gusten.",
        ),
        button("Explorar productos", "primary", () =>
          closeDialog("cart-dialog"),
        ),
      );
      box.append(empty);
    }
    updateCartSummary();
  }
  function updateCartSummary() {
    let valid = loaded && cart.length > 0;
    const totals = {};
    cart.forEach((i) => {
      const { p, v, valid: ok } = resolveItem(i);
      if (!ok) {
        valid = false;
        return;
      }
      const currency = v.Moneda_base;
      totals[currency] = (totals[currency] || 0) + price(v, p) * i.quantity;
    });
    $("cart-summary").replaceChildren();
    Object.entries(totals).forEach(([currency, total]) => {
      const line = node("div", "total-line");
      line.append(
        node("span", "", "Subtotal orientativo"),
        node("span", "", money(total, currency)),
      );
      $("cart-summary").append(line);
    });
    if (cart.length)
      $("cart-summary").append(
        node(
          "p",
          "hint",
          "Envío no incluido. No se cobra nada aquí; el total definitivo se calcula en la app.",
        ),
      );
    $("cart-transfer").hidden = !cart.length;
    $("copy-cart").disabled = !valid;
    try {
      $("cart-link").value = valid ? rules.encodeCart(state.country, cart) : "";
    } catch (_) {
      $("cart-link").value = "";
      $("copy-cart").disabled = true;
    }
    if (!valid && cart.length)
      $("cart-summary").append(
        node(
          "p",
          "cart-warning",
          "Hay artículos no disponibles. Elimínalos o ajusta sus cantidades.",
        ),
      );
  }
  function openCart() {
    renderCart();
    $("copy-status").textContent = "";
    showDialog("cart-dialog");
  }
  function showIncoming(payload) {
    const content = node("div", "detail-main");
    const title = node("h2", "", "Carrito compartido");
    title.id = "detail-title";
    content.append(
      title,
      node(
        "p",
        "description",
        payload.items.length +
          " presentaciones para " +
          payload.country +
          ". Puedes revisar esta selección sin hacer un pedido. Sustituirá el carrito guardado en este navegador.",
      ),
    );
    content.append(
      button("Revisar este carrito", "primary full", () => {
        const changedCountry = state.country !== payload.country;
        state.country = payload.country;
        cart = payload.items;
        save();
        renderCounts();
        closeDialog("product-dialog");
        if (changedCountry) load().then(openCart);
        else openCart();
      }),
      button("Conservar mi carrito", "secondary full", () =>
        closeDialog("product-dialog"),
      ),
    );
    $("detail-content").replaceChildren(content);
    showDialog("product-dialog");
  }
  $("search-input").value = state.q;
  $("country").value = state.country;
  $("sort-select").value = state.sort;
  $("search-form").addEventListener("submit", (e) => {
    e.preventDefault();
    setFilter("q", $("search-input").value.trim().slice(0, 100));
  });
  $("search-input").addEventListener("input", () => {
    if (!$("search-input").value) setFilter("q", "");
  });
  $("country").addEventListener("change", () => {
    state.country = $("country").value;
    if (cart.length)
      toast(
        "Conservamos tu carrito. Los artículos de otro país no se podrán transferir.",
      );
    state.section = "";
    state.category = "";
    state.sub = "";
    state.sub3 = "";
    state.currency = "";
    save();
    load();
  });
  [
    ["category", "category"],
    ["subcategory", "sub"],
    ["subcategory3", "sub3"],
    ["currency", "currency"],
    ["sort-select", "sort"],
  ].forEach(([id, key]) =>
    $(id).addEventListener("change", () => setFilter(key, $(id).value)),
  );
  $("sale").addEventListener("change", () =>
    setFilter("sale", $("sale").checked),
  );
  function toggleFilters() {
    const open = $("filters").hidden;
    $("filters").hidden = !open;
    $("filter-toggle").setAttribute("aria-expanded", String(open));
  }
  $("filter-toggle").addEventListener("click", toggleFilters);
  function reset() {
    Object.assign(state, {
      q: "",
      section: "",
      category: "",
      sub: "",
      sub3: "",
      currency: "",
      sale: false,
      favorites: false,
    });
    syncUrl();
    render();
  }
  $("reset-filters").addEventListener("click", reset);
  $("empty-reset").addEventListener("click", reset);
  $("all-sections").addEventListener("click", () => setFilter("section", ""));
  $("more").addEventListener("click", () => {
    visible += 16;
    render();
  });
  $("retry").addEventListener("click", load);
  $("nav-home").addEventListener("click", () => {
    reset();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  $("nav-sections").addEventListener("click", () => {
    $("filters").hidden = false;
    $("filter-toggle").setAttribute("aria-expanded", "true");
    $("departments").scrollIntoView({ behavior: "smooth", block: "center" });
  });
  $("nav-favorites").addEventListener("click", () => {
    state.favorites = true;
    render();
    $("catalog-title").scrollIntoView({ behavior: "smooth", block: "center" });
  });
  ["nav-cart", "header-cart"].forEach((id) =>
    $(id).addEventListener("click", openCart),
  );
  document
    .querySelectorAll("[data-close]")
    .forEach((b) =>
      b.addEventListener("click", () => closeDialog(b.dataset.close)),
    );
  ["product-dialog", "cart-dialog"].forEach((id) =>
    $(id).addEventListener("click", (e) => {
      if (e.target === $(id)) {
        const r = $(id).getBoundingClientRect();
        if (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        )
          closeDialog(id);
      }
    }),
  );
  $("copy-cart").addEventListener("click", async () => {
    updateCartSummary();
    if ($("copy-cart").disabled) return;
    try {
      await navigator.clipboard.writeText($("cart-link").value);
      $("copy-status").textContent =
        "Enlace copiado. Abre CumaShop para importar y revisar el carrito.";
    } catch (_) {
      $("cart-link").focus();
      $("cart-link").select();
      $("copy-status").textContent =
        "Selecciona y copia el enlace de abajo. Tu navegador no permitió copiar automáticamente.";
    }
  });
  window.addEventListener("storage", (e) => {
    if (e.key === storageKey)
      toast("Tu selección cambió en otra pestaña. Recarga para verla.");
  });
  load();
})();
