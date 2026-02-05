/**
 * FNPulse Banner Management Routes
 * Complete advertising system routes
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');

// Import managers
const bannerManager = require('./utils/bannerManager');
const clientManager = require('./utils/clientManager');
const placementManager = require('./utils/placementManager');
const analyticsManager = require('./utils/analyticsManager');

// Configure multer for banner uploads
const bannerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../News/img/banners');
        if (!fsSync.existsSync(uploadDir)) {
            fsSync.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '-');
        cb(null, `banner-${timestamp}-${safeName}`);
    }
});

const bannerUpload = multer({
    storage: bannerStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp', 'video/mp4'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Allowed: JPG, PNG, GIF, SVG, WebP, MP4'));
        }
    }
});

// =====================
// PAGE ROUTES
// =====================

// Main banner management dashboard
router.get('/', async (req, res) => {
    try {
        const stats = await bannerManager.getBannerStats();
        const dashboardSummary = await analyticsManager.getDashboardSummary();
        const recentBanners = await bannerManager.getAllBanners();
        const clients = await clientManager.getAllClients();
        const placements = await placementManager.getAllPlacements();

        res.render('banner-dashboard', {
            page: 'banners',
            stats,
            dashboard: dashboardSummary,
            banners: recentBanners.slice(0, 10),
            clients,
            placements,
            BANNER_SIZES: bannerManager.BANNER_SIZES,
            BANNER_STATUS: bannerManager.BANNER_STATUS
        });
    } catch (error) {
        console.error('Banner dashboard error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Banner list page
router.get('/list', async (req, res) => {
    try {
        const filters = {
            status: req.query.status || null,
            clientId: req.query.client || null,
            placementId: req.query.placement || null
        };
        const banners = await bannerManager.getAllBanners(filters);
        const clients = await clientManager.getAllClients();
        const placements = await placementManager.getAllPlacements();

        res.render('banner-list', {
            page: 'banners',
            banners,
            clients,
            placements,
            filters,
            BANNER_SIZES: bannerManager.BANNER_SIZES,
            BANNER_STATUS: bannerManager.BANNER_STATUS
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// New banner form
router.get('/new', async (req, res) => {
    try {
        const clients = await clientManager.getAllClients();
        const campaigns = await clientManager.getAllCampaigns();
        const placements = await placementManager.getAllPlacements();

        res.render('banner-editor', {
            page: 'banners',
            banner: null,
            mode: 'create',
            clients,
            campaigns,
            placements,
            BANNER_SIZES: bannerManager.BANNER_SIZES,
            BANNER_STATUS: bannerManager.BANNER_STATUS,
            ROTATION_TYPES: bannerManager.ROTATION_TYPES
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Edit banner form
router.get('/edit/:id', async (req, res) => {
    try {
        const banner = await bannerManager.getBannerById(req.params.id);
        if (!banner) {
            return res.status(404).render('error', { message: 'Banner not found' });
        }

        const clients = await clientManager.getAllClients();
        const campaigns = await clientManager.getAllCampaigns();
        const placements = await placementManager.getAllPlacements();

        res.render('banner-editor', {
            page: 'banners',
            banner,
            mode: 'edit',
            clients,
            campaigns,
            placements,
            BANNER_SIZES: bannerManager.BANNER_SIZES,
            BANNER_STATUS: bannerManager.BANNER_STATUS,
            ROTATION_TYPES: bannerManager.ROTATION_TYPES
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================
// CLIENT ROUTES
// =====================

// Clients list page
router.get('/clients', async (req, res) => {
    try {
        const clients = await clientManager.getAllClients();
        const clientsWithStats = await Promise.all(
            clients.map(async client => ({
                ...client,
                stats: await clientManager.getClientStats(client.id)
            }))
        );

        res.render('client-list', {
            page: 'banners',
            clients: clientsWithStats
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// New client form
router.get('/clients/new', (req, res) => {
    res.render('client-editor', {
        page: 'banners',
        client: null,
        mode: 'create'
    });
});

// Edit client form
router.get('/clients/edit/:id', async (req, res) => {
    try {
        const client = await clientManager.getClientById(req.params.id);
        if (!client) {
            return res.status(404).render('error', { message: 'Client not found' });
        }

        const stats = await clientManager.getClientStats(client.id);
        const banners = await clientManager.getClientBanners(client.id);
        const campaigns = await clientManager.getClientCampaigns(client.id);

        res.render('client-editor', {
            page: 'banners',
            client,
            mode: 'edit',
            stats,
            banners,
            campaigns
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================
// PLACEMENT ROUTES
// =====================

// Placements list page
router.get('/placements', async (req, res) => {
    try {
        const placements = await placementManager.getAllPlacements();
        const placementsWithStats = await Promise.all(
            placements.map(async placement => ({
                ...placement,
                stats: await placementManager.getPlacementStats(placement.id)
            }))
        );

        res.render('placement-list', {
            page: 'banners',
            placements: placementsWithStats,
            POSITIONS: placementManager.POSITIONS,
            PAGE_TYPES: placementManager.PAGE_TYPES,
            BANNER_SIZES: bannerManager.BANNER_SIZES
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// New placement form
router.get('/placements/new', (req, res) => {
    res.render('placement-editor', {
        page: 'banners',
        placement: null,
        mode: 'create',
        POSITIONS: placementManager.POSITIONS,
        PAGE_TYPES: placementManager.PAGE_TYPES,
        BANNER_SIZES: bannerManager.BANNER_SIZES,
        ROTATION_TYPES: bannerManager.ROTATION_TYPES
    });
});

// Edit placement form
router.get('/placements/edit/:id', async (req, res) => {
    try {
        const placement = await placementManager.getPlacementById(req.params.id);
        if (!placement) {
            return res.status(404).render('error', { message: 'Placement not found' });
        }

        const stats = await placementManager.getPlacementStats(placement.id);
        const banners = await placementManager.getPlacementBanners(placement.id);
        const embedCode = placementManager.generatePlacementCode(placement);

        res.render('placement-editor', {
            page: 'banners',
            placement,
            mode: 'edit',
            stats,
            banners,
            embedCode,
            POSITIONS: placementManager.POSITIONS,
            PAGE_TYPES: placementManager.PAGE_TYPES,
            BANNER_SIZES: bannerManager.BANNER_SIZES,
            ROTATION_TYPES: bannerManager.ROTATION_TYPES
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================
// CAMPAIGN ROUTES
// =====================

// Campaigns list page
router.get('/campaigns', async (req, res) => {
    try {
        const campaigns = await clientManager.getAllCampaigns();
        const clients = await clientManager.getAllClients();
        const campaignsWithStats = await Promise.all(
            campaigns.map(async campaign => ({
                ...campaign,
                client: clients.find(c => c.id === campaign.clientId),
                stats: await clientManager.getCampaignStats(campaign.id)
            }))
        );

        res.render('campaign-list', {
            page: 'banners',
            campaigns: campaignsWithStats,
            clients
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// New campaign form
router.get('/campaigns/new', async (req, res) => {
    try {
        const clients = await clientManager.getAllClients();
        res.render('campaign-editor', {
            page: 'banners',
            campaign: null,
            mode: 'create',
            clients
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Edit campaign form
router.get('/campaigns/edit/:id', async (req, res) => {
    try {
        const campaign = await clientManager.getCampaignById(req.params.id);
        if (!campaign) {
            return res.status(404).render('error', { message: 'Campaign not found' });
        }

        const clients = await clientManager.getAllClients();
        const stats = await clientManager.getCampaignStats(campaign.id);
        const banners = await clientManager.getCampaignBanners(campaign.id);

        res.render('campaign-editor', {
            page: 'banners',
            campaign,
            mode: 'edit',
            clients,
            stats,
            banners
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================
// ANALYTICS ROUTES
// =====================

// Analytics dashboard
router.get('/analytics', async (req, res) => {
    try {
        const summary = await analyticsManager.getDashboardSummary();
        const banners = await bannerManager.getAllBanners();
        const clients = await clientManager.getAllClients();
        const placements = await placementManager.getAllPlacements();

        res.render('analytics-dashboard', {
            page: 'banners',
            summary,
            banners,
            clients,
            placements
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Audit log
router.get('/audit-log', async (req, res) => {
    try {
        const logs = await bannerManager.getAuditLog({ limit: 100 });
        res.render('audit-log', {
            page: 'banners',
            logs
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================
// API ROUTES - BANNERS
// =====================

// Get all banners (API)
router.get('/api/banners', async (req, res) => {
    try {
        const banners = await bannerManager.getAllBanners(req.query);
        res.json(banners);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single banner (API)
router.get('/api/banners/:id', async (req, res) => {
    try {
        const banner = await bannerManager.getBannerById(req.params.id);
        if (!banner) {
            return res.status(404).json({ error: 'Banner not found' });
        }
        res.json(banner);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create banner (API)
router.post('/api/banners', async (req, res) => {
    try {
        const banner = await bannerManager.createBanner(req.body);
        res.json({ success: true, banner });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update banner (API)
router.put('/api/banners/:id', async (req, res) => {
    try {
        const banner = await bannerManager.updateBanner(req.params.id, req.body);
        res.json({ success: true, banner });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete banner (API)
router.delete('/api/banners/:id', async (req, res) => {
    try {
        await bannerManager.deleteBanner(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Toggle banner status (API)
router.put('/api/banners/:id/toggle', async (req, res) => {
    try {
        const banner = await bannerManager.toggleBannerStatus(req.params.id);
        res.json({ success: true, banner });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Duplicate banner (API)
router.post('/api/banners/:id/duplicate', async (req, res) => {
    try {
        const banner = await bannerManager.duplicateBanner(req.params.id);
        res.json({ success: true, banner });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upload banner asset
router.post('/api/banners/upload', bannerUpload.single('asset'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        res.json({
            success: true,
            filename: req.file.filename,
            path: `img/banners/${req.file.filename}`,
            url: `/img/banners/${req.file.filename}`,
            size: req.file.size,
            mimetype: req.file.mimetype
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================
// API ROUTES - CLIENTS
// =====================

// Get all clients (API)
router.get('/api/clients', async (req, res) => {
    try {
        const clients = await clientManager.getAllClients();
        res.json(clients);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single client (API)
router.get('/api/clients/:id', async (req, res) => {
    try {
        const client = await clientManager.getClientById(req.params.id);
        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }
        res.json(client);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create client (API)
router.post('/api/clients', async (req, res) => {
    try {
        const client = await clientManager.createClient(req.body);
        res.json({ success: true, client });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update client (API)
router.put('/api/clients/:id', async (req, res) => {
    try {
        const client = await clientManager.updateClient(req.params.id, req.body);
        res.json({ success: true, client });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete client (API)
router.delete('/api/clients/:id', async (req, res) => {
    try {
        await clientManager.deleteClient(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get client stats (API)
router.get('/api/clients/:id/stats', async (req, res) => {
    try {
        const stats = await clientManager.getClientStats(req.params.id);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================
// API ROUTES - PLACEMENTS
// =====================

// Get all placements (API)
router.get('/api/placements', async (req, res) => {
    try {
        const placements = await placementManager.getAllPlacements();
        res.json(placements);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single placement (API)
router.get('/api/placements/:id', async (req, res) => {
    try {
        const placement = await placementManager.getPlacementById(req.params.id);
        if (!placement) {
            return res.status(404).json({ error: 'Placement not found' });
        }
        res.json(placement);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create placement (API)
router.post('/api/placements', async (req, res) => {
    try {
        const placement = await placementManager.createPlacement(req.body);
        res.json({ success: true, placement });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update placement (API)
router.put('/api/placements/:id', async (req, res) => {
    try {
        const placement = await placementManager.updatePlacement(req.params.id, req.body);
        res.json({ success: true, placement });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete placement (API)
router.delete('/api/placements/:id', async (req, res) => {
    try {
        await placementManager.deletePlacement(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Toggle placement (API)
router.put('/api/placements/:id/toggle', async (req, res) => {
    try {
        const placement = await placementManager.togglePlacement(req.params.id);
        res.json({ success: true, placement });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get placement embed code (API)
router.get('/api/placements/:id/embed', async (req, res) => {
    try {
        const placement = await placementManager.getPlacementById(req.params.id);
        if (!placement) {
            return res.status(404).json({ error: 'Placement not found' });
        }
        const embedCode = placementManager.generatePlacementCode(placement);
        res.json({ success: true, embedCode });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================
// API ROUTES - CAMPAIGNS
// =====================

// Get all campaigns (API)
router.get('/api/campaigns', async (req, res) => {
    try {
        const campaigns = await clientManager.getAllCampaigns();
        res.json(campaigns);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create campaign (API)
router.post('/api/campaigns', async (req, res) => {
    try {
        const campaign = await clientManager.createCampaign(req.body);
        res.json({ success: true, campaign });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update campaign (API)
router.put('/api/campaigns/:id', async (req, res) => {
    try {
        const campaign = await clientManager.updateCampaign(req.params.id, req.body);
        res.json({ success: true, campaign });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete campaign (API)
router.delete('/api/campaigns/:id', async (req, res) => {
    try {
        await clientManager.deleteCampaign(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================
// API ROUTES - ANALYTICS
// =====================

// Get dashboard summary (API)
router.get('/api/analytics/summary', async (req, res) => {
    try {
        const summary = await analyticsManager.getDashboardSummary();
        res.json(summary);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get banner report (API)
router.get('/api/analytics/banner/:id', async (req, res) => {
    try {
        const startDate = req.query.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = req.query.end || new Date().toISOString().split('T')[0];
        const report = await analyticsManager.getBannerReport(req.params.id, startDate, endDate);
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get placement report (API)
router.get('/api/analytics/placement/:id', async (req, res) => {
    try {
        const startDate = req.query.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = req.query.end || new Date().toISOString().split('T')[0];
        const report = await analyticsManager.getPlacementReport(req.params.id, startDate, endDate);
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get client report (API)
router.get('/api/analytics/client/:id', async (req, res) => {
    try {
        const startDate = req.query.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = req.query.end || new Date().toISOString().split('T')[0];
        const report = await analyticsManager.getClientReport(req.params.id, startDate, endDate);
        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Export report to CSV (API)
router.get('/api/analytics/export/:type/:id', async (req, res) => {
    try {
        const startDate = req.query.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = req.query.end || new Date().toISOString().split('T')[0];
        const csv = await analyticsManager.exportToCSV(req.params.type, req.params.id, startDate, endDate);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${req.params.type}-${req.params.id}-report.csv"`);
        res.send(csv);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================
// API ROUTES - DELIVERY
// =====================

// Get banners for placement (public API for frontend)
router.get('/api/deliver/:placementId', async (req, res) => {
    try {
        const options = {
            device: req.query.device || 'desktop',
            pageType: req.query.pageType || 'homepage'
        };

        const banners = await bannerManager.getActiveBannersForPlacement(req.params.placementId, options);

        // Transform for frontend delivery
        const deliveryBanners = banners.map(b => ({
            id: b.id,
            type: b.creativeType,
            size: b.size,
            assetUrl: b.assetUrl,
            htmlCode: b.htmlCode,
            targetUrl: bannerManager.buildUtmUrl(b),
            altText: b.altText
        }));

        res.json({
            placementId: req.params.placementId,
            banners: deliveryBanners
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Track impression (public API)
router.post('/api/track/impression', async (req, res) => {
    try {
        await analyticsManager.recordImpression({
            bannerId: req.body.bannerId,
            placementId: req.body.placementId,
            clientId: req.body.clientId,
            campaignId: req.body.campaignId,
            pageUrl: req.body.pageUrl || req.headers.referer,
            pageType: req.body.pageType,
            userAgent: req.headers['user-agent'],
            sessionId: req.body.sessionId || req.cookies?.fnp_session
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Track click (public API)
router.post('/api/track/click', async (req, res) => {
    try {
        await analyticsManager.recordClick({
            bannerId: req.body.bannerId,
            placementId: req.body.placementId,
            clientId: req.body.clientId,
            campaignId: req.body.campaignId,
            pageUrl: req.body.pageUrl || req.headers.referer,
            targetUrl: req.body.targetUrl,
            userAgent: req.headers['user-agent'],
            sessionId: req.body.sessionId || req.cookies?.fnp_session
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Click redirect (public)
router.get('/click/:bannerId', async (req, res) => {
    try {
        const banner = await bannerManager.getBannerById(req.params.bannerId);
        if (!banner) {
            return res.status(404).send('Banner not found');
        }

        // Record click
        await analyticsManager.recordClick({
            bannerId: banner.id,
            clientId: banner.clientId,
            campaignId: banner.campaignId,
            pageUrl: req.headers.referer,
            targetUrl: banner.targetUrl,
            userAgent: req.headers['user-agent']
        });

        // Redirect to target URL
        const targetUrl = bannerManager.buildUtmUrl(banner);
        res.redirect(targetUrl || '/');
    } catch (error) {
        res.redirect('/');
    }
});

// =====================
// AUDIT LOG ROUTES
// =====================

router.get('/api/audit-log', async (req, res) => {
    try {
        const logs = await bannerManager.getAuditLog({
            entityId: req.query.entityId,
            action: req.query.action,
            limit: parseInt(req.query.limit) || 50
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
