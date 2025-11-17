#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if service name is provided
SERVICE_NAME=$1
ENVIRONMENT=${2:-dev}

if [ -z "$SERVICE_NAME" ]; then
    print_error "Usage: ./scripts/deploy-new-service.sh <service-name> [environment]"
    echo ""
    echo "Examples:"
    echo "  ./scripts/deploy-new-service.sh user-service dev"
    echo "  ./scripts/deploy-new-service.sh api-gateway prod"
    echo ""
    echo "Available services:"
    echo "  - api-gateway"
    echo "  - auth-service"
    echo "  - user-service"
    echo "  - trip-service"
    echo "  - driver-service"
    echo "  - notification-service"
    exit 1
fi

print_info "🚀 Starting deployment of ${SERVICE_NAME} to ${ENVIRONMENT}"
echo ""

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    print_error "GitHub CLI (gh) is not installed"
    echo "Install from: https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated with GitHub
if ! gh auth status &> /dev/null; then
    print_error "Not authenticated with GitHub CLI"
    echo "Run: gh auth login"
    exit 1
fi

# Check if service exists
SERVICE_PATH="apps/${SERVICE_NAME}"
if [ ! -d "$SERVICE_PATH" ]; then
    print_error "Service '${SERVICE_NAME}' not found at ${SERVICE_PATH}"
    exit 1
fi

print_success "Service found at ${SERVICE_PATH}"

# Check if workflow exists
WORKFLOW_FILE=".github/workflows/deploy-${SERVICE_NAME}.yml"
if [ ! -f "$WORKFLOW_FILE" ]; then
    print_warning "Workflow file not found: ${WORKFLOW_FILE}"
    print_info "Creating workflow file..."
    
    # This would be implemented if needed
    print_error "Please create the workflow file first or contact DevOps team"
    exit 1
fi

print_success "Workflow file found: ${WORKFLOW_FILE}"

# Show service configuration
print_info "Service Configuration:"
case $SERVICE_NAME in
    "user-service"|"trip-service"|"driver-service")
        echo "  - Has database: Yes"
        echo "  - Needs migrations: Yes"
        ;;
    *)
        echo "  - Has database: No"
        echo "  - Needs migrations: No"
        ;;
esac

# Get budget info from Terraform
BUDGET=$(grep -A 5 "\"${SERVICE_NAME}\"" infra/local.tf | grep "budget" | awk -F'=' '{print $2}' | tr -d ' }' || echo "N/A")
echo "  - Monthly budget: \$${BUDGET}"
echo ""

# Estimate costs (if Infracost is available)
if command -v infracost &> /dev/null; then
    print_info "💰 Estimating infrastructure costs..."
    cd infra
    infracost breakdown \
        --path=. \
        --terraform-var="env=${ENVIRONMENT}" \
        --format=table 2>/dev/null || print_warning "Could not estimate costs"
    cd ..
    echo ""
else
    print_warning "Infracost not installed - skipping cost estimation"
    print_info "Install from: https://www.infracost.io/docs/#quick-start"
    echo ""
fi

# Ask for confirmation
print_warning "This will trigger a deployment workflow on GitHub Actions"
echo ""
read -p "Continue with deployment? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Deployment cancelled"
    exit 0
fi

# Ask about Terraform apply
echo ""
read -p "Apply Terraform changes? (y/n) " -n 1 -r
echo ""
APPLY_TF="false"
if [[ $REPLY =~ ^[Yy]$ ]]; then
    APPLY_TF="true"
fi

# Ask about migrations (only for services with DB)
RUN_MIGRATIONS="false"
case $SERVICE_NAME in
    "user-service"|"trip-service"|"driver-service")
        echo ""
        read -p "Run database migrations? (y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            RUN_MIGRATIONS="true"
        fi
        ;;
esac

# Trigger GitHub Actions workflow
print_info "🎯 Triggering deployment workflow..."
echo ""

gh workflow run "deploy-${SERVICE_NAME}.yml" \
    -f environment="${ENVIRONMENT}" \
    -f apply-terraform="${APPLY_TF}" \
    -f run-migrations="${RUN_MIGRATIONS}"

if [ $? -eq 0 ]; then
    print_success "Deployment workflow triggered successfully!"
    echo ""
    print_info "View deployment progress:"
    echo "  gh run watch"
    echo ""
    print_info "Or visit:"
    REPO=$(git config --get remote.origin.url | sed 's/.*://;s/.git$//')
    echo "  https://github.com/${REPO}/actions"
    echo ""
    print_info "Monitor costs after deployment:"
    echo "  - CloudWatch Dashboard: UIT-GO-FinOps-Dashboard"
    echo "  - AWS Cost Explorer: Filter by Service=${SERVICE_NAME}"
    echo "  - AWS Budgets: Check ${SERVICE_NAME} budget alerts"
else
    print_error "Failed to trigger workflow"
    exit 1
fi
