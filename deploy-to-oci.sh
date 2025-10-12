#!/bin/bash

# Lomen Club OCI Deployment Script
# This script deploys the React app to OCI Object Storage

set -e

echo "🚀 Starting Lomen Club OCI Deployment..."

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

# Build the React app
build_app() {
    print_status "Building React app..."
    npm run build
    
    if [ ! -d "dist" ]; then
        print_error "Build failed - dist directory not found"
        exit 1
    fi
    print_status "React app built successfully"
}

# Create OCI bucket
create_bucket() {
    local bucket_name="$1"
    local compartment_id="$2"
    
    print_status "Creating bucket: $bucket_name"
    
    # Check if bucket already exists
    if oci os bucket get --bucket-name "$bucket_name" &> /dev/null; then
        print_warning "Bucket $bucket_name already exists"
    else
        oci os bucket create \
            --compartment-id "$compartment_id" \
            --name "$bucket_name" \
            --public-access-type "ObjectReadWithoutList"
        print_status "Bucket $bucket_name created"
    fi
}

# Upload files to bucket
upload_files() {
    local bucket_name="$1"
    
    print_status "Uploading files to bucket..."
    
    # Upload all files from dist directory
    cd dist
    for file in $(find . -type f); do
        # Remove leading ./
        file=${file#./}
        if [ -n "$file" ]; then
            oci os object put \
                --bucket-name "$bucket_name" \
                --file "$file" \
                --name "$file" \
                --content-type "auto" \
                --no-overwrite
            print_status "Uploaded: $file"
        fi
    done
    cd ..
    
    print_status "All files uploaded successfully"
}

# Enable static website hosting
enable_static_hosting() {
    local bucket_name="$1"
    local index_file="$2"
    local error_file="$3"
    
    print_status "Enabling static website hosting..."
    
    oci os bucket update \
        --bucket-name "$bucket_name" \
        --namespace-name "$(oci os ns get --query 'data' --raw-output)" \
        --website-type "OBJECT_READ" \
        --index-file "$index_file" \
        --error-file "$error_file"
    
    print_status "Static website hosting enabled"
}

# Get website URL
get_website_url() {
    local bucket_name="$1"
    local namespace="$2"
    local region="$3"
    
    local url="https://${bucket_name}.objectstorage.${region}.oci.customer-oci.com/${namespace}/index.html"
    echo "$url"
}

# Main deployment function
deploy() {
    local bucket_name="${1:-lomen-club-app}"
    local compartment_id="$2"
    local region="${3:-$(oci iam region list --query 'data[0].name' --raw-output)}"
    
    print_status "Starting deployment to OCI..."
    print_status "Bucket: $bucket_name"
    print_status "Region: $region"
    
    # Check prerequisites
    check_oci_cli
    check_oci_auth
    
    # Build the app
    build_app
    
    # Get namespace
    local namespace=$(oci os ns get --query 'data' --raw-output)
    print_status "Namespace: $namespace"
    
    # Create bucket
    create_bucket "$bucket_name" "$compartment_id"
    
    # Upload files
    upload_files "$bucket_name"
    
    # Enable static hosting
    enable_static_hosting "$bucket_name" "index.html" "index.html"
    
    # Get website URL
    local website_url=$(get_website_url "$bucket_name" "$namespace" "$region")
    
    print_status "🎉 Deployment completed successfully!"
    echo ""
    echo "📱 Your Lomen Club app is now live at:"
    echo "   $website_url"
    echo ""
    echo "🔗 Object Storage URL:"
    echo "   https://console.${region}.oraclecloud.com/object-storage/buckets/${region}/${namespace}/${bucket_name}/objects"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Test the deployed application"
    echo "   2. Set up CloudFlare for SSL and CDN (optional)"
    echo "   3. Configure custom domain (optional)"
    echo ""
}

# Show usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Deploy Lomen Club React app to OCI Object Storage"
    echo ""
    echo "Options:"
    echo "  -b, --bucket-name NAME    Bucket name (default: lomen-club-app)"
    echo "  -c, --compartment-id ID   OCI Compartment OCID (required)"
    echo "  -r, --region REGION       OCI Region (default: current region)"
    echo "  -h, --help               Show this help message"
    echo ""
    echo "Example:"
    echo "  $0 --bucket-name my-lomen-app --compartment-id ocid1.compartment.oc1..example"
    echo ""
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -b|--bucket-name)
            BUCKET_NAME="$2"
            shift 2
            ;;
        -c|--compartment-id)
            COMPARTMENT_ID="$2"
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

# Validate required arguments
if [ -z "$COMPARTMENT_ID" ]; then
    print_error "Compartment ID is required"
    usage
    exit 1
fi

# Run deployment
deploy "$BUCKET_NAME" "$COMPARTMENT_ID" "$REGION"
