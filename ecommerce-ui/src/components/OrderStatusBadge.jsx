import { Badge } from "@/components/ui/badge";

const STATUS = {
  PENDING: { label: "Belum dibayar", variant: "secondary" },
  PAID: { label: "Sudah dibayar", variant: "default" },
};

export default function OrderStatusBadge({ status }) {
  const { label, variant } = STATUS[status] ?? {
    label: status,
    variant: "outline",
  };
  return <Badge variant={variant}>{label}</Badge>;
}
