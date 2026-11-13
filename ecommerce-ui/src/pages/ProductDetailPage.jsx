import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getProductDetail } from "../api/aggregate";
import { addToCart } from "../api/cartApi";
import AsyncView from "../components/AsyncView";
import ProductImage from "../components/ProductImage";
import QuantityStepper from "../components/QuantityStepper";
import ReviewForm from "../components/ReviewForm";
import StarRating from "../components/StarRating";
import { ProductDetailSkeleton } from "../components/Skeletons";
import { useAsync } from "../hooks/useAsync";
import { describeError, formatRupiah } from "../utils/format";

export default function ProductDetailPage({ userId }) {
  const { id } = useParams(); // nilai :id dari alamat /products/:id
  const { loading, data, error, reload } = useAsync(
    () => getProductDetail(id),
    [id],
  );

  const [quantity, setQuantity] = useState(1);
  const [cartMessage, setCartMessage] = useState(null);
  const [adding, setAdding] = useState(false);

  async function handleAddToCart() {
    setAdding(true);
    try {
      await addToCart(userId, Number(id), Math.max(1, quantity));
      setCartMessage({ type: "success", text: "Produk masuk ke keranjang." });
    } catch (err) {
      setCartMessage({ type: "error", text: describeError(err) });
    } finally {
      setAdding(false);
    }
  }

  return (
    <section>
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-sm text-muted-foreground"
      >
        <Link
          to="/"
          className="rounded transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Produk
        </Link>
        <span aria-hidden="true">/</span>
        <span className="min-w-0 truncate font-medium text-foreground">
          {data?.product.name ?? "Detail produk"}
        </span>
      </nav>

      <AsyncView
        loading={loading}
        error={error}
        onRetry={reload}
        skeleton={<ProductDetailSkeleton />}
      >
        {data && (
          <>
            <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
              <ProductImage
                product={data.product}
                className="mx-auto aspect-square w-full max-w-md rounded-3xl border border-border lg:max-w-none"
              />

              <div className="flex flex-col">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {data.product.name}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                  {data.reviews && (
                    <StarRating
                      average={data.reviews.summary.average_rating}
                      total={data.reviews.summary.total_reviews}
                    />
                  )}
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span
                      aria-hidden="true"
                      className={`inline-block h-1.5 w-1.5 rounded-full ${
                        data.product.stock > 0 ? "bg-primary" : "bg-red-400"
                      }`}
                    />
                    {data.product.stock > 0
                      ? `Stok tersedia (${data.product.stock})`
                      : "Stok habis"}
                  </p>
                </div>

                <p className="mt-5 text-3xl font-semibold tabular-nums text-primary">
                  {formatRupiah(data.product.price)}
                </p>
                <p className="mt-5 max-w-prose leading-relaxed text-muted-foreground">
                  {data.product.description}
                </p>

                <Card className="mt-8">
                  <CardContent>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Jumlah
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <QuantityStepper
                        value={quantity}
                        onChange={setQuantity}
                        disabled={adding}
                      />
                      <Button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={adding}
                        className="flex-1 py-2.5 sm:flex-none sm:px-8"
                      >
                        {adding ? "Menambahkan..." : "Masukkan ke keranjang"}
                      </Button>
                    </div>
                    {cartMessage && (
                      <Alert
                        role={
                          cartMessage.type === "success" ? "status" : "alert"
                        }
                        variant={
                          cartMessage.type === "success"
                            ? "default"
                            : "destructive"
                        }
                        className={
                          cartMessage.type === "success"
                            ? "mt-3 border-primary/30 bg-primary/10"
                            : "mt-3"
                        }
                      >
                        <AlertDescription
                          className={
                            cartMessage.type === "success"
                              ? "text-primary"
                              : undefined
                          }
                        >
                          {cartMessage.text}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Ulasan pembeli
                </h2>
                {data.reviews ? (
                  <ul className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card px-5">
                    {data.reviews.reviews.map((review) => (
                      <li key={review.id} className="py-4">
                        <small className="text-xs text-muted-foreground">
                          User {review.user_id}
                        </small>
                        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                          <StarRating
                            average={review.rating}
                            total={1}
                            compact
                          />
                          <small className="text-xs text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              },
                            )}
                          </small>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-foreground">
                          {review.comment || (
                            <em className="text-muted-foreground">
                              Tanpa komentar
                            </em>
                          )}
                        </p>
                      </li>
                    ))}
                    {data.reviews.reviews.length === 0 && (
                      <li className="py-6 text-center text-sm text-muted-foreground">
                        Belum ada review. Jadilah yang pertama.
                      </li>
                    )}
                  </ul>
                ) : (
                  <Alert variant="destructive" className="mt-4">
                    <AlertDescription>
                      Review tidak dapat dimuat saat ini.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <ReviewForm
                productId={Number(id)}
                userId={userId}
                onCreated={reload}
              />
            </div>
          </>
        )}
      </AsyncView>
    </section>
  );
}
