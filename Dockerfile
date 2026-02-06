FROM node:20-alpine

WORKDIR /usr/src/app

# Pnpm kurulumu
RUN npm install -g pnpm

# Bağımlılıkları kopyala
COPY package.json pnpm-lock.yaml ./

# Bağımlılıkları yükle
RUN pnpm install

# Kaynak kodları kopyala
COPY . .

# Build (Production için gerekli, dev için opsiyonel ama iyi pratik)
RUN pnpm build

EXPOSE 3281

# Development modunda başlat
CMD ["pnpm", "run", "start:dev"]
