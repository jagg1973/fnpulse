const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');
const htmlParser = require('./htmlParser');
const contentManager = require('./contentManager');
const fileManager = require('./fileManager');
const { ensureHeadStructure } = require('./schemaUtils');
const { updateAssetLinks } = require('./assetUtils');
const { minifyAssets } = require('./assetMinifier');
const { minifyHtml } = require('./htmlMinifier');

const NEWS_DIR = path.join(__dirname, '../../News');

/**
 * Update homepage with latest articles
 */
async function updateHomepage() {
    const articles = await htmlParser.parseAllArticles();
    const config = await fileManager.getConfig();

    // Sort by publish date (newest first)
    articles.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));

    const homepagePath = path.join(NEWS_DIR, 'index.html');
    const html = await fs.readFile(homepagePath, 'utf-8');
    const $ = cheerio.load(html, { xmlMode: false, decodeEntities: false });

    if (config) {
        $('title').text(`${config.siteName} — ${config.siteTagline}`);
        $('meta[name="description"]').attr('content', config.siteDescription);
    }

    // Update hero section articles (connected to new hero redesign)
    if (articles.length >= 3) {
        // Main Featured (Hero Main) -> Article 0
        const mainArticle = articles[0];
        const mainImage = (mainArticle.content && mainArticle.content.featuredImage) || mainArticle.featuredImage || 'img/news-825x525.jpg';

        // Ensure image exists or fallback
        $('.hero-main img').attr('src', mainImage);
        $('.hero-main .card-badge').text(mainArticle.category || 'News');
        $('.hero-main .card-title a')
            .attr('href', mainArticle.filename)
            .text(mainArticle.title);

        // Secondary Featured (Hero Secondary) -> Article 1
        const secArticle = articles[1];
        const secImage = (secArticle.content && secArticle.content.featuredImage) || secArticle.featuredImage || 'img/news-350x223-1.jpg';

        $('.hero-secondary img').attr('src', secImage);
        $('.hero-secondary .card-badge').text(secArticle.category || 'News');
        $('.hero-secondary .card-title a')
            .attr('href', secArticle.filename)
            .text(secArticle.title);

        // Tertiary (Hero Tertiary) -> Article 2
        const tertArticle = articles[2];

        // If tertiary card title is inside an anchor in h3
        $('.hero-tertiary h3 a')
            .attr('href', tertArticle.filename)
            .text(tertArticle.title);

        // Fallback if h3 has no anchor (just text replacement)
        if ($('.hero-tertiary h3 a').length === 0) {
            $('.hero-tertiary h3').wrapInner(`<a href="${tertArticle.filename}" style="text-decoration:none;color:inherit"></a>`);
            $('.hero-tertiary h3 a').text(tertArticle.title);
        }
    }

    // Update Latest News section (latest 10 news items)
    const newsArticles = articles.filter(article => (article.contentType || 'article') === 'news');
    const latestNews = (newsArticles.length ? newsArticles : articles).slice(0, 10);
    const newsListHtml = latestNews.map((article, index) => {
        const articleImage = (article.content && article.content.featuredImage)
            || article.featuredImage
            || `img/news-350x223-${(index % 5) + 1}.jpg`;
        return `
            <a href="${article.filename}" class="news-link" style="text-decoration:none;color:inherit;">
                <article class="news-item">
                    <img src="${articleImage}" alt="${article.title}">
                    <div>
                        <span class="eyebrow">${article.category || 'News'}</span>
                        <h3>${article.title}</h3>
                        <p>${article.excerpt || ''}</p>
                        <div class="meta">${formatDate(article.publishDate)}</div>
                    </div>
                </article>
            </a>
            `;
    }).join('');
    if ($('.news-list').length > 0) {
        $('.news-list').html(newsListHtml);
    }

    // Update Press Releases section
    const pressReleases = await contentManager.getAllPressReleases();
    const homepagePressReleases = pressReleases
        .filter(pr => pr.showOnHomepage)
        .sort((a, b) => new Date(b.releaseDate || b.date) - new Date(a.releaseDate || a.date));

    if (homepagePressReleases.length > 0) {
        // Featured press release (first one with featured flag, or just first one)
        const featuredPR = homepagePressReleases.find(pr => pr.featured) || homepagePressReleases[0];
        const featuredImage = featuredPR.image || (featuredPR.mediaAssets && featuredPR.mediaAssets.length > 0
            ? featuredPR.mediaAssets[0].url
            : 'img/news-825x525.jpg');
        const prDate = featuredPR.releaseDate || featuredPR.date;
        const prType = featuredPR.type === 'general' ? 'Press Release' :
            featuredPR.type === 'financial' ? 'Financial' :
                featuredPR.type === 'product' ? 'Product Launch' :
                    featuredPR.type === 'partnership' ? 'Partnership' : 'Press Release';

        if ($('.press-featured').length > 0) {
            $('.press-featured img').attr('src', featuredImage).attr('alt', featuredPR.headline);
            $('.press-featured .post-cat').text(prType);
            $('.press-featured h3 a')
                .attr('href', featuredPR.filename)
                .text(featuredPR.headline);
            $('.press-featured .meta-light').text(
                `${featuredPR.contactName || 'FNPulse'} • ${formatDate(prDate)}`
            );
        }

        // List of press releases (skip the featured one, get next 3 for simple display)
        const listPressReleases = homepagePressReleases.slice(1, 4);
        const pressListHtml = listPressReleases.map((pr, index) => {
            const prDate = pr.releaseDate || pr.date;

            return `
                <article class="press-small">
                    <span class="press-date">${new Date(prDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <h4><a href="${pr.filename}">${pr.headline}</a></h4>
                </article>
            `;
        }).join('');

        if ($('.press-list-grid').length > 0) {
            $('.press-list-grid').html(pressListHtml);
        }
    }

    updateAssetLinks($);
    ensureHeadStructure($, { filename: 'index.html', config });
    await fs.writeFile(homepagePath, await minifyHtml($.html()));
    console.log('✓ Homepage updated');
}

