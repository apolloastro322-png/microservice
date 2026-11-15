import { request } from "./http";

const BASE_URL = import.meta.env.VITE_REVIEW_URL;

export const getProductReviews = (productId) =>
  request(BASE_URL, `/reviews/product/${productId}`).then((res) => res.data);

export const createReview = ({ productId, userId, rating, comment }) =>
  request(BASE_URL, "/reviews", {
    method: "POST",
    body: { product_id: productId, user_id: userId, rating, comment },
  }).then((res) => res.data);

export const updateReview = (reviewId, { rating, comment }) =>
  request(BASE_URL, `/reviews/${reviewId}`, {
    method: "PUT",
    body: { rating, comment },
  }).then((res) => res.data);

export const deleteReview = (reviewId) =>
  request(BASE_URL, `/reviews/${reviewId}`, { method: "DELETE" }).then(
    (res) => res.data,
  );
