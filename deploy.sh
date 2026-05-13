#!/bin/bash
# ============================================
# Deploy TimeTracker a servidor DonWeb/Ferozo
# ============================================
# USO:
#   1. Subir este script al servidor via SCP
#   2. ssh usuario@tu-servidor
#   3. bash deploy.sh

set -e

DOMAIN="${DOMAIN:-tudominio.com}"
APP_DIR="/home/$USER/htdocs/$DOMAIN"
NODE_VERSION="20"

echo "=== 1. Instalar Node.js ==="
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_$NODE_VERSION.x | sudo -E bash -
  sudo apt install -y nodejs
fi

echo "=== 2. Instalar PM2 ==="
if ! command -v pm2 &> /dev/null; then
  npm install -g pm2
fi

echo "=== 3. Clonar/Actualizar repositorio ==="
if [ -d "$APP_DIR" ]; then
  cd "$APP_DIR"
  git pull
else
  mkdir -p "$APP_DIR"
  cd "$APP_DIR"
  git clone https://github.com/TU_USER/time-tracker.git .
fi

echo "=== 4. Configurar variables de entorno ==="
if [ ! -f server/.env ]; then
  cat > server/.env << EOF
DATABASE_URL="file:./prisma/prod.db"
JWT_SECRET=$(openssl rand -hex 32)
CLIENT_URL=https://$DOMAIN
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@$DOMAIN
EOF
fi

echo "=== 5. Instalar dependencias ==="
cd "$APP_DIR"
npm install
cd server && npm install && npx prisma generate && npx prisma db push && cd ..
cd client && npm install && npm run build && cd ..

echo "=== 6. Iniciar con PM2 ==="
cd "$APP_DIR/server"
pm2 delete time-tracker 2>/dev/null || true
pm2 start npm --name time-tracker -- start
pm2 save

echo "=== 7. Configurar Nginx ==="
sudo tee /etc/nginx/sites-available/$DOMAIN << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

echo "=== 8. SSL con Let's Encrypt ==="
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN || true

echo "=== LISTO! =="
echo "App corriendo en https://$DOMAIN"
echo "Usuario: admin@timetracker.com / admin123"
