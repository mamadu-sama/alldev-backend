#!/bin/bash

# ============================================
# ALLDEV BACKEND - BACKUP SCRIPT
# ============================================
# Script para fazer backup da base de dados
# Autor: Alldev Team

set -e



# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'


# Configuration
VPS_USER="root"
VPS_HOST=" " # Preencher com IP do VPS
VPS_PORT="22"
DEPLOY_DIR="/opt/alldev-backend/current"
BACKUP_DIR="/opt/alldev-backend/backups"
KEEP_BACKUPS=7  # Número de backups a manter

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Create backup
create_backup() {
    echo "🗄️  Criando backup da base de dados..."
    
    ssh -p $VPS_PORT $VPS_USER@$VPS_HOST << ENDSSH
        cd $DEPLOY_DIR
        
        # Create backup directory
        mkdir -p $BACKUP_DIR
        
        # Backup filename with timestamp
        BACKUP_FILE="alldev-db-\$(date +%Y%m%d-%H%M%S).sql.gz"
        
        # Create backup
        docker-compose -f docker-compose.production.yml exec -T db pg_dump -U alldev_user -d alldev_production | gzip > $BACKUP_DIR/\$BACKUP_FILE
        
        echo "Backup criado: \$BACKUP_FILE"
        
        # Remove old backups
        cd $BACKUP_DIR
        ls -t alldev-db-*.sql.gz | tail -n +$((KEEP_BACKUPS + 1)) | xargs -r rm
        
        echo "Backups antigos removidos (mantendo últimos $KEEP_BACKUPS)"
        
        # Show backup size
        du -h \$BACKUP_FILE
ENDSSH
    
    print_success "Backup concluído!"
}

# List backups
list_backups() {
    echo "📋 Lista de backups:"
    
    ssh -p $VPS_PORT $VPS_USER@$VPS_HOST << ENDSSH
        ls -lh $BACKUP_DIR/alldev-db-*.sql.gz 2>/dev/null || echo "Nenhum backup encontrado"
ENDSSH
}

# Restore backup
restore_backup() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        print_error "Especifique o arquivo de backup"
        echo "Uso: $0 restore <nome-do-arquivo>"
        list_backups
        exit 1
    fi
    
    print_warning "⚠️  ATENÇÃO: Isto irá SUBSTITUIR a base de dados atual!"
    read -p "Tem certeza? (sim/não) " -r
    
    if [[ ! $REPLY == "sim" ]]; then
        print_warning "Restauração cancelada"
        exit 0
    fi
    
    echo "♻️  Restaurando backup: $backup_file"
    
    ssh -p $VPS_PORT $VPS_USER@$VPS_HOST << ENDSSH
        cd $DEPLOY_DIR
        
        # Stop API temporarily
        docker-compose -f docker-compose.production.yml stop api
        
        # Restore backup
        gunzip -c $BACKUP_DIR/$backup_file | docker-compose -f docker-compose.production.yml exec -T db psql -U alldev_user -d alldev_production
        
        # Start API
        docker-compose -f docker-compose.production.yml start api
        
        echo "Base de dados restaurada!"
ENDSSH
    
    print_success "Restauração concluída!"
}

# Main
case "${1:-backup}" in
    backup)
        create_backup
        ;;
    list)
        list_backups
        ;;
    restore)
        restore_backup "$2"
        ;;
    *)
        echo "Uso: $0 {backup|list|restore <arquivo>}"
        exit 1
        ;;
esac
