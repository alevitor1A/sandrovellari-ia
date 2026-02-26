#!/bin/bash
# Deploy manual to Cloud Run (requires gcloud configured and authenticated)
PROJECT=$1
REGION=${2:-us-central1}
IMAGE=gcr.io/${PROJECT}/sandrovellari-ia:latest

if [ -z "$PROJECT" ]; then
  echo "Usage: ./deploy_cloudrun.sh <GCP_PROJECT_ID> [region]"
  exit 1
fi

echo "Building Docker image..."
docker build -t $IMAGE .

echo "Pushing image to Container Registry..."
docker push $IMAGE

echo "Deploying to Cloud Run in region $REGION..."
gcloud run deploy sandrovellari-ia --image $IMAGE --region $REGION --platform managed --allow-unauthenticated --project $PROJECT

echo "Deployed. Update your clients to point to the service URL printed by gcloud." 
