#!/bin/bash
set -euo pipefail

# Deploy script for non-technical users

DEPLOY_LIB=".agents/skills/vpk-deploy/scripts/deploy-lib.sh"
DEPLOY_GUIDE=".agents/skills/vpk-deploy/references/guide-deployment.md"
if [ ! -f "$DEPLOY_LIB" ]; then
  echo "❌ Missing deployment helper: $DEPLOY_LIB"
  exit 1
fi
# shellcheck disable=SC1090
source "$DEPLOY_LIB"

echo "🚀 Prototype Deployment Helper"
echo ""

# Check if service name provided.
# Using ${1:-} (not $1) so `set -u` doesn't abort before we can print the
# usage help when the user runs the script with no arguments.
if [ -z "${1:-}" ]; then
  echo "❌ Service name is required"
  echo "Usage: $0 <service-name> <version> [env]"
  echo "Example: $0 my-prototype 1.0.1 pdev-west2"
  echo ""
  echo "⚠️  Service name must be ≤26 characters"
  exit 1
fi

if [ -z "${2:-}" ]; then
  echo "❌ Deployment version is required"
  echo "Usage: $0 <service-name> <version> [env]"
  exit 1
fi

if [ -n "${4:-}" ]; then
  echo "❌ Unexpected argument: $4"
  echo "Usage: $0 <service-name> <version> [env]"
  exit 2
fi

SERVICE_NAME=$1
VERSION=$2
REQUESTED_SERVICE_NAME=$SERVICE_NAME
REQUESTED_VERSION=$VERSION

# Resolve ENV with the following precedence (highest first):
#   1. 3rd positional arg               (./deploy.sh <svc> <ver> <env>)
#   2. ENV from .deploy.local           (sourced if file exists)
#   3. Default: pdev-west2
# Valid pdev environments: pdev-west2, pdev-apse2 (only two exist)
if [ -n "${3:-}" ]; then
  ENV=$3
elif [ -f ".deploy.local" ] && grep -q '^ENV=' .deploy.local; then
  # shellcheck disable=SC1091
  source .deploy.local
  ENV=${ENV:-pdev-west2}
  SERVICE_NAME=$REQUESTED_SERVICE_NAME
  VERSION=$REQUESTED_VERSION
else
  ENV="pdev-west2"
fi

# Validate environment is one of the two pdev envs
case "$ENV" in
  pdev-west2|pdev-apse2) ;;
  *)
    echo "❌ Unsupported Micros environment: $ENV"
    echo "   Supported environments: pdev-west2, pdev-apse2"
    exit 1
    ;;
esac

vpk_validate_service_name "$SERVICE_NAME"
vpk_validate_version "$VERSION"

echo "Service: $SERVICE_NAME"
echo "Version: $VERSION"
echo "Environment: $ENV"
echo ""

bash .agents/skills/vpk-deploy/scripts/deploy-check.sh

# Validate every local and remote identity before Docker build, push, or Micros
# deployment. `service show` success is sufficient: a newly created service can
# legitimately have no stack until this first deployment.
vpk_validate_descriptor_identity "$SERVICE_NAME" service-descriptor.yml
if ! vpk_require_service_and_stashes "$SERVICE_NAME" "$ENV"; then
  echo "   See $DEPLOY_GUIDE"
  exit 1
fi

# Build the static export consumed by backend/Dockerfile.
echo ""
echo "🏗️  Building static export..."
corepack pnpm run build:export
if [ ! -f out/index.html ]; then
  echo "❌ Static export did not produce out/index.html"
  exit 1
fi

# Build Docker image
echo ""
echo "📦 Building Docker image..."
if ! vpk_build_image "$SERVICE_NAME" "$VERSION"; then
  echo "❌ Build failed. Contact repo maintainer."
  exit 1
fi

# Push image
echo ""
echo "📤 Pushing Docker image..."
docker push "docker.atl-paas.net/${SERVICE_NAME}:app-${VERSION}"

# Deploy
echo ""
echo "🚀 Deploying..."
export VERSION=$VERSION
atlas micros service deploy \
  --service=$SERVICE_NAME \
  --env=$ENV \
  --file=service-descriptor.yml

echo ""
echo "✅ Deployment initiated!"
echo ""
# Region hint based on $ENV. Both pdev envs follow the same DNS pattern:
#   https://<service>.<aws-region>.platdev.atl-paas.net
case "$ENV" in
  pdev-west2)  REGION="us-west-2" ;;
  pdev-apse2)  REGION="ap-southeast-2" ;;
esac
echo "Your service URL will be (internal — needs Atlassian VPN):"
echo "  https://$SERVICE_NAME.$REGION.platdev.atl-paas.net"
echo ""
echo "Note: Micros API may show CREATE_IN_PROGRESS for 1–3 min after CFN finishes."
echo "If you want ground truth, check AWS directly:"
echo "  aws cloudformation describe-stacks --region $REGION \\"
echo "    --stack-name vpk-awake--$ENV--... --query 'Stacks[].StackStatus'"
