#!/bin/bash

# ============================================
# ALLDEV BACKEND - SSL SETUP
# ============================================
# Script para configurar SSL certificates com Let's Encrypt

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
VPS_USER="root"
VPS_HOST="185.11.166.176" # Preencher com IP do VPS
VPS_PORT="22"
DEPLOY_DIR="/opt/alldev-backend/current"
DOMAIN="api.alldev.pt"
EMAIL="geral@alldev.pt"

print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

setup_ssl() {
    print_header "🔐 Configurando SSL para $DOMAIN"
    
    ssh -p $VPS_PORT $VPS_USER@$VPS_HOST << ENDSSH
        cd $DEPLOY_DIR
        
        # Check if certificate already exists
        if [ -d "certbot/conf/live/$DOMAIN" ]; then
            echo "Certificado já existe. Renovando..."
            docker-compose -f docker-compose.production.yml run --rm certbot renew
        else
            echo "Solicitando novo certificado..."
            
            # Ensure Nginx is running
            docker-compose -f docker-compose.production.yml up -d nginx
            sleep 5
            
            # Request certificate
            docker-compose -f docker-compose.production.yml run --rm certbot certonly \
                --webroot \
                --webroot-path=/var/www/certbot \
                --email $EMAIL \
                --agree-tos \
                --no-eff-email \
                --force-renewal \
                -d $DOMAIN
        fi
        
        # Reload Nginx to use new certificates
        docker-compose -f docker-compose.production.yml exec nginx nginx -s reload
        
        echo "SSL configurado com sucesso!"
ENDSSH
    
    print_success "SSL certificates instalados!"
    
    # Test HTTPS
    print_warning "Testando HTTPS..."
    sleep 3
    
    if curl -f -s https://$DOMAIN/api/health > /dev/null; then
        print_success "HTTPS funcionando corretamente!"
        echo ""
        echo "✅ Acesse: https://$DOMAIN"
    else
        print_warning "HTTPS ainda não está respondendo. Aguarde alguns minutos."
    fi
}

# Check SSL status
check_ssl() {
    print_header "📊 Status do Certificado SSL"
    
    ssh -p $VPS_PORT $VPS_USER@$VPS_HOST << ENDSSH
        cd $DEPLOY_DIR
        
        if [ -d "certbot/conf/live/$DOMAIN" ]; then
            echo "Certificado encontrado!"
            echo ""
            docker-compose -f docker-compose.production.yml run --rm certbot certificates
        else
            echo "Nenhum certificado encontrado para $DOMAIN"
        fi
ENDSSH
}

# Main
case "${1:-setup}" in
    setup)
        setup_ssl
        ;;
    check)
        check_ssl
        ;;
    renew)
        print_header "♻️  Renovando Certificado SSL"
        ssh -p $VPS_PORT $VPS_USER@$VPS_HOST << ENDSSH
            cd $DEPLOY_DIR
            docker-compose -f docker-compose.production.yml run --rm certbot renew
            docker-compose -f docker-compose.production.yml exec nginx nginx -s reload
ENDSSH
        print_success "Certificado renovado!"
        ;;
    *)
        echo "Uso: $0 {setup|check|renew}"
        exit 1
        ;;
esac
