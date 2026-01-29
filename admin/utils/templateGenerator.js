const fs = require('fs').promises;
const path = require('path');
const slugify = require('slugify');
const dayjs = require('dayjs');
const cheerio = require('cheerio');
const fileManager = require('./fileManager');
const { ensureHeadStructure } = require('./schemaUtils');
const { minifyAssets } = require('./assetMinifier');
const { minifyHtml } = require('./htmlMinifier');
const { updateAssetLinks } = require('./assetUtils');

const NEWS_DIR = path.join(__dirname, '../../News');
const TEMPLATE_PATH = path.join(__dirname, '../templates/article-template.html');

/**
 * Generate dynamic ticker HTML from latest articles
 */
async function generateDynamicTicker() {
    const htmlParser = require('./htmlParser');
    const articles = await htmlParser.parseAllArticles();

    // Get latest 4-6 articles, sorted by date
    const latestArticles = articles
        .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
        .slice(0, 6);

    if (latestArticles.length === 0) {
        // Return default static ticker if no articles
        return `
            <div class="ticker-item">
                <span class="ticker-category">Markets</span>
                <span class="ticker-date">${dayjs().format('MMM D, YYYY')}</span>
                <span class="ticker-headline">FNPulse delivers breaking financial news and real-time market coverage</span>
                <span class="ticker-dot">•</span>
            </div>`;
    }

    // Generate ticker items from real articles
    return latestArticles.map(article => {
        const displayDate = dayjs(article.publishDate).format('MMM D, YYYY');
        const category = article.category || 'News';
        const headline = article.title.length > 80
            ? article.title.substring(0, 77) + '...'
            : article.title;

        return `
            <div class="ticker-item">
                <span class="ticker-category">${category}</span>
                <span class="ticker-date">${displayDate}</span>
                <span class="ticker-headline">${headline}</span>
                <span class="ticker-dot">•</span>
            </div>`;
    }).join('');
}

/**
 * Generate article filename from title or slug
 * @param {string} title - Article title
 * @param {string} contentType - Type of content (article, news, multimedia)
 * @param {string} customSlug - Custom slug provided by user (optional)
 * @returns {string} Generated filename
 */
function generateFilename(title, contentType = 'article', customSlug = '') {
    // Use custom slug if provided, otherwise generate from title
    const slug = customSlug
        ? slugify(customSlug, { lower: true, strict: true })
        : slugify(title, { lower: true, strict: true });

    if (contentType === 'news') {
        return `news/${slug}.html`;
    }
    if (contentType === 'multimedia') {
        return `news/multimedia/${slug}.html`;
    }
    return `article-${slug}.html`;
}

function buildArticleUrl(config, filename) {
    const normalized = filename.replace(/\\/g, '/');
    return `${config.siteUrl}/${normalized}`;
}

/**
 * Create a new article
 */
