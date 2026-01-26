/**
 * Pagination Manager
 * Generates dynamic pagination HTML and creates paginated category pages
 */
const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');
const { minifyHtml } = require('./htmlMinifier');
const { updateAssetLinks } = require('./assetUtils');
const { ensureHeadStructure } = require('./schemaUtils');

const NEWS_DIR = path.join(__dirname, '../../News');

/**
 * Generate pagination HTML based on current page and total pages
 * @param {number} currentPage - Current page number (1-indexed)
 * @param {number} totalPages - Total number of pages
 * @param {string} baseUrl - Base URL for pagination links (e.g., 'economy' or 'markets')
 * @returns {string} - HTML string for pagination, or empty string if totalPages <= 1
 */
function generatePaginationHtml(currentPage, totalPages, baseUrl) {
    // Don't show pagination if 1 or 0 pages
    if (totalPages <= 1) {
        return '';
    }

    const maxVisible = 5; // Max page numbers to show
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    // Adjust if near boundaries
    if (currentPage <= 3) {
        endPage = Math.min(maxVisible, totalPages);
    }
    if (currentPage >= totalPages - 2) {
        startPage = Math.max(1, totalPages - maxVisible + 1);
    }

    let html = '<div class="pagination">';

    // Previous button
    if (currentPage > 1) {
        const prevUrl = currentPage === 2 ? `${baseUrl}.html` : `${baseUrl}-page-${currentPage - 1}.html`;
        html += `<a href="${prevUrl}" class="page-link page-prev">← Prev</a>`;
    } else {
        html += '<span class="page-link page-prev disabled">← Prev</span>';
    }

    // First page + ellipsis
    if (startPage > 1) {
        html += `<a href="${baseUrl}.html" class="page-link">1</a>`;
        if (startPage > 2) {
            html += '<span class="page-dots">...</span>';
        }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        const pageUrl = i === 1 ? `${baseUrl}.html` : `${baseUrl}-page-${i}.html`;
        if (i === currentPage) {
            html += `<span class="page-link active">${i}</span>`;
        } else {
            html += `<a href="${pageUrl}" class="page-link">${i}</a>`;
        }
    }

    // Last page + ellipsis
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += '<span class="page-dots">...</span>';
        }
        html += `<a href="${baseUrl}-page-${totalPages}.html" class="page-link">${totalPages}</a>`;
    }

    // Next button
    if (currentPage < totalPages) {
        html += `<a href="${baseUrl}-page-${currentPage + 1}.html" class="page-link page-next">Next →</a>`;
    } else {
        html += '<span class="page-link page-next disabled">Next →</span>';
    }

    html += '</div>';
    return html;
}

/**
 * Update pagination HTML in a loaded Cheerio document
 * @param {CheerioStatic} $ - Cheerio loaded HTML
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total pages
 * @param {string} baseUrl - Base URL for category
 */
function updatePaginationInDom($, currentPage, totalPages, baseUrl) {
    const paginationHtml = generatePaginationHtml(currentPage, totalPages, baseUrl);

    if ($('.pagination').length > 0) {
        if (paginationHtml) {
            $('.pagination').replaceWith(paginationHtml);
        } else {
            // Remove pagination if not needed
            $('.pagination').remove();
        }
    } else if (paginationHtml && $('.archive-list').length > 0) {
        // Add pagination after archive-list if it doesn't exist
        $('.archive-list').after(paginationHtml);
    }
}

/**
 * Create paginated category pages
 * @param {string} categoryName - Category name (e.g., 'Economy', 'Markets')
 * @param {Array} articles - All articles for this category (sorted)
 * @param {string} baseFilename - Base filename (e.g., 'economy.html')
 * @param {Object} config - Site configuration
 * @param {number} articlesPerPage - Articles per page (default: 12)
 */
