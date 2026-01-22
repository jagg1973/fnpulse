#!/bin/bash

echo "🚀 FNPulse GitHub Deployment Setup"
echo "===================================="
echo ""

# Check if Git is initialized
if [ ! -d .git ]; then
    echo "❌ Error: Git not initialized"
    echo "   Run this from your FNPulse directory"
    exit 1
fi

# Check if remote exists
if git remote get-url origin > /dev/null 2>&1; then
    CURRENT_REMOTE=$(git remote get-url origin)
    echo "✓ Git remote already configured:"
    echo "  $CURRENT_REMOTE"
    echo ""
    read -p "Do you want to change it? (y/N): " CHANGE_REMOTE
    if [[ ! $CHANGE_REMOTE =~ ^[Yy]$ ]]; then
        echo "Keeping existing remote."
        exit 0
    fi
fi

# Prompt for GitHub repository URL
echo ""
echo "📋 Enter your GitHub repository details:"
echo ""
read -p "Repository URL (e.g., https://github.com/username/fnpulse.git): " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo "❌ Repository URL is required"
    exit 1
fi

# Add or update remote
if git remote get-url origin > /dev/null 2>&1; then
    git remote set-url origin "$REPO_URL"
    echo "✓ Updated Git remote"
else
    git remote add origin "$REPO_URL"
    echo "✓ Added Git remote"
fi

# Ask about branch
read -p "Branch name (default: main): " BRANCH
BRANCH=${BRANCH:-main}

# Check if we're on the right branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    echo ""
    echo "Creating and switching to branch: $BRANCH"
    git branch -M "$BRANCH"
fi

# Push to GitHub
echo ""
echo "📤 Pushing to GitHub..."
if git push -u origin "$BRANCH"; then
    echo ""
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "Next steps:"
    echo "1. Go to https://dash.cloudflare.com"
    echo "2. Navigate to Workers & Pages → Create application"
    echo "3. Choose 'Connect to Git' and select your repository"
    echo "4. Set 'Build output directory' to: /News"
    echo "5. Click 'Save and Deploy'"
    echo ""
    echo "After setup, use 'Push to GitHub' button in the admin dashboard!"
else
    echo ""
    echo "❌ Push failed. Common issues:"
    echo ""
    echo "If authentication failed:"
    echo "  - Set up SSH key: https://docs.github.com/en/authentication"
    echo "  - Or use Personal Access Token in URL:"
    echo "    https://YOUR_TOKEN@github.com/username/repo.git"
    echo ""
    echo "If repository doesn't exist:"
    echo "  - Create it on GitHub first"
    echo "  - Make sure the URL is correct"
    echo ""
fi