/**
 * Update press releases archive page
 */
async function updatePressReleasesArchive() {
    const pressReleases = await contentManager.getAllPressReleases();
    const config = await fileManager.getConfig();

    // Sort by release date (newest first)
    const sortedPR = pressReleases
        .sort((a, b) => new Date(b.releaseDate || b.date) - new Date(a.releaseDate || a.date));

    const archivePath = path.join(NEWS_DIR, 'press-releases.html');
    const html = await fs.readFile(archivePath, 'utf-8');
    const $ = cheerio.load(html, { xmlMode: false, decodeEntities: false });

    // Update the grid with all press releases
    const pressGridHtml = sortedPR.map((pr, index) => {
        const prDate = pr.releaseDate || pr.date;
        const prType = pr.type === 'general' ? 'Press Release' :
            pr.type === 'financial' ? 'Financial Results' :
                pr.type === 'product' ? 'Product Launch' :
                    pr.type === 'partnership' ? 'Partnership' :
                        pr.type === 'award' ? 'Award' :
                            pr.type === 'expansion' ? 'Expansion' :
                                pr.type === 'corporate' ? 'Corporate News' :
                                    pr.type === 'technology' ? 'Technology' :
                                        pr.type === 'community' ? 'Community' : 'Press Release';

        return `
            <article class="pr-recent-card">
                <div class="pr-recent-meta">
                    <span class="pr-recent-date">${formatDate(prDate)}</span>
                    <span class="pr-recent-category">${prType}</span>
                </div>
                <h3><a href="${pr.filename}">${pr.headline}</a></h3>
                <p>${pr.lead ? pr.lead.substring(0, 150) + '...' : pr.subheadline || ''}</p>
                <a href="${pr.filename}" class="pr-recent-link">Read Full Release →</a>
            </article>
        `;
    }).join('');

    if ($('.pr-recent-grid').length > 0) {
        $('.pr-recent-grid').html(pressGridHtml);
    }

    updateAssetLinks($);
    ensureHeadStructure($, { filename: 'press-releases.html', config });
    await fs.writeFile(archivePath, await minifyHtml($.html()));
    console.log('✓ Press releases archive updated');
}

/**
 * Update news archive page
 */
async function updateNewsArchive() {
    const articles = await htmlParser.parseAllArticles();
    const config = await fileManager.getConfig();

    // Sort by publish date (newest first)
    articles.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));

    const archivePath = path.join(NEWS_DIR, 'news.html');
    const html = await fs.readFile(archivePath, 'utf-8');
    const $ = cheerio.load(html, { xmlMode: false, decodeEntities: false });

    // Update the news list with all articles
    const newsArticles = articles.filter(article => (article.contentType || 'article') === 'news');
    const displayArticles = (newsArticles.length ? newsArticles : articles).slice(0, 20);

    const newsListHtml = displayArticles.map((article, index) => {
        const articleImage = (article.content && article.content.featuredImage)
            || article.featuredImage
            || `img/news-350x223-${(index % 5) + 1}.jpg`;

        const readTime = article.readTime || '5 min read';

        return `
            <article class="news-item">
                <img src="${articleImage}" alt="${article.title}">
                <div>
                    <span class="eyebrow">${article.category || 'News'}</span>
                    <h3><a href="${article.filename}">${article.title}</a></h3>
                    <p>${article.excerpt || ''}</p>
                    <div class="meta">${formatDate(article.publishDate)} • ${readTime}</div>
                </div>
            </article>
        `;
    }).join('');

    if ($('.news-list').length > 0) {
        $('.news-list').html(newsListHtml);
    }

    updateAssetLinks($);
    ensureHeadStructure($, { filename: 'news.html', config });
    await fs.writeFile(archivePath, await minifyHtml($.html()));
    console.log('✓ News archive updated');
}

