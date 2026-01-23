const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs').promises;
const cheerio = require('cheerio');

const app = express();
const PORT = 3000;

// Import utilities
const htmlParser = require('./utils/htmlParser');
const templateGenerator = require('./utils/templateGenerator');
const fileManager = require('./utils/fileManager');
const contentManager = require('./utils/contentManager');
const siteUpdater = require('./utils/siteUpdater');
const pageManager = require('./utils/pageManager');
const deployer = require('./utils/deployer');
const gitDeployer = require('./utils/gitDeployer');

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/site-assets', express.static(path.join(__dirname, '../News')));
app.use('/api', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Image upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../News/img'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Routes
app.get('/', async (req, res) => {
    try {
        const articles = await fileManager.getAllArticles();
        const images = await fileManager.getAllImages();
        const config = await fileManager.getConfig();
        const authors = await contentManager.getAllAuthors();
        const ads = await contentManager.getAllAds();

        const stats = {
            articles: articles.length,
            images: images.length,
            categories: config.categories ? config.categories.length : 0,
            authors: authors.length,
            adBanners: ads.length
        };

        res.render('dashboard', { page: 'dashboard', stats });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.render('dashboard', { page: 'dashboard', stats: { articles: 0, images: 0, categories: 0, authors: 0, adBanners: 0 } });
    }
});

app.get('/articles', async (req, res) => {
    try {
        const articles = await fileManager.getAllArticles();
        const footerPosts = await contentManager.getFooterPosts();
        res.render('articles', { page: 'articles', articles, footerPosts });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/articles/new', (req, res) => {
    res.render('article-editor', { page: 'articles', article: null, mode: 'create' });
});

app.get('/articles/edit/:filename', async (req, res) => {
    try {
        const article = await htmlParser.parseArticle(req.params.filename);
        res.render('article-editor', { page: 'articles', article, mode: 'edit' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/articles', async (req, res) => {
    try {
        const result = await templateGenerator.createArticle(req.body);

        if (typeof req.body.includeInFooter !== 'undefined') {
            await contentManager.setFooterPostSelection(
                result.filename,
                req.body.includeInFooter === 'true' || req.body.includeInFooter === true
            );
        }

        // Update site pages with new article
        await siteUpdater.updateHomepage();
        if (req.body.category) {
            await siteUpdater.updateCategoryPage(req.body.category);
        }
        if (req.body.author) {
            await siteUpdater.updateAuthorPage(req.body.author);
        }
        await siteUpdater.updateFooterRecentPosts();

        res.json({ success: true, filename: result.filename });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/articles/:filename', async (req, res) => {
    try {
        await templateGenerator.updateArticle(req.params.filename, req.body);

        if (typeof req.body.includeInFooter !== 'undefined') {
            await contentManager.setFooterPostSelection(
                req.params.filename,
                req.body.includeInFooter === 'true' || req.body.includeInFooter === true
            );
        }

        // Update site pages
        await siteUpdater.updateHomepage();
        if (req.body.category) {
            await siteUpdater.updateCategoryPage(req.body.category);
        }
        if (req.body.author) {
            await siteUpdater.updateAuthorPage(req.body.author);
        }
        await siteUpdater.updateFooterRecentPosts();

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/articles/:filename', async (req, res) => {
    try {
        await fileManager.deleteArticle(req.params.filename);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/images', async (req, res) => {
    try {
        const images = await fileManager.getAllImages();
        res.render('images', { page: 'images', images });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/images/upload', upload.single('image'), (req, res) => {
    try {
        res.json({
            success: true,
            filename: req.file.filename,
            path: `img/${req.file.filename}`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/images/:filename', async (req, res) => {
    try {
        await fileManager.deleteImage(req.params.filename);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update entire site endpoint
app.post('/api/update-site', async (req, res) => {
    try {
        await siteUpdater.updateEntireSite();
        const config = await fileManager.getConfig();
        if (config?.deployment?.github?.repository) {
            const commitMessage = `Update site content (${new Date().toISOString()})`;
            await gitDeployer.pushToGitHub(config, commitMessage);
        }
        res.json({ success: true, message: 'Site updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/images/list', async (req, res) => {
    try {
        const images = await fileManager.getAllImages();
        res.json(images);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/settings', async (req, res) => {
    try {
        const config = await fileManager.getConfig();
        res.render('settings', { page: 'settings', config });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/settings', async (req, res) => {
    try {
        await fileManager.saveConfig(req.body);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const fetchWithTimeout = async (url, timeout = 10000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`);
        }
        return response;
    } finally {
        clearTimeout(timer);
    }
};

app.get('/api/live-ticker', async (req, res) => {
    try {
        const rssUrl = 'https://www.marketwatch.com/rss/topstories';
        const response = await fetchWithTimeout(rssUrl);
        const xml = await response.text();
        const $ = cheerio.load(xml, { xmlMode: true });
        const titles = $('item > title').toArray().map(el => $(el).text().trim()).filter(Boolean).slice(0, 6);
        res.json({ headlines: titles });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/markets/:type', async (req, res) => {
    try {
        const type = req.params.type;
        if (type === 'forex') {
            const response = await fetchWithTimeout('https://open.er-api.com/v6/latest/USD');
            const data = await response.json();
            if (!data || data.result !== 'success') {
                throw new Error('Forex data unavailable');
            }
            const usdToEur = data.rates.EUR;
            const usdToJpy = data.rates.JPY;
            const usdToGbp = data.rates.GBP;
            const stooqMap = {
                'EUR/USD': 'eurusd',
                'USD/JPY': 'usdjpy',
                'GBP/USD': 'gbpusd'
            };
            const stooqQuotes = await Promise.all(Object.entries(stooqMap).map(async ([label, symbol]) => {
                const quote = await fetchStooqQuote(symbol);
                return [label, quote];
            }));
            const changeMap = Object.fromEntries(stooqQuotes);

            const items = [
                buildForexItem('EUR/USD', (1 / usdToEur).toFixed(4), changeMap['EUR/USD']),
                buildForexItem('USD/JPY', usdToJpy.toFixed(2), changeMap['USD/JPY']),
                buildForexItem('GBP/USD', (1 / usdToGbp).toFixed(4), changeMap['GBP/USD'])
            ];
            return res.json({ items, source: 'FX rates: open.er-api.com / Stooq' });
        }

        if (type === 'crypto') {
            const url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true';
            const response = await fetchWithTimeout(url);
            const data = await response.json();
            const items = [
                { label: 'Bitcoin', value: `$${Number(data.bitcoin.usd).toFixed(2)}`, changeText: `${data.bitcoin.usd_24h_change.toFixed(2)}%`, changeClass: data.bitcoin.usd_24h_change >= 0 ? 'up' : 'down' },
                { label: 'Ethereum', value: `$${Number(data.ethereum.usd).toFixed(2)}`, changeText: `${data.ethereum.usd_24h_change.toFixed(2)}%`, changeClass: data.ethereum.usd_24h_change >= 0 ? 'up' : 'down' },
                { label: 'Solana', value: `$${Number(data.solana.usd).toFixed(2)}`, changeText: `${data.solana.usd_24h_change.toFixed(2)}%`, changeClass: data.solana.usd_24h_change >= 0 ? 'up' : 'down' }
            ];
            return res.json({ items, source: 'Crypto prices: coingecko.com' });
        }

        if (type === 'indices') {
            const symbols = ['^GSPC', '^DJI', '^IXIC'];
            const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols.join(','))}`;
            const response = await fetchWithTimeout(url);
            const data = await response.json();
            const results = data?.quoteResponse?.result || [];
            if (results.length) {
                const labelMap = { '^GSPC': 'S&P 500', '^DJI': 'Dow Jones', '^IXIC': 'Nasdaq' };
                const items = results.map(result => ({
                    label: labelMap[result.symbol] || result.symbol,
                    value: Number(result.regularMarketPrice).toFixed(2),
                    changeText: `${Number(result.regularMarketChangePercent).toFixed(2)}%`,
                    changeClass: result.regularMarketChangePercent >= 0 ? 'up' : 'down'
                }));
                return res.json({ items, source: 'Indices: Yahoo Finance' });
            }

            const stooqSymbols = [
                { symbol: '^spx', label: 'S&P 500' },
                { symbol: '^dji', label: 'Dow Jones' },
                { symbol: '^ndq', label: 'Nasdaq' }
            ];
            const items = await Promise.all(stooqSymbols.map(async ({ symbol, label }) => {
                const quote = await fetchStooqQuote(symbol);
                if (!quote) return null;
                return {
                    label,
                    value: Number(quote.price).toFixed(2),
                    changeText: quote.changePercent !== null ? `${quote.changePercent.toFixed(2)}%` : '—',
                    changeClass: quote.changePercent === null ? 'neutral' : quote.changePercent >= 0 ? 'up' : 'down'
                };
            }));
            const filtered = items.filter(Boolean);
            if (!filtered.length) {
                return res.status(502).json({ error: 'Indices data unavailable' });
            }
            return res.json({ items: filtered, source: 'Indices: Stooq' });
        }

        if (type === 'commodities') {
            const symbols = ['GC=F', 'SI=F', 'CL=F', 'BZ=F'];
            const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols.join(','))}`;
            const response = await fetchWithTimeout(url);
            const data = await response.json();
            const results = data?.quoteResponse?.result || [];
            if (results.length) {
                const labelMap = { 'GC=F': 'Gold', 'SI=F': 'Silver', 'CL=F': 'WTI Crude', 'BZ=F': 'Brent Crude' };
                const items = results.map(result => ({
                    label: labelMap[result.symbol] || result.symbol,
                    value: Number(result.regularMarketPrice).toFixed(2),
                    changeText: `${Number(result.regularMarketChangePercent).toFixed(2)}%`,
                    changeClass: result.regularMarketChangePercent >= 0 ? 'up' : 'down'
                }));
                return res.json({ items, source: 'Commodities: Yahoo Finance' });
            }

            const stooqSymbols = [
                { symbol: 'xauusd', label: 'Gold' },
                { symbol: 'xagusd', label: 'Silver' },
                { symbol: 'cl.f', label: 'WTI Crude' },
                { symbol: 'brent', label: 'Brent Crude' }
            ];
            const items = await Promise.all(stooqSymbols.map(async ({ symbol, label }) => {
                const quote = await fetchStooqQuote(symbol);
                if (!quote) return null;
                return {
                    label,
                    value: Number(quote.price).toFixed(2),
                    changeText: quote.changePercent !== null ? `${quote.changePercent.toFixed(2)}%` : '—',
                    changeClass: quote.changePercent === null ? 'neutral' : quote.changePercent >= 0 ? 'up' : 'down'
                };
            }));
            const filtered = items.filter(Boolean);
            if (!filtered.length) {
                return res.status(502).json({ error: 'Commodities data unavailable' });
            }
            return res.json({ items: filtered, source: 'Commodities: Stooq' });
        }

        return res.status(400).json({ error: 'Unsupported market type' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

async function fetchStooqQuote(symbol) {
    const url = `https://stooq.com/q/l/?s=${encodeURIComponent(symbol)}&f=sd2t2ohlcv&h&e=csv`;
    const response = await fetchWithTimeout(url);
    if (!response.ok) return null;
    const text = await response.text();
    const lines = text.trim().split('\n');
    if (lines.length < 2) return null;
    const values = lines[1].split(',');
    if (values.length < 7) return null;
    const open = Number(values[3]);
    const close = Number(values[6]);
    if (!Number.isFinite(close)) return null;
    const changePercent = Number.isFinite(open) && open > 0 ? ((close - open) / open) * 100 : null;
    return { price: close, changePercent };
}

function buildForexItem(label, value, stooqQuote) {
    if (stooqQuote && stooqQuote.changePercent !== null) {
        return {
            label,
            value,
            changeText: `${stooqQuote.changePercent.toFixed(2)}%`,
            changeClass: stooqQuote.changePercent >= 0 ? 'up' : 'down'
        };
    }
    return {
        label,
        value,
        changeText: '—',
        changeClass: 'neutral'
    };
}

app.get('/api/events', async (req, res) => {
    try {
        const eventsUrl = 'https://api.tradingeconomics.com/calendar/country/united%20states?c=guest:guest&f=json';
        const response = await fetchWithTimeout(eventsUrl);
        const data = await response.json();
        const now = new Date();
        const upcoming = data
            .map(item => ({
                date: new Date(item.Date || item.date || item.datetime),
                event: item.Event || item.EventDescription || item.Title || 'Market Event',
                detail: item.Forecast || item.Actual || item.Previous || item.Consensus || 'Details pending'
            }))
            .filter(item => !Number.isNaN(item.date.getTime()) && item.date >= now)
            .sort((a, b) => a.date - b.date)
            .slice(0, 4)
            .map(item => ({
                date: item.date.toISOString(),
                event: item.event,
                detail: item.detail
            }));
        res.json({ events: upcoming });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Deployment endpoints
app.post('/api/deploy', async (req, res) => {
    try {
        const config = await fileManager.getConfig();
        const method = req.body.method || 'wrangler'; // 'wrangler' or 'api'

        let result;
        if (method === 'wrangler') {
            result = await deployer.deployWithWrangler(config);
        } else {
            result = await deployer.deployToCloudflare(config);
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/deployment-status/:id', async (req, res) => {
    try {
        const config = await fileManager.getConfig();
        const status = await deployer.getDeploymentStatus(config, req.params.id);
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Git deployment endpoints
app.post('/api/git/push', async (req, res) => {
    try {
        const config = await fileManager.getConfig();
        const { commitMessage } = req.body;
        const result = await gitDeployer.pushToGitHub(config, commitMessage);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/git/status', async (req, res) => {
    try {
        const status = gitDeployer.getGitStatus();
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/git/init', async (req, res) => {
    try {
        const config = await fileManager.getConfig();
        const { repository, branch } = req.body;
        const result = await gitDeployer.initializeGit(
            repository || config.deployment?.github?.repository,
            branch || config.deployment?.github?.branch || 'main'
        );
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/regenerate-all', async (req, res) => {
    try {
        await siteUpdater.updateEntireSite();
        const config = await fileManager.getConfig();
        if (config?.deployment?.github?.repository) {
            const commitMessage = `Regenerate pages (${new Date().toISOString()})`;
            await gitDeployer.pushToGitHub(config, commitMessage);
        }
        res.json({ success: true, message: 'All pages regenerated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Pages Routes
app.get('/pages', async (req, res) => {
    try {
        const pages = await pageManager.getAllPages();
        res.render('pages', { page: 'pages', pages });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/pages/new', async (req, res) => {
    try {
        const templateHtml = await pageManager.getPageTemplate();
        res.render('page-editor', {
            page: 'pages',
            mode: 'create',
            pageData: { filename: '', html: templateHtml }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/pages/edit/:filename', async (req, res) => {
    try {
        const pageData = await pageManager.getPage(req.params.filename);
        res.render('page-editor', { page: 'pages', mode: 'edit', pageData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/pages', async (req, res) => {
    try {
        const result = await pageManager.createPage(req.body.filename, req.body.html);
        res.json({ success: true, filename: result.filename });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/pages/:filename', async (req, res) => {
    try {
        await pageManager.updatePage(req.params.filename, req.body.html);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Authors Routes
app.get('/authors', async (req, res) => {
    try {
        const authors = await contentManager.getAllAuthors();
        res.render('authors', { page: 'authors', authors });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/authors/new', (req, res) => {
    res.render('author-editor', { page: 'authors', author: null });
});

app.get('/authors/edit/:id', async (req, res) => {
    try {
        const author = await contentManager.getAuthorById(req.params.id);
        if (!author) {
            return res.status(404).json({ error: 'Author not found' });
        }
        res.render('author-editor', { page: 'authors', author });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/authors', async (req, res) => {
    try {
        const author = await contentManager.createAuthor(req.body);
        res.json({ success: true, author });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/authors/:id', async (req, res) => {
    try {
        const author = await contentManager.updateAuthor(req.params.id, req.body);
        res.json({ success: true, author });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/authors/:id', async (req, res) => {
    try {
        await contentManager.deleteAuthor(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/authors', async (req, res) => {
    try {
        const authors = await contentManager.getAllAuthors();
        res.json(authors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Footer posts routes
app.get('/api/footer-posts', async (req, res) => {
    try {
        const footerPosts = await contentManager.getFooterPosts();
        res.json(footerPosts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/footer-posts/:filename', async (req, res) => {
    try {
        const includeInFooter = req.body.includeInFooter === true || req.body.includeInFooter === 'true';
        const footerPosts = await contentManager.setFooterPostSelection(req.params.filename, includeInFooter);
        await siteUpdater.updateFooterRecentPosts();
        res.json({ success: true, footerPosts });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ad Banners Routes
app.get('/ads', async (req, res) => {
    try {
        const ads = await contentManager.getAllAds();
        res.render('ads', { page: 'ads', ads });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/ads/new', (req, res) => {
    res.render('ad-editor', { page: 'ads', ad: null });
});

app.get('/ads/edit/:id', async (req, res) => {
    try {
        const ad = await contentManager.getAdById(req.params.id);
        if (!ad) {
            return res.status(404).json({ error: 'Ad banner not found' });
        }
        res.render('ad-editor', { page: 'ads', ad });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/ads', async (req, res) => {
    try {
        const ad = await contentManager.createAd(req.body);
        res.json({ success: true, ad });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/ads/:id', async (req, res) => {
    try {
        const ad = await contentManager.updateAd(req.params.id, req.body);
        res.json({ success: true, ad });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/ads/:id/toggle', async (req, res) => {
    try {
        const ad = await contentManager.updateAd(req.params.id, { enabled: req.body.enabled });
        res.json({ success: true, ad });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/ads/:id', async (req, res) => {
    try {
        await contentManager.deleteAd(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`\n✨ FNPulse Admin Dashboard running at http://localhost:${PORT}\n`);
});
