import { useState } from "react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getOrdersWithProducts } from "../api/aggregate";
import { payOrder } from "../api/orderApi";
import AsyncView from "../components/AsyncView";
import { BagIcon } from "../components/Icons";
import OrderStatusBadge from "../components/OrderStatusBadge";
import ProductImage from "../components/ProductImage";
import { useAsync } from "../hooks/useAsync";
import { describeError, formatDateTime, formatRupiah } from "../utils/format";

const FILTERS = [
  { value: "", label: "Semua" },
  { value: "PENDING", label: "Belum dibayar" },
  { value: "PAID", label: "Sudah dibayar" },
];

export default function OrdersPage({ userId }) {
  const [status, setStatus] = useState("");
  const { loading, data, error, reload } = useAsync(
    () => getOrdersWithProducts(userId, status),
    [userId, status],
  );
  const [actionError, setActionError] = useState(null);
  const [payingId, setPayingId] = useState(null);

  async function pay(id) {
    setActionError(null);
    setPayingId(id);
    try {
      await payOrder(id);
      reload();
    } catch (err) {
      setActionError(err);
    } finally {
      setPayingId(null);
    }
  }

  return (
    <section>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        Pesanan
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Riwayat pesanan user {userId}
      </p>

      <div
        className="mt-5 flex flex-wrap gap-2"
        role="group"
        aria-label="Filter status pesanan"
      >
        {FILTERS.map((filter) => (
          <Button
            key={filter.value}
            type="button"
            size="sm"
            variant={status === filter.value ? "default" : "outline"}
            aria-pressed={status === filter.value}
            onClick={() => setStatus(filter.value)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {actionError && (
        <Alert variant="destructive" className="mt-3">
          <AlertDescription>{describeError(actionError)}</AlertDescription>
        </Alert>
      )}

      <AsyncView loading={loading} error={error} onRetry={reload}>
        {data && data.length === 0 && (
          <div className="mt-6 rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <BagIcon className="h-6 w-6" />
            </span>
            <p className="mt-4 font-medium text-foreground">
              {status ? "Tidak ada pesanan dengan status ini" : "Belum ada pesanan"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {status
                ? "Coba pilih filter lain."
                : "Pesanan muncul setelah kamu checkout dari keranjang."}
            </p>
            {!status && (
              <Button asChild className="mt-6">
                <Link to="/">Lihat produk</Link>
              </Button>
            )}
          </div>
        )}

        {data && data.length > 0 && (
          <ul className="mt-6 grid items-start gap-4 sm:grid-cols-2">
            {data.map((order) => (
              <li key={order.id}>
                <Card>
                  <CardContent>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground">
                          Pesanan #{order.id}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatDateTime(order.created_at)}
                        </p>
                      </div>
                      <OrderStatusBadge status={order.status} />
                    </div>

                    <ul className="mt-3 divide-y divide-border border-y border-border">
                      {order.items.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center gap-3 py-2 text-sm"
                        >
                          <ProductImage
                            product={{
                              name: item.product_name,
                              image: item.product?.image,
                            }}
                            className="h-24 w-24 shrink-0 rounded-xl border border-border"
                          />
                          <span className="min-w-0 flex-1 truncate text-foreground">
                            {item.product_name}{" "}
                            <span className="text-muted-foreground">
                              × {item.quantity}
                            </span>
                          </span>
                          <span className="shrink-0 tabular-nums text-foreground">
                            {formatRupiah(item.subtotal)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm text-muted-foreground">
                        Total{" "}
                        <span className="text-base font-semibold tabular-nums text-foreground">
                          {formatRupiah(order.total_amount)}
                        </span>
                      </p>
                      <div className="flex gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/orders/${order.id}`}>Detail</Link>
                        </Button>
                        {order.status === "PENDING" && (
                          <Button
                            type="button"
                            size="sm"
                            disabled={payingId === order.id}
                            onClick={() => pay(order.id)}
                          >
                            {payingId === order.id ? "Memproses..." : "Bayar"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </AsyncView>
    </section>
  );
}