/**
 * Update footer recent posts for all pages
 */
async function updateFooterRecentPosts() {
    const articles = await htmlParser.parseAllArticles();
    const config = await fileManager.getConfig();
    const footerSelections = await contentManager.getFooterPosts();

    const articleByFilename = new Map(articles.map(article => [article.filename, article]));
    const selectedArticles = footerSelections
        .map(filename => articleByFilename.get(filename))
        .filter(Boolean);

    const fallbackArticles = articles
        .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
        .slice(0, 3);

    const footerArticles = (selectedArticles.length > 0 ? selectedArticles : fallbackArticles).slice(0, 3);

    const files = await fs.readdir(NEWS_DIR);
    const htmlFiles = files.filter(f => f.endsWith('.html'));

    for (const file of htmlFiles) {
        const filePath = path.join(NEWS_DIR, file);
        const html = await fs.readFile(filePath, 'utf-8');
        const $ = cheerio.load(html, { xmlMode: false, decodeEntities: false });

        const footerPostsContainer = $('.footer-widget').filter((i, el) => {
            const title = $(el).find('h4').first().text().trim().toLowerCase();
            return title === 'recent post' || title === 'recent posts';
        }).find('.f-posts');

        if (footerPostsContainer.length > 0) {
            const postsHtml = footerArticles.map(article => {
                const image = article.featuredImage || 'img/news-350x223-1.jpg';
                const dateLabel = formatFooterDate(article.publishDate);
                return `
                    <article class="f-post-item">
                        <img src="${image}" alt="thumb">
                        <div>
                            <a href="${article.filename}">${article.title}</a>
                            <span class="f-date">${dateLabel}</span>
                        </div>
                    </article>
                `;
            }).join('');

            footerPostsContainer.html(postsHtml);
        }

        // Refresh global messaging
        if (config && config.siteDescription) {
            $('.f-desc').text(config.siteDescription);
        }

        updateAssetLinks($);
        ensureHeadStructure($, { filename: file, config });
        const normalized = normalizeHtmlTextAmpersands($.html());
        await fs.writeFile(filePath, await minifyHtml(normalized));
    }

    console.log('✓ Footer recent posts updated');
}

/**
 * Update a category page with articles from that category
 */
async function updateCategoryPage(categoryName) {
    const articles = await htmlParser.parseAllArticles();

    // Filter articles by category
    const categoryArticles = articles.filter(a =>
        a.category.toLowerCase() === categoryName.toLowerCase()
    ).sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));

    if (categoryArticles.length === 0) {
        console.log(`No articles found for category: ${categoryName}`);
        return;
    }

    const categoryFile = `${categoryName.toLowerCase()}.html`;
    const categoryPath = path.join(NEWS_DIR, categoryFile);

    // Check if category page exists
    try {
        await fs.access(categoryPath);
    } catch {
        console.log(`Category page not found: ${categoryFile}`);
        return;
    }

    const html = await fs.readFile(categoryPath, 'utf-8');
    const $ = cheerio.load(html, { xmlMode: false, decodeEntities: false });

    // Update the articles list
    const articlesHtml = categoryArticles.slice(0, 12).map(article => {
        const articleImage = (article.content && article.content.featuredImage) || article.featuredImage || 'img/news-350x223-1.jpg';
        return `
        <article class="news-item">
            <a href="${article.filename}">
                <img src="${articleImage}" alt="${article.title}">
            </a>
            <div>
                <span class="eyebrow">${article.category || 'News'}</span>
                <h3><a href="${article.filename}">${article.title}</a></h3>
                <p>${article.excerpt || article.metaDescription || ''}</p>
                <div class="meta">${formatDate(article.publishDate)}</div>
            </div>
        </article>
        `;
    }).join('\n');

    // Replace the news list content
    if ($('.news-list').length > 0) {
        $('.news-list').html(articlesHtml);
    }

    const config = await fileManager.getConfig();
    updateAssetLinks($);
    ensureHeadStructure($, { filename: categoryFile, config });
    await fs.writeFile(categoryPath, await minifyHtml($.html()));
    console.log(`✓ ${categoryName} page updated`);
}

/**
 * Update all category pages
 */
async function updateAllCategoryPages() {
    const categories = ['Markets', 'Economy', 'Technology', 'Cryptocurrency',
        'Stocks', 'Forex', 'Commodities', 'Bonds', 'Analysis'];

    for (const category of categories) {
        try {
            await updateCategoryPage(category);
        } catch (error) {
            console.error(`Error updating ${category}:`, error.message);
        }
    }
}

