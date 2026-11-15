import { request } from "./http";

const BASE_URL = import.meta.env.VITE_CART_URL;

// Navbar memakai event ini untuk memperbarui jumlah item di keranjang.
export const notifyCartChanged = () =>
  window.dispatchEvent(new Event("cart:changed"));

export const getCart = (userId) =>
  request(BASE_URL, `/carts/${userId}`).then((res) => res.data);

export const addToCart = (userId, productId, quantity) =>
  request(BASE_URL, "/carts", {
    method: "POST",
    body: { user_id: userId, product_id: productId, quantity },
  }).then((res) => {
    notifyCartChanged();
    return res.data;
  });

export const updateCartItem = (itemId, quantity) =>
  request(BASE_URL, `/carts/items/${itemId}`, {
    method: "PUT",
    body: { quantity },
  }).then((res) => {
    notifyCartChanged();
    return res.data;
  });

export const removeCartItem = (itemId) =>
  request(BASE_URL, `/carts/items/${itemId}`, { method: "DELETE" }).then(
    (res) => {
      notifyCartChanged();
      return res;
    },
  );

export const clearCart = (userId) =>
  request(BASE_URL, `/carts/${userId}`, { method: "DELETE" }).then((res) => {
    notifyCartChanged();
    return res;
  });
