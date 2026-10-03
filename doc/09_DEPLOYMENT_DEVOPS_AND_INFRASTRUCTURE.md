# 🍄 Mushroom Business Management & E-Commerce Platform (Mushroom ERP)
## Document 09: DevOps, Infrastructure & Deployment Engineering

**Project Name:** SporeERP  
**Document Code:** DOC-09-DEVOPS  
**Version:** 1.0.0-PROD  
**Deployment Target:** Production Ubuntu 24.04 LTS VPS (Hetzner / DigitalOcean / AWS EC2)  
**Container Engine:** Docker Engine 27+ & Docker Compose v2  

---

## 1. Production Infrastructure Topology

```
                                  INTERNET TRAFFIC
                                         │
                                         ▼
                            [Cloudflare DNS & WAF]
                                         │
                                         ▼ (Port 80/443 SSL)
                        [Nginx Reverse Proxy & Certbot]
                                         │
                        ┌────────────────┴────────────────┐
                        │ (Port 3000)                     │ (Port 6379)
                        ▼                                 ▼
             [Next.js 15 Standalone Node]          [Redis 7 Caching]
                        │
                        ▼ (Port 3306 Internal)
             [MariaDB 11.x InnoDB Engine]
                        │
                        ▼ (Cron Backup)
             [Automated Encrypted S3 Dump]
```

---

## 2. Production Docker Compose Configuration

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: runner
    container_name: spore_nextjs_app
    restart: always
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=mysql://spore_db_user:${DB_PASSWORD}@mariadb:3306/spore_mushroom_erp
      - REDIS_URL=redis://redis:6379
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=https://app.sporemushroom.com
      - RAZORPAY_KEY_ID=${RAZORPAY_KEY_ID}
      - RAZORPAY_KEY_SECRET=${RAZORPAY_KEY_SECRET}
      - RAZORPAY_WEBHOOK_SECRET=${RAZORPAY_WEBHOOK_SECRET}
    depends_on:
      mariadb:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - spore_network

  mariadb:
    image: mariadb:11.4
    container_name: spore_mariadb
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: spore_mushroom_erp
      MYSQL_USER: spore_db_user
      MYSQL_PASSWORD: ${DB_PASSWORD}
    command: >
      --character-set-server=utf8mb4
      --collation-server=utf8mb4_unicode_ci
      --max_connections=100
      --innodb_buffer_pool_size=1G
      --innodb_log_file_size=256M
    volumes:
      - mariadb_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - spore_network

  redis:
    image: redis:7-alpine
    container_name: spore_redis
    restart: always
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - spore_network

  nginx:
    image: nginx:alpine
    container_name: spore_nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    depends_on:
      - app
    networks:
      - spore_network

volumes:
  mariadb_data:
    name: spore_mariadb_volume
  redis_data:
    name: spore_redis_volume

networks:
  spore_network:
    name: spore_app_network
    driver: bridge
```

---

## 3. Automated Database Backup & Disaster Recovery Script

A robust backup script running as a nightly cron job on the production host:

```bash
#!/usr/bin/env bash
# /opt/scripts/backup_spore_db.sh
set -euo pipefail

BACKUP_DIR="/opt/backups/mariadb"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/spore_erp_backup_${TIMESTAMP}.sql.gz"
CONTAINER_NAME="spore_mariadb"
DB_NAME="spore_mushroom_erp"
DB_USER="spore_db_user"
DB_PASS="<SECURE_DB_PASSWORD>"

mkdir -p "${BACKUP_DIR}"

echo "[INFO] Starting MariaDB backup at $(date)..."

# 1. Execute mysqldump with single-transaction for InnoDB consistency
docker exec "${CONTAINER_NAME}" mariadb-dump \
  --user="${DB_USER}" \
  --password="${DB_PASS}" \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  "${DB_NAME}" | gzip > "${BACKUP_FILE}"

echo "[INFO] Backup saved to ${BACKUP_FILE} ($(du -sh "${BACKUP_FILE}" | cut -f1))"

# 2. Sync to Offsite Cloud Storage (e.g. AWS S3 / Cloudflare R2)
# aws s3 cp "${BACKUP_FILE}" "s3://spore-erp-backups/daily/${TIMESTAMP}.sql.gz"

# 3. Retain local backups for 14 days, delete older
find "${BACKUP_DIR}" -type f -name "*.sql.gz" -mtime +14 -delete

echo "[INFO] Backup rotation complete."
```
