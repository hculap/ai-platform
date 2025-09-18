#!/bin/bash

# Build script for integrated deployment
# This script builds the frontend and prepares it for serving from Flask backend

set -e

echo "Building frontend..."
cd frontend
npm install --legacy-peer-deps
REACT_APP_API_URL=/api npm run build
cd ..

echo "Frontend built successfully!"
echo "React build files are now in frontend/build/"
echo "Flask backend will serve these files automatically"