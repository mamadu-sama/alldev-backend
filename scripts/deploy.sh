#!/bin/bash

# ============================================
# ALLDEV BACKEND - DEPLOYMENT SCRIPT
# ============================================
# Script para fazer deploy do backend no VPS
# Autor: Alldev Team
# Data: $(date +%Y-%m-%d)

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration (Loaded from .env)
# Load .env file if exists
if [ -f .env ]; then
    # Load variables exporting them
    set -a
    . .env
    set +a
fi

VPS_USER=${VPS_USER:-"root"} # Default to root if not set
VPS_HOST=${VPS_HOST:-""}     # Must be set in .env
VPS_PORT=${VPS_PORT:-"22"}
DEPLOY_DIR="/opt/alldev-backend"

# ============================================
# FUNCTIONS
# ============================================

print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

check_requirements() {
    print_header "Verificando Requisitos"
    
    # Check if .env.production exists
    if [ ! -f ".env.production" ]; then
        print_error "Arquivo .env.production não encontrado!"
        echo "Crie o arquivo a partir de ENV_PRODUCTION_TEMPLATE.txt"
        exit 1
    fi
    print_success "Arquivo .env.production encontrado"
    
    # Check if VPS_HOST is set
    if [ -z "$VPS_HOST" ]; then
        print_error "VPS_HOST não configurado!"
        echo "Edite este script e defina o IP do VPS na variável VPS_HOST"
        exit 1
    fi
    print_success "VPS_HOST configurado: $VPS_HOST"
    
    # Check SSH connection
    print_warning "Testando conexão SSH..."
    if ssh -p $VPS_PORT -o ConnectTimeout=5 $VPS_USER@$VPS_HOST "echo 'SSH OK'" >/dev/null 2>&1; then
        print_success "Conexão SSH estabelecida"
    else
        print_error "Falha na conexão SSH"
        print_warning "Verifique se o SSH está configurado corretamente"
        exit 1
    fi
}

prepare_vps() {
    print_header "Preparando VPS"
    
    ssh -p $VPS_PORT $VPS_USER@$VPS_HOST << 'ENDSSH'
        # Update system
        echo "Atualizando sistema..."
        apt-get update -qq
        
        # Install Docker if not installed
        if ! command -v docker &> /dev/null; then
            echo "Instalando Docker..."
            curl -fsSL https://get.docker.com -o get-docker.sh
            sh get-docker.sh
            rm get-docker.sh
        fi
        
        # Install Docker Compose if not installed
        if ! command -v docker-compose &> /dev/null; then
            echo "Instalando Docker Compose..."
            curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            chmod +x /usr/local/bin/docker-compose
        fi
        
        # Create deploy directory
        mkdir -p /opt/alldev-backend
        
        echo "VPS preparado!"
ENDSSH
    
    print_success "VPS preparado com sucesso"
}

deploy_application() {
    print_header "Fazendo Build e Deploy da Aplicação"
    
    # Check if docker is running locally
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker não está rodando localmente!"
        exit 1
    fi

    # Build image locally
    print_warning "Construindo imagem Docker localmente..."
    if docker-compose --env-file .env.production -f docker-compose.production.yml build api; then
        print_success "Build local concluído"
    else
        print_error "Falha no build local"
        exit 1
    fi

    # Stream image directly to VPS
    print_warning "Enviando imagem diretamente para VPS via SSH (stream)..."
    if docker save alldev-backend:latest | gzip | ssh -P $VPS_PORT $VPS_USER@$VPS_HOST "gunzip | docker load"; then
        print_success "Imagem enviada e carregada no VPS"
    else
        print_error "Falha ao enviar imagem para o VPS"
        exit 1
    fi
    
    print_warning "Enviando docker-compose atualizado..."
    scp -P $VPS_PORT docker-compose.production.yml $VPS_USER@$VPS_HOST:/tmp/
    
    if [ -f .env.production ]; then
        print_warning "Enviando .env.production..."
        scp -P $VPS_PORT .env.production $VPS_USER@$VPS_HOST:/tmp/
    fi
    
    # Extract and setup on VPS
    ssh -p $VPS_PORT $VPS_USER@$VPS_HOST << ENDSSH
        mkdir -p $DEPLOY_DIR/current
        cd $DEPLOY_DIR/current
        
        # Move updated docker-compose
        mv /tmp/docker-compose.production.yml .
        
        # Move updated .env.production if exists
        if [ -f /tmp/.env.production ]; then
            mv /tmp/.env.production .
            sed -i 's/\r$//' .env.production
            echo "NOTA: .env.production atualizado no servidor. Verifique se precisa atualizar o .env principal."
        fi
        
        # Ensure .env also has correct line endings if it exists
        if [ -f .env ]; then
            sed -i 's/\r$//' .env
        fi
        
        # Image already loaded via stream
        echo "Imagem já carregada via stream."
        
        # Generate secrets if needed (only for first deploy)
        if [ ! -f .env ]; then
             if [ -f .env.production ]; then
                cp .env.production .env
             fi
        fi
        
        # Create necessary directories
        mkdir -p logs uploads backups nginx/ssl certbot/conf certbot/www
        
        echo "Arquivos atualizados!"
ENDSSH
    
    # Cleanup local
    # No local artifact to clean up
    
    print_success "Deploy dos artefatos concluído"
}

