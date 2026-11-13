import { useState } from "react";
import { productImageSrc } from "../utils/image";

export default function ProductImage({ product, className = "" }) {
  const [failed, setFailed] = useState(false);
  const src = failed ? null : productImageSrc(product.image);
  const initial = product.name?.trim().charAt(0).toUpperCase() || "?";

  return (
    <div
      className={`relative grid place-items-center overflow-hidden bg-muted ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={product.name}
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <span
          aria-hidden="true"
          className="text-4xl font-semibold text-muted-foreground/50"
        >
          {initial}
        </span>
      )}
    </div>
  );
}
