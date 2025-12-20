#!/bin/bash

# ============================================
# ALLDEV BACKEND - MANAGEMENT SCRIPT
# ============================================
# Script para gerenciar a aplicação no VPS

set -e

# Configuration
VPS_USER="root"
VPS_HOST="185.11.166.176" # Preencher com IP do VPS
VPS_PORT="22"
DEPLOY_DIR="/opt/alldev-backend/current"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_header() {
    echo -e "\n${BLUE}$1${NC}\n"
}

# Start services
start() {
    print_header "▶️  Iniciando serviços..."
    
    ssh -p $VPS_PORT $VPS_USER@$VPS_HOST << ENDSSH
        cd $DEPLOY_DIR
        docker-compose -f docker-compose.production.yml up -d
        echo "Aguardando serviços..."
        sleep 10
        docker-compose -f docker-compose.production.yml ps
ENDSSH
    
    print_success "Serviços iniciados!"
}

# Stop services
stop() {
    print_header "⏹️  Parando serviços..."
    
    ssh -p $VPS_PORT $VPS_USER@$VPS_HOST << ENDSSH
        cd $DEPLOY_DIR
        docker-compose -f docker-compose.production.yml down
ENDSSH
    
    print_success "Serviços parados!"
}

# Restart services
restart() {
    print_header "🔄 Reiniciando serviços..."
    
    ssh -p $VPS_PORT $VPS_USER@$VPS_HOST << ENDSSH
        cd $DEPLOY_DIR
        docker-compose -f docker-compose.production.yml restart
        echo "Aguardando serviços..."
        sleep 10
        docker-compose -f docker-compose.production.yml ps
ENDSSH
    
    print_success "Serviços reiniciados!"
}

# Show status
status() {
    print_header "📊 Status dos Serviços"
    
    ssh -p $VPS_PORT $VPS_USER@$VPS_HOST << ENDSSH
        cd $DEPLOY_DIR
        docker-compose -f docker-compose.production.yml ps
        echo ""
        echo "💾 Uso de Disco:"
        df -h | grep -E "Filesystem|/dev/vda|/dev/sda"
        echo ""
        echo "📦 Volumes Docker:"
        docker volume ls | grep alldev || echo "Nenhum volume encontrado"
ENDSSH
}

# Update application
update() {
    print_header "🔄 Atualizando aplicação..."
    
    print_warning "Fazendo backup antes da atualização..."
    ./scripts/backup.sh backup
    
    print_warning "Baixando nova versão..."
    
    ssh -p $VPS_PORT $VPS_USER@$VPS_HOST << ENDSSH
        cd $DEPLOY_DIR
        
        # Pull latest code (if using git)
        # git pull origin main
        
        # Rebuild containers
        docker-compose -f docker-compose.production.yml build --no-cache api
        
        # Stop services
        docker-compose -f docker-compose.production.yml down
        
        # Start services
        docker-compose -f docker-compose.production.yml up -d
        
        # Run migrations
        echo "Executando migrações..."
        sleep 10
        docker-compose -f docker-compose.production.yml exec -T api npm run prisma:migrate:deploy
        
        echo "Atualização concluída!"
ENDSSH
    
    print_success "Aplicação atualizada!"
}

# Health check
health() {
    print_header "🏥 Verificando saúde da aplicação"
    
    echo "Testando API..."
    if curl -f -s https://api.alldev.pt/api/health | jq . 2>/dev/null; then
        print_success "API está saudável!"
    else
        print_warning "API não está respondendo corretamente"
    fi
    
    echo ""
    echo "Status dos containers:"
    ssh -p $VPS_PORT $VPS_USER@$VPS_HOST << ENDSSH
        cd $DEPLOY_DIR
        docker-compose -f docker-compose.production.yml ps
ENDSSH
}

# Clean old data
clean() {
    print_header "🧹 Limpando dados antigos"
    
    ssh -p $VPS_PORT $VPS_USER@$VPS_HOST << ENDSSH
        # Clean Docker
        echo "Limpando containers parados..."
        docker container prune -f
        
        echo "Limpando imagens não utilizadas..."
        docker image prune -a -f
        
        echo "Limpando volumes não utilizados..."
        docker volume prune -f
        
        echo "Limpando build cache..."
        docker builder prune -f
        
        # Clean old backups (keep last 7)
        cd /opt/alldev-backend/backups
        ls -t backup-* 2>/dev/null | tail -n +8 | xargs -r rm -rf
        
        echo "Limpeza concluída!"
ENDSSH
    
    print_success "Limpeza concluída!"
}

# Show help
help() {
    echo "ALLDEV Backend - Script de Gerenciamento"
    echo ""
    echo "Uso: $0 <comando>"
    echo ""
    echo "Comandos disponíveis:"
    echo "  start    - Iniciar todos os serviços"
    echo "  stop     - Parar todos os serviços"
    echo "  restart  - Reiniciar todos os serviços"
    echo "  status   - Mostrar status dos serviços"
    echo "  update   - Atualizar aplicação"
    echo "  health   - Verificar saúde da aplicação"
    echo "  clean    - Limpar dados antigos"
    echo "  help     - Mostrar esta ajuda"
    echo ""
}

# Main
case "${1:-help}" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    status)
        status
        ;;
    update)
        update
        ;;
    health)
        health
        ;;
    clean)
        clean
        ;;
    help|*)
        help
        ;;
esac