setup_ssl() {
    print_header "Configurando SSL Certificates"
    
    ssh -p $VPS_PORT $VPS_USER@$VPS_HOST << ENDSSH
        cd $DEPLOY_DIR/current
        
        # Start Nginx temporarily for Let's Encrypt challenge
        echo "Iniciando Nginx para validação SSL..."
        docker-compose -f docker-compose.production.yml up -d nginx
        
        # Wait for Nginx to start
        sleep 5
        
        # Request SSL certificate
        echo "Solicitando certificado SSL..."
        docker-compose -f docker-compose.production.yml run --rm certbot certonly \
            --webroot \
            --webroot-path=/var/www/certbot \
            --email geral@alldev.pt \
            --agree-tos \
            --no-eff-email \
            -d api.alldev.pt
        
        echo "SSL configurado!"
ENDSSH
    
    print_success "SSL certificates configurados"
}

backup_database() {
    print_header "Backup do Banco de Dados"
    
    ssh -p $VPS_PORT $VPS_USER@$VPS_HOST << 'ENDSSH'
        cd /opt/alldev-backend/current
        
        # Check if db container is running
        if docker compose -f docker-compose.production.yml ps | grep -q db; then
            if [ -f .env ]; then
                echo "Carregando variáveis de ambiente..."
                export $(grep -v '^#' .env | xargs)
                
                echo "Criando backup em /backups..."
                mkdir -p backups
                TIMESTAMP=$(date +%Y%m%d_%H%M%S)
                BACKUP_FILE="backups/backup_${TIMESTAMP}.sql"
                
                # Executa dump usando credenciais do .env
                docker compose -f docker-compose.production.yml exec -T -e PGPASSWORD=$POSTGRES_PASSWORD db pg_dump -U $POSTGRES_USER $POSTGRES_DB > $BACKUP_FILE
                
                if [ $? -eq 0 ]; then
                    echo "Compactando backup..."
                    gzip $BACKUP_FILE
                    echo "Backup salvo: ${BACKUP_FILE}.gz"
                    
                    # Manter apenas os 5 últimos backups
                    echo "Limpando backups antigos (mantendo 5 recentes)..."
                    ls -tp backups/*.gz | grep -v '/$' | tail -n +6 | xargs -I {} rm -- {}
                else
                    echo "Erro ao criar backup!"
                    rm -f $BACKUP_FILE
                fi
            else
                echo "Arquivo .env não encontrado. Pulando backup."
            fi
        else
            echo "Container de banco de dados não está rodando. Pulando backup."
        fi
ENDSSH
}

start_services() {
    # Run backup first
    backup_database

    print_header "Iniciando Serviços"
    
    ssh -p $VPS_PORT $VPS_USER@$VPS_HOST << ENDSSH
        cd $DEPLOY_DIR/current
        
        # Stop old containers
        docker-compose -f docker-compose.production.yml down || true
        
        # Start all services
        echo "Iniciando todos os serviços..."
        docker-compose -f docker-compose.production.yml up -d
        
        # Wait for database to be ready
        echo "Aguardando base de dados..."
        sleep 10
        
        # Sync Database Schema (DB Push) instead of Migrate
        echo "Sincronizando schema do banco (DB Push)..."
        # --accept-data-loss is NOT used automatically to prevent accidental deletion.
        # If deploy fails here, it means manual intervention is needed.
        docker-compose -f docker-compose.production.yml exec -T api npx prisma db push
        
        # Generate Prisma Client
        echo "Gerando Prisma Client..."
        docker-compose -f docker-compose.production.yml exec -T api npm run prisma:generate
        
        echo "Serviços iniciados!"
ENDSSH
    
    print_success "Serviços iniciados com sucesso"
}

verify_deployment() {
    print_header "Verificando Deployment"
    
    print_warning "Aguardando serviços ficarem prontos..."
    sleep 15
    
    # Check API health
    if curl -f -s https://api.alldev.pt/api/health > /dev/null; then
        print_success "API está respondendo corretamente"
    else
        print_error "API não está respondendo"
        print_warning "Verifique os logs: ./scripts/logs.sh"
        exit 1
    fi
    
    # Show service status
    ssh -p $VPS_PORT $VPS_USER@$VPS_HOST << ENDSSH
        cd $DEPLOY_DIR/current
        echo -e "\n📊 Status dos Serviços:"
        docker-compose -f docker-compose.production.yml ps
ENDSSH
    
    print_success "Deployment verificado com sucesso!"
}

# ============================================
# MAIN EXECUTION
# ============================================

main() {
    print_header "🚀 ALLDEV BACKEND DEPLOYMENT"
    
    # Check if VPS_HOST needs to be set
    if [ -z "$VPS_HOST" ]; then
        echo "IMPORTANTE: Configure o IP do VPS antes de continuar!"
        echo ""
        echo "Edite este arquivo (scripts/deploy.sh) e defina:"
        echo "VPS_HOST=\"SEU_IP_AQUI\""
        echo ""
        exit 1
    fi
    
    echo "Deploy para: $VPS_USER@$VPS_HOST:$VPS_PORT"
    echo "Diretório: $DEPLOY_DIR"
    echo ""
    read -p "Deseja continuar? (s/N) " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        print_warning "Deploy cancelado"
        exit 0
    fi
    
    check_requirements
    prepare_vps
    deploy_application
    
    # Ask about SSL setup
    echo ""
    read -p "Deseja configurar SSL agora? (s/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        setup_ssl
    else
        print_warning "SSL não configurado. Execute './scripts/setup-ssl.sh' depois"
    fi
    
    start_services
    verify_deployment
    
    print_header "✅ DEPLOYMENT CONCLUÍDO COM SUCESSO!"
    
    echo ""
    echo "📌 Próximos passos:"
    echo "   1. Acesse: https://api.alldev.pt/api/health"
    echo "   2. Verifique logs: ./scripts/logs.sh"
    echo "   3. Configure backups automáticos: ./scripts/setup-backup.sh"
    echo ""
    echo "📚 Documentação completa: docs/DEPLOYMENT.md"
    echo ""
}

# Run main function
main
