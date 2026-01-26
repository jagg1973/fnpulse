const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');

const NEWS_DIR = path.join(__dirname, '../../News');

/**
 * Parse an article HTML file and extract metadata
 */
async function parseArticle(filename) {
    const filePath = path.join(NEWS_DIR, filename);
    const html = await fs.readFile(filePath, 'utf-8');
    const $ = cheerio.load(html);

    // Extract metadata
    const article = {
        filename: filename,
        title: $('title').text().replace(' — FNPulse', '').trim(),
        metaDescription: $('meta[name="description"]').attr('content') || '',
        canonicalUrl: $('link[rel="canonical"]').attr('href') || '',
        ogTitle: $('meta[property="og:title"]').attr('content') || '',
        ogDescription: $('meta[property="og:description"]').attr('content') || '',
        ogImage: $('meta[property="og:image"]').attr('content') || '',
        twitterTitle: $('meta[property="twitter:title"]').attr('content') || '',
        twitterDescription: $('meta[property="twitter:description"]').attr('content') || '',
        twitterImage: $('meta[property="twitter:image"]').attr('content') || '',
        schemaData: {},
        content: {},
        publishDate: '',
        modifiedDate: '',
        author: '',
        category: '',
        featuredImage: '',
        excerpt: '',
        contentType: ''
    };

    // Extract Schema.org JSON-LD
    const schemaScript = $('script[type="application/ld+json"]').html();
    let schemaType = '';
    if (schemaScript) {
        try {
            article.schemaData = JSON.parse(schemaScript);
            article.publishDate = article.schemaData.datePublished || '';
            article.modifiedDate = article.schemaData.dateModified || '';
            if (article.schemaData.author && article.schemaData.author[0]) {
                article.author = article.schemaData.author[0].name || '';
            }
            if (article.schemaData['@type']) {
                schemaType = Array.isArray(article.schemaData['@type'])
                    ? article.schemaData['@type'].join(',')
                    : article.schemaData['@type'];
            }
        } catch (e) {
            console.error('Error parsing schema:', e);
        }
    }

    // Extract article content
    const articleHeader = $('.article-header h1').text() || $('.article-title').text();
    const articleMeta = $('.post-cat-large').text() || $('.article-meta .category').text();
    const articleExcerpt = $('.article-lead').text() || $('.article-excerpt').text();
    const articleBody = $('.article-body').html() || '';
    const featuredImgSrc = $('.article-featured-image img').attr('src');

    article.content = {
        headline: articleHeader || article.title,
        excerpt: articleExcerpt,
        body: articleBody,
        featuredImage: featuredImgSrc || ''
    };

    article.category = articleMeta || '';
    article.excerpt = articleExcerpt || article.metaDescription;
    article.featuredImage = featuredImgSrc || '';

    if (!article.contentType) {
        const metaContentType = $('meta[name="content_type"]').attr('content')
            || $('meta[name="article_type"]').attr('content')
            || '';
        if (metaContentType) {
            article.contentType = metaContentType.toLowerCase();
        } else if (filename.startsWith('news/')) {
            article.contentType = 'news';
        } else if (filename.startsWith('article-')) {
            article.contentType = 'article';
        } else if (String(schemaType).toLowerCase().includes('newsarticle')) {
            article.contentType = 'news';
        } else {
            article.contentType = 'article';
        }
    }

    // Extract ticker content
    article.tickerContent = $('.ticker-content').text() || '';

    return article;
}

/**
 * Parse all article files to get list of articles
 */
async function parseAllArticles() {
    const files = await fs.readdir(NEWS_DIR);
    const articleFiles = files.filter(f =>
        f.startsWith('article-') && f.endsWith('.html') && !f.startsWith('press-')
    );

    try {
        const newsDir = path.join(NEWS_DIR, 'news');
        const newsFiles = await fs.readdir(newsDir);
        newsFiles
            .filter(f => f.endsWith('.html') && !f.startsWith('press-'))
            .forEach(f => articleFiles.push(`news/${f}`));
    } catch (error) {
        // news directory may not exist yet
    }

    const articles = [];
    for (const file of articleFiles) {
        try {
            const article = await parseArticle(file);
            articles.push({
                filename: file,
                title: article.title,
                category: article.category,
                publishDate: article.publishDate,
                author: article.author,
                excerpt: article.excerpt,
                featuredImage: article.featuredImage || (article.content && article.content.featuredImage) || '',
                contentType: article.contentType || 'article'
            });
        } catch (error) {
            console.error(`Error parsing ${file}:`, error.message);
            // Skip files that no longer exist or can't be parsed
        }
    }

    return articles;
}

/**
 * Extract navigation menu from a page
 */
async function extractNavigation(filename = 'index.html') {
    const filePath = path.join(NEWS_DIR, filename);
    const html = await fs.readFile(filePath, 'utf-8');
    const $ = cheerio.load(html);

    const navItems = [];
    $('.main-nav a').each((i, el) => {
        navItems.push({
            label: $(el).text().trim(),
            url: $(el).attr('href')
        });
    });

    return navItems;
}

module.exports = {
    parseArticle,
    parseAllArticles,
    extractNavigation
};
