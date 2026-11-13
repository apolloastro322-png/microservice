import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { formatRupiah } from "../utils/format";
import ProductImage from "./ProductImage";
import StarRating from "./StarRating";
import StockBadge from "./StockBadge";

export default function ProductCard({ product }) {
  const { id, name, price, stock, rating } = product;
  return (
    <Link
      to={`/products/${id}`}
      className="group block min-w-0 rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="flex flex-col gap-0 py-0 transition duration-200 group-hover:-translate-y-1 group-hover:shadow-xl group-hover:shadow-primary/10 group-hover:ring-primary/40">
        <div className="relative block">
          <ProductImage
            product={product}
            className="aspect-[3/2] w-full sm:aspect-[4/3]"
          />
          <StockBadge stock={stock} className="absolute left-3 top-3 shadow-sm" />
        </div>
        <CardContent className="flex flex-1 flex-col gap-1.5 p-4">
          <h3
            title={name}
            className="truncate font-medium leading-snug text-foreground transition-colors group-hover:text-primary"
          >
            {name}
          </h3>
          {rating ? (
            <StarRating
              average={rating.average_rating}
              total={rating.total_reviews}
            />
          ) : (
            <span className="text-xs text-muted-foreground">
              Rating tidak tersedia
            </span>
          )}
          <p className="mt-auto pt-2 text-lg font-semibold tabular-nums text-foreground transition-colors group-hover:text-primary">
            {formatRupiah(price)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
