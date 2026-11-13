const test = require("node:test");
const assert = require("node:assert/strict");
let rules;
try {
  rules = require("../js/store-rules.js");
} catch {
  rules = {};
}
test("cart canonicalization only accepts positive safe IDs and bounded quantities", () => {
  assert.equal(typeof rules.cartItems, "function");
  assert.deepEqual(
    rules.cartItems([
      { offerId: 31, offerItemId: 1, quantity: 2 },
      { offerId: 31, offerItemId: 1, quantity: 3 },
    ]),
    [{ offerId: 31, offerItemId: 1, quantity: 5 }],
  );
  assert.throws(() =>
    rules.cartItems([{ offerId: 0, offerItemId: 1, quantity: 1 }]),
  );
  assert.throws(() =>
    rules.cartItems([{ offerId: 31, offerItemId: 1, quantity: 100 }]),
  );
});
test("cart URL roundtrip has version and no client-controlled prices", () => {
  assert.equal(typeof rules.encodeCart, "function");
  const link = rules.encodeCart("Cuba", [
    { offerId: 31, offerItemId: 1, quantity: 2, price: 1 },
  ]);
  assert.match(link, /^https:\/\/ledexsoft\.com\/tienda\.html\?carrito=/);
  assert.deepEqual(rules.decodeCart(link).items, [
    { offerId: 31, offerItemId: 1, quantity: 2 },
  ]);
  assert.throws(() => rules.decodeCart("https://evil.example/?carrito=x"));
});
test("filters match country section category stock and normalized search", () => {
  assert.equal(typeof rules.filterOffers, "function");
  let rows = [
    {
      id: 1,
      Pais: "Cuba",
      Seccion: "Alimentos",
      Categoria: "Frutas",
      Titulo_Es: "Piña",
      Stock_Disponible: true,
    },
    {
      id: 2,
      Pais: "Brasil",
      Seccion: "Alimentos",
      Titulo_Es: "Piña",
      Stock_Disponible: true,
    },
  ];
  assert.deepEqual(
    rules.filterOffers(rows, { country: "Cuba", q: "pina" }).map((x) => x.id),
    [1],
  );
});
test("price sorting never compares different currencies and missing price sorts last", () => {
  assert.equal(typeof rules.sortOffers, "function");
  let rows = [
    { id: 1, Moneda_base: "USD", Precio_base_UI: 2 },
    { id: 2, Moneda_base: "CUP", Precio_base_UI: 20 },
    { id: 3, Moneda_base: "CUP", Precio_base_UI: 0 },
  ];
  assert.deepEqual(
    rules.sortOffers(rows, "price-low").map((x) => x.id),
    [2, 3, 1],
  );
});
test("malformed versions, quantities, IDs and oversized carts are rejected", () => {
  for (const items of [
    [{ offerId: 1, offerItemId: 2, quantity: 0 }],
    [{ offerId: 1, offerItemId: 2, quantity: 1.5 }],
    Array.from({ length: 51 }, (_, i) => ({
      offerId: i + 1,
      offerItemId: i + 1,
      quantity: 1,
    })),
  ])
    assert.throws(() => rules.encodeCart("Cuba", items));
  for (const data of [
    { v: 2, country: "Cuba", items: [] },
    { v: 1, country: "USA", items: [] },
    {
      v: 1,
      country: "Cuba",
      items: [{ offerId: "1", offerItemId: 2, quantity: 1 }],
    },
  ])
    assert.throws(() =>
      rules.decodeCart(
        "https://ledexsoft.com/tienda.html?carrito=" +
          Buffer.from(JSON.stringify(data)).toString("base64url"),
      ),
    );
});
test("currency-specific filtering and unavailable stock are explicit", () => {
  const rows = [
    { id: 1, Pais: "Cuba", Moneda_base: "CUP", Stock_Disponible: true },
    { id: 2, Pais: "Cuba", Moneda_base: "USD", Stock_Disponible: true },
    { id: 3, Pais: "Cuba", Moneda_base: "CUP", Stock_Disponible: false },
  ];
  assert.deepEqual(
    rules
      .filterOffers(rows, { country: "Cuba", currency: "CUP", available: true })
      .map((x) => x.id),
    [1],
  );
});

test("cart URL rejects ambiguous authority, repeated parameters and fragments", () => {
  const url = rules.encodeCart("Cuba", [
    { offerId: 1, offerItemId: 2, quantity: 1 },
  ]);
  for (const bad of [
    url.replace("https://", "https://user@"),
    url + "#x",
    url + "&carrito=abc",
    url.replace(".com/", ".com:444/"),
  ])
    assert.throws(() => rules.decodeCart(bad));
});
