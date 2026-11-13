export default function StarRating({ average, total, compact = false }) {
  if (!total)
    return (
      <span className="text-xs text-muted-foreground">Belum ada ulasan</span>
    );
  const filled = Math.round(average);

  return (
    <span
      className="inline-flex flex-wrap items-center gap-1 text-sm text-primary"
      title={`${average} dari 5`}
    >
      <span aria-hidden="true" className="tracking-tight">
        {"★".repeat(filled)}
        {"☆".repeat(5 - filled)}
      </span>
      {!compact && (
        <span className="text-xs text-muted-foreground">
          {Number(average).toFixed(1)} ({total} ulasan)
        </span>
      )}
      <span className="sr-only">
        {`${average} dari 5 bintang, ${total} ulasan`}
      </span>
    </span>
  );
}
