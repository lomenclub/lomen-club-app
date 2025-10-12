#!/bin/bash

# Lomen Club OCI Container Instance Deployment Script
# This script deploys the React app as a Docker container on OCI Container Instances

set -e

echo "🚀 Starting Lomen Club OCI Container Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if OCI CLI is installed
check_oci_cli() {
    if ! command -v oci &> /dev/null; then
        print_error "OCI CLI is not installed. Please install it first."
        echo "Installation guide: https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/cliinstall.htm"
        exit 1
    fi
    print_status "OCI CLI is installed"
}

# Check if user is logged in
check_oci_auth() {
    if ! oci iam region list &> /dev/null; then
        print_error "Not authenticated with OCI. Please run: oci session authenticate"
        exit 1
    fi
    print_status "Authenticated with OCI"
}

# Build Docker image
build_docker_image() {
    local image_name="$1"
    
    print_status "Building Docker image: $image_name"
    
    if [ ! -f "docker/Dockerfile" ]; then
        print_error "Dockerfile not found at docker/Dockerfile"
        exit 1
    fi
    
    docker build -t "$image_name" -f docker/Dockerfile .
    
    if [ $? -ne 0 ]; then
        print_error "Docker build failed"
        exit 1
    fi
    print_status "Docker image built successfully: $image_name"
}

# Push Docker image to OCI Container Registry
push_docker_image() {
    local image_name="$1"
    local region="$2"
    
    print_status "Pushing Docker image to OCI Container Registry..."
    
    # Get region key (e.g., us-ashburn-1 -> iad)
    local region_key=$(echo "$region" | cut -d'-' -f2)
    
    # Create repository if it doesn't exist
    local repo_name="lomen-club"
    if ! oci artifacts container repository list --compartment-id "$COMPARTMENT_ID" --query "data[?\"display-name\"=='$repo_name']" --output table | grep -q "$repo_name"; then
        print_status "Creating container repository: $repo_name"
        oci artifacts container repository create \
            --compartment-id "$COMPARTMENT_ID" \
            --display-name "$repo_name" \
            --is-immutable false \
            --is-public true
    fi
    
    # Tag image for OCI
    local oci_image="${region_key}.ocir.io/${TENANCY_NAMESPACE}/${repo_name}:latest"
    docker tag "$image_name" "$oci_image"
    
    # Login to OCI Container Registry
    print_status "Logging into OCI Container Registry..."
    oci artifacts container repository get-login --repository-name "$repo_name" --compartment-id "$COMPARTMENT_ID" | tail -1 | bash
    
    # Push image
    print_status "Pushing image to OCI Container Registry..."
    docker push "$oci_image"
    
    print_status "Docker image pushed successfully: $oci_image"
    echo "$oci_image"
}

# Create Container Instance
create_container_instance() {
    local image_url="$1"
    local container_name="$2"
    local compartment_id="$3"
    local availability_domain="$4"
    
    print_status "Creating Container Instance: $container_name"
    
    # Create container instance configuration
    cat > /tmp/container-instance-config.json << EOF
{
    "displayName": "$container_name",
    "compartmentId": "$compartment_id",
    "availabilityDomain": "$availability_domain",
    "shape": "CI.Standard.E4.Flex",
    "shapeConfig": {
        "ocpus": 1,
        "memoryInGBs": 2
    },
    "containers": [
        {
            "displayName": "lomen-club-app",
            "imageUrl": "$image_url",
            "resourceConfig": {
                "vcpus": 1,
                "memoryInGBs": 2
            },
            "healthChecks": {
                "livenessProbe": {
                    "command": ["/bin/sh", "-c", "curl -f http://localhost/health || exit 1"],
                    "failureAction": "RESTART",
                    "initialDelayInSeconds": 30,
                    "periodInSeconds": 60,
                    "timeoutInSeconds": 10,
                    "failureThreshold": 3
                }
            }
        }
    ],
    "vnics": [
        {
            "displayName": "lomen-club-vnic",
            "isPublicIpAssigned": true,
            "skipSourceDestCheck": false,
            "subnetId": "$SUBNET_ID"
        }
    ],
    "containerRestartPolicy": "ALWAYS"
}
EOF
    
    # Create container instance
    local instance_id=$(oci container-instances container-instance create \
        --from-json file:///tmp/container-instance-config.json \
        --query 'data.id' \
        --raw-output)
    
    print_status "Container Instance created: $instance_id"
    echo "$instance_id"
}

