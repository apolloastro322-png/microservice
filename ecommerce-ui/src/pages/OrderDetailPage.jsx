import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrderWithProducts } from "../api/aggregate";
import { payOrder } from "../api/orderApi";
import AsyncView from "../components/AsyncView";
import OrderStatusBadge from "../components/OrderStatusBadge";
import ProductImage from "../components/ProductImage";
import { useAsync } from "../hooks/useAsync";
import { describeError, formatDateTime, formatRupiah } from "../utils/format";

export default function OrderDetailPage() {
  const { id } = useParams();
  const { loading, data, error, reload } = useAsync(
    () => getOrderWithProducts(id),
    [id],
  );
  const [actionError, setActionError] = useState(null);
  const [paying, setPaying] = useState(false);

  async function pay() {
    setActionError(null);
    setPaying(true);
    try {
      await payOrder(id);
      reload();
    } catch (err) {
      setActionError(err);
    } finally {
      setPaying(false);
    }
  }

  return (
    <section>
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-sm text-muted-foreground"
      >
        <Link
          to="/orders"
          className="rounded transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Pesanan
        </Link>
        <span aria-hidden="true">/</span>
        <span className="min-w-0 truncate font-medium text-foreground">
          {data ? `#${data.id}` : "Detail pesanan"}
        </span>
      </nav>

      {actionError && (
        <Alert variant="destructive" className="mt-3">
          <AlertDescription>{describeError(actionError)}</AlertDescription>
        </Alert>
      )}

      <AsyncView loading={loading} error={error} onRetry={reload}>
        {data && (
          <>
            <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  Pesanan #{data.id}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDateTime(data.created_at)} · User {data.user_id}
                </p>
              </div>
              <OrderStatusBadge status={data.status} />
            </div>

            <Card className="mt-5">
              <CardHeader>
                <CardTitle>Item pesanan</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border">
                  {data.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 py-3"
                    >
                      <ProductImage
                        product={{
                          name: item.product_name,
                          image: item.product?.image,
                        }}
                        className="h-28 w-28 shrink-0 rounded-xl border border-border"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">
                          {item.product_name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatRupiah(item.unit_price)} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold tabular-nums text-foreground">
                        {formatRupiah(item.subtotal)}
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="mt-1 flex items-center justify-between border-t border-border pt-3 text-base font-semibold text-foreground">
                  <span>Total</span>
                  <span className="tabular-nums">
                    {formatRupiah(data.total_amount)}
                  </span>
                </div>

                {data.status === "PENDING" && (
                  <Button
                    type="button"
                    disabled={paying}
                    onClick={pay}
                    className="mt-4 w-full sm:w-auto"
                  >
                    {paying ? "Memproses..." : "Bayar sekarang"}
                  </Button>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </AsyncView>
    </section>
  );
}
