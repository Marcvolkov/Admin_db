#!/bin/bash

# Production Deployment Script for Admin DB
# This script handles the complete deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking requirements..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    print_success "All requirements satisfied"
}

# Backup existing data
backup_data() {
    print_status "Creating backup of existing data..."
    
    BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    if docker ps | grep -q admin-db-postgres; then
        print_status "Backing up PostgreSQL database..."
        docker exec admin-db-postgres-prod pg_dumpall -U postgres > "$BACKUP_DIR/database_backup.sql"
        print_success "Database backup created: $BACKUP_DIR/database_backup.sql"
    else
        print_warning "No existing database container found, skipping backup"
    fi
}

# Pull latest images and build
build_images() {
    print_status "Building Docker images..."
    
    # Build backend
    print_status "Building backend image..."
    docker build -f backend/Dockerfile.prod -t admin-db-backend:latest backend/
    
    # Build frontend
    print_status "Building frontend image..."
    docker build -f frontend/Dockerfile.prod -t admin-db-frontend:latest frontend/
    
    print_success "Docker images built successfully"
}

# Deploy services
deploy_services() {
    print_status "Deploying services..."
    
    # Check if .env.prod exists
    if [ ! -f .env.prod ]; then
        print_error ".env.prod file not found. Please copy .env.prod.example to .env.prod and configure it."
        exit 1
    fi
    
    # Stop existing services
    print_status "Stopping existing services..."
    docker-compose -f docker-compose.prod.yml --env-file .env.prod down
    
    # Start new services
    print_status "Starting new services..."
    docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
    
    print_success "Services deployed successfully"
}

# Wait for services to be healthy
wait_for_services() {
    print_status "Waiting for services to be healthy..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f docker-compose.prod.yml --env-file .env.prod ps | grep -q "Up (healthy)"; then
            print_success "Services are healthy"
            return 0
        fi
        
        print_status "Attempt $attempt/$max_attempts - waiting for services..."
        sleep 10
        attempt=$((attempt + 1))
    done
    
    print_error "Services failed to become healthy within timeout"
    return 1
}

# Initialize database
init_database() {
    print_status "Initializing database..."
    
    # Wait for PostgreSQL to be ready
    print_status "Waiting for PostgreSQL to be ready..."
    docker-compose -f docker-compose.prod.yml --env-file .env.prod exec -T postgres sh -c 'until pg_isready -U postgres; do sleep 1; done'
    
    # Initialize database structure
    print_status "Setting up database structure..."
    docker-compose -f docker-compose.prod.yml --env-file .env.prod exec -T backend python -c "from app.database import init_databases; init_databases()"
    
    print_success "Database initialized successfully"
}

# Run health checks
health_check() {
    print_status "Running health checks..."
    
    # Check backend health
    if curl -f http://localhost:8000/ > /dev/null 2>&1; then
        print_success "Backend is healthy"
    else
        print_error "Backend health check failed"
        return 1
    fi
    
    # Check frontend health
    if curl -f http://localhost:3000/ > /dev/null 2>&1; then
        print_success "Frontend is healthy"
    else
        print_error "Frontend health check failed"
        return 1
    fi
    
    # Check nginx health
    if curl -f http://localhost/health > /dev/null 2>&1; then
        print_success "Nginx is healthy"
    else
        print_error "Nginx health check failed"
        return 1
    fi
    
    print_success "All health checks passed"
}

# Cleanup old images
cleanup() {
    print_status "Cleaning up old Docker images..."
    docker image prune -f
    print_success "Cleanup completed"
}

# Show deployment status
show_status() {
    print_status "Deployment Status:"
    echo ""
    
    # Show running containers
    echo "Running Containers:"
    docker-compose -f docker-compose.prod.yml --env-file .env.prod ps
    echo ""
    
    # Show service URLs
    echo "Service URLs:"
    echo "- Frontend: http://localhost"
    echo "- Backend API: http://localhost/api"
    echo "- Database: localhost:5432"
    echo ""
    
    # Show logs command
    echo "To view logs, run:"
    echo "docker-compose -f docker-compose.prod.yml --env-file .env.prod logs -f [service_name]"
    echo ""
}

# Main deployment function
main() {
    print_status "Starting Admin DB production deployment..."
    echo ""
    
    # Parse command line arguments
    SKIP_BACKUP=false
    SKIP_BUILD=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-backup)
                SKIP_BACKUP=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --skip-backup    Skip database backup"
                echo "  --skip-build     Skip Docker image building"
                echo "  --help           Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Execute deployment steps
    check_requirements
    
    if [ "$SKIP_BACKUP" = false ]; then
        backup_data
    else
        print_warning "Skipping backup as requested"
    fi
    
    if [ "$SKIP_BUILD" = false ]; then
        build_images
    else
        print_warning "Skipping build as requested"
    fi
    
    deploy_services
    wait_for_services
    init_database
    health_check
    cleanup
    show_status
    
    print_success "Deployment completed successfully!"
    echo ""
    print_status "You can now access the application at:"
    print_status "- Frontend: http://localhost"
    print_status "- Login with admin/admin123 or user/user123"
}

# Run main function with all arguments
main "$@"