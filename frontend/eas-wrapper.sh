#!/bin/bash

# EAS Build and Submit Script for FixIntel AI
# Ensures EXPO_TOKEN is set for non-interactive environments

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep EXPO_TOKEN | xargs)
fi

# Set EXPO_TOKEN if not already set
if [ -z "$EXPO_TOKEN" ]; then
  export EXPO_TOKEN=glz-msxGir_f_3P_YP9znHhrv-RHB4rgG3cBKS4B
fi

echo "✅ Authenticated as: $(npx eas whoami)"
echo ""

# Execute the EAS command passed as arguments
npx eas "$@"
