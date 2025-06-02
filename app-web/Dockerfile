# app-web/Dockerfile

# Gunakan base image Node.js versi LTS Alpine (ringan)
FROM node:18-alpine AS builder

# Tetapkan direktori kerja di dalam kontainer
WORKDIR /usr/src/app

# Salin package.json dan package-lock.json (atau yarn.lock)
COPY package*.json ./
# Jika menggunakan yarn, salin yarn.lock
# COPY yarn.lock ./

# Install dependensi produksi
RUN npm install --omit=dev
# Jika menggunakan yarn:
# RUN yarn install --production --frozen-lockfile

# Salin sisa kode aplikasi
COPY . .

# Expose port yang digunakan aplikasi (port internal kontainer)
# Ini harus sesuai dengan APP_PORT di server.js atau .env
EXPOSE 3001

# Perintah untuk menjalankan aplikasi saat kontainer dimulai
CMD ["node", "server.js"]
