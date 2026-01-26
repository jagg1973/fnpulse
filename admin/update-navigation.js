const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');

const NEWS_DIR = path.join(__dirname, '../News');

// Professional navigation structure with mega menus
const NEW_NAVIGATION = `
<nav class="nav-island">
    <a href="index.html" class="nav-link">Home</a>
    
    <div class="nav-dropdown">
        <a href="markets.html" class="nav-link">Markets</a>
        <div class="mega-menu">
            <div class="mega-menu-content">
                <div class="mega-menu-column">
                    <div class="mega-menu-title">Equity Markets</div>
                    <div class="mega-menu-links">
                        <a href="stocks-indices.html">Stocks & Indices</a>
                        <a href="stocks.html">Stock Analysis</a>
                        <a href="investing.html">Investing</a>
                        <a href="trading.html">Trading</a>
                    </div>
                </div>
                <div class="mega-menu-column">
                    <div class="mega-menu-title">Asset Classes</div>
                    <div class="mega-menu-links">
                        <a href="forex.html">Foreign Exchange</a>
                        <a href="crypto.html">Cryptocurrency</a>
                        <a href="commodities.html">Commodities</a>
                        <a href="bonds.html">Bonds & Fixed Income</a>
                    </div>
                </div>
                <div class="mega-menu-column">
                    <div class="mega-menu-title">Market Data</div>
                    <div class="mega-menu-links">
                        <a href="markets.html">Live Markets</a>
                        <a href="analysis.html">Market Analysis</a>
                        <a href="finance.html">Financial Data</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="nav-dropdown">
        <a href="news.html" class="nav-link">News & Analysis</a>
        <div class="mega-menu">
            <div class="mega-menu-content">
                <div class="mega-menu-column">
                    <div class="mega-menu-title">Business News</div>
                    <div class="mega-menu-links">
                        <a href="economy.html">Economy</a>
                        <a href="global-business.html">Global Business</a>
                        <a href="technology.html">Technology</a>
                        <a href="economic-policy.html">Economic Policy</a>
                    </div>
                </div>
                <div class="mega-menu-column">
                    <div class="mega-menu-title">Analysis & Research</div>
                    <div class="mega-menu-links">
                        <a href="analysis.html">Market Analysis</a>
                        <a href="news.html">Breaking News</a>
                        <a href="press-releases.html">Press Releases</a>
                    </div>
                </div>
                <div class="mega-menu-column">
                    <div class="mega-menu-title">Sectors</div>
                    <div class="mega-menu-links">
                        <a href="finance.html">Finance</a>
                        <a href="technology.html">Tech</a>
                        <a href="category.html">All Categories</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="nav-dropdown">
        <a href="about.html" class="nav-link">About</a>
        <div class="dropdown-menu">
            <a href="about.html">About FNPulse</a>
            <a href="editorial-standards.html">Editorial Standards</a>
            <a href="contact.html">Contact Us</a>
            <a href="advertisement.html">Advertise</a>
            <a href="media-kit.html">Media Kit</a>
        </div>
    </div>
</nav>
`;

const MOBILE_NAVIGATION = `
<div class="mobile-nav-content">
    <a href="index.html">Home</a>
    
    <div class="nav-dropdown">
        <a href="markets.html">Markets</a>
        <div class="mega-menu">
            <div class="mega-menu-content">
                <div class="mega-menu-column">
                    <div class="mega-menu-title">Equity Markets</div>
                    <div class="mega-menu-links">
                        <a href="stocks-indices.html">Stocks & Indices</a>
                        <a href="stocks.html">Stock Analysis</a>
                        <a href="investing.html">Investing</a>
                        <a href="trading.html">Trading</a>
                    </div>
                </div>
                <div class="mega-menu-column">
                    <div class="mega-menu-title">Asset Classes</div>
                    <div class="mega-menu-links">
                        <a href="forex.html">Foreign Exchange</a>
                        <a href="crypto.html">Cryptocurrency</a>
                        <a href="commodities.html">Commodities</a>
                        <a href="bonds.html">Bonds & Fixed Income</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="nav-dropdown">
        <a href="news.html">News & Analysis</a>
        <div class="mega-menu">
            <div class="mega-menu-content">
                <div class="mega-menu-column">
                    <div class="mega-menu-title">Business News</div>
                    <div class="mega-menu-links">
                        <a href="economy.html">Economy</a>
                        <a href="global-business.html">Global Business</a>
                        <a href="technology.html">Technology</a>
                        <a href="economic-policy.html">Economic Policy</a>
                    </div>
                </div>
                <div class="mega-menu-column">
                    <div class="mega-menu-title">Analysis</div>
                    <div class="mega-menu-links">
                        <a href="analysis.html">Market Analysis</a>
                        <a href="news.html">Breaking News</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="nav-dropdown">
        <a href="about.html">About</a>
        <div class="dropdown-menu">
            <a href="about.html">About FNPulse</a>
            <a href="editorial-standards.html">Editorial Standards</a>
            <a href="contact.html">Contact Us</a>
            <a href="advertisement.html">Advertise</a>
        </div>
    </div>
</div>
`;

