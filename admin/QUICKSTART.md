# FNPulse Admin - Quick Start Guide

## 🚀 Getting Started in 3 Steps

### Step 1: Install Dependencies

Open a terminal in the `admin` folder and run:

```bash
npm install
```

This will install:
- Express (web server)
- EJS (templating)
- Multer (file uploads)
- Cheerio (HTML parsing)
- Body-parser (form handling)
- Slugify (URL generation)
- Dayjs (date formatting)

### Step 2: Start the Server

```bash
npm start
```

You should see:
```
✨ FNPulse Admin Dashboard running at http://localhost:3000
```

### Step 3: Open in Browser

Navigate to: **http://localhost:3000**

## 📚 First-Time Setup Checklist

1. **Review Settings** (http://localhost:3000/settings)
   - ✅ Verify site name and URL
   - ✅ Check navigation menu items
   - ✅ Update social media links
   - ✅ Configure ticker news text

2. **Create Your First Article**
   - Click "New Article" button
   - Fill in title, category, author
   - Write your content using the rich text editor
   - Add a featured image
   - Configure SEO meta tags
   - Click "Publish"

3. **Upload Images**
   - Go to Images section
   - Click "Upload Images"
   - Select image files from your computer
   - Copy paths to use in articles

4. **Test Local Preview**
   - Click "Preview Site" in sidebar
   - Verify your changes look correct
   - Check article formatting and images

## 🎯 Common Tasks

### Create a New Article
Dashboard → New Article → Fill form → Publish

### Edit Existing Article
Articles → Click ✏️ → Make changes → Publish

### Upload Images
Images → Upload Images → Select files

### Update Navigation Menu
Settings → Main Navigation → Add/Edit items → Save → Regenerate All

### Change Site-Wide Text
Settings → Update any field → Save Settings → Regenerate All Pages

## 🚢 Deploying to Cloudflare Pages

### Option 1: Dashboard Upload
1. Go to Cloudflare Pages dashboard
2. Select your project
3. Click "Upload assets"
4. Drag the `/News` folder
5. Deploy

### Option 2: Wrangler CLI
```bash
cd ..
wrangler pages deploy News --project-name=fnpulse
```

### Option 3: Git Integration
```bash
git add News/*
git commit -m "Update articles"
git push
```
Cloudflare will auto-deploy from your Git repository.

## ⚡ Pro Tips

1. **Keep the admin running** while you work - changes save immediately
2. **Use "Preview Site"** to check your work before deploying
3. **Regenerate All Pages** after changing navigation or footer
4. **Backups are automatic** - original files saved before editing
5. **Image picker** in article editor makes inserting images easy
6. **Meta description counter** helps optimize for SEO (160 char max)

## 🛠️ Development Mode

For auto-restart on file changes:

```bash
npm run dev
```

Requires: `npm install -g nodemon`

## ❓ Need Help?

- Check `README.md` for detailed documentation
- View server logs in the terminal for errors
- Ensure port 3000 is not in use by another app
- Verify Node.js version: `node --version` (v14+ required)

## 📁 Important Folders

- **`/News`** - Your actual website files (deploy this)
- **`/admin`** - Admin dashboard (local only)
- **`/admin/data/backup`** - Automatic backups of edited files
- **`/admin/data/config.json`** - Site configuration

---

**Ready to go!** 🎉

Start by creating your first article or exploring the settings.
