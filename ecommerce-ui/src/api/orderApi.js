import { request } from "./http";

const BASE_URL = import.meta.env.VITE_ORDER_URL;

export const checkout = (userId) =>
  request(BASE_URL, "/orders", {
    method: "POST",
    body: { user_id: userId },
  }).then((res) => res.data);

// status kosong = semua pesanan; backend hanya menerima PENDING atau PAID.
export const getOrders = (userId, status) =>
  request(
    BASE_URL,
    `/orders/user/${userId}${status ? `?status=${status}` : ""}`,
  ).then((res) => res.data);

export const getOrder = (id) =>
  request(BASE_URL, `/orders/${id}`).then((res) => res.data);

export const payOrder = (id) =>
  request(BASE_URL, `/orders/${id}/pay`, { method: "PATCH" }).then(
    (res) => res.data,
  );
