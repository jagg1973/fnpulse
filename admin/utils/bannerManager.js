/**
 * FNPulse Banner Management System
 * Comprehensive banner inventory, delivery, and analytics
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const BANNER_DATA_PATH = path.join(__dirname, '../data/banners.json');

// Banner size presets
const BANNER_SIZES = {
    'leaderboard': { width: 728, height: 90, label: 'Leaderboard' },
    'medium-rectangle': { width: 300, height: 250, label: 'Medium Rectangle' },
    'skyscraper': { width: 160, height: 600, label: 'Skyscraper' },
    'billboard': { width: 970, height: 250, label: 'Billboard' },
    'mobile-banner': { width: 320, height: 100, label: 'Mobile Banner' },
    'large-rectangle': { width: 336, height: 280, label: 'Large Rectangle' },
    'half-page': { width: 300, height: 600, label: 'Half Page' },
    'wide-skyscraper': { width: 160, height: 600, label: 'Wide Skyscraper' },
    'square': { width: 250, height: 250, label: 'Square' }
};

// Accepted file types
const ACCEPTED_FILE_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'mp4', 'webp'];

// Banner status options
const BANNER_STATUS = {
    ACTIVE: 'active',
    PAUSED: 'paused',
    EXPIRED: 'expired',
    DRAFT: 'draft',
    SCHEDULED: 'scheduled'
};

// Rotation logic types
const ROTATION_TYPES = {
    RANDOM: 'random',
    WEIGHTED: 'weighted',
    SEQUENTIAL: 'sequential',
    EVEN: 'even'
};

/**
 * Initialize banner data file if not exists
 */
async function initializeBannerData() {
    try {
        await fs.access(BANNER_DATA_PATH);
    } catch {
        const initialData = {
            banners: [],
            clients: [],
            campaigns: [],
            placements: getDefaultPlacements(),
            analytics: {
                impressions: [],
                clicks: []
            },
            auditLog: [],
            settings: {
                defaultRotation: 'weighted',
                frequencyCap: 5,
                lazyLoading: true,
                gdprCompliant: true
            }
        };
        await saveBannerData(initialData);
    }
}

/**
 * Get default placements for FNPulse.com
 */
function getDefaultPlacements() {
    return [
        {
            id: 'homepage-top-leaderboard',
            name: 'Homepage Top Leaderboard',
            pageType: 'homepage',
            position: 'top',
            allowedSizes: ['leaderboard', 'billboard'],
            maxBanners: 3,
            rotation: 'weighted',
            enabled: true,
            description: 'Premium placement above main content'
        },
        {
            id: 'article-sidebar',
            name: 'Article Sidebar',
            pageType: 'article',
            position: 'sidebar',
            allowedSizes: ['medium-rectangle', 'half-page', 'skyscraper'],
            maxBanners: 2,
            rotation: 'weighted',
            enabled: true,
            description: 'Sidebar placement on article pages'
        },
        {
            id: 'article-inline',
            name: 'Article Inline',
            pageType: 'article',
            position: 'inline',
            allowedSizes: ['medium-rectangle', 'large-rectangle'],
            maxBanners: 2,
            rotation: 'sequential',
            enabled: true,
            description: 'Inline placement within article content'
        },
        {
            id: 'footer-global',
            name: 'Footer Global Banner',
            pageType: 'all',
            position: 'footer',
            allowedSizes: ['billboard', 'leaderboard'],
            maxBanners: 1,
            rotation: 'random',
            enabled: true,
            description: 'Global footer placement on all pages'
        },
        {
            id: 'mobile-sticky',
            name: 'Mobile Sticky Bottom',
            pageType: 'all',
            position: 'sticky-bottom',
            allowedSizes: ['mobile-banner'],
            maxBanners: 1,
            rotation: 'weighted',
            enabled: true,
            deviceTarget: 'mobile',
            description: 'Sticky banner for mobile devices'
        },
        {
            id: 'category-header',
            name: 'Category Page Header',
            pageType: 'category',
            position: 'top',
            allowedSizes: ['leaderboard', 'billboard'],
            maxBanners: 2,
            rotation: 'weighted',
            enabled: true,
            description: 'Header placement on category archive pages'
        },
        {
            id: 'between-articles',
            name: 'Between Articles',
            pageType: 'archive',
            position: 'inline',
            allowedSizes: ['medium-rectangle', 'large-rectangle'],
            maxBanners: 3,
            rotation: 'sequential',
            enabled: true,
            description: 'Inserted between article listings'
        }
    ];
}

