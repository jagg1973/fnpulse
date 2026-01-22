# 🚀 GitHub + Cloudflare Pages Setup Checklist

Complete these steps to deploy your FNPulse site with automatic deployments.

---

## ✅ Step 1: Create GitHub Repository

- [ ] Go to https://github.com/new
- [ ] Repository name: `fnpulse` (or your choice)
- [ ] Visibility: Private or Public (your choice)
- [ ] **DO NOT** check "Initialize with README"
- [ ] Click "Create repository"
- [ ] Copy the repository URL (format: `https://github.com/username/fnpulse.git`)

**Repository URL:** `_______________________________________`

---

## ✅ Step 2: Configure Admin Dashboard

- [ ] Open admin dashboard: http://localhost:3000
- [ ] Go to **Settings** (⚙️ icon in sidebar)
- [ ] Scroll to **"GitHub Repository"** section
- [ ] Paste your repository URL
- [ ] Set branch to: `main`
- [ ] Click **"Save Settings"**

---

## ✅ Step 3: Initialize Git (First Time)

Choose **ONE** method:

### Method A: Using Admin Dashboard (Easiest)
- [ ] Go to **Dashboard** in admin
- [ ] Look for **"Git Status"** card
- [ ] Click **"Initialize Git"** button
- [ ] Wait for confirmation

### Method B: Using Command Line
- [ ] Open terminal in FNPulse directory
- [ ] Run: `./setup-github.sh`
- [ ] Follow the prompts

### Method C: Manual Git Setup
```bash
cd /c/FNPulse
git remote add origin https://github.com/YOUR_USERNAME/fnpulse.git
git branch -M main
```

---

## ✅ Step 4: First Push to GitHub

Choose **ONE** method:

### Method A: Using Admin Dashboard (Recommended)
- [ ] Go to **Dashboard**
- [ ] Click **"Push to GitHub"** button
- [ ] Enter commit message: "Initial commit"
- [ ] Wait for success message

### Method B: Using Command Line
```bash
cd /c/FNPulse
git push -u origin main
```

**If authentication fails, see "Authentication Setup" section below**

---

## ✅ Step 5: Connect Cloudflare Pages

- [ ] Go to https://dash.cloudflare.com
- [ ] Navigate to **Workers & Pages**
- [ ] Click **"Create application"**
- [ ] Choose **"Pages"** → **"Connect to Git"**
- [ ] Click **"Connect GitHub"**
- [ ] Authorize Cloudflare to access your GitHub
- [ ] Select your `fnpulse` repository

### Build Configuration:
- [ ] Project name: `fnpulse` (or your choice)
- [ ] Production branch: `main`
- [ ] Framework preset: `None`
- [ ] Build command: *(leave empty)*
- [ ] **Build output directory: `/News`** ⚠️ **CRITICAL!**
- [ ] Click **"Save and Deploy"**

**Project Name:** `_______________________________________`

---

## ✅ Step 6: Record Your URLs

After Cloudflare deploys (takes ~1 minute):

- [ ] Copy your Cloudflare Pages URL
- [ ] Test the URL in browser
- [ ] Verify your site loads correctly

**Cloudflare URL:** `https://_________________.pages.dev`

**Custom Domain (optional):** `_______________________________________`

---

## ✅ Step 7: Update Admin Configuration

- [ ] Go to **Settings** in admin dashboard
- [ ] Scroll to **"Cloudflare Pages"** section
- [ ] Enter **Account ID** (find in CF dashboard)
- [ ] Enter **Project Name** (same as above)
- [ ] Click **"Save Settings"**

---

## ✅ Step 8: Test the Workflow

- [ ] Create a new article in admin dashboard
- [ ] Click **"Publish"**
- [ ] Go to **Dashboard**
- [ ] Check **Git Status** - should show "uncommitted changes"
- [ ] Click **"Push to GitHub"**
- [ ] Enter commit message: "Test article"
- [ ] Wait for push to complete
- [ ] Go to Cloudflare dashboard
- [ ] Watch deployment progress
- [ ] Visit your site URL - article should appear in ~1 minute

---

## 🔐 Authentication Setup

If Git push fails with "Permission denied" or "Authentication failed":

### Option 1: SSH Key (Recommended)

1. Generate SSH key:
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

2. Start SSH agent:
```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

3. Copy public key:
```bash
cat ~/.ssh/id_ed25519.pub
```

4. Add to GitHub:
   - [ ] Go to GitHub → Settings → SSH and GPG keys
   - [ ] Click "New SSH key"
   - [ ] Paste the key
   - [ ] Click "Add SSH key"

5. Change repository URL to SSH format:
```bash
git remote set-url origin git@github.com:username/fnpulse.git
```

### Option 2: Personal Access Token

1. Create token:
   - [ ] Go to GitHub → Settings → Developer settings
   - [ ] Click "Personal access tokens" → "Tokens (classic)"
   - [ ] Click "Generate new token (classic)"
   - [ ] Check `repo` scope
   - [ ] Click "Generate token"
   - [ ] **Copy the token immediately!**

2. Update repository URL:
```bash
git remote set-url origin https://YOUR_TOKEN@github.com/username/fnpulse.git
```

**Token:** `ghp_________________________________` *(keep secret!)*

---

## 🎉 Success Criteria

Your setup is complete when:

- [x] Git repository initialized
- [x] Remote connected to GitHub
- [x] Successfully pushed to GitHub
- [x] Cloudflare Pages connected to repository
- [x] Site deploys automatically on push
- [x] Admin dashboard shows correct Git status
- [x] "Push to GitHub" button works
- [x] Changes appear on live site within 1-2 minutes

---

## 📋 Daily Workflow

Once set up, your workflow is:

1. **Edit content** in admin dashboard
2. Click **"Push to GitHub"**
3. Enter a **commit message**
4. Wait **~1 minute**
5. **Your site is live!**

---

## 🆘 Troubleshooting

### Git Status shows "Git not initialized"
**Fix:** Click "Initialize Git" button on dashboard

### Push fails: "Permission denied"
**Fix:** Set up SSH key or Personal Access Token (see above)

### Push fails: "Repository not found"
**Fix:** 
- Verify repository exists on GitHub
- Check URL is correct in Settings
- Make sure you have access to the repository

### Cloudflare not deploying
**Fix:**
- Check Cloudflare dashboard for errors
- Verify build output directory is `/News`
- Check production branch matches your config
- Verify GitHub integration is connected

### Changes not appearing on site
**Fix:**
- Wait 1-2 minutes for deployment
- Check Cloudflare deployment logs
- Clear browser cache
- Verify files are in `/News` folder

### "No changes to commit"
This is normal! It means you haven't made any edits.

---

## 📞 Need Help?

- GitHub Docs: https://docs.github.com
- Cloudflare Pages: https://developers.cloudflare.com/pages
- Git Tutorial: https://git-scm.com/docs/gittutorial

---

**Date Completed:** `_______________`

**Notes:**
```




```
