// product-service menyimpan gambar sebagai base64 mentah (tanpa prefix data URI),
// jadi tipe file ditebak dari beberapa byte pertama.
const PREFIXES = [
  ["iVBORw0KGgo", "image/png"],
  ["/9j/", "image/jpeg"],
  ["R0lGOD", "image/gif"],
];

// Gambar contoh di init.sql hanya 1x1 piksel (~92 karakter base64), jadi tampil
// sebagai blok warna kosong. Untuk itu dipakai tile inisial saja.
// shortcut: batas 1000 karakter, turunkan kalau ada foto produk asli sekecil itu.
const MIN_REAL_IMAGE_LENGTH = 1000;

export function productImageSrc(image) {
  if (typeof image !== "string" || image.length < MIN_REAL_IMAGE_LENGTH) {
    return null;
  }
  const match = PREFIXES.find(([prefix]) => image.startsWith(prefix));
  return match ? `data:${match[1]};base64,${image}` : null;
}
