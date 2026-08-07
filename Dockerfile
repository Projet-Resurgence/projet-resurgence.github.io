FROM python:3.12-slim

WORKDIR /app

COPY resurgence-web/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# The whole site (static pages + the Flask app that serves them)
COPY resurgence-web/ /app/

# Non-web files. app.py also refuses to serve the sources that remain.
RUN rm -f /app/CNAME \
          /app/Dockerfile \
          /app/LICENSE \
          /app/README.md \
          /app/robots.txt.bak \
          /app/verify-seo.sh \
          /app/analytics-report.txt \
    && rm -rf /app/.git \
              /app/.vscode \
              /app/test-results \
              /app/test-scripts \
              /app/__pycache__

ENV PYTHONPATH=/app \
    PYTHONUNBUFFERED=1

# Port 80: the nginx vhost proxies projet-resurgence.fr to resurgence-web:80.
EXPOSE 80

CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:80", "--timeout", "60", "app:app"]
