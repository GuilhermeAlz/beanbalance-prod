# Build Angular app
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Serve with nginx
FROM nginx:alpine

COPY --from=build /app/dist/beanbalance-front/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf.template

# DOMAIN is injected at container start via envsubst.
# Only ${DOMAIN} is substituted — nginx variables like $host are left untouched.
ENV DOMAIN=beanbalance.me

EXPOSE 80 443

CMD ["/bin/sh", "-c", "envsubst '${DOMAIN}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && nginx -g 'daemon off;'"]
