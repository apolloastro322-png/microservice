import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCartDetail } from "../api/aggregate";
import {
  clearCart,
  notifyCartChanged,
  removeCartItem,
  updateCartItem,
} from "../api/cartApi";
import { checkout } from "../api/orderApi";
import AsyncView from "../components/AsyncView";
import { BagIcon } from "../components/Icons";
import ProductImage from "../components/ProductImage";
import QuantityStepper from "../components/QuantityStepper";
import { CartSkeleton } from "../components/Skeletons";
import { useAsync } from "../hooks/useAsync";
import { describeError, formatRupiah } from "../utils/format";

export default function CartPage({ userId }) {
  const navigate = useNavigate();
  const { loading, data, error, reload } = useAsync(
    () => getCartDetail(userId),
    [userId],
  );
  const [actionError, setActionError] = useState(null);
  const [pending, setPending] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  async function run(action, { refresh = true } = {}) {
    setActionError(null);
    setPending(true);
    try {
      await action();
      if (refresh) reload();
    } catch (err) {
      setActionError(err);
    } finally {
      setPending(false);
    }
  }

  function removeItem(item) {
    setConfirmAction({
      title: "Hapus item?",
      description: `${item.product?.name ?? "Produk ini"} akan dihapus dari keranjang.`,
      confirmLabel: "Hapus",
      variant: "destructive",
      action: () => run(() => removeCartItem(item.id)),
    });
  }

  function clearAll() {
    setConfirmAction({
      title: "Kosongkan keranjang?",
      description: "Semua item di keranjang akan dihapus.",
      confirmLabel: "Kosongkan",
      variant: "destructive",
      action: () => run(() => clearCart(userId)),
    });
  }

  function checkoutNow() {
    setConfirmAction({
      title: "Buat pesanan?",
      description:
        "Pesanan dibuat dari isi keranjang saat ini, lalu keranjang dikosongkan.",
      confirmLabel: "Buat pesanan",
      action: () =>
        run(
          async () => {
            await checkout(userId);
            notifyCartChanged();
            navigate("/orders");
          },
          { refresh: false },
        ),
    });
  }

  const itemCount = data?.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <section>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        Keranjang
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Belanja sebagai user {userId}
      </p>
      {actionError && (
        <Alert variant="destructive" className="mt-3">
          <AlertDescription>{describeError(actionError)}</AlertDescription>
        </Alert>
      )}

      <AsyncView
        loading={loading}
        error={error}
        onRetry={reload}
        skeleton={<CartSkeleton />}
      >
        {data && data.items.length === 0 && (
          <div className="mt-8 rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <BagIcon className="h-6 w-6" />
            </span>
            <p className="mt-4 font-medium text-foreground">
              Keranjang masih kosong
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Yuk pilih produk yang kamu butuhkan.
            </p>
            <Button asChild className="mt-6">
              <Link to="/">Lihat produk</Link>
            </Button>
          </div>
        )}

        {data && data.items.length > 0 && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
              {data.items.map((item) => (
                <li key={item.id} className="flex gap-3 p-4 sm:gap-4 sm:p-5">
                  {item.product ? (
                    <Link
                      to={`/products/${item.product.id}`}
                      tabIndex={-1}
                      aria-hidden="true"
                      className="shrink-0"
                    >
                      <ProductImage
                        product={item.product}
                        className="h-16 w-16 rounded-xl border border-border sm:h-24 sm:w-24"
                      />
                    </Link>
                  ) : (
                    <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl border border-dashed border-border bg-background text-xs text-muted-foreground sm:h-24 sm:w-24">
                      ?
                    </div>
                  )}

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {item.product ? (
                          <Link
                            to={`/products/${item.product.id}`}
                            className="line-clamp-2 rounded font-medium text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                          >
                            {item.product.name}
                          </Link>
                        ) : (
                          <p className="font-medium text-muted-foreground">
                            Produk tidak tersedia
                          </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.product
                            ? `${formatRupiah(item.product.price)} / item`
                            : "Tidak dihitung"}
                        </p>
                      </div>
                      <p className="shrink-0 font-semibold tabular-nums text-foreground">
                        {item.product
                          ? formatRupiah(
                              Number(item.product.price) * item.quantity,
                            )
                          : "-"}
                      </p>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                      <QuantityStepper
                        value={item.quantity}
                        disabled={pending}
                        onChange={(amount) =>
                          run(() => updateCartItem(item.id, amount))
                        }
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="xs"
                        disabled={pending}
                        onClick={() => removeItem(item)}
                      >
                        Hapus
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <Card className="lg:sticky lg:top-24">
              <CardHeader>
                <CardTitle>Ringkasan</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Total item</dt>
                    <dd className="tabular-nums text-foreground">{itemCount}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Subtotal</dt>
                    <dd className="tabular-nums text-foreground">
                      {formatRupiah(data.totalPrice)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-3 text-base font-semibold text-foreground">
                    <dt>Total</dt>
                    <dd className="tabular-nums text-foreground">
                      {formatRupiah(data.totalPrice)}
                    </dd>
                  </div>
                </dl>
                <Button
                  type="button"
                  disabled={pending}
                  onClick={checkoutNow}
                  className="mt-5 w-full"
                >
                  Buat pesanan
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={clearAll}
                  className="mt-2 w-full"
                >
                  Kosongkan keranjang
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </AsyncView>

      <AlertDialog
        open={Boolean(confirmAction)}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
      >
        <AlertDialogContent className="w-[calc(100%-2rem)]">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant={confirmAction?.variant}
              onClick={() => confirmAction?.action()}
            >
              {confirmAction?.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
