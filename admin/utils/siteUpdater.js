const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');
const dayjs = require('dayjs');
const htmlParser = require('./htmlParser');
const contentManager = require('./contentManager');
const fileManager = require('./fileManager');
const { ensureHeadStructure } = require('./schemaUtils');
const { updateAssetLinks } = require('./assetUtils');
const { minifyAssets } = require('./assetMinifier');
const { minifyHtml } = require('./htmlMinifier');
const paginationManager = require('./paginationManager');

const NEWS_DIR = path.join(__dirname, '../../News');

/**
 * Generate dynamic ticker HTML from latest articles
 */
async function generateDynamicTicker(articles) {
    // Use provided articles or fetch them
    if (!articles) {
        articles = await htmlParser.parseAllArticles();
    }

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
    } else {
        // Clear hero section if not enough articles
        $('.hero-main').html('<div class="card-body"><p style="color:#94a3b8;padding:2rem;text-align:center;">No articles available. Create articles in the admin panel.</p></div>');
        $('.hero-secondary').remove();
        $('.hero-tertiary').remove();
    }

    // Update Latest News section (latest 10 news items)
    const newsArticles = articles.filter(article => (article.contentType || 'article') === 'news');
    const latestNews = (newsArticles.length ? newsArticles : articles).slice(0, 10);

    if (latestNews.length > 0) {
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
    } else {
        // Clear news list if no articles
        if ($('.news-list').length > 0) {
            $('.news-list').html('<p style="color:#94a3b8;padding:2rem;text-align:center;">No news articles available yet.</p>');
        }
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
    } else {
        // Clear press releases section if none available
        if ($('.press-featured').length > 0) {
            $('.press-featured').html('<div style="padding:3rem;text-align:center;color:#94a3b8;"><p>No press releases available. Create press releases in the admin panel.</p></div>');
        }
        if ($('.press-list-grid').length > 0) {
            $('.press-list-grid').html('');
        }
    }

    // Clear Analysis & Research section (hardcoded content)
    if ($('.card-grid').length > 0) {
        const analysisArticles = articles.filter(a => a.category && a.category.toLowerCase().includes('analysis'));

        // Update the "Explore" link to point to analysis.html
        $('.card-grid').closest('.primary').find('a.section-link[href="#"]').attr('href', 'analysis.html');

        if (analysisArticles.length > 0) {
            const analysisHtml = analysisArticles.slice(0, 2).map(article => {
                const articleImage = article.featuredImage || 'img/news-350x223-4.jpg';
                return `
                    <article class="card">
                        <img src="${articleImage}" alt="${article.title}">
                        <div class="card-body">
                            <span class="eyebrow">${article.category}</span>
                            <h3><a href="${article.filename}">${article.title}</a></h3>
                            <p>${article.excerpt || ''}</p>
                        </div>
                    </article>
                `;
            }).join('');
            $('.card-grid').html(analysisHtml);
        } else {
            $('.card-grid').html('<p style="color:#94a3b8;padding:2rem;text-align:center;">No analysis articles available yet.</p>');
        }
    }

    // Clear Multimedia section (hardcoded content)
    if ($('.video-grid').length > 0) {
        $('.video-grid').html('<p style="color:#94a3b8;padding:3rem;text-align:center;">Multimedia content coming soon.</p>');
    }

    // Update ticker with dynamic content
    const tickerHtml = await generateDynamicTicker(articles);
    const tickerContent = $('.new-ticker-content');
    if (tickerContent.length > 0) {
        tickerContent.html(tickerHtml);
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
 * Update analysis archive page
 */
async function updateAnalysisArchive() {
    const articles = await htmlParser.parseAllArticles();
    const config = await fileManager.getConfig();

    // Filter for analysis articles and sort by publish date (newest first)
    const analysisArticles = articles
        .filter(article => article.category && article.category.toLowerCase().includes('analysis'))
        .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));

    const archivePath = path.join(NEWS_DIR, 'analysis.html');
    const html = await fs.readFile(archivePath, 'utf-8');
    const $ = cheerio.load(html, { xmlMode: false, decodeEntities: false });

    // Update featured article (.cat-featured-card)
    if ($('.cat-featured-card').length > 0) {
        if (analysisArticles.length > 0) {
            const featured = analysisArticles[0];
            const featuredImage = (featured.content && featured.content.featuredImage) || featured.featuredImage || 'img/news-825x525.jpg';
            const featuredHtml = `
                <div class="cat-featured-img">
                    <img src="${featuredImage}" alt="${featured.title}">
                    <span class="post-cat-badge">Must Read</span>
                </div>
                <div class="cat-featured-content">
                    <h2><a href="${featured.filename}">${featured.title}</a></h2>
                    <div class="meta-row">
                        <span class="author">By ${featured.author || 'Staff Writer'}</span>
                        <span class="sep">•</span>
                        <span class="date">${formatDate(featured.publishDate)}</span>
                    </div>
                    <p class="excerpt">${featured.excerpt || featured.metaDescription || ''}</p>
                </div>
            `;
            $('.cat-featured-card').html(featuredHtml);
        } else {
            $('.cat-featured-card').html(`
                <div class="cat-featured-content" style="padding:2rem;text-align:center;color:#94a3b8;">
                    <p>No analysis articles available yet. Create articles in the admin panel.</p>
                </div>
            `);
        }
    }

    // Update the articles list (.archive-list)
    if ($('.archive-list').length > 0) {
        if (analysisArticles.length > 1) {
            // Skip first article (already featured) and show remaining
            const articlesHtml = analysisArticles.slice(1).map(article => {
                const articleImage = (article.content && article.content.featuredImage) || article.featuredImage || 'img/news-350x223-1.jpg';
                return `
                <article class="post-card-large">
                    <div class="post-thumb">
                        <a href="${article.filename}"><img src="${articleImage}" alt="${article.title}"></a>
                    </div>
                    <div class="post-content">
                        <span class="post-cat">${article.category || 'Analysis'}</span>
                        <h3><a href="${article.filename}">${article.title}</a></h3>
                        <div class="meta">${formatDate(article.publishDate)} • ${article.readTime || '5'} min read</div>
                        <p>${article.excerpt || article.metaDescription || ''}</p>
                    </div>
                </article>
                `;
            }).join('\n');
            $('.archive-list').html(articlesHtml);
        } else if (analysisArticles.length === 1) {
            $('.archive-list').html('<p style="color:#94a3b8;padding:2rem;text-align:center">No more analysis articles available. Check back later for more content.</p>');
        } else {
            $('.archive-list').html('<p style="color:#94a3b8;padding:2rem;text-align:center">No articles available yet.</p>');
        }
    }

    updateAssetLinks($);
    ensureHeadStructure($, { filename: 'analysis.html', config });
    await fs.writeFile(archivePath, await minifyHtml($.html()));
    console.log('✓ Analysis archive updated');
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
async function updateCategoryPage(categoryName, customFilename = null) {
    const articles = await htmlParser.parseAllArticles();
    const config = await fileManager.getConfig();
    const articlesPerPage = (config && config.pagination && config.pagination.articlesPerPage) || 12;

    // Filter articles by category
    const categoryArticles = articles.filter(a =>
        a.category && a.category.toLowerCase() === categoryName.toLowerCase()
    ).sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));

    // Handle special filename mappings
    const categoryFile = customFilename || `${categoryName.toLowerCase()}.html`;
    const categoryPath = path.join(NEWS_DIR, categoryFile);
    const baseName = categoryFile.replace('.html', '');

    // Check if category page exists
    try {
        await fs.access(categoryPath);
    } catch {
        console.log(`Category page not found: ${categoryFile}`);
        return;
    }

    const html = await fs.readFile(categoryPath, 'utf-8');
    const $ = cheerio.load(html, { xmlMode: false, decodeEntities: false });

    // Calculate pagination
    const firstPageArticleCount = Math.min(categoryArticles.length, 12); // 1 featured + up to 11 in list
    const remainingArticles = Math.max(0, categoryArticles.length - firstPageArticleCount);
    const totalPages = 1 + Math.ceil(remainingArticles / articlesPerPage);

    // Update featured article (.cat-featured-card)
    if ($('.cat-featured-card').length > 0) {
        if (categoryArticles.length > 0) {
            const featured = categoryArticles[0];
            const featuredImage = (featured.content && featured.content.featuredImage) || featured.featuredImage || 'img/news-825x525.jpg';
            const featuredHtml = `
                <div class="cat-featured-img">
                    <img src="${featuredImage}" alt="${featured.title}">
                    <span class="post-cat-badge">Must Read</span>
                </div>
                <div class="cat-featured-content">
                    <h2><a href="${featured.filename}">${featured.title}</a></h2>
                    <div class="meta-row">
                        <span class="author">By ${featured.author || 'Staff Writer'}</span>
                        <span class="sep">•</span>
                        <span class="date">${formatDate(featured.publishDate)}</span>
                    </div>
                    <p class="excerpt">${featured.excerpt || featured.metaDescription || ''}</p>
                </div>
            `;
            $('.cat-featured-card').html(featuredHtml);
        } else {
            $('.cat-featured-card').html(`
                <div class="cat-featured-content" style="padding:2rem;text-align:center;color:#94a3b8;">
                    <p>No ${categoryName.toLowerCase()} articles available yet. Create articles in the admin panel.</p>
                </div>
            `);
        }
    }

    // Update the articles list (.archive-list)
    if ($('.archive-list').length > 0) {
        if (categoryArticles.length > 1) {
            // Skip first article (already featured) and show next 11
            const articlesHtml = categoryArticles.slice(1, 12).map(article => {
                const articleImage = (article.content && article.content.featuredImage) || article.featuredImage || 'img/news-350x223-1.jpg';
                return `
                <article class="post-card-large">
                    <div class="post-thumb">
                        <a href="${article.filename}"><img src="${articleImage}" alt="${article.title}"></a>
                    </div>
                    <div class="post-content">
                        <span class="post-cat">${article.category || 'News'}</span>
                        <h3><a href="${article.filename}">${article.title}</a></h3>
                        <div class="meta">${formatDate(article.publishDate)} • ${article.readTime || '5'} min read</div>
                        <p>${article.excerpt || article.metaDescription || ''}</p>
                    </div>
                </article>
                `;
            }).join('\n');
            $('.archive-list').html(articlesHtml);
        } else if (categoryArticles.length === 1) {
            $('.archive-list').html('<p style="color:#94a3b8;padding:2rem;text-align:center">No more articles in this category. Check back later for more content.</p>');
        } else {
            $('.archive-list').html('<p style="color:#94a3b8;padding:2rem;text-align:center">No articles available yet.</p>');
        }
    }

    // Update the news-list if it exists (alternative layout)
    if ($('.news-list').length > 0) {
        if (categoryArticles.length > 0) {
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
            $('.news-list').html(articlesHtml);
        } else {
            $('.news-list').html('<p style="color:#94a3b8;padding:2rem;text-align:center">No articles available yet.</p>');
        }
    }

    // Update or remove pagination based on article count
    paginationManager.updatePaginationInDom($, 1, totalPages, baseName);

    updateAssetLinks($);
    ensureHeadStructure($, { filename: categoryFile, config });
    await fs.writeFile(categoryPath, await minifyHtml($.html()));

    // Create additional paginated pages if needed
    if (totalPages > 1) {
        await paginationManager.createPaginatedCategoryPages(
            categoryName,
            categoryArticles,
            categoryFile,
            config,
            articlesPerPage
        );
    } else {
        // Clean up any existing paginated files
        await paginationManager.cleanupOldPaginatedFiles(baseName, 1);
    }

    console.log(`✓ ${categoryName} page updated (${categoryArticles.length} articles, ${totalPages} page${totalPages !== 1 ? 's' : ''})`);
}

