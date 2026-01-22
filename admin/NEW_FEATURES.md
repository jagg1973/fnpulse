# FNPulse Admin - New Features Documentation

## Overview
This document covers the 4 new features added to the FNPulse Admin dashboard:

1. **Authors Management** - Complete CRUD system for managing content authors
2. **Ad Banners Management** - Manage advertising banners with locations, sizes, and targeting
3. **Enhanced Menu Management** - Support for nested/child menu items
4. **HTML Editor Mode** - Toggle between Rich Text and HTML editing

---

## 1. Authors Management

### Features
- Create, edit, and delete author profiles
- Store author information:
  - Full name
  - Email address
  - Title/Position (e.g., "Senior Financial Reporter")
  - Bio
  - Avatar image
  - Social media links (Twitter/X, LinkedIn)
- Visual author cards with avatars and social links
- Author selection dropdown in article editor

### Usage

#### Access Authors
Navigate to: **http://localhost:3000/authors**

#### Add New Author
1. Click "Add New Author" button
2. Fill in the form:
   - **Name** (required): Full name of the author
   - **Email**: Contact email
   - **Title**: Job title or position
   - **Bio**: Short biography
   - **Avatar**: Path to author image (use Images section to upload)
   - **Social Links**: Twitter/X and LinkedIn URLs
3. Click "Create Author"

#### Edit Author
1. Go to Authors page
2. Click "Edit" on any author card
3. Update information
4. Click "Update Author"

#### Delete Author
1. Go to Authors page
2. Click "Delete" on author card
3. Confirm deletion

#### Using Authors in Articles
When creating or editing an article:
1. The "Author" field is now a dropdown
2. Select from available authors
3. The author name will be saved with the article

### API Endpoints
```
GET    /authors          - View all authors
GET    /authors/new      - New author form
GET    /authors/edit/:id - Edit author form
POST   /api/authors      - Create author
PUT    /api/authors/:id  - Update author
DELETE /api/authors/:id  - Delete author
GET    /api/authors      - Get authors list (JSON)
```

---

## 2. Ad Banners Management

### Features
- Create, edit, and delete ad banners
- Banner configurations:
  - Name (internal reference)
  - Location (header, sidebar, article-body, footer, between-articles)
  - Size presets (728x90, 300x250, 336x280, 300x600, 970x250, custom)
  - Type: Image, HTML Code, or Google AdSense
  - Enable/disable toggle
  - Page targeting (all, home, articles, category)
- Quick enable/disable from list view
- Status badges (Active/Disabled)

### Usage

#### Access Ad Banners
Navigate to: **http://localhost:3000/ads**

#### Add New Banner
1. Click "Add New Ad Banner"
2. Fill in the form:
   - **Banner Name** (required): Internal reference name
   - **Location** (required): Where the banner appears
   - **Size**: Select standard IAB size or custom
   - **Type** (required):
     - **Image**: Provide image URL
     - **HTML Code**: Paste custom HTML
     - **Google AdSense**: Paste AdSense code
   - **Content** (required): Image path or HTML code
   - **Link URL**: Destination URL (for image banners)
   - **Alt Text**: Accessibility text
   - **Display On Pages**: Select where banner shows
   - **Enable this banner**: Check to activate
3. Click "Create Banner"

#### Edit Banner
1. Go to Ad Banners page
2. Click "Edit" on any banner row
3. Update information
4. Click "Update Banner"

#### Quick Enable/Disable
- Click the play (▶) or pause (⏸) button to toggle banner status

#### Delete Banner
1. Go to Ad Banners page
2. Click "Delete" on banner row
3. Confirm deletion

### Banner Locations
- **header**: Top of page
- **sidebar**: Side column
- **article-body**: Within article content
- **footer**: Bottom of page
- **between-articles**: Between article listings

### Standard IAB Sizes
- 728x90 - Leaderboard
- 300x250 - Medium Rectangle
- 336x280 - Large Rectangle
- 300x600 - Half Page
- 970x250 - Billboard

### API Endpoints
```
GET    /ads               - View all banners
GET    /ads/new           - New banner form
GET    /ads/edit/:id      - Edit banner form
POST   /api/ads           - Create banner
PUT    /api/ads/:id       - Update banner
PUT    /api/ads/:id/toggle - Toggle enabled status
DELETE /api/ads/:id       - Delete banner
```

---

## 3. Enhanced Menu Management

### Features
- Nested menu structure with parent-child relationships
- Each menu item has:
  - ID (auto-generated)
  - Label (display text)
  - URL (link destination)
  - Children array (sub-menu items)

### Current Structure
The navigation in `config.json` now supports nested menus:

```json
"navigation": [
  {
    "id": "markets",
    "label": "Markets",
    "url": "/markets.html",
    "children": [
      { "id": "stocks", "label": "Stocks", "url": "/stocks.html" },
      { "id": "forex", "label": "Forex", "url": "/forex.html" },
      { "id": "crypto", "label": "Crypto", "url": "/crypto.html" },
      { "id": "commodities", "label": "Commodities", "url": "/commodities.html" }
    ]
  },
  // ... more menu items
]
```

### Usage
Edit menu structure in Settings page:
1. Navigate to **http://localhost:3000/settings**
2. Scroll to "Navigation Menu" section
3. Edit the JSON structure to add/modify menu items
4. Add `children` array to any menu item to create sub-menu
5. Click "Save Settings"

### Best Practices
- Keep menu hierarchy to 2 levels (parent → children)
- Use descriptive IDs (lowercase, hyphenated)
- Ensure all URLs are valid and point to existing pages
- Test navigation after saving changes

---

## 4. HTML Editor Mode

