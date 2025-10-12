# Oracle Cloud Infrastructure (OCI) Deployment Guide for Lomen Club

## Step 1: OCI Account Setup

### 1.1 Create OCI Account (Free Tier)
1. Go to [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/)
2. Click "Start for free"
3. Fill in your details:
   - Email address
   - Country
   - Name and company information
4. Verify your email address
5. Complete the registration form
6. Add payment method (credit card required for verification, but won't be charged for free tier usage)

### 1.2 Free Tier Resources Included:
- 2 AMD-based Compute VMs (1/8 OCPU and 1 GB memory each)
- 4 Arm-based Ampere A1 cores and 24 GB of memory
- 200 GB total block storage
- 10 GB object storage
- 10 GB archive storage
- 1 Load Balancer (10 Mbps)
- And more...

## Step 2: OCI Console Setup

### 2.1 Access OCI Console
1. After account creation, log in to [OCI Console](https://cloud.oracle.com)
2. Select your region (choose one close to your users)
3. Familiarize yourself with the dashboard

### 2.2 Set Up Compartment
1. In the OCI Console, go to **Identity & Security** → **Compartments**
2. Create a new compartment called "lomen-club"
3. This will help organize your resources

## Step 3: Prepare for Deployment

### 3.1 Choose Deployment Method

**Recommended: Option A - Object Storage + CloudFlare (Easiest & Cheapest)**
- Uses OCI Object Storage for static hosting
- Free CloudFlare for CDN and SSL
- No server management required
- Perfect for React SPA

### 3.2 Domain Setup (Optional but Recommended)
1. Purchase a domain (e.g., lomen-club.com) from any registrar
2. Or use a free subdomain if available
3. We'll configure DNS later

## Step 4: Deployment Preparation

### 4.1 Build Your React App
```bash
# In your project directory
npm run build
```

This creates a `dist/` folder with production-ready files.

### 4.2 Configure OCI CLI (Optional but Recommended)
```bash
# Install OCI CLI
bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)"

# Configure OCI CLI
oci setup config
```

You'll need:
- Tenancy OCID
- User OCID
- Region
- Fingerprint
- Private key path

## Step 5: Next Steps

Once you have your OCI account set up, we'll proceed with:

1. **Create Object Storage Bucket**
2. **Upload built files**
3. **Configure static website hosting**
4. **Set up CloudFlare (for SSL and CDN)**
5. **Configure custom domain**
6. **Test deployment**

## Important Notes

### Free Tier Limitations:
- Resources are limited but sufficient for a React app
- Monitor usage to stay within free tier limits
- Object Storage has 10 GB free
- Data transfer has generous free allowances

### Cost Management:
- Set up budget alerts
- Monitor usage regularly
- Free tier is generous but has limits

## Getting Help

- [OCI Documentation](https://docs.oracle.com/en-us/iaas/Content/GSG/Concepts/baremetalintro.htm)
- [OCI Free Tier FAQ](https://www.oracle.com/cloud/free/faq/)
- [OCI Community Forums](https://community.oracle.com/community/cloud)

## Ready for Next Step?

Once you complete the OCI account setup, let me know and we'll proceed with the actual deployment of your Lomen Club app!

**Your next actions:**
1. ✅ Create OCI account (free tier)
2. ✅ Log in to OCI console
3. ✅ Create "lomen-club" compartment
4. 🔄 Let me know when ready for deployment
