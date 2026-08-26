FROM nginx:alpine

# Remove default nginx page
RUN rm -rf /usr/share/nginx/html/*

# Copy all HTML files
COPY index.html /usr/share/nginx/html/index.html
COPY dsr.html /usr/share/nginx/html/dsr.html
COPY dsr2.html /usr/share/nginx/html/dsr2.html
COPY SIMULADOR_DSR.html /usr/share/nginx/html/SIMULADOR_DSR.html

# Custom nginx config: gzip + security headers
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