### Features
- Toggle between Rich Text (WYSIWYG) and HTML editing
- Seamless content sync between modes
- Monospace font for HTML editing
- Full HTML control for advanced users

### Usage

#### Switch to HTML Mode
1. In article editor, find "Article Content" section
2. Click "HTML" button in the editor mode toggle
3. The content converts to raw HTML in a textarea
4. Edit HTML directly with full control

#### Switch to Rich Text Mode
1. Click "Rich Text" button
2. HTML is parsed and rendered in WYSIWYG editor
3. Continue editing visually

#### When to Use HTML Mode
- Embedding custom widgets or scripts
- Adding specific HTML attributes
- Inserting complex tables or layouts
- Pasting pre-formatted HTML from other sources
- Fine-tuning HTML structure

#### When to Use Rich Text Mode
- Standard article writing
- Visual formatting (bold, italic, headings)
- Quick content creation
- User-friendly editing

### Technical Details
The editor:
- Uses Quill.js for rich text editing
- HTML mode shows `quill.root.innerHTML`
- Changes in HTML mode sync back to Quill on mode switch
- Content is saved based on active mode

---

## Data Storage

All data is stored in JSON files:

### `/admin/data/content.json`
Stores authors and ad banners:
```json
{
  "authors": [
    {
      "id": "jesus-guzman",
      "name": "Jesus Guzman",
      "email": "jesus@fnpulse.com",
      "bio": "...",
      "avatar": "img/author-face.jpg",
      "title": "Senior Financial Reporter",
      "twitter": "https://twitter.com/...",
      "linkedin": "https://linkedin.com/in/..."
    }
  ],
  "adBanners": [
    {
      "id": "header-leaderboard",
      "name": "Header Leaderboard",
      "location": "header",
      "size": "728x90",
      "type": "image",
      "content": "img/banner-728x90.jpg",
      "link": "https://example.com",
      "altText": "Advertisement",
      "enabled": true,
      "pages": ["all"]
    }
  ]
}
```

### `/admin/data/config.json`
Stores navigation (with nested structure) and site settings:
```json
{
  "navigation": [
    {
      "id": "markets",
      "label": "Markets",
      "url": "/markets.html",
      "children": [...]
    }
  ],
  "categories": [...],
  "socialLinks": {...},
  "siteInfo": {...}
}
```

---

## Testing Checklist

### Authors Management
- [ ] Create new author
- [ ] Edit existing author
- [ ] Delete author
- [ ] Author appears in article editor dropdown
- [ ] Save article with selected author
- [ ] Avatar image displays correctly
- [ ] Social links work

### Ad Banners Management
- [ ] Create image banner
- [ ] Create HTML code banner
- [ ] Create AdSense banner
- [ ] Edit banner
- [ ] Toggle enable/disable
- [ ] Delete banner
- [ ] Different locations save correctly
- [ ] Page targeting works

### Enhanced Menu
- [ ] View nested menu structure in settings
- [ ] Edit menu with children
- [ ] Save changes
- [ ] Menu displays correctly on site

### HTML Editor Mode
- [ ] Switch to HTML mode
- [ ] Edit HTML
- [ ] Switch back to Rich Text
- [ ] Changes persist
- [ ] Save article with HTML edits
- [ ] Paste HTML from external source

---

## Files Modified/Created

### New Files Created
- `/admin/utils/contentManager.js` - Authors and ads CRUD functions
- `/admin/views/authors.ejs` - Authors list view
- `/admin/views/author-editor.ejs` - Author create/edit form
- `/admin/views/ads.ejs` - Ad banners list view
- `/admin/views/ad-editor.ejs` - Ad banner create/edit form

### Modified Files
- `/admin/server.js` - Added routes for authors and ads
- `/admin/views/article-editor.ejs` - Added author dropdown and HTML mode toggle
- `/admin/views/dashboard.ejs` - Added Authors and Ads navigation links
- `/admin/views/articles.ejs` - Updated navigation
- `/admin/views/images.ejs` - Updated navigation
- `/admin/views/settings.ejs` - Updated navigation
- `/admin/public/css/admin.css` - Added styles for new features
- `/admin/data/content.json` - Created data file for authors/ads
- `/admin/data/config.json` - Updated navigation structure

---

## Next Steps

1. **Test all features** using the checklist above
2. **Add sample authors** and ad banners for your site
3. **Update existing articles** to use author dropdown
4. **Configure ad banners** for your advertising needs
5. **Customize nested menus** to match your site structure

---

## Support & Troubleshooting

### Common Issues

**Authors not loading in article editor**
- Check console for errors
- Verify content.json exists and is valid JSON
- Ensure server is running

**Ad banner not appearing**
- Check if banner is enabled
- Verify page targeting includes current page
- Check content field has valid data

**HTML mode not syncing**
- Refresh page
- Try switching modes again
- Check browser console for errors

**Nested menus not displaying**
- Verify JSON structure in config.json
- Ensure children array is properly formatted
- Check for syntax errors

---

## Developer Notes

### Adding New Banner Locations
Edit `ad-editor.ejs` line ~30 to add location options:
```html
<option value="new-location">New Location</option>
```

### Adding New Banner Sizes
Edit `ad-editor.ejs` line ~40 to add size options:
```html
<option value="120x600">120x600 (Skyscraper)</option>
```

### Extending Author Fields
Modify:
1. `contentManager.js` - Add field to createAuthor/updateAuthor
2. `author-editor.ejs` - Add form field
3. `authors.ejs` - Display new field in card

---

**Version:** 2.0.0  
**Last Updated:** {{ current_date }}  
**Admin Dashboard:** http://localhost:3000
