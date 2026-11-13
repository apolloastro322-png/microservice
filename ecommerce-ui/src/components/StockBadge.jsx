import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function StockBadge({ stock, className }) {
  if (stock > 5) return null;
  const empty = stock <= 0;
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border-transparent",
        empty
          ? "bg-red-500/15 text-red-400"
          : "bg-primary/15 text-primary",
        className,
      )}
    >
      {empty ? "Stok habis" : `Tersisa ${stock}`}
    </Badge>
  );
}
