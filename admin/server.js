const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs').promises;

const app = express();
const PORT = 3000;

// Import utilities
const htmlParser = require('./utils/htmlParser');
const templateGenerator = require('./utils/templateGenerator');
const fileManager = require('./utils/fileManager');
const contentManager = require('./utils/contentManager');
const siteUpdater = require('./utils/siteUpdater');
const deployer = require('./utils/deployer');
const gitDeployer = require('./utils/gitDeployer');

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/site-assets', express.static(path.join(__dirname, '../News')));

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
        res.render('articles', { page: 'articles', articles });
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

        // Update site pages with new article
        await siteUpdater.updateHomepage();
        if (req.body.category) {
            await siteUpdater.updateCategoryPage(req.body.category);
        }
        if (req.body.author) {
            await siteUpdater.updateAuthorPage(req.body.author);
        }

        res.json({ success: true, filename: result.filename });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/articles/:filename', async (req, res) => {
    try {
        await templateGenerator.updateArticle(req.params.filename, req.body);

        // Update site pages
        await siteUpdater.updateHomepage();
        if (req.body.category) {
            await siteUpdater.updateCategoryPage(req.body.category);
        }
        if (req.body.author) {
            await siteUpdater.updateAuthorPage(req.body.author);
        }

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
        await templateGenerator.regenerateAllPages();
        res.json({ success: true, message: 'All pages regenerated successfully' });
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
