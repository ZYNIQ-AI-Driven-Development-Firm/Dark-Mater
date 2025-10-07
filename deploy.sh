#!/bin/bash

# Deployment script for Dark Matter MCP
set -e

echo "🚀 Starting Dark Matter MCP deployment..."

# Configuration
PROJECT_ID=${PROJECT_ID:-"darkmatter-mcp"}
REGION=${REGION:-"us-central1"}
ENVIRONMENT=${ENVIRONMENT:-"production"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install it first."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Set up Google Cloud project
setup_gcloud() {
    print_status "Setting up Google Cloud configuration..."
    
    gcloud config set project $PROJECT_ID
    gcloud config set run/region $REGION
    
    print_success "Google Cloud configuration complete"
}

# Enable required APIs
enable_apis() {
    print_status "Enabling required Google Cloud APIs..."
    
    gcloud services enable cloudbuild.googleapis.com
    gcloud services enable run.googleapis.com
    gcloud services enable secretmanager.googleapis.com
    gcloud services enable sqladmin.googleapis.com
    gcloud services enable redis.googleapis.com
    
    print_success "APIs enabled successfully"
}

# Create secrets if they don't exist
create_secrets() {
    print_status "Creating secrets..."
    
    # Check if secrets exist, create if they don't
    if ! gcloud secrets describe darkmatter-secret-key &> /dev/null; then
        echo -n "$(openssl rand -base64 32)" | gcloud secrets create darkmatter-secret-key --data-file=-
        print_success "Created darkmatter-secret-key secret"
    else
        print_warning "Secret darkmatter-secret-key already exists"
    fi
    
    print_success "Secrets configuration complete"
}

# Build and deploy using Cloud Build
deploy() {
    print_status "Starting deployment with Cloud Build..."
    
    gcloud builds submit --config=cloudbuild.yaml \
        --substitutions=_REGION=$REGION,_REGION_SUFFIX=$(echo $REGION | cut -c1-2)
    
    print_success "Deployment complete!"
}

# Get service URLs
get_urls() {
    print_status "Getting service URLs..."
    
    BACKEND_URL=$(gcloud run services describe darkmatter-mcp-backend --region=$REGION --format="value(status.url)")
    FRONTEND_URL=$(gcloud run services describe darkmatter-mcp-frontend --region=$REGION --format="value(status.url)")
    
    echo ""
    print_success "🎉 Deployment successful!"
    echo ""
    echo "📊 Service URLs:"
    echo "   Backend API:  $BACKEND_URL"
    echo "   Frontend App: $FRONTEND_URL"
    echo ""
    echo "📋 API Documentation: $BACKEND_URL/docs"
    echo ""
}

# Main deployment flow
main() {
    echo "🌟 Dark Matter MCP Deployment Script"
    echo "====================================="
    echo ""
    echo "Configuration:"
    echo "  Project ID: $PROJECT_ID"
    echo "  Region:     $REGION"
    echo "  Environment: $ENVIRONMENT"
    echo ""
    
    check_prerequisites
    setup_gcloud
    enable_apis
    create_secrets
    deploy
    get_urls
    
    print_success "🚀 All done! Your application is now live."
}

# Handle script arguments
case "${1:-deploy}" in
    "prerequisites")
        check_prerequisites
        ;;
    "setup")
        setup_gcloud
        enable_apis
        ;;
    "secrets")
        create_secrets
        ;;
    "deploy")
        main
        ;;
    "urls")
        get_urls
        ;;
    *)
        echo "Usage: $0 [prerequisites|setup|secrets|deploy|urls]"
        echo ""
        echo "Commands:"
        echo "  prerequisites - Check if required tools are installed"
        echo "  setup        - Set up Google Cloud configuration and APIs"
        echo "  secrets      - Create required secrets"
        echo "  deploy       - Full deployment (default)"
        echo "  urls         - Get service URLs"
        exit 1
        ;;
esac