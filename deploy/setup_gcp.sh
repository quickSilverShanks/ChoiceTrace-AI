#!/bin/bash
# ==============================================================================
# ChoiceTrace AI - GCP Infrastructure Setup Automation
# ==============================================================================
# This script provisions:
# 1. Required Google Cloud APIs
# 2. Artifact Registry repository for container images
# 3. Secret Manager entries for API Keys
# 4. Cloud SQL PostgreSQL instance and database
# ==============================================================================

set -e

# Configuration (Adjust variables as needed)
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "(unset)" ]; then
    echo "ERROR: Google Cloud Project ID is not set in gcloud config."
    echo "Please set your project ID first using:"
    echo "  gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi
REGION="us-central1"
REPO_NAME="choicetrace-repo"
DB_INSTANCE="choicetrace-db"
DB_NAME="choicetrace"
GEMINI_KEY_SECRET_NAME="GEMINI_API_KEY"

echo "========================================================"
echo "Starting GCP Setup for project: $PROJECT_ID in region: $REGION"
echo "========================================================"

# 1. Enable Google Cloud APIs
echo "--> Enabling required GCP APIs..."
gcloud services enable \
    run.googleapis.com \
    sqladmin.googleapis.com \
    secretmanager.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com

# 2. Create Artifact Registry Repository
echo "--> Creating Artifact Registry repository..."
gcloud artifacts repositories create $REPO_NAME \
    --repository-format=docker \
    --location=$REGION \
    --description="Docker repository for ChoiceTrace AI frontend and backend" || echo "Repository already exists."

# 3. Setup Secret Manager for Gemini API Key
echo "--> Setting up GCP Secret Manager for Gemini API Key..."
if gcloud secrets describe $GEMINI_KEY_SECRET_NAME >/dev/null 2>&1; then
    echo "Secret $GEMINI_KEY_SECRET_NAME already exists."
else
    gcloud secrets create $GEMINI_KEY_SECRET_NAME --replication-policy="automatic"
    echo "Please enter your Gemini API Key (or press Enter to configure a placeholder key):"
    read -r API_KEY
    if [ -z "$API_KEY" ]; then
        API_KEY="MOCK_API_KEY_FALLBACK"
    fi
    echo -n "$API_KEY" | gcloud secrets versions add $GEMINI_KEY_SECRET_NAME --data-file=-
    echo "Secret successfully created and seeded."
fi

# 4. Create Cloud SQL PostgreSQL Instance
echo "--> Creating Cloud SQL PostgreSQL instance (this may take a few minutes)..."
if gcloud sql instances describe $DB_INSTANCE >/dev/null 2>&1; then
    echo "SQL instance $DB_INSTANCE already exists."
    # If the instance already exists, we will check if we need to retrieve the password
else
    echo "Please enter a password for the Cloud SQL 'postgres' root user (or press Enter to use the default):"
    read -r DB_PASSWORD
    if [ -z "$DB_PASSWORD" ]; then
        DB_PASSWORD="SuperSecretDBPassword123!"
    fi

    gcloud sql instances create $DB_INSTANCE \
        --database-version=POSTGRES_15 \
        --tier=db-f1-micro \
        --region=$REGION \
        --root-password="$DB_PASSWORD"
fi

# 5. Create Cloud SQL Database
echo "--> Creating Cloud SQL Database '$DB_NAME'..."
gcloud sql databases create $DB_NAME \
    --instance=$DB_INSTANCE || echo "Database already exists."

# 5.5 Save DATABASE_URL in Secret Manager
DB_SECRET_NAME="DATABASE_URL"
echo "--> Setting up Secret Manager for Database Connection URL..."
if gcloud secrets describe $DB_SECRET_NAME >/dev/null 2>&1; then
    echo "Secret $DB_SECRET_NAME already exists."
else
    gcloud secrets create $DB_SECRET_NAME --replication-policy="automatic"
    
    # If DB_PASSWORD was not prompted above, prompt for it now to construct secret
    if [ -z "$DB_PASSWORD" ]; then
        echo "Please enter the password for your existing Cloud SQL 'postgres' user to configure the secret:"
        read -r DB_PASSWORD
        if [ -z "$DB_PASSWORD" ]; then
            DB_PASSWORD="SuperSecretDBPassword123!"
        fi
    fi

    DB_CONN_URL="postgresql://postgres:${DB_PASSWORD}@/${DB_NAME}?host=/cloudsql/${PROJECT_ID}:${REGION}:${DB_INSTANCE}"
    echo -n "$DB_CONN_URL" | gcloud secrets versions add $DB_SECRET_NAME --data-file=-
    echo "Database URL successfully stored in Secret Manager."
fi

# 6. Set Up IAM Permissions for Cloud Run to Access Secret Manager
echo "--> Configuring IAM permissions for service accounts..."
# Retrieve the project number to format the default compute service account correctly
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
COMPUTE_SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# Grant secret accessor role to the default compute service account (used by Cloud Run)
echo "--> Granting secretmanager.secretAccessor role to default compute service account: $COMPUTE_SERVICE_ACCOUNT"
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$COMPUTE_SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor"

echo "========================================================"
echo "GCP Infrastructure Provisioning Complete!"
echo "========================================================"
echo "Next Steps to deploy:"
echo "1. Run: gcloud builds submit --config=deploy/cloudbuild.yaml --substitutions=_REGION=$REGION,_REPOSITORY=$REPO_NAME"
echo "========================================================"
