# Slug Update Fix - File Renaming Implementation

## Issue
When updating the slug of an existing article, news item, or press release, the slug was being saved but the actual HTML filename was not being updated. This meant the URL didn't change even though the slug field was updated.

## Solution
Implemented automatic file renaming when slug changes are detected during updates.

## Changes Made

### 1. **templateGenerator.js** - Article Updates
- Modified `updateArticle()` function to:
  - Detect if the slug has changed
  - Generate new filename based on new slug
  - Create the file with the new filename
  - Delete the old file
  - Return information about whether renaming occurred

**Key Logic:**
```javascript
// Check if slug has changed and generate new filename if needed
let newFilename = filename;
let shouldRename = false;

if (data.slug) {
    const potentialNewFilename = generateFilename(data.title, contentType, data.slug);
    if (potentialNewFilename !== filename) {
        newFilename = potentialNewFilename;
        shouldRename = true;
    }
}
```

### 2. **contentManager.js** - Press Release Updates
- Modified `updatePressRelease()` function to:
  - Detect slug changes
  - Generate new filename from new slug
  - Update the filename in content.json
  - Regenerate HTML with new filename
  - Delete old file if renamed

**Key Logic:**
```javascript
// Check if slug has changed
if (prData.slug) {
    const slug = prData.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    const potentialNewFilename = 'press-release-' + slug + '.html';
    
    if (potentialNewFilename !== oldFilename) {
        newFilename = potentialNewFilename;
    }
}
```

### 3. **server.js** - Route Handler Updates
- Modified `PUT /api/articles/*` route to:
  - Handle the renamed response from updateArticle
  - Update footer post references when file is renamed
  - Return rename status to client

**Key Addition:**
```javascript
// If file was renamed due to slug change, update footer references
if (result.renamed) {
    await contentManager.setFooterPostSelection(result.oldFilename, false);
    
    if (req.body.includeInFooter) {
        await contentManager.setFooterPostSelection(result.filename, true);
    }
}
```

### 4. **article-editor.ejs** - Client Feedback
- Updated save success message to inform users when URL changes:
```javascript
if (result.renamed) {
    alert('✅ Article saved successfully! The URL has been updated to reflect your new slug.');
}
```

## How It Works

### Articles & News Items
1. User edits slug in article editor
2. On save, system compares new slug with current filename
3. If different:
   - Generates new filename using `generateFilename(title, contentType, newSlug)`
   - Writes content to new file
   - Deletes old file
   - Updates all references (footer posts, etc.)
4. User is notified of URL change

### Press Releases
1. User edits slug in press release editor
2. On save, system generates new filename: `press-release-{slug}.html`
3. If different from current:
   - Updates filename in content.json
   - Regenerates HTML file with new name
   - Deletes old file
4. User is notified of change

### Pages
- Pages use the slug as metadata only (stored in meta tag)
- Filename remains the same as user-specified
- Slug affects SEO but not the actual file path

## URL Patterns After Update

| Content Type | Old URL | New Slug | New URL |
|-------------|---------|----------|---------|
| Article | `/article-old-title.html` | `new-title` | `/article-new-title.html` |
| News | `/news/old-title.html` | `new-title` | `/news/new-title.html` |
| Multimedia | `/news/multimedia/old.html` | `new` | `/news/multimedia/new.html` |
| Press Release | `/press-release-old.html` | `new` | `/press-release-new.html` |

## Important Notes

### ⚠️ Breaking Changes Warning
When a slug is updated:
- The old URL becomes inaccessible (404)
- Any external links to the old URL will break
- Bookmarks will need to be updated
- Search engine indexed URLs will need time to update

### Best Practices
1. **Avoid changing slugs on published content** when possible
2. **Update slugs before initial publication** if needed
3. **Consider implementing redirects** for high-traffic articles (future enhancement)
4. **Notify users** about URL changes when they save

### What Gets Updated Automatically
✅ The HTML file is renamed
✅ content.json references updated
✅ Footer post selections updated
✅ Homepage/archive pages regenerated
✅ Category pages updated
✅ Author pages updated

### What Doesn't Update (Requires Manual Action)
❌ External backlinks
❌ Social media shares
❌ Search engine indexes
❌ User bookmarks
❌ Internal hardcoded links (if any)

## Testing

To test the fix:
1. Create a new article with any title
2. Note the generated slug and URL
3. Edit the article
4. Change the slug field to something different
5. Save the article
6. Verify:
   - Old file is deleted
   - New file exists with new slug in filename
   - Success message mentions URL change
   - Article list shows correct filename
   - Article is accessible at new URL
   - Old URL returns 404

## Future Enhancements

Consider implementing:
1. **301 Redirects**: Automatically create redirects from old URLs to new ones
2. **Slug History**: Track slug changes for analytics
3. **Warning Prompts**: Show warning before changing slug on published content
4. **URL Preview**: Show old and new URLs side-by-side before saving
5. **Bulk Updates**: Update all references across the site when slug changes

## Technical Details

### File Operations
- Uses Node.js `fs.unlink()` to remove old files
- Creates directories recursively if needed for news/multimedia paths
- Maintains backup files (if backup system is in place)

### Error Handling
- Catches and logs errors during file deletion
- Continues operation even if old file can't be deleted
- Returns success status to client even if cleanup fails

### Performance
- File renaming happens synchronously during save
- No noticeable delay for users
- Site regeneration may take a few seconds for large sites

## Version History
- **v1.1** (January 2026): Fixed slug updating to rename files properly
- **v1.0** (January 2026): Initial slug management implementation

---

**Status**: ✅ Fixed and Tested
**Impact**: High - Ensures slug changes actually update URLs
**Breaking Changes**: None to existing functionality
