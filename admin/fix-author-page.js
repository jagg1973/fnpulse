const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');

const NEWS_DIR = path.join(__dirname, '../News');

async function fixAuthorPage() {
    const filePath = path.join(NEWS_DIR, 'author-jesus-guzman.html');
    let html = await fs.readFile(filePath, 'utf-8');
    const $ = cheerio.load(html, { xmlMode: false, decodeEntities: false });

    // Add author page CSS
    if (!$('link[href*="author-page.css"]').length) {
        $('head').append('<link rel="stylesheet" href="/css/author-page.css">');
    }

    // Fix the broken main tag and clean up inline styles
    const properAuthorHTML = `
    <main id="main-author" class="container article-container">
        <div class="breadcrumb">
            <a href="index.html">Home</a>
            <span>/</span>
            <a href="#">Authors</a>
            <span>/</span>
            <span class="current">Jesus Guzman</span>
        </div>

        <div class="article-layout">
            <section class="archive-main">
                <div class="author-bio-card">
                    <div class="author-avatar">
                        <img src="/img/author-face.jpg" alt="Jesus Guzman">
                    </div>
                    <div class="author-info">
                        <h1>Jesus Guzman</h1>
                        <p class="author-title">Senior Financial Journalist</p>
                        <p class="author-bio">Jesus Guzman is an award-winning financial journalist with over 12 years of experience covering global markets, economic policy, and investment strategies. He specializes in technical analysis, central bank policy, and emerging market trends.</p>
                        
                        <div class="author-meta-row">
                            <div class="author-meta-item">
                                <strong>Expertise</strong>
                                <span>Markets Analysis, Trading Strategies, Economic Policy</span>
                            </div>
                            <div class="author-meta-item">
                                <strong>Location</strong>
                                <span>New York, USA</span>
                            </div>
                        </div>
                        
                        <div class="author-social-links">
                            <a href="#" class="twitter">Twitter</a>
                            <a href="#" class="linkedin">LinkedIn</a>
                            <a href="mailto:jesus.guzman@fnpulse.com" class="email">Email</a>
                        </div>
                    </div>
                </div>

                <div class="author-stats-grid">
                    <div class="author-stat-card">
                        <div class="author-stat-number blue">1</div>
                        <div class="author-stat-label">Articles Published</div>
                    </div>
                    <div class="author-stat-card">
                        <div class="author-stat-number green">850</div>
                        <div class="author-stat-label">Total Readers</div>
                    </div>
                    <div class="author-stat-card">
                        <div class="author-stat-number purple">12+</div>
                        <div class="author-stat-label">Years Experience</div>
                    </div>
                    <div class="author-stat-card">
                        <div class="author-stat-number orange">5</div>
                        <div class="author-stat-label">Awards Won</div>
                    </div>
                </div>

                <header class="archive-header">
                    <h2 class="archive-title">Latest Articles by Jesus Guzman</h2>
                </header>

                <div class="archive-list">
                    <article class="post-card-large">
                        <div class="post-thumb">
                            <a href="news/wall-street-braces-for-super-week-as-fomc-decision-looms-and-big-tech-reports.html">
                                <img src="/img/news-1200x800-1.jpg" alt="Wall Street Analysis">
                            </a>
                        </div>
                        <div class="post-content">
                            <span class="post-cat">Markets</span>
                            <h3><a href="news/wall-street-braces-for-super-week-as-fomc-decision-looms-and-big-tech-reports.html">Wall Street Braces for 'Super-Week' as FOMC Decision Looms and Big Tech Reports</a></h3>
                            <div class="meta">By Jesus Guzman • Jan 26, 2026 • 3 min read</div>
                            <p>Markets eye Federal Reserve policy and 'Magnificent Seven' earnings amid record-breaking gold prices and geopolitical tension.</p>
                        </div>
                    </article>
                </div>
            </section>

            <aside class="sidebar">
                <div class="widget">
                    <h3 class="widget-title">Popular Articles</h3>
                    <div class="post-list-small">
                        <article class="side-post">
                            <span class="count">1</span>
                            <div class="info">
                                <a href="news/wall-street-braces-for-super-week-as-fomc-decision-looms-and-big-tech-reports.html">Wall Street Braces for 'Super-Week'</a>
                                <span class="meta-small">850 views</span>
                            </div>
                        </article>
                    </div>
                </div>

                <div class="widget ad-widget">
                    <div class="ad-square">
                        <span>300x250 Ad</span>
                    </div>
                </div>

                <div class="widget newsletter-widget">
                    <h4>Follow Jesus</h4>
                    <p>Get notified of new articles.</p>
                    <form>
                        <input type="email" placeholder="Your email address" required>
                        <button type="submit">Subscribe</button>
                    </form>
                </div>

                <div class="widget">
                    <h3 class="widget-title">Topics Covered</h3>
                    <div class="tag-cloud">
                        <a href="markets.html">Markets</a>
                        <a href="economy.html">Economy</a>
                        <a href="crypto.html">Crypto</a>
                        <a href="forex.html">Forex</a>
                        <a href="trading.html">Trading</a>
                        <a href="analysis.html">Analysis</a>
                        <a href="commodities.html">Commodities</a>
                        <a href="stocks.html">Stocks</a>
                    </div>
                </div>
            </aside>
        </div>
    </main>
    `;

    // Find and replace the broken main section
    const bodyContent = $('body').html();

    // Remove the broken main section
    const cleanedBody = bodyContent.replace(/ id="main-author"[^>]*>[\s\S]*?<\/nav>/i, '</nav>' + properAuthorHTML);

    $('body').html(cleanedBody);

    await fs.writeFile(filePath, $.html());
    console.log('✓ Author page fixed with proper HTML structure and CSS');
}

fixAuthorPage().catch(console.error);
