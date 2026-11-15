const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export const formatRupiah = (value) => rupiah.format(Number(value));

export const formatDateTime = (value) =>
  new Date(value).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });

export function describeError(error) {
  const details = error.errors ? Object.values(error.errors).flat() : [];
  return details.length
    ? `${error.message}: ${details.join(", ")}`
    : error.message;
}
