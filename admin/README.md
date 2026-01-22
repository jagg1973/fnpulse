# FNPulse Admin Dashboard

Local admin tool for managing your FNPulse static news website.

## Features

✅ **Article Management**
- Create and edit articles with rich text editor
- SEO-optimized with meta tags, Open Graph, and Schema.org
- Live preview of articles
- Full control over content, images, and formatting

✅ **Image Library**
- Upload and manage media files
- Browse images with visual picker
- Copy image paths for easy insertion
- Delete unused images

✅ **Site-Wide Settings**
- Configure navigation menus
- Update social media links
- Manage ticker news content
- Set pagination preferences
- Customize ad placements

✅ **Batch Operations**
- Regenerate all pages with updated navigation/footer
- Apply global changes site-wide
- Backup system for safe editing

## Installation

1. Navigate to the admin folder:
```bash
cd admin
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser:
```
http://localhost:3000
```

## Usage

### Creating a New Article

1. Click **"New Article"** from the dashboard or articles page
2. Fill in all required fields:
   - Title
   - Category
   - Author
   - Excerpt
   - Featured image
   - Article content (use the rich text editor)
3. Configure SEO meta tags
4. Click **"Publish"** to create the article

The article will be saved as an HTML file in the `/News` folder.

### Editing Existing Articles

1. Go to **Articles** page
2. Click the ✏️ edit icon next to the article
3. Make your changes
4. Click **"Publish"** to save

A backup of the original file is automatically created before editing.

### Managing Images

1. Go to **Images** page
2. Click **"Upload Images"** to add new images
3. Select one or multiple image files
4. Images are saved to `/News/img/` folder
5. Click 📋 to copy image path for use in articles

### Updating Site Settings

1. Go to **Settings** page
2. Modify any settings:
   - Site information
   - Navigation menu
   - Social links
   - Pagination
   - SEO defaults
3. Click **"Save Settings"**
4. Click **"Regenerate All Pages"** to apply changes site-wide

### Deploying to Cloudflare Pages

After making changes:

1. All files are saved locally in `/News` folder
2. Preview your changes by clicking "Preview Site"
3. Upload the entire `/News` folder to Cloudflare Pages:
   - Via Cloudflare Pages dashboard (drag & drop)
   - Via Wrangler CLI: `wrangler pages deploy News`
   - Via Git (commit and push changes)

## File Structure

```
admin/
├── server.js           # Express server
├── package.json        # Dependencies
├── data/
│   └── config.json     # Site configuration
├── views/              # EJS templates
│   ├── dashboard.ejs
│   ├── articles.ejs
│   ├── article-editor.ejs
│   ├── images.ejs
│   └── settings.ejs
├── utils/              # Backend utilities
│   ├── htmlParser.js
│   ├── templateGenerator.js
│   └── fileManager.js
├── templates/
│   └── article-template.html
└── public/             # Static assets
    ├── css/
    │   └── admin.css
    └── js/
        └── admin.js
```

## Configuration

Edit `data/config.json` to modify default settings:
- Site name and URL
- Navigation structure
- Categories
- Social links
- SEO defaults

## Development

For development with auto-reload:

```bash
npm run dev
```

## Backup System

The admin automatically creates backups before editing files:
- Backups stored in `admin/data/backup/`
- Timestamped filenames for version tracking
- Manually restore if needed

## Important Notes

⚠️ **File-Based System**: All changes are saved directly to local HTML files. Always keep backups of your `/News` folder.

⚠️ **No Database**: This is a static site generator. No database required.

⚠️ **Local Only**: This admin runs on your local machine. Not meant for production deployment.

✅ **CF Pages Compatible**: Generated files work perfectly with Cloudflare Pages static hosting.

## Troubleshooting

### Server won't start
- Check if port 3000 is available
- Run `npm install` to ensure dependencies are installed

### Images not uploading
- Check write permissions on `/News/img/` folder
- Ensure folder exists

### Changes not showing
- Clear browser cache
- Check if files are being saved to correct location
- Run "Regenerate All Pages" from Settings

## Support

For issues or questions about FNPulse theme, contact the theme developer.
For admin tool issues, check the logs in the terminal.

---

**Version**: 1.0.0  
**Last Updated**: January 2026
