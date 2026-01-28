# Slug Management Feature - SEO Guide

## Overview
The FNPulse admin tool now includes comprehensive slug management for all content types (articles, news, press releases, and pages). This feature gives you full control over URL structure for better SEO performance.

## What is a Slug?
A slug is the URL-friendly version of a page title or headline. It appears in the browser's address bar and search engine results.

**Example:**
- Title: "Bitcoin Surges to New All-Time High"
- Slug: `bitcoin-surges-new-all-time-high`
- URL: `/article-bitcoin-surges-new-all-time-high.html`

## Features

### 1. **Auto-Generation**
- Slugs are automatically generated from titles/headlines as you type
- Only works for new content or when the slug field is empty
- Click "🔄 Auto-Generate" button to regenerate at any time

### 2. **SEO Optimization**
The slug generator automatically:
- Converts text to lowercase
- Replaces spaces with hyphens
- Removes special characters and accents
- Removes common stop words (a, an, the, is, etc.) from the middle of the slug
- Limits length to 60 characters for optimal SEO
- Keeps the first and last words for better context

### 3. **Real-Time Preview**
- See how your URL will look before publishing
- Preview updates as you type
- Different formats for different content types

### 4. **Manual Editing**
- Override auto-generated slugs with custom ones
- Edit slugs before or after publishing
- Validation ensures only valid characters (a-z, 0-9, hyphens)

## How to Use

### Creating a New Article/News
1. Enter your title in the "Article Title" field
2. The slug is automatically generated in the "URL Slug" field
3. Review the URL preview below the slug field
4. Edit the slug if needed for better SEO
5. Click "Publish" to save

### Creating a Press Release
1. Enter your headline
2. Slug auto-generates in the SEO Settings section
3. Review and customize as needed
4. URL format: `/press-release-your-slug.html`

### Creating a Page
1. Enter the filename (e.g., `about.html`)
2. The slug is generated from the filename
3. Edit for better SEO-friendliness
4. The slug is stored as metadata

### Editing Existing Content
- Slug field retains the current value
- Edit manually if you want to change the URL structure
- **Warning:** Changing slugs on published content may break existing links

## SEO Best Practices

### ✅ DO:
- **Keep it short**: 3-5 words is ideal (max 60 characters)
- **Use keywords**: Include your primary keyword
- **Use hyphens**: Separate words with hyphens, not underscores
- **Be descriptive**: Clearly indicate what the page is about
- **Stay consistent**: Use similar patterns across your site

### ❌ DON'T:
- **Use stop words**: Avoid "a", "the", "and", "is" in the middle
- **Include dates**: Unless specifically needed
- **Use special characters**: Stick to letters, numbers, and hyphens
- **Make it too long**: Keep under 60 characters
- **Change frequently**: URL stability is important for SEO

## Examples

### Good Slugs ✅
```
bitcoin-price-analysis-2026
federal-reserve-interest-rate-decision
tech-stocks-quarterly-earnings
cryptocurrency-market-trends
oil-prices-supply-chain-impact
```

### Bad Slugs ❌
```
the-bitcoin-price-is-going-up-today (too long, has stop words)
BTC_Price_Analysis (uppercase, underscores)
article-123 (not descriptive)
news-item (too generic)
this-is-a-really-long-slug-that-goes-on-and-on-and-exceeds-sixty-characters
```

## Content-Specific Guidelines

### Articles
- **Format**: `/article-[slug].html`
- **Focus on**: Main topic keywords
- **Example**: `article-distressed-reserve-metrics.html`

### News Items
- **Format**: `/news/[slug].html`
- **Focus on**: Breaking news keywords
- **Example**: `news/federal-reserve-rate-hike.html`

### Multimedia
- **Format**: `/news/multimedia/[slug].html`
- **Focus on**: Video/media description
- **Example**: `news/multimedia/ceo-interview-market-outlook.html`

### Press Releases
- **Format**: `/press-release-[slug].html`
- **Focus on**: Company + announcement
- **Example**: `press-release-company-quarterly-results.html`

### Static Pages
- **Format**: `/[filename].html`
- **Focus on**: Page purpose
- **Example**: `about.html` with slug `about-fnpulse`

## Technical Details

### Slug Generation Algorithm
1. Normalize unicode characters (remove accents)
2. Convert to lowercase
3. Split into words
4. Remove stop words from middle positions
5. Keep first and last words for context
6. Join with hyphens
7. Remove invalid characters
8. Truncate to 60 characters
9. Remove leading/trailing hyphens

### Validation
- **Pattern**: `[a-z0-9-]+`
- **Max Length**: 60 characters
- **Required**: Yes
- **Unique**: Recommended (not enforced)

### Storage
- **Articles/News**: Stored in content.json, used for filename generation
- **Press Releases**: Stored in pressReleases array in content.json
- **Pages**: Stored as meta tag in HTML `<meta name="slug" content="...">`

## URL Structure by Content Type

| Content Type | URL Pattern | Example |
|-------------|-------------|---------|
| Article | `/article-{slug}.html` | `/article-bitcoin-analysis.html` |
| News | `/news/{slug}.html` | `/news/fed-rate-decision.html` |
| Multimedia | `/news/multimedia/{slug}.html` | `/news/multimedia/market-interview.html` |
| Press Release | `/press-release-{slug}.html` | `/press-release-q4-earnings.html` |
| Page | `/{filename}.html` | `/about.html` |

## Tips for Maximum SEO Impact

### 1. Keyword Research
Before creating content, research keywords that:
- Have good search volume
- Are relevant to your content
- Have manageable competition
- Match user search intent

### 2. Slug Strategy
- **Homepage/Main pages**: Use branded terms
- **Category pages**: Use category keywords
- **Article pages**: Use specific topic keywords
- **News items**: Use timely, trending keywords

### 3. Consistency
Maintain a consistent URL structure:
- Same separator (hyphen)
- Same capitalization (lowercase)
- Same word order pattern
- Predictable hierarchy

### 4. User Experience
Good slugs should be:
- **Readable**: Easy to understand at a glance
- **Memorable**: Easy to remember and share
- **Shareable**: Look good in social media posts
- **Trustworthy**: Professional and credible

## Common Questions

**Q: Can I change the slug after publishing?**
A: Yes, but be cautious. Changing URLs can break existing links and hurt SEO. Consider setting up redirects if you must change a slug.

**Q: What if two articles have the same slug?**
A: The system will create the file but it will overwrite the existing one. Always check for uniqueness.

**Q: Should I include numbers in slugs?**
A: Yes, if they're meaningful (e.g., "2026-market-outlook"). Avoid arbitrary numbers.

**Q: How important are slugs for SEO?**
A: Very important! Good slugs help:
- Search engines understand content
- Users know what to expect
- Social sharing look professional
- Click-through rates improve

**Q: Can I use my language's special characters?**
A: No, slugs should use only a-z, 0-9, and hyphens. The system automatically converts accented characters to their base form.

## Troubleshooting

### Slug won't save
- Check that it only contains lowercase letters, numbers, and hyphens
- Ensure it's not empty
- Verify it's under 60 characters

### Auto-generation not working
- Ensure you've entered a title/headline first
- Click the "🔄 Auto-Generate" button
- Refresh the page if needed

### URL preview not updating
- Type in the slug field to trigger update
- Click outside the field (blur event)
- The preview updates automatically

## Version History
- **v1.0** (January 2026): Initial release with full slug management across all content types

## Support
For issues or questions about slug management, contact the development team or refer to the main admin documentation.

---

**Remember**: Good slugs are an investment in your content's discoverability. Take a moment to optimize them for the best SEO results!
