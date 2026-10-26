# OFSMS frontend (Next.js) image for Railway, or any Docker host.
FROM node:22-bookworm-slim

WORKDIR /app

# NEXT_PUBLIC_* values are baked into the browser bundle at build time, so they must be
# present here. On Railway, service variables with these names are passed in automatically.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_S3_BUCKET_NAME
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_S3_BUCKET_NAME=$NEXT_PUBLIC_S3_BUCKET_NAME \
    NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build && npm prune --omit=dev

ENV NODE_ENV=production
# Railway injects PORT; `next start` reads it
EXPOSE 3000
CMD ["npm", "start"]