/**
 * Update all category pages
 */
async function updateAllCategoryPages() {
    // Define categories with their corresponding filenames
    const categoryMappings = [
        { name: 'Markets', file: 'markets.html' },
        { name: 'Economy', file: 'economy.html' },
        { name: 'Technology', file: 'technology.html' },
        { name: 'Cryptocurrency', file: 'crypto.html' },  // Special: crypto.html instead of cryptocurrency.html
        { name: 'Cryptocurrency', file: 'cryptocurrency.html' },  // Also update this if it exists
        { name: 'Stocks', file: 'stocks.html' },
        { name: 'Stocks', file: 'stocks-indices.html' },  // Special: stocks-indices.html
        { name: 'Forex', file: 'forex.html' },
        { name: 'Commodities', file: 'commodities.html' },
        { name: 'Bonds', file: 'bonds.html' },
        { name: 'Analysis', file: 'analysis.html' }
    ];

    for (const mapping of categoryMappings) {
        try {
            await updateCategoryPage(mapping.name, mapping.file);
        } catch (error) {
            console.error(`Error updating ${mapping.name} (${mapping.file}):`, error.message);
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
        await updateAnalysisArchive();
        await updateAllCategoryPages();
        await updateAllAuthorPages();
        await updateFooterRecentPosts();
        await updateAllTickerContent(); // Update ticker across all pages
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

/**
 * Update ticker content across all HTML pages
 */
async function updateAllTickerContent() {
    const articles = await htmlParser.parseAllArticles();
    const tickerHtml = await generateDynamicTicker(articles);

    const files = await fs.readdir(NEWS_DIR);
    const htmlFiles = files.filter(f => f.endsWith('.html'));

    let updatedCount = 0;

    for (const file of htmlFiles) {
        try {
            const filePath = path.join(NEWS_DIR, file);
            const html = await fs.readFile(filePath, 'utf-8');
            const $ = cheerio.load(html, { xmlMode: false, decodeEntities: false });

            const tickerContent = $('.new-ticker-content');
            if (tickerContent.length > 0) {
                tickerContent.html(tickerHtml);
                await fs.writeFile(filePath, $.html());
                updatedCount++;
            }
        } catch (error) {
            console.error(`Error updating ticker in ${file}:`, error.message);
        }
    }

    console.log(`✓ Updated ticker content in ${updatedCount} files`);
    return updatedCount;
}

module.exports = {
    updateHomepage,
    updatePressReleasesArchive,
    updateNewsArchive,
    updateAnalysisArchive,
    updateCategoryPage,
    updateAllCategoryPages,
    updateAuthorPage,
    updateAllAuthorPages,
    updateEntireSite,
    updateFooterRecentPosts,
    regenerateAllArticles,
    updateAllTickerContent
};
