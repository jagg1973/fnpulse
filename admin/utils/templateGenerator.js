const fs = require('fs').promises;
const path = require('path');
const slugify = require('slugify');
const dayjs = require('dayjs');
const cheerio = require('cheerio');
const fileManager = require('./fileManager');

const NEWS_DIR = path.join(__dirname, '../../News');
const TEMPLATE_PATH = path.join(__dirname, '../templates/article-template.html');

/**
 * Generate article filename from title
 */
function generateFilename(title) {
    const slug = slugify(title, { lower: true, strict: true });
    return `article-${slug}.html`;
}

/**
 * Create a new article
 */
async function createArticle(data) {
    const config = await fileManager.getConfig();
    const template = await fs.readFile(TEMPLATE_PATH, 'utf-8');
    const $ = cheerio.load(template, {
        xmlMode: false,
        decodeEntities: false
    });

    const filename = data.filename || generateFilename(data.title);
    const publishDate = data.publishDate || new Date().toISOString();
    const modifiedDate = data.modifiedDate || publishDate;

    // Update meta tags
    $('title').text(`${data.title} — ${config.siteName}`);
    $('meta[name="description"]').attr('content', data.metaDescription);
    $('link[rel="canonical"]').attr('href', `${config.siteUrl}/${filename}`);

    // Open Graph
    $('meta[property="og:title"]').attr('content', data.title);
    $('meta[property="og:description"]').attr('content', data.metaDescription);
    $('meta[property="og:url"]').attr('content', `${config.siteUrl}/${filename}`);
    $('meta[property="og:image"]').attr('content', data.featuredImage || config.seo.defaultImage);

    // Twitter Card
    $('meta[property="twitter:title"]').attr('content', data.title);
    $('meta[property="twitter:description"]').attr('content', data.metaDescription);
    $('meta[property="twitter:url"]').attr('content', `${config.siteUrl}/${filename}`);
    $('meta[property="twitter:image"]').attr('content', data.featuredImage || config.seo.defaultImage);

    // Schema.org JSON-LD
    const schemaData = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": data.title,
        "image": [data.featuredImage || config.seo.defaultImage],
        "datePublished": publishDate,
        "dateModified": modifiedDate,
        "author": [{
            "@type": "Person",
            "name": data.author,
            "url": `${config.siteUrl}/author-${slugify(data.author, { lower: true, strict: true })}.html`
        }],
        "publisher": {
            "@type": "Organization",
            "name": config.siteName,
            "logo": {
                "@type": "ImageObject",
                "url": `${config.siteUrl}/${config.logoPath}`
            }
        },
        "description": data.metaDescription
    };

    $('script[type="application/ld+json"]').html(JSON.stringify(schemaData, null, 2));

    // Update ticker
    $('.ticker-content').text(data.tickerContent || config.tickerNews);

    // Update date display
    const displayDate = dayjs(publishDate).format('MMM DD, YYYY');
    $('.date-display').text(displayDate);

    // Update breadcrumb
    $('.breadcrumb .current').text(data.title.substring(0, 50) + (data.title.length > 50 ? '...' : ''));
    const categorySlug = slugify(data.category, { lower: true, strict: true });
    $('.breadcrumb a').eq(1).attr('href', `${categorySlug}.html`).text(data.category);

    // Update article content
    $('.post-cat-large').text(data.category);
    $('.article-title').text(data.title);
    $('.article-lead').text(data.excerpt);

    // Author info
    $('.author-info .byline a').text(data.author)
        .attr('href', `author-${slugify(data.author, { lower: true, strict: true })}.html`);
    $('.author-info time').attr('datetime', publishDate)
        .text(`${displayDate} • ${data.publishTime || '09:00 AM EST'}`);
    $('.read-time').text(`${data.readTime || '5'} min read`);

    // Featured image
    if (data.featuredImage) {
        $('.article-featured-image img').attr('src', data.featuredImage)
            .attr('alt', data.featuredImageAlt || data.title);
        $('.article-featured-image figcaption').text(data.featuredImageCaption || '');
    }

    // Article body
    $('.article-body').html(data.body);

    // Author box
    $('.author-box h5').text(`About ${data.author}`);
    $('.author-box p').text(data.authorBio || `${data.author} is a financial journalist covering markets and economic policy.`);
    $('.author-box a').attr('href', `author-${slugify(data.author, { lower: true, strict: true })}.html`)
        .text(`View all posts by ${data.author.split(' ')[0]}`);

    // Save file
    const filePath = path.join(NEWS_DIR, filename);
    await fs.writeFile(filePath, $.html());

    return { filename, path: filePath };
}