async function updateNavigationInFiles() {
    const files = await fs.readdir(NEWS_DIR);
    const htmlFiles = files.filter(f => f.endsWith('.html') && !f.includes('backup'));

    console.log(`Found ${htmlFiles.length} HTML files to update\n`);

    let updated = 0;

    for (const file of htmlFiles) {
        try {
            const filePath = path.join(NEWS_DIR, file);
            let html = await fs.readFile(filePath, 'utf-8');
            const $ = cheerio.load(html, { xmlMode: false, decodeEntities: false });

            // Add CSS if not present
            if (!$('link[href*="dropdown-nav.css"]').length) {
                $('head').append('<link rel="stylesheet" href="/css/dropdown-nav.css">');
            }

            // Update desktop navigation
            if ($('.nav-island').length) {
                $('.nav-island').replaceWith(NEW_NAVIGATION);
            }

            // Update mobile navigation
            if ($('.mobile-nav-content').length) {
                $('.mobile-nav-content').replaceWith(MOBILE_NAVIGATION);
            }

            // Save
            await fs.writeFile(filePath, $.html());
            console.log(`✓ ${file}`);
            updated++;

        } catch (error) {
            console.log(`✗ ${file} - ${error.message}`);
        }
    }

    // Update articles in news/ folder
    const newsDir = path.join(NEWS_DIR, 'news');
    try {
        const newsFiles = await fs.readdir(newsDir);
        const newsHtmlFiles = newsFiles.filter(f => f.endsWith('.html'));

        for (const file of newsHtmlFiles) {
            try {
                const filePath = path.join(newsDir, file);
                let html = await fs.readFile(filePath, 'utf-8');
                const $ = cheerio.load(html, { xmlMode: false, decodeEntities: false });

                // Add CSS if not present
                if (!$('link[href*="dropdown-nav.css"]').length) {
                    $('head').append('<link rel="stylesheet" href="/css/dropdown-nav.css">');
                }

                // Update desktop navigation (use ../ for articles)
                if ($('.nav-island').length) {
                    const articleNav = NEW_NAVIGATION.replace(/href="/g, 'href="../');
                    $('.nav-island').replaceWith(articleNav);
                }

                // Update mobile navigation
                if ($('.mobile-nav-content').length) {
                    const articleMobileNav = MOBILE_NAVIGATION.replace(/href="/g, 'href="../');
                    $('.mobile-nav-content').replaceWith(articleMobileNav);
                }

                await fs.writeFile(filePath, $.html());
                console.log(`✓ news/${file}`);
                updated++;

            } catch (error) {
                console.log(`✗ news/${file} - ${error.message}`);
            }
        }
    } catch (error) {
        console.log('No news directory found');
    }

    console.log(`\n✓ Updated ${updated} files with new navigation`);
}

// Add mobile dropdown toggle script
const DROPDOWN_SCRIPT = `
<script>
// Mobile dropdown toggles
document.addEventListener('DOMContentLoaded', () => {
    const mobileDropdowns = document.querySelectorAll('.mobile-nav-content .nav-dropdown > a');
    mobileDropdowns.forEach(link => {
        link.addEventListener('click', (e) => {
            const parent = link.parentElement;
            if (parent.querySelector('.dropdown-menu')) {
                e.preventDefault();
                parent.classList.toggle('active');
            }
        });
    });
});
</script>
`;

updateNavigationInFiles().catch(console.error);
