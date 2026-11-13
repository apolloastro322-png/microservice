import { Skeleton } from "@/components/ui/skeleton";

// Skeleton per halaman, bentuknya mengikuti layout asli supaya tidak lompat.
function Line({ className }) {
  return <Skeleton className={className} />;
}

export function ProductListSkeleton() {
  return (
    <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-border bg-card"
        >
          <Line className="aspect-[3/2] w-full rounded-none sm:aspect-[4/3]" />
          <div className="space-y-2 p-4">
            <Line className="h-5 w-2/3" />
            <Line className="h-3 w-1/2" />
            <Line className="mt-4 h-6 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
      <Line className="aspect-square w-full rounded-3xl" />
      <div className="space-y-3">
        <Line className="h-8 w-3/4" />
        <Line className="h-4 w-1/2" />
        <Line className="mt-5 h-9 w-1/3" />
        <Line className="h-4 w-full" />
        <Line className="h-4 w-4/5" />
        <div className="mt-6 rounded-2xl border border-border p-4">
          <Line className="h-3 w-16" />
          <div className="mt-3 flex gap-3">
            <Line className="h-9 w-28" />
            <Line className="h-9 w-44" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CartSkeleton() {
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
      <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex gap-4 p-4 sm:p-5">
            <Line className="h-16 w-16 shrink-0 rounded-xl sm:h-24 sm:w-24" />
            <div className="flex-1 space-y-2">
              <Line className="h-4 w-1/2" />
              <Line className="h-3 w-1/4" />
              <Line className="mt-4 h-9 w-28" />
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <Line className="h-5 w-1/2" />
        <Line className="h-4 w-full" />
        <Line className="h-4 w-full" />
        <Line className="h-6 w-2/3" />
        <Line className="mt-2 h-10 w-full" />
      </div>
    </div>
  );
}