/**
 * Update an existing article
 */
async function updateArticle(filename, data) {
    // Backup original file
    await fileManager.backupFile(filename);

    const filePath = path.join(NEWS_DIR, filename);
    const html = await fs.readFile(filePath, 'utf-8');
    const $ = cheerio.load(html, {
        xmlMode: false,
        decodeEntities: false
    });

    const config = await fileManager.getConfig();
    const modifiedDate = new Date().toISOString();

    // Update meta tags
    $('title').text(`${data.title} — ${config.siteName}`);
    $('meta[name="description"]').attr('content', data.metaDescription);

    // Update Open Graph
    $('meta[property="og:title"]').attr('content', data.title);
    $('meta[property="og:description"]').attr('content', data.metaDescription);
    if (data.featuredImage) {
        $('meta[property="og:image"]').attr('content', data.featuredImage);
    }

    // Update Twitter Card
    $('meta[property="twitter:title"]').attr('content', data.title);
    $('meta[property="twitter:description"]').attr('content', data.metaDescription);
    if (data.featuredImage) {
        $('meta[property="twitter:image"]').attr('content', data.featuredImage);
    }

    // Update Schema.org
    const schemaScript = $('script[type="application/ld+json"]').html();
    if (schemaScript) {
        const schemaData = JSON.parse(schemaScript);
        schemaData.headline = data.title;
        schemaData.description = data.metaDescription;
        schemaData.dateModified = modifiedDate;
        if (data.author) {
            schemaData.author = [{
                "@type": "Person",
                "name": data.author,
                "url": `${config.siteUrl}/author-${slugify(data.author, { lower: true, strict: true })}.html`
            }];
        }
        if (data.featuredImage) {
            schemaData.image = [data.featuredImage];
        }
        $('script[type="application/ld+json"]').html(JSON.stringify(schemaData, null, 2));
    }

    // Update article content
    if (data.category) $('.post-cat-large').text(data.category);
    if (data.title) $('.article-title').text(data.title);
    if (data.excerpt) $('.article-lead').text(data.excerpt);
    if (data.body) $('.article-body').html(data.body);

    // Update featured image
    if (data.featuredImage) {
        $('.article-featured-image img').attr('src', data.featuredImage)
            .attr('alt', data.featuredImageAlt || data.title);
        if (data.featuredImageCaption) {
            $('.article-featured-image figcaption').text(data.featuredImageCaption);
        }
    }

    // Update author
    if (data.author) {
        $('.author-info .byline a').text(data.author)
            .attr('href', `author-${slugify(data.author, { lower: true, strict: true })}.html`);
        $('.author-box h5').text(`About ${data.author}`);
        $('.author-box a').text(`View all posts by ${data.author.split(' ')[0]}`);
    }

    // Save updated file
    await fs.writeFile(filePath, $.html());

    return { filename, path: filePath };
}

/**
 * Regenerate all pages with updated navigation/footer
 */
async function regenerateAllPages() {
    const config = await fileManager.getConfig();
    const files = await fs.readdir(NEWS_DIR);
    const htmlFiles = files.filter(f => f.endsWith('.html'));

    for (const file of htmlFiles) {
        try {
            await updatePageGlobals(file, config);
        } catch (error) {
            console.error(`Error updating ${file}:`, error.message);
        }
    }
}

/**
 * Update global elements (nav, footer) in a page
 */
async function updatePageGlobals(filename, config) {
    const filePath = path.join(NEWS_DIR, filename);
    const html = await fs.readFile(filePath, 'utf-8');
    const $ = cheerio.load(html, {
        xmlMode: false,
        decodeEntities: false
    });

    // Update navigation
    const navLinks = $('.nav-links');
    if (navLinks.length > 0) {
        navLinks.empty();
        config.navigation.forEach(item => {
            navLinks.append(`<a href="${item.url}">${item.label}</a>`);
        });
    }

    // Update ticker
    $('.ticker-content').text(config.tickerNews);

    // Update social links
    if (config.socialLinks) {
        $('.social-links a').eq(0).attr('href', config.socialLinks.facebook);
        $('.social-links a').eq(1).attr('href', config.socialLinks.linkedin);
        $('.social-links a').eq(2).attr('href', config.socialLinks.twitter);
    }

    // Save updated file
    await fs.writeFile(filePath, $.html());
}

module.exports = {
    createArticle,
    updateArticle,
    regenerateAllPages,
    generateFilename
};
