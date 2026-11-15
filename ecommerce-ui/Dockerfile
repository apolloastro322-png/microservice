# Dockerfile
# Resep image untuk ecommerce-ui: React + Vite di-build jadi file statis, lalu disajikan
# vite preview. Build-nya statis, jadi perubahan code UI butuh `--build`, bukan restart.

FROM node:22-alpine
WORKDIR /app

# package*.json dulu supaya layer npm ci bisa di-cache dan tidak diulang setiap kode berubah.
COPY package*.json ./
RUN npm ci

# Hanya file yang dibutuhkan build yang disalin. .env ikut karena VITE_* ditanam saat build.
# node_modules dan dist sengaja tidak ikut; kalau ada config root baru, tambahkan COPY di sini.
COPY index.html vite.config.js .env ./
COPY public ./public
COPY src ./src

RUN npm run build

EXPOSE 5173
# vite preview sudah menangani fallback SPA, jadi refresh di /cart tidak 404.
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "5173", "--strictPort"]
