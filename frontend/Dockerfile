FROM node:22-alpine AS build
WORKDIR /app
RUN npm install --global pnpm@12.11.2
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ENV VITE_API_URL=/
RUN pnpm build

FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
