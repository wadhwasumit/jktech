# Use Node.js to build the Angular app
FROM node:18-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build --prod

# Use Nginx to serve the frontend
FROM nginx:1.21-alpine
COPY --from=builder /app/dist/post-app/browser /usr/share/nginx/html
COPY ./default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
