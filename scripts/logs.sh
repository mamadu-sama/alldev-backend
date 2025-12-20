#!/bin/bash

# ============================================
# ALLDEV BACKEND - LOGS VIEWER
# ============================================
# Script para visualizar logs dos serviços

set -e

# Configuration
VPS_USER="root"
VPS_HOST="185.11.166.176" # Preencher com IP do VPS
VPS_PORT="22"
DEPLOY_DIR="/opt/alldev-backend/current"

# Colors
BLUE='\033[0;34m'
NC='\033[0m'

show_logs() {
    local service=${1:-api}
    local lines=${2:-100}
    
    echo -e "${BLUE}📋 Logs do serviço: $service (últimas $lines linhas)${NC}\n"
    
    ssh -p $VPS_PORT $VPS_USER@$VPS_HOST << ENDSSH
        cd $DEPLOY_DIR
        docker-compose -f docker-compose.production.yml logs --tail=$lines -f $service
ENDSSH
}

# Show available services
list_services() {
    echo "Serviços disponíveis:"
    echo "  - api       (Backend Node.js)"
    echo "  - db        (PostgreSQL)"
    echo "  - redis     (Redis Cache)"
    echo "  - nginx     (Reverse Proxy)"
    echo "  - certbot   (SSL Certificates)"
    echo ""
    echo "Uso: $0 [serviço] [linhas]"
    echo "Exemplo: $0 api 50"
}

# Main
if [ "$1" == "help" ] || [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
    list_services
    exit 0
fi

show_logs "$1" "$2"
