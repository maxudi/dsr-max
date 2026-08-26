FROM nginx:alpine

# Remove default nginx page
RUN rm -rf /usr/share/nginx/html/*

# Copy all HTML files
COPY *.html /usr/share/nginx/html/

# Custom nginx config: gzip + security headers
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