async function createPaginatedCategoryPages(categoryName, articles, baseFilename, config, articlesPerPage = 12) {
    const baseName = baseFilename.replace('.html', '');
    const totalArticles = articles.length;

    // Calculate pagination: Page 1 shows featured (1) + list (11) = 12 articles
    // Subsequent pages show 12 articles each
    const firstPageCount = 12; // 1 featured + 11 in list
    const remainingArticles = Math.max(0, totalArticles - firstPageCount);
    const additionalPages = Math.ceil(remainingArticles / articlesPerPage);
    const totalPages = 1 + additionalPages;

    console.log(`  Creating ${totalPages} page(s) for ${categoryName} (${totalArticles} articles)`);

    // Page 1 already exists and is handled by updateCategoryPage
    // We only need to create pages 2, 3, 4, etc.

    if (totalPages > 1) {
        for (let page = 2; page <= totalPages; page++) {
            await createPaginatedPage(categoryName, articles, baseName, page, totalPages, config, articlesPerPage, firstPageCount);
        }
    }

    // Clean up old paginated files that are no longer needed
    await cleanupOldPaginatedFiles(baseName, totalPages);
}

/**
 * Create a single paginated page
 * @param {string} categoryName - Category name
 * @param {Array} articles - All articles
 * @param {string} baseName - Base filename without .html
 * @param {number} pageNum - Page number to create
 * @param {number} totalPages - Total pages
 * @param {Object} config - Site config
 * @param {number} articlesPerPage - Articles per page
 * @param {number} firstPageCount - Articles on first page
 */
async function createPaginatedPage(categoryName, articles, baseName, pageNum, totalPages, config, articlesPerPage, firstPageCount) {
    // Calculate article range for this page
    const startIdx = firstPageCount + (pageNum - 2) * articlesPerPage;
    const endIdx = startIdx + articlesPerPage;
    const pageArticles = articles.slice(startIdx, endIdx);

    if (pageArticles.length === 0) {
        return; // Don't create empty pages
    }

    // Load the base category page as template
    const basePath = path.join(NEWS_DIR, `${baseName}.html`);
    const baseHtml = await fs.readFile(basePath, 'utf-8');
    const $ = cheerio.load(baseHtml, { xmlMode: false, decodeEntities: false });

    // Update page title
    const baseTitle = $('title').text().replace(/\s*—\s*FNPulse/, '');
    $('title').text(`${baseTitle} - Page ${pageNum} — FNPulse`);
    $('meta[name="description"]').attr('content', `${categoryName} news and analysis - Page ${pageNum}`);

    // Remove featured card on paginated pages
    if ($('.cat-featured-card').length > 0) {
        $('.cat-featured-card').remove();
    }

    // Update breadcrumb
    if ($('.breadcrumb .current').length > 0) {
        $('.breadcrumb .current').text(`${$('.breadcrumb .current').text()} - Page ${pageNum}`);
    }

    // Build articles HTML
    const articlesHtml = pageArticles.map(article => {
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

    // Update pagination
    updatePaginationInDom($, pageNum, totalPages, baseName);

    // Update canonical URL
    $('link[rel="canonical"]').attr('href', `https://www.FNPulse.com/${baseName}-page-${pageNum}.html`);
    $('meta[property="og:url"]').attr('content', `https://www.FNPulse.com/${baseName}-page-${pageNum}.html`);

    updateAssetLinks($);
    ensureHeadStructure($, { filename: `${baseName}-page-${pageNum}.html`, config });

    const outputPath = path.join(NEWS_DIR, `${baseName}-page-${pageNum}.html`);
    await fs.writeFile(outputPath, await minifyHtml($.html()));
    console.log(`    ✓ Created ${baseName}-page-${pageNum}.html`);
}

/**
 * Clean up old paginated files that exceed current page count
 * @param {string} baseName - Base filename
 * @param {number} currentTotalPages - Current total pages
 */
async function cleanupOldPaginatedFiles(baseName, currentTotalPages) {
    try {
        const files = await fs.readdir(NEWS_DIR);
        const pattern = new RegExp(`^${baseName}-page-(\\d+)\\.html$`);

        for (const file of files) {
            const match = file.match(pattern);
            if (match) {
                const pageNum = parseInt(match[1], 10);
                if (pageNum > currentTotalPages) {
                    const filePath = path.join(NEWS_DIR, file);
                    await fs.unlink(filePath);
                    console.log(`    ✓ Deleted old ${file}`);
                }
            }
        }
    } catch (error) {
        console.error('Error cleaning up old paginated files:', error.message);
    }
}

/**
 * Format date helper
 */
function formatDate(dateString) {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays < 7) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
}

module.exports = {
    generatePaginationHtml,
    updatePaginationInDom,
    createPaginatedCategoryPages,
    cleanupOldPaginatedFiles
};
