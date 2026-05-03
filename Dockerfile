FROM nginx:alpine

# Copy static site files
COPY resurgence-web/ /usr/share/nginx/html/

# Remove non-web files
RUN rm -f /usr/share/nginx/html/CNAME \
          /usr/share/nginx/html/Dockerfile \
          /usr/share/nginx/html/LICENSE \
          /usr/share/nginx/html/README.md \
          /usr/share/nginx/html/robots.txt.bak \
          /usr/share/nginx/html/verify-seo.sh \
    && rm -rf /usr/share/nginx/html/.git \
              /usr/share/nginx/html/.vscode \
              /usr/share/nginx/html/test-results \
              /usr/share/nginx/html/test-scripts \
              /usr/share/nginx/html/analytics-report.txt

# Nginx config for SPA-like behaviour and caching
RUN printf 'server {\n\
    listen 80;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    charset utf-8;\n\
\n\
    location / {\n\
        try_files $uri $uri/ =404;\n\
    }\n\
\n\
    # Service Worker must never be cached\n\
    location = /sw.js {\n\
        add_header Cache-Control "no-cache, no-store, must-revalidate";\n\
        add_header Pragma "no-cache";\n\
        expires 0;\n\
    }\n\
\n\
    # Web components must revalidate\n\
    location /components/ {\n\
        add_header Cache-Control "no-cache, must-revalidate";\n\
        expires 0;\n\
    }\n\
\n\
    # Cache static assets aggressively\n\
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp|avif)$ {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
    }\n\
\n\
    # No cache for HTML pages\n\
    location ~* \\.html$ {\n\
        add_header Cache-Control "no-cache, no-store, must-revalidate";\n\
        add_header Pragma "no-cache";\n\
        expires 0;\n\
    }\n\
\n\
    # Security headers\n\
    add_header X-Frame-Options "SAMEORIGIN" always;\n\
    add_header X-Content-Type-Options "nosniff" always;\n\
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;\n\
\n\
    # Gzip compression\n\
    gzip on;\n\
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;\n\
    gzip_min_length 256;\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
