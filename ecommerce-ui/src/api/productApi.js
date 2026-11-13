import { request } from "./http";

const BASE_URL = import.meta.env.VITE_PRODUCT_URL;

export const getProducts = () =>
  request(BASE_URL, "/products").then((res) => res.data);

export const getProduct = (id) =>
  request(BASE_URL, `/products/${id}`).then((res) => res.data);