async function createArticle(data) {
    const config = await fileManager.getConfig();
    const contentTypeRaw = (data.contentType || data.articleType || data.type || '').toString().toLowerCase();
    const contentType = contentTypeRaw === 'news' ? 'news'
        : contentTypeRaw === 'multimedia' ? 'multimedia'
            : 'article';

    let templatePath = TEMPLATE_PATH;
    if (contentType === 'multimedia') {
        templatePath = path.join(__dirname, '../templates/multimedia-single-template.html');
    }

    let template = await fs.readFile(templatePath, 'utf-8');

    // Use custom slug if provided, otherwise generate from title
    const filename = data.filename || generateFilename(data.title, contentType, data.slug);

    // Calculate basePath based on article location (folder depth)
    // news/article.html needs ../ prefix, article-*.html at root level needs no prefix
    const basePath = filename.includes('/') ? '../' : '';

    // Replace all basePath placeholders in template
    template = template.replace(/\{\{basePath\}\}/g, basePath);

    const $ = cheerio.load(template, {
        xmlMode: false,
        decodeEntities: false
    });
    const publishDate = data.publishDate || new Date().toISOString();
    const modifiedDate = data.modifiedDate || publishDate;
    const articleUrl = buildArticleUrl(config, filename);
    const displayDate = dayjs(publishDate).format('MMM DD, YYYY');
    const displayUpdatedDate = dayjs(modifiedDate).format('MMM DD, YYYY');
    const keywords = Array.isArray(data.keywords) && data.keywords.length
        ? data.keywords.join(', ')
        : [data.category, 'News', config.siteName].filter(Boolean).join(', ');

    // Update meta tags
    $('title').text(`${data.title} — ${config.siteName}`);
    $('meta[name="description"]').attr('content', data.metaDescription);
    $('link[rel="canonical"]').attr('href', articleUrl);
    if (data.keywords) {
        const keywords = Array.isArray(data.keywords) ? data.keywords.join(', ') : data.keywords;
        $('meta[name="news_keywords"]').attr('content', keywords);
    }
    if (data.category) {
        $('meta[property="article:section"]').attr('content', data.category);
    }
    $('link[rel="canonical"]').attr('href', articleUrl);
    $('meta[name="news_keywords"]').attr('content', keywords);
    $('meta[property="article:section"]').attr('content', data.category || 'News');
    $('meta[name="content_type"]').attr('content', contentType);

    // Open Graph
    $('meta[property="og:title"]').attr('content', data.title);
    $('meta[property="og:description"]').attr('content', data.metaDescription);
    $('meta[property="og:url"]').attr('content', articleUrl);
    $('meta[property="og:url"]').attr('content', articleUrl);
    $('meta[property="og:image"]').attr('content', data.featuredImage || config.seo.defaultImage);

    // Twitter Card
    $('meta[property="twitter:title"]').attr('content', data.title);
    $('meta[property="twitter:description"]').attr('content', data.metaDescription);
    $('meta[property="twitter:url"]').attr('content', articleUrl);
    $('meta[property="twitter:url"]').attr('content', articleUrl);
    $('meta[property="twitter:image"]').attr('content', data.featuredImage || config.seo.defaultImage);

    // Schema.org JSON-LD
    const schemaData = {
        "@context": "https://schema.org",
        "@type": contentType === 'news' ? "NewsArticle" : "Article",
        "headline": data.title,
        "image": [data.featuredImage || config.seo.defaultImage],
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": articleUrl
        },
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
                "url": `${config.siteUrl}/${config.logoPath}`,
                "width": 600,
                "height": 60
            }
        },
        "description": data.metaDescription,
        "articleSection": data.category || 'News',
        "keywords": keywords,
        "inLanguage": "en",
        "isAccessibleForFree": true,
        "dateline": data.dateline || ''
    };

    $('script[type="application/ld+json"]').html(JSON.stringify(schemaData, null, 2));

    // Update ticker with dynamic content
    const tickerHtml = await generateDynamicTicker();
    const tickerContent = $('.new-ticker-content');
    if (tickerContent.length > 0) {
        tickerContent.html(tickerHtml);
    }

    // Update footer description
    $('.f-desc').text(config.siteDescription || 'Latest financial news and market coverage from FNPulse.');

    // Update date display
    $('.date-display').text(displayDate);

    // Update breadcrumb
    $('.breadcrumb .current').text(data.title.substring(0, 50) + (data.title.length > 50 ? '...' : ''));
    const categorySlug = slugify(data.category, { lower: true, strict: true });
    $('.breadcrumb a').eq(1).attr('href', `${categorySlug}.html`).text(data.category);

    // Content type UI
    $('body').attr('data-content-type', contentType);
    if (contentType === 'news') {
        $('body').addClass('news-article');
        $('.news-badge').text('News');
        $('.news-desk').text(`${data.category || 'News'} Desk`);
    } else {
        $('body').removeClass('news-article');
        $('.news-kicker').remove();
        $('.news-standards').remove();
        $('.source-line').remove();
    }

    // Update article content
    $('.post-cat-large').text(data.category);
    $('.article-title').text(data.title);
    $('.article-lead').text(data.excerpt);

    // Newsroom indicators
    const deskLabel = data.desk || `${data.category} Desk`;
    $('.news-desk').text(deskLabel);
    $('.news-updated time').attr('datetime', modifiedDate)
        .text(`${displayUpdatedDate} • ${data.updatedTime || data.publishTime || '09:20 AM EST'}`);

    $('.meta-published').attr('datetime', publishDate)
        .text(`${displayDate} • ${data.publishTime || '09:00 AM EST'}`);
    $('.meta-dateline').text(data.dateline || 'New York');
    $('.author-role').text(data.authorRole || 'Staff Reporter');

    // Author info with proper path handling
    const authorSlug = slugify(data.author, { lower: true, strict: true });
    const authorUrl = `${basePath}author-${authorSlug}.html`;
    $('.author-info .byline a').text(data.author).attr('href', authorUrl);
    $('.author-info time').attr('datetime', publishDate)
        .text(`${displayDate} • ${data.publishTime || '09:00 AM EST'}`);

    // Set author avatar image with root-relative path
    if (data.authorAvatar) {
        // Ensure avatar path is root-relative (starts with /)
        const avatarPath = data.authorAvatar.startsWith('/') ? data.authorAvatar : `/${data.authorAvatar.replace(/^\//, '')}`;
        $('.author-info .author-avatar-small').attr('src', avatarPath).attr('alt', data.author);
        $('.author-box img').attr('src', avatarPath).attr('alt', data.author);
    }

    // Multimedia Updates
    if (contentType === 'multimedia') {
        if (data.videoUrl) {
            // Check if iframe exists in template, otherwise creating one might be tricky without reading specific template structure again
            // But we know we used multimedia-single-template which has an iframe
            $('iframe').attr('src', data.videoUrl);
        }
        if (data.duration) {
            $('.read-time').text(data.duration);
        }
    } else {
        // Standard Read Time
        $('.read-time').text(`${data.readTime || '5'} min read`);
    }

    // Featured image
    if (data.featuredImage) {
        $('.article-featured-image img').attr('src', data.featuredImage)
            .attr('alt', data.featuredImageAlt || data.title);
        $('.article-featured-image figcaption').text(data.featuredImageCaption || '');
    }

    // Article body
    $('.article-body').html(data.body);

    // Key points
    if (Array.isArray(data.keyPoints) && data.keyPoints.length) {
        const list = $('.key-points-list');
        list.empty();
        data.keyPoints.forEach(point => {
            list.append(`<li>${point}</li>`);
        });
    } else {
        $('.key-points').remove();
    }

    // Source line
    $('.source-line').text(data.sourceLine || `Source: ${config.siteName} Newsroom`);

    // Author box with proper path handling
    $('.author-box h5').text(`About ${data.author}`);
    $('.author-box p').text(data.authorBio || `${data.author} is a financial journalist covering markets and economic policy.`);
    $('.author-box a').attr('href', authorUrl)
        .text(`View all posts by ${data.author.split(' ')[0]}`);

    // Save file
    const filePath = path.join(NEWS_DIR, filename);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    ensureHeadStructure($, { filename, config });
    updateAssetLinks($);
    await minifyAssets();
    await fs.writeFile(filePath, await minifyHtml($.html()));

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
    const contentTypeRaw = (data.contentType || $('meta[name="content_type"]').attr('content') || '').toString().toLowerCase();
    const contentType = contentTypeRaw === 'news' ? 'news' : contentTypeRaw === 'multimedia' ? 'multimedia' : 'article';

    // Check if slug has changed and generate new filename if needed
    let newFilename = filename;
    let shouldRename = false;

    if (data.slug) {
        // Generate what the new filename should be based on the slug
        const potentialNewFilename = generateFilename(data.title, contentType, data.slug);

        // If the new filename is different from current, we need to rename
        if (potentialNewFilename !== filename) {
            newFilename = potentialNewFilename;
            shouldRename = true;
        }
    }

    const articleUrl = buildArticleUrl(config, newFilename);

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
        schemaData['@type'] = contentType === 'news' ? 'NewsArticle' : 'Article';
        schemaData.mainEntityOfPage = {
            "@type": "WebPage",
            "@id": articleUrl
        };
        if (data.author) {
            schemaData.author = [{
                "@type": "Person",
                "name": data.author,
                "url": `${config.siteUrl}/author-${slugify(data.author, { lower: true, strict: true })}.html`
            }];
        }
        if (data.category) {
            schemaData.articleSection = data.category;
        }
        if (data.keywords) {
            schemaData.keywords = Array.isArray(data.keywords) ? data.keywords.join(', ') : data.keywords;
        }
        if (data.dateline) {
            schemaData.dateline = data.dateline;
        }
        if (data.featuredImage) {
            schemaData.image = [data.featuredImage];
        }
        if (schemaData.publisher && schemaData.publisher.logo) {
            schemaData.publisher.logo.width = schemaData.publisher.logo.width || 600;
            schemaData.publisher.logo.height = schemaData.publisher.logo.height || 60;
        }
        $('script[type="application/ld+json"]').html(JSON.stringify(schemaData, null, 2));
    }

    $('meta[name="content_type"]').attr('content', contentType);
    $('body').attr('data-content-type', contentType);
    if (contentType === 'news') {
        $('body').addClass('news-article');
        $('.news-badge').text('News');
        $('.news-desk').text(`${data.category || 'News'} Desk`);
    } else {
        $('body').removeClass('news-article');
        $('.news-kicker').remove();
        $('.news-standards').remove();
        $('.source-line').remove();
    }

    // Update article content
    if (data.category) $('.post-cat-large').text(data.category);
    if (data.title) $('.article-title').text(data.title);
    if (data.excerpt) $('.article-lead').text(data.excerpt);
    if (data.body) $('.article-body').html(data.body);

    // Update multimedia specific content
    if (contentType === 'multimedia') {
        if (data.videoUrl) {
            $('iframe').attr('src', data.videoUrl);
        }
        if (data.duration) {
            $('.read-time').text(data.duration);
        }
    }

    // Update featured image
    if (data.featuredImage) {
        $('.article-featured-image img').attr('src', data.featuredImage)
            .attr('alt', data.featuredImageAlt || data.title);
        if (data.featuredImageCaption) {
            $('.article-featured-image figcaption').text(data.featuredImageCaption);
        }
    }

    // Calculate basePath for the current/new filename
    const basePath = newFilename.includes('/') ? '../' : '';

    // Update author with proper path handling
    if (data.author) {
        const authorSlug = slugify(data.author, { lower: true, strict: true });
        const authorUrl = `${basePath}author-${authorSlug}.html`;
        $('.author-info .byline a').text(data.author).attr('href', authorUrl);
        $('.author-box h5').text(`About ${data.author}`);
        $('.author-box a').text(`View all posts by ${data.author.split(' ')[0]}`)
            .attr('href', authorUrl);
    }

    // Update author avatar with root-relative path
    if (data.authorAvatar) {
        const avatarPath = data.authorAvatar.startsWith('/') ? data.authorAvatar : `/${data.authorAvatar.replace(/^\//, '')}`;
        $('.author-info .author-avatar-small').attr('src', avatarPath);
        $('.author-box img').attr('src', avatarPath);
    }

    // Save updated file
    // Update footer description
    $('.f-desc').text(config.siteDescription || 'Latest financial news and market coverage from FNPulse.');

    ensureHeadStructure($, { filename: newFilename, config });
    updateAssetLinks($);
    await minifyAssets();

    // If slug changed, rename the file
    if (shouldRename) {
        const newFilePath = path.join(NEWS_DIR, newFilename);
        await fs.mkdir(path.dirname(newFilePath), { recursive: true });
        await fs.writeFile(newFilePath, await minifyHtml($.html()));

        // Delete old file
        try {
            await fs.unlink(filePath);
            console.log(`Renamed article from ${filename} to ${newFilename}`);
        } catch (error) {
            console.error(`Error deleting old file ${filename}:`, error);
        }

        return { filename: newFilename, oldFilename: filename, path: newFilePath, renamed: true };
    } else {
        await fs.writeFile(filePath, await minifyHtml($.html()));
        return { filename, path: filePath, renamed: false };
    }
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

    // Update ticker with dynamic content
    const tickerHtml = await generateDynamicTicker();
    const tickerContent = $('.new-ticker-content');
    if (tickerContent.length > 0) {
        tickerContent.html(tickerHtml);
    }

    // Update social links
    if (config.socialLinks) {
        $('.social-links a').eq(0).attr('href', config.socialLinks.facebook);
        $('.social-links a').eq(1).attr('href', config.socialLinks.linkedin);
        $('.social-links a').eq(2).attr('href', config.socialLinks.twitter);
    }

    // Save updated file
    ensureHeadStructure($, { filename, config });
    updateAssetLinks($);
    await minifyAssets();
    await fs.writeFile(filePath, await minifyHtml($.html()));
}

module.exports = {
    createArticle,
    updateArticle,
    regenerateAllPages,
    generateFilename
};