/**
 * Get banner data
 */
async function getBannerData() {
    await initializeBannerData();
    try {
        const data = await fs.readFile(BANNER_DATA_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading banner data:', error);
        return {
            banners: [],
            clients: [],
            campaigns: [],
            placements: getDefaultPlacements(),
            analytics: { impressions: [], clicks: [] },
            auditLog: [],
            settings: {}
        };
    }
}

/**
 * Save banner data
 */
async function saveBannerData(data) {
    await fs.writeFile(BANNER_DATA_PATH, JSON.stringify(data, null, 2));
}

/**
 * Generate unique ID
 */
function generateId(prefix = 'ban') {
    return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

// =====================
// BANNER OPERATIONS
// =====================

/**
 * Get all banners
 */
async function getAllBanners(filters = {}) {
    const data = await getBannerData();
    let banners = data.banners || [];

    // Apply filters
    if (filters.status) {
        banners = banners.filter(b => b.status === filters.status);
    }
    if (filters.clientId) {
        banners = banners.filter(b => b.clientId === filters.clientId);
    }
    if (filters.placementId) {
        banners = banners.filter(b => b.placements && b.placements.includes(filters.placementId));
    }
    if (filters.campaignId) {
        banners = banners.filter(b => b.campaignId === filters.campaignId);
    }

    // Sort by priority (highest first), then by creation date
    banners.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    return banners;
}

/**
 * Get banner by ID
 */
async function getBannerById(id) {
    const data = await getBannerData();
    return (data.banners || []).find(b => b.id === id);
}

/**
 * Create new banner
 */
async function createBanner(bannerData, userId = 'admin') {
    const data = await getBannerData();
    if (!data.banners) data.banners = [];

    const now = new Date().toISOString();
    const newBanner = {
        id: generateId('ban'),
        internalId: bannerData.internalId || '',
        name: bannerData.name,
        clientId: bannerData.clientId || null,
        campaignId: bannerData.campaignId || null,
        status: bannerData.status || BANNER_STATUS.DRAFT,
        priority: parseInt(bannerData.priority) || 5,

        // Creative assets
        creativeType: bannerData.creativeType || 'image', // image, html, video, adsense
        size: bannerData.size || 'medium-rectangle',
        customWidth: bannerData.customWidth || null,
        customHeight: bannerData.customHeight || null,
        assetUrl: bannerData.assetUrl || '',
        assetPath: bannerData.assetPath || '',
        htmlCode: bannerData.htmlCode || '',
        altText: bannerData.altText || 'Advertisement',

        // Click tracking
        targetUrl: bannerData.targetUrl || '',
        utmSource: bannerData.utmSource || 'fnpulse',
        utmMedium: bannerData.utmMedium || 'banner',
        utmCampaign: bannerData.utmCampaign || '',
        utmContent: bannerData.utmContent || '',

        // Placements
        placements: bannerData.placements || [],

        // Scheduling
        startDate: bannerData.startDate || null,
        endDate: bannerData.endDate || null,
        timeWindows: bannerData.timeWindows || [], // [{start: '09:00', end: '17:00'}]

        // Targeting
        pageTargeting: bannerData.pageTargeting || ['all'], // specific pages or 'all'
        categoryTargeting: bannerData.categoryTargeting || [], // specific categories
        deviceTargeting: bannerData.deviceTargeting || 'all', // desktop, mobile, tablet, all
        geoTargeting: bannerData.geoTargeting || [], // country codes

        // Delivery settings
        impressionLimit: bannerData.impressionLimit || null,
        clickLimit: bannerData.clickLimit || null,
        frequencyCap: bannerData.frequencyCap || null, // per user per day
        abTestGroup: bannerData.abTestGroup || null, // A, B, or null

        // Version control
        version: 1,
        versions: [],

        // Metadata
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        updatedBy: userId,

        // Legacy compatibility
        enabled: bannerData.status === BANNER_STATUS.ACTIVE,
        location: bannerData.placements?.[0] || 'header',
        type: bannerData.creativeType || 'image',
        content: bannerData.assetUrl || bannerData.htmlCode || '',
        link: bannerData.targetUrl || '',
        pages: bannerData.pageTargeting || ['all']
    };

    data.banners.push(newBanner);

    // Add to audit log
    await addAuditLog(data, 'banner_created', newBanner.id, userId, { name: newBanner.name });

    await saveBannerData(data);
    return newBanner;
}

/**
 * Update banner
 */
async function updateBanner(id, bannerData, userId = 'admin') {
    const data = await getBannerData();
    const index = (data.banners || []).findIndex(b => b.id === id);

    if (index === -1) {
        throw new Error('Banner not found');
    }

    const oldBanner = { ...data.banners[index] };
    const now = new Date().toISOString();

    // Store previous version
    if (!data.banners[index].versions) {
        data.banners[index].versions = [];
    }
    data.banners[index].versions.push({
        version: data.banners[index].version,
        data: oldBanner,
        savedAt: now
    });

    // Update banner
    data.banners[index] = {
        ...data.banners[index],
        ...bannerData,
        id: data.banners[index].id,
        createdAt: data.banners[index].createdAt,
        createdBy: data.banners[index].createdBy,
        version: (data.banners[index].version || 1) + 1,
        versions: data.banners[index].versions,
        updatedAt: now,
        updatedBy: userId,
        // Update legacy fields
        enabled: bannerData.status === BANNER_STATUS.ACTIVE || bannerData.enabled,
        location: bannerData.placements?.[0] || data.banners[index].location,
        type: bannerData.creativeType || data.banners[index].type,
        content: bannerData.assetUrl || bannerData.htmlCode || data.banners[index].content,
        link: bannerData.targetUrl || data.banners[index].link,
        pages: bannerData.pageTargeting || data.banners[index].pages
    };

    // Add to audit log
    await addAuditLog(data, 'banner_updated', id, userId, {
        name: data.banners[index].name,
        changes: getChanges(oldBanner, data.banners[index])
    });

    await saveBannerData(data);
    return data.banners[index];
}

/**
 * Delete banner
 */
async function deleteBanner(id, userId = 'admin') {
    const data = await getBannerData();
    const banner = (data.banners || []).find(b => b.id === id);

    if (!banner) {
        throw new Error('Banner not found');
    }

    data.banners = data.banners.filter(b => b.id !== id);

    // Add to audit log
    await addAuditLog(data, 'banner_deleted', id, userId, { name: banner.name });

    await saveBannerData(data);
}

/**
 * Toggle banner status
 */
async function toggleBannerStatus(id, userId = 'admin') {
    const data = await getBannerData();
    const banner = (data.banners || []).find(b => b.id === id);

    if (!banner) {
        throw new Error('Banner not found');
    }

    const newStatus = banner.status === BANNER_STATUS.ACTIVE ? BANNER_STATUS.PAUSED : BANNER_STATUS.ACTIVE;
    return updateBanner(id, { status: newStatus }, userId);
}

/**
 * Duplicate banner
 */
async function duplicateBanner(id, userId = 'admin') {
    const banner = await getBannerById(id);
    if (!banner) {
        throw new Error('Banner not found');
    }

    const duplicateData = {
        ...banner,
        name: `${banner.name} (Copy)`,
        status: BANNER_STATUS.DRAFT,
        internalId: ''
    };
    delete duplicateData.id;
    delete duplicateData.createdAt;
    delete duplicateData.updatedAt;
    delete duplicateData.versions;
    delete duplicateData.version;

    return createBanner(duplicateData, userId);
}

// =====================
// HELPER FUNCTIONS
// =====================

/**
 * Get changes between two objects
 */
function getChanges(oldObj, newObj) {
    const changes = [];
    const keys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

    for (const key of keys) {
        if (key === 'versions' || key === 'updatedAt' || key === 'updatedBy') continue;
        if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
            changes.push(key);
        }
    }
    return changes;
}

/**
 * Add entry to audit log
 */
async function addAuditLog(data, action, entityId, userId, details = {}) {
    if (!data.auditLog) data.auditLog = [];

    data.auditLog.unshift({
        id: generateId('log'),
        action,
        entityId,
        userId,
        details,
        timestamp: new Date().toISOString()
    });

    // Keep only last 1000 entries
    if (data.auditLog.length > 1000) {
        data.auditLog = data.auditLog.slice(0, 1000);
    }
}

/**
 * Get audit log
 */
async function getAuditLog(filters = {}) {
    const data = await getBannerData();
    let log = data.auditLog || [];

    if (filters.entityId) {
        log = log.filter(l => l.entityId === filters.entityId);
    }
    if (filters.action) {
        log = log.filter(l => l.action === filters.action);
    }
    if (filters.userId) {
        log = log.filter(l => l.userId === filters.userId);
    }
    if (filters.limit) {
        log = log.slice(0, filters.limit);
    }

    return log;
}

/**
 * Build UTM URL
 */
function buildUtmUrl(banner) {
    if (!banner.targetUrl) return '';

    const url = new URL(banner.targetUrl);
    if (banner.utmSource) url.searchParams.set('utm_source', banner.utmSource);
    if (banner.utmMedium) url.searchParams.set('utm_medium', banner.utmMedium);
    if (banner.utmCampaign) url.searchParams.set('utm_campaign', banner.utmCampaign);
    if (banner.utmContent) url.searchParams.set('utm_content', banner.utmContent);

    return url.toString();
}

/**
 * Check if banner should be delivered based on schedule
 */
function isBannerScheduledNow(banner) {
    const now = new Date();

    // Check date range
    if (banner.startDate && new Date(banner.startDate) > now) {
        return false;
    }
    if (banner.endDate && new Date(banner.endDate) < now) {
        return false;
    }

    // Check time windows
    if (banner.timeWindows && banner.timeWindows.length > 0) {
        const currentTime = now.toTimeString().slice(0, 5);
        const inWindow = banner.timeWindows.some(w =>
            currentTime >= w.start && currentTime <= w.end
        );
        if (!inWindow) return false;
    }

    return true;
}

/**
 * Get active banners for delivery
 */
async function getActiveBannersForPlacement(placementId, options = {}) {
    const data = await getBannerData();
    const placement = (data.placements || []).find(p => p.id === placementId);

    if (!placement || !placement.enabled) {
        return [];
    }

    let banners = (data.banners || []).filter(b => {
        // Must be active
        if (b.status !== BANNER_STATUS.ACTIVE) return false;

        // Must be assigned to this placement
        if (!b.placements || !b.placements.includes(placementId)) return false;

        // Must match placement allowed sizes
        if (!placement.allowedSizes.includes(b.size)) return false;

        // Must be within schedule
        if (!isBannerScheduledNow(b)) return false;

        // Device targeting
        if (options.device && b.deviceTargeting !== 'all' && b.deviceTargeting !== options.device) {
            return false;
        }

        // Page targeting
        if (options.pageType && !b.pageTargeting.includes('all') && !b.pageTargeting.includes(options.pageType)) {
            return false;
        }

        return true;
    });

    // Apply rotation logic
    banners = applyRotation(banners, placement.rotation, placement.maxBanners);

    return banners;
}

/**
 * Apply rotation logic to banners
 */
function applyRotation(banners, rotationType, maxBanners) {
    if (banners.length === 0) return [];

    let selected = [];

    switch (rotationType) {
        case ROTATION_TYPES.WEIGHTED:
            // Sort by priority, select highest priority banners
            banners.sort((a, b) => (b.priority || 0) - (a.priority || 0));
            selected = banners.slice(0, maxBanners);
            break;

        case ROTATION_TYPES.RANDOM:
            // Shuffle and select
            const shuffled = [...banners].sort(() => Math.random() - 0.5);
            selected = shuffled.slice(0, maxBanners);
            break;

        case ROTATION_TYPES.SEQUENTIAL:
            // Use time-based index for rotation
            const index = Math.floor(Date.now() / 60000) % banners.length;
            selected = [];
            for (let i = 0; i < Math.min(maxBanners, banners.length); i++) {
                selected.push(banners[(index + i) % banners.length]);
            }
            break;

        case ROTATION_TYPES.EVEN:
            // Even distribution - use impression count to determine
            banners.sort((a, b) => (a.impressions || 0) - (b.impressions || 0));
            selected = banners.slice(0, maxBanners);
            break;

        default:
            selected = banners.slice(0, maxBanners);
    }

    return selected;
}

/**
 * Update banner status based on schedule
 */
async function updateBannerStatuses() {
    const data = await getBannerData();
    const now = new Date();
    let updated = false;

    for (const banner of data.banners || []) {
        // Check if scheduled banner should start
        if (banner.status === BANNER_STATUS.SCHEDULED && banner.startDate) {
            if (new Date(banner.startDate) <= now) {
                banner.status = BANNER_STATUS.ACTIVE;
                banner.enabled = true;
                banner.updatedAt = now.toISOString();
                updated = true;
            }
        }

        // Check if active banner should expire
        if (banner.status === BANNER_STATUS.ACTIVE && banner.endDate) {
            if (new Date(banner.endDate) < now) {
                banner.status = BANNER_STATUS.EXPIRED;
                banner.enabled = false;
                banner.updatedAt = now.toISOString();
                updated = true;
            }
        }
    }

    if (updated) {
        await saveBannerData(data);
    }
}

/**
 * Get banner statistics summary
 */
async function getBannerStats() {
    const data = await getBannerData();
    const banners = data.banners || [];

    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return {
        total: banners.length,
        active: banners.filter(b => b.status === BANNER_STATUS.ACTIVE).length,
        paused: banners.filter(b => b.status === BANNER_STATUS.PAUSED).length,
        draft: banners.filter(b => b.status === BANNER_STATUS.DRAFT).length,
        expired: banners.filter(b => b.status === BANNER_STATUS.EXPIRED).length,
        scheduled: banners.filter(b => b.status === BANNER_STATUS.SCHEDULED).length,
        expiringSoon: banners.filter(b => {
            if (!b.endDate) return false;
            const endDate = new Date(b.endDate);
            return endDate > now && endDate <= weekFromNow;
        }).length,
        clients: (data.clients || []).length,
        placements: (data.placements || []).length
    };
}

// Export constants and functions
module.exports = {
    // Constants
    BANNER_SIZES,
    ACCEPTED_FILE_TYPES,
    BANNER_STATUS,
    ROTATION_TYPES,

    // Banner operations
    getAllBanners,
    getBannerById,
    createBanner,
    updateBanner,
    deleteBanner,
    toggleBannerStatus,
    duplicateBanner,

    // Delivery
    getActiveBannersForPlacement,
    isBannerScheduledNow,
    updateBannerStatuses,
    buildUtmUrl,

    // Data access
    getBannerData,
    saveBannerData,
    getBannerStats,

    // Audit
    getAuditLog,

    // Helpers
    generateId,
    getDefaultPlacements
};
