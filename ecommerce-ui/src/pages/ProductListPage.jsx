import { getProductsWithRating } from "../api/aggregate";
import AsyncView from "../components/AsyncView";
import ProductCard from "../components/ProductCard";
import { ProductListSkeleton } from "../components/Skeletons";
import { useAsync } from "../hooks/useAsync";

export default function ProductListPage() {
  const { loading, data, error, reload } = useAsync(getProductsWithRating);

  return (
    <section>
      <div className="swatch-cut relative overflow-hidden rounded-3xl bg-primary px-6 py-12 text-primary-foreground sm:px-10 sm:py-16">
        <div
          aria-hidden="true"
          className="bg-grid-ink pointer-events-none absolute inset-0 opacity-50"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-24 h-80 w-80 rounded-full border-[3.5rem] border-black/5"
        />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 right-24 h-24 w-24 rotate-12 rounded-2xl bg-black/5" />
        <div className="relative">
          <h1 className="max-w-2xl text-4xl font-bold leading-[1.02] tracking-tight sm:text-6xl">
            Elektronik &amp; aksesoris pilihan
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-primary-foreground/70 sm:text-base">
            Harga jelas, stok ter-update, dan ulasan asli dari pembeli.
          </p>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight text-foreground">
          <span aria-hidden="true" className="h-5 w-1 rounded-full bg-primary" />
          Semua produk
        </h2>
        {data && (
          <p className="text-sm text-muted-foreground">{data.length} produk tersedia</p>
        )}
      </div>
      <AsyncView
        loading={loading}
        error={error}
        onRetry={reload}
        skeleton={<ProductListSkeleton />}
      >
        {data && (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </AsyncView>
    </section>
  );
}