# Get Container Instance public IP
get_container_instance_ip() {
    local instance_id="$1"
    
    print_status "Waiting for Container Instance to be running..."
    
    # Wait for instance to be running
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        local state=$(oci container-instances container-instance get \
            --container-instance-id "$instance_id" \
            --query 'data."lifecycle-state"' \
            --raw-output)
        
        if [ "$state" == "ACTIVE" ]; then
            break
        fi
        
        print_status "Waiting for Container Instance to be active... (attempt $attempt/$max_attempts)"
        sleep 30
        ((attempt++))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        print_error "Container Instance failed to become active within timeout"
        exit 1
    fi
    
    # Get public IP
    local public_ip=$(oci container-instances container-instance get \
        --container-instance-id "$instance_id" \
        --query 'data.vnics[0]."public-ip"' \
        --raw-output)
    
    print_status "Container Instance is active with public IP: $public_ip"
    echo "$public_ip"
}

# Main deployment function
deploy() {
    local container_name="${1:-lomen-club-container}"
    local compartment_id="$2"
    local region="${3:-$(oci iam region list --query 'data[0].name' --raw-output)}"
    
    print_status "Starting container deployment to OCI..."
    print_status "Container Name: $container_name"
    print_status "Region: $region"
    print_status "Compartment ID: $compartment_id"
    
    # Check prerequisites
    check_oci_cli
    check_oci_auth
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Get required information
    if [ -z "$TENANCY_NAMESPACE" ]; then
        TENANCY_NAMESPACE=$(oci os ns get --query 'data' --raw-output)
        print_status "Tenancy Namespace: $TENANCY_NAMESPACE"
    fi
    
    if [ -z "$AVAILABILITY_DOMAIN" ]; then
        AVAILABILITY_DOMAIN=$(oci iam availability-domain list \
            --compartment-id "$compartment_id" \
            --query 'data[0].name' \
            --raw-output)
        print_status "Availability Domain: $AVAILABILITY_DOMAIN"
    fi
    
    # Build Docker image
    local image_name="lomen-club:latest"
    build_docker_image "$image_name"
    
    # Push to OCI Container Registry
    local oci_image=$(push_docker_image "$image_name" "$region")
    
    # Create Container Instance
    local instance_id=$(create_container_instance "$oci_image" "$container_name" "$compartment_id" "$AVAILABILITY_DOMAIN")
    
    # Get public IP
    local public_ip=$(get_container_instance_ip "$instance_id")
    
    print_status "🎉 Container deployment completed successfully!"
    echo ""
    echo "📱 Your Lomen Club app is now live at:"
    echo "   http://$public_ip"
    echo "   https://$public_ip (if SSL configured)"
    echo ""
    echo "🔗 Container Instance details:"
    echo "   https://console.${region}.oraclecloud.com/container-instances/container-instances/$instance_id"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Test the deployed application"
    echo "   2. Set up Load Balancer for SSL termination (optional)"
    echo "   3. Configure custom domain (optional)"
    echo "   4. Set up auto-scaling (optional)"
    echo ""
}

# Show usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Deploy Lomen Club React app as Docker container on OCI Container Instances"
    echo ""
    echo "Required Environment Variables:"
    echo "  COMPARTMENT_ID          OCI Compartment OCID"
    echo "  SUBNET_ID               OCI Subnet OCID for networking"
    echo ""
    echo "Optional Environment Variables:"
    echo "  TENANCY_NAMESPACE       OCI Tenancy Namespace (auto-detected if not set)"
    echo "  AVAILABILITY_DOMAIN     OCI Availability Domain (auto-detected if not set)"
    echo ""
    echo "Options:"
    echo "  -n, --name NAME         Container instance name (default: lomen-club-container)"
    echo "  -r, --region REGION     OCI Region (default: current region)"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Example:"
    echo "  export COMPARTMENT_ID=ocid1.compartment.oc1..example"
    echo "  export SUBNET_ID=ocid1.subnet.oc1..example"
    echo "  $0 --name my-lomen-app"
    echo ""
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -n|--name)
            CONTAINER_NAME="$2"
            shift 2
            ;;
        -r|--region)
            REGION="$2"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Validate required environment variables
if [ -z "$COMPARTMENT_ID" ]; then
    print_error "COMPARTMENT_ID environment variable is required"
    usage
    exit 1
fi

if [ -z "$SUBNET_ID" ]; then
    print_error "SUBNET_ID environment variable is required"
    usage
    exit 1
fi

# Run deployment
deploy "$CONTAINER_NAME" "$COMPARTMENT_ID" "$REGION"