/**
 * Update author page with their articles
 */
async function updateAuthorPage(authorName) {
    const articles = await htmlParser.parseAllArticles();

    // Filter articles by author
    const authorArticles = articles.filter(a =>
        a.author.toLowerCase() === authorName.toLowerCase()
    ).sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));

    if (authorArticles.length === 0) {
        console.log(`No articles found for author: ${authorName}`);
        return;
    }

    const authorSlug = authorName.toLowerCase().replace(/\s+/g, '-');
    const authorFile = `author-${authorSlug}.html`;
    const authorPath = path.join(NEWS_DIR, authorFile);

    // Check if author page exists
    try {
        await fs.access(authorPath);
    } catch {
        console.log(`Author page not found: ${authorFile}`);
        return;
    }

    const html = await fs.readFile(authorPath, 'utf-8');
    const $ = cheerio.load(html, { xmlMode: false, decodeEntities: false });

    // Update article count
    $('.author-stats .stat-number').first().text(authorArticles.length);

    // Update the articles grid - get first 6 articles
    const articlesHtml = authorArticles.slice(0, 6).map(article => {
        const articleImage = (article.content && article.content.featuredImage) || article.featuredImage || 'img/news-350x223-1.jpg';
        return `
        <article class="post-card-grid">
            <a href="${article.filename}">
                <img src="${articleImage}" alt="${article.title}">
            </a>
            <div class="card-content">
                <span class="post-cat">${article.category || 'News'}</span>
                <h3><a href="${article.filename}">${article.title}</a></h3>
                <p>${article.excerpt || article.metaDescription || ''}</p>
                <span class="post-meta">${formatDate(article.publishDate)}</span>
            </div>
        </article>
        `;
    }).join('\n');

    // Replace the articles grid content
    if ($('.articles-grid').length > 0) {
        $('.articles-grid').html(articlesHtml);
    }

    const config = await fileManager.getConfig();
    updateAssetLinks($);
    ensureHeadStructure($, { filename: authorFile, config });
    await fs.writeFile(authorPath, await minifyHtml($.html()));
    console.log(`✓ ${authorName} author page updated`);
}

/**
 * Update all author pages
 */
async function updateAllAuthorPages() {
    const articles = await htmlParser.parseAllArticles();
    const authors = [...new Set(articles.map(a => a.author).filter(Boolean))];

    for (const author of authors) {
        try {
            await updateAuthorPage(author);
        } catch (error) {
            console.error(`Error updating author ${author}:`, error.message);
        }
    }
}

/**
 * Update entire site (homepage, categories, authors)
 */
async function regenerateAllArticles() {
    console.log('Regenerating all articles...');
    const articles = await fileManager.getAllArticles();

    for (const article of articles) {
        try {
            const articlePath = path.join(NEWS_DIR, article.filename);
            const content = await fs.readFile(articlePath, 'utf-8');
            const $ = cheerio.load(content, { xmlMode: false, decodeEntities: false });

            // Apply asset link updates
            updateAssetLinks($);

            // Write back
            await fs.writeFile(articlePath, $.html(), 'utf-8');
            console.log(`  ✓ ${article.filename}`);
        } catch (error) {
            console.error(`  ✗ Error updating ${article.filename}:`, error.message);
        }
    }
    console.log(`Regenerated ${articles.length} articles`);
}

async function updateEntireSite() {
    console.log('Updating entire site...\n');

    try {
        await minifyAssets();
        await regenerateAllArticles();
        await updateHomepage();
        await updatePressReleasesArchive();
        await updateNewsArchive();
        await updateAllCategoryPages();
        await updateAllAuthorPages();
        await updateFooterRecentPosts();
        console.log('\n✓ Site update complete!');
    } catch (error) {
        console.error('Error updating site:', error);
        throw error;
    }
}

/**
 * Format date for display
 */
function formatDate(dateString) {
    if (!dateString) return 'Recently';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
        return `${diffMins} min ago`;
    } else if (diffHours < 24) {
        return `${diffHours} hr ago`;
    } else if (diffDays < 7) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
}

function formatFooterDate(dateString) {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function normalizeHtmlTextAmpersands(html) {
    return html
        .replace(/&amp;amp;/g, '&')
        .replace(/>([^<]*)</g, (match, text) => {
            const updated = text.replace(/&amp;/g, '&');
            return `>${updated}<`;
        });
}

module.exports = {
    updateHomepage,
    updatePressReleasesArchive,
    updateNewsArchive,
    updateCategoryPage,
    updateAllCategoryPages,
    updateAuthorPage,
    updateAllAuthorPages,
    updateEntireSite,
    updateFooterRecentPosts,
    regenerateAllArticles
};
