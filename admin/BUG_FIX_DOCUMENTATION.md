# Admin Tool Bug Fix Documentation

**Date:** January 2026  
**Scope:** Systemic fixes for three recurring configuration errors

---

## Executive Summary

This document details the root cause analysis and corrective actions for three interconnected bugs affecting article generation consistency.

---

## Issue A: Menu Design Inconsistency

### Symptom
Article pages displayed a simplified flat navigation bar while the homepage and category pages showed the full mega-menu with dropdowns.

### Root Cause
The `article-template.html` used a legacy `nav-island` component:
```html
<!-- OLD - Simple flat navigation -->
<nav class="nav-island">
    <a href="../index.html" class="nav-link">Home</a>
    <a href="../markets.html" class="nav-link">Markets</a>
    ...
</nav>
```

The homepage/category pages used a modern mega-menu structure with `dropdown-nav.css` styling.

### Corrective Action
**File Modified:** `admin/templates/article-template.html`

1. Added `dropdown-nav.css` stylesheet reference in `<head>`:
```html
<link rel="stylesheet" href="/css/dropdown-nav.css">
```

2. Replaced the `nav-island` with full mega-menu navigation matching homepage structure:
```html
<nav class="mega-nav">
    <div class="mega-nav-links">
        <a href="{{basePath}}index.html" class="mega-link">Home</a>
        <div class="mega-dropdown">
            <a href="{{basePath}}markets.html" class="mega-link has-sub">Markets ▾</a>
            <div class="mega-dropdown-content">
                <a href="{{basePath}}stocks-indices.html">Stocks & Indices</a>
                <a href="{{basePath}}commodities.html">Commodities</a>
                ...
            </div>
        </div>
        ...
    </div>
</nav>
```

3. Updated mobile menu overlay with matching mega-menu structure and accordion functionality.

---

## Issue B: Author Image Asset Paths

### Symptom
Author avatars displayed correctly on root-level articles but broke on articles in the `/news/` subfolder.

### Root Cause (Multi-Factor)

1. **content.json** stored author avatars with relative paths:
```json
"avatar": "img/1769532260611-298154634.jpg"  // WRONG
```

2. **templateGenerator.js** didn't normalize avatar paths to root-relative format.

3. **assetUtils.js** image normalization didn't consistently convert `img/` to `/img/`.

### Corrective Actions

**File Modified:** `admin/data/content.json`
```json
// CORRECTED - Now uses root-relative path
"avatar": "/img/1769532260611-298154634.jpg"
```

**File Modified:** `admin/utils/templateGenerator.js`

Added avatar path normalization in both `createArticle()` and `updateArticle()`:
```javascript
// Ensure author avatar uses root-relative path
let authorAvatar = author.avatar || '/img/author-face.jpg';
if (authorAvatar && !authorAvatar.startsWith('/') && !authorAvatar.startsWith('http')) {
    authorAvatar = '/' + authorAvatar.replace(/^\/+/, '');
}
```

**File Modified:** `admin/utils/assetUtils.js`

Enhanced `normalizeImagePaths()` function:
```javascript
// Convert relative img/ paths to root-relative /img/ paths
normalizedSrc = normalizedSrc.replace(/^img\//, '/img/');
```

---

## Issue C: Broken Navigation Links

### Symptom
Articles at different folder depths had broken navigation links:
- Root-level `article-*.html` files with `../` paths pointed to non-existent parent directory
- Subfolder `/news/*.html` files worked correctly with `../` paths

### Root Cause
The `article-template.html` used hardcoded `../` relative paths:
```html
<a href="../index.html">Home</a>
<a href="../markets.html">Markets</a>
```

This worked for `/news/` subfolder articles but broke for root-level articles.

### Corrective Action

**File Modified:** `admin/utils/templateGenerator.js`

Implemented dynamic `basePath` calculation:
```javascript
// Calculate basePath based on filename depth
const basePath = filename.includes('/') ? '../' : '';

// Replace placeholder in template
html = html.replace(/\{\{basePath\}\}/g, basePath);
```

**File Modified:** `admin/templates/article-template.html`

Converted all navigation paths to use `{{basePath}}` placeholder:
```html
<!-- Header -->
<a href="{{basePath}}index.html">Home</a>
<a href="{{basePath}}markets.html">Markets</a>

<!-- Breadcrumb -->
<a href="{{basePath}}index.html">Home</a>

<!-- Sidebar -->
<a href="{{basePath}}markets.html">Markets</a>

<!-- Footer -->
<a href="{{basePath}}about.html">About Us</a>

<!-- Bottom Nav -->
<a href="{{basePath}}index.html">Home</a>
```

---

## Files Modified Summary

| File | Changes |
|------|---------|
| `admin/templates/article-template.html` | Mega-menu header, mobile nav, {{basePath}} placeholders throughout |
| `admin/utils/templateGenerator.js` | basePath calculation, author avatar normalization |
| `admin/utils/assetUtils.js` | Enhanced image path normalization |
| `admin/data/content.json` | Root-relative author avatar path |

---

## Verification Checklist

### Pre-Deployment Testing

- [ ] **Generate a root-level article** (type: "article")
  - Verify: Navigation links point to `./` (no prefix)
  - Verify: Author avatar loads correctly
  - Verify: Mega-menu dropdown appears on hover

- [ ] **Generate a subfolder article** (type: "news")
  - Verify: Navigation links point to `../`
  - Verify: Author avatar loads correctly
  - Verify: Mega-menu dropdown appears on hover

- [ ] **Check mobile view**
  - Verify: Mobile menu has correct links
  - Verify: Accordion dropdowns work properly

- [ ] **Cross-browser testing**
  - Chrome, Firefox, Safari, Edge

### Regression Prevention

- [ ] All existing articles should be regenerated via admin tool to apply fixes
- [ ] Test the "Update Article" functionality preserves basePath
- [ ] Verify footer Recent Posts links work correctly

---

## How to Regenerate Existing Articles

The fixes only apply to **newly created/updated** articles. To fix existing articles:

### Option 1: Regenerate via Admin Tool
```bash
cd admin
node server.js
# Use the admin UI to edit and save each article
```

### Option 2: Batch Update Script
Create a script that:
1. Reads each article from content.json
2. Calls the updateArticle() function for each

### Articles Requiring Update:
- `/News/article-corporate-distressed-debt-solvency-flip-dollar-deno.html`
- `/News/article-distressed-reserve-metrics-identifying-takeover-targets-trading-below-pv-10-at-dollar60-oil.html`
- `/News/news/wall-street-braces-for-super-week-as-fomc-decision-looms-and-big-tech-reports.html`

---

## Configuration Notes for Future Development

### When Adding New Templates
1. Always include `dropdown-nav.css` in the `<head>`
2. Use the mega-menu navigation structure
3. Use `{{basePath}}` for all internal navigation links
4. Use root-relative paths (`/img/`, `/css/`, `/js/`) for assets

### Content Types and Base Paths
| Content Type | Output Location | basePath Value |
|-------------|-----------------|----------------|
| `article` | `/News/article-*.html` | `""` (empty) |
| `news` | `/News/news/*.html` | `"../"` |
| `multimedia` | `/News/multimedia/*.html` | `"../"` |

### Author Avatar Guidelines
- Store avatars in `/News/img/` directory
- Reference in content.json with root-relative path: `/img/filename.jpg`
- Never use relative paths like `img/filename.jpg`

---

## Contact

For questions about these fixes, refer to this documentation or examine the git commit history for detailed change context.
