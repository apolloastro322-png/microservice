import { getCart } from "./cartApi";
import { getOrder, getOrders } from "./orderApi";
import { getProduct, getProducts } from "./productApi";
import { getProductReviews } from "./reviewApi";

export async function getProductsWithRating() {
  const products = await getProducts();
  return Promise.all(
    products.map(async (product) => {
      try {
        const { summary } = await getProductReviews(product.id);
        return { ...product, rating: summary };
      } catch {
        // review-service bermasalah: produk tetap ditampilkan, hanya rating-nya kosong.
        return { ...product, rating: null };
      }
    }),
  );
}

export async function getProductDetail(productId) {
  const [productResult, reviewResult] = await Promise.allSettled([
    getProduct(productId),
    getProductReviews(productId),
  ]);
  if (productResult.status === "rejected") throw productResult.reason;
  return {
    product: productResult.value,
    reviews: reviewResult.status === "fulfilled" ? reviewResult.value : null,
  };
}

export async function getCartDetail(userId) {
  const cart = await getCart(userId);

  const items = await Promise.all(
    cart.items.map(async (item) => {
      try {
        const product = await getProduct(item.product_id);
        return { ...item, product };
      } catch {
        // produk sudah dihapus, atau product-service sedang bermasalah.

        return { ...item, product: null };
      }
    }),
  );

  const totalPrice = items.reduce(
    (sum, item) =>
      sum + (item.product ? Number(item.product.price) * item.quantity : 0),
    0,
  );

  return { items, totalPrice };
}

// Thumbnail diambil dari product-service per produk unik. Produk yang sudah
// dihapus atau service yang mati tidak boleh menggagalkan riwayat pesanan.
async function productsById(ids) {
  const unique = [...new Set(ids)];
  const entries = await Promise.all(
    unique.map(async (id) => {
      try {
        return [id, await getProduct(id)];
      } catch {
        return [id, null];
      }
    }),
  );
  return new Map(entries);
}

async function withProducts(orders) {
  const products = await productsById(
    orders.flatMap((order) => order.items.map((item) => item.product_id)),
  );

  return orders.map((order) => ({
    ...order,
    items: order.items.map((item) => ({
      ...item,
      product: products.get(item.product_id) ?? null,
    })),
  }));
}

export const getOrdersWithProducts = (userId, status) =>
  getOrders(userId, status).then(withProducts);

export const getOrderWithProducts = (id) =>
  getOrder(id).then((order) => withProducts([order])).then(([order]) => order);
