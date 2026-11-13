import { Button } from "@/components/ui/button";

export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  disabled = false,
}) {
  const amount = Number(value) || min;
  return (
    <div className="inline-flex items-center overflow-hidden rounded-lg border border-input bg-background">
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        className="rounded-none"
        aria-label="Kurangi jumlah"
        disabled={disabled || amount <= min}
        onClick={() => onChange(amount - 1)}
      >
        &minus;
      </Button>
      <span className="min-w-9 text-center text-sm font-medium tabular-nums text-foreground">
        {amount}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        className="rounded-none"
        aria-label="Tambah jumlah"
        disabled={disabled}
        onClick={() => onChange(amount + 1)}
      >
        +
      </Button>
    </div>
  );
}
