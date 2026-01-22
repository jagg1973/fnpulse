# GitHub + Cloudflare Pages Deployment Guide

## 🎯 Overview

Your FNPulse site now uses a **GitHub → Cloudflare Pages** workflow:

1. **Edit content** in the admin dashboard
2. **Push to GitHub** with one click
3. **Cloudflare Pages automatically deploys** your site

This workflow provides:
- ✅ **Version control** - Full history of all changes
- ✅ **Backup** - Your content is safe on GitHub
- ✅ **Automatic deployment** - No manual uploads
- ✅ **Free hosting** - Cloudflare Pages is free for most sites

---

## 📋 Setup Instructions

### Step 1: Create a GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the **+** icon (top right) → **New repository**
3. Name it: `fnpulse` (or your preferred name)
4. Choose **Private** or **Public**
5. **DO NOT** initialize with README, .gitignore, or license
6. Click **Create repository**
7. Copy the repository URL (looks like: `https://github.com/username/fnpulse.git`)

### Step 2: Configure GitHub in Admin Dashboard

1. Open your admin dashboard: `http://localhost:3000`
2. Go to **Settings** (⚙️)
3. Scroll to **"GitHub Repository"** section
4. Paste your repository URL: `https://github.com/username/fnpulse.git`
5. Set branch to: `main` (or `master` if you prefer)
6. Click **Save Settings**

### Step 3: Initialize Git (First Time Only)

1. Go back to the **Dashboard**
2. Look at the **Git Status** card
3. If it says "Git not initialized", click **Initialize Git**
4. Git will be set up automatically!

### Step 4: Configure Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → **Create application**
3. Click **Pages** → **Connect to Git**
4. Click **Connect GitHub** and authorize Cloudflare
5. Select your `fnpulse` repository
6. Configure build settings:
   - **Project name**: `fnpulse` (or your preferred name)
   - **Production branch**: `main`
   - **Build command**: Leave blank (no build needed)
   - **Build output directory**: `/News` ⚠️ **IMPORTANT!**
7. Click **Save and Deploy**

### Step 5: First Deployment

1. Go back to your admin dashboard
2. Click **"Push to GitHub"** button
3. Enter a commit message (e.g., "Initial commit")
4. Wait for the push to complete
5. Cloudflare Pages will automatically start deploying!
6. Check the Cloudflare dashboard for your live URL

---

## 🚀 Daily Workflow

Once set up, your workflow is simple:

1. **Create/Edit Articles** in the admin dashboard
2. Click **"Push to GitHub"** when you're ready to publish
3. Cloudflare automatically deploys in ~1 minute
4. Your site is live!

---

## 📦 Git Status Card

The dashboard shows your Git status:

- **Branch**: Current branch (usually `main`)
- **Repository**: Your GitHub repository URL
- **Status**: 
  - ✓ Clean = No changes
  - ⚠️ X uncommitted changes = You have unpublished changes
- **Last Commit**: Your most recent commit

---

## 🔧 Troubleshooting

### "Git not initialized"
**Solution**: Click "Initialize Git" button on the dashboard, then configure your GitHub repository URL in Settings.

### "Permission denied (publickey)"
**Solution**: Set up SSH authentication with GitHub:
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to SSH agent
ssh-add ~/.ssh/id_ed25519

# Copy public key
cat ~/.ssh/id_ed25519.pub
```
Then add the key to GitHub: Settings → SSH and GPG keys → New SSH key

**Alternative**: Use HTTPS with a Personal Access Token:
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` scope
3. Use this URL format: `https://YOUR_TOKEN@github.com/username/fnpulse.git`

### "Repository not found"
**Solution**: Make sure:
- The repository URL is correct (copy from GitHub)
- You have access to the repository
- The repository exists

### "Failed to push some refs"
**Solution**: Pull remote changes first:
```bash
cd c:\FNPulse
git pull origin main
```
Then push again from the dashboard.

### "Cloudflare not deploying"
**Solution**:
- Check Cloudflare dashboard for build logs
- Verify the build output directory is set to `/News`
- Make sure the GitHub integration is connected
- Check the production branch matches your config (usually `main`)

### "No changes to commit"
This is normal! It means you haven't made any edits since the last push.

---

## 📚 Git Basics

### Understanding Git
- **Repository**: Your project folder tracked by Git
- **Commit**: A snapshot of your changes with a message
- **Push**: Upload commits to GitHub
- **Branch**: A version of your code (you're using `main`)

### Manual Git Commands (if needed)
```bash
# Navigate to your project
cd c:\FNPulse

# Check status
git status

# View commit history
git log --oneline

# Undo uncommitted changes
git checkout -- .

# Create a new branch
git checkout -b feature-name
```

---

## 🔐 Security Best Practices

### What's Protected on GitHub
✅ All your site files (HTML, CSS, JS, images)
✅ Admin dashboard code
✅ Full change history

### What to KEEP PRIVATE
⚠️ `admin/node_modules/` (ignored by .gitignore)
⚠️ `admin/data/backup/` (ignored by .gitignore)
⚠️ API tokens and secrets (if stored in config.json)

### .gitignore
Your `.gitignore` file prevents sensitive files from being uploaded:
```gitignore
admin/node_modules/
admin/*.log
admin/.DS_Store
admin/data/backup/
admin/deploy/
admin/deploy.zip
```

---

## 🌐 Custom Domains

To use your own domain (e.g., `fnpulse.com`):

1. Go to Cloudflare Pages dashboard
2. Select your project → **Custom domains**
3. Click **Set up a custom domain**
4. Enter your domain: `fnpulse.com`
5. Follow the DNS setup instructions
6. Your site will be available at your custom domain!

---

## 🔄 Migration from Direct Deployment

If you were using the old direct deployment method:

**Old workflow:**
1. Edit content
2. Click "Deploy to CF"
3. Site uploads directly

**New workflow (recommended):**
1. Edit content
2. Click "Push to GitHub"
3. Cloudflare auto-deploys from GitHub

**Benefits of new workflow:**
- Version history
- Easy rollbacks
- Collaboration support
- Backup on GitHub

---

## 💡 Tips

### Commit Messages
Use descriptive commit messages:
- ✅ "Add article about Bitcoin reaching $125K"
- ✅ "Update homepage with latest news"
- ✅ "Fix navigation menu links"
- ❌ "Update"
- ❌ "Changes"

### When to Push
- After adding new articles
- After updating site settings
- Before closing the admin dashboard
- At the end of your work session

### Deployment Time
- Push to GitHub: ~5 seconds
- Cloudflare Pages build: ~30-60 seconds
- Total time: ~1 minute from push to live

---

## 📞 Support

### Need Help?
1. Check the troubleshooting section above
2. Review GitHub documentation: https://docs.github.com
3. Check Cloudflare Pages docs: https://developers.cloudflare.com/pages
4. Check Git status on dashboard for clues

### Common Resources
- [GitHub Guides](https://guides.github.com/)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
