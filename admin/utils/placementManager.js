/**
 * FNPulse Placement Management
 * Manage ad placements across the site
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const BANNER_DATA_PATH = path.join(__dirname, '../data/banners.json');

// Position options
const POSITIONS = {
    TOP: 'top',
    SIDEBAR: 'sidebar',
    FOOTER: 'footer',
    INLINE: 'inline',
    STICKY_TOP: 'sticky-top',
    STICKY_BOTTOM: 'sticky-bottom',
    FLOATING: 'floating',
    INTERSTITIAL: 'interstitial'
};

// Page types
const PAGE_TYPES = {
    HOMEPAGE: 'homepage',
    ARTICLE: 'article',
    CATEGORY: 'category',
    ARCHIVE: 'archive',
    SEARCH: 'search',
    AUTHOR: 'author',
    ALL: 'all'
};

/**
 * Get banner data
 */
async function getBannerData() {
    try {
        const data = await fs.readFile(BANNER_DATA_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return {
            banners: [],
            clients: [],
            campaigns: [],
            placements: [],
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
function generateId(prefix = 'plc') {
    return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

// =====================
// PLACEMENT OPERATIONS
// =====================

/**
 * Get all placements
 */
async function getAllPlacements() {
    const data = await getBannerData();
    return data.placements || [];
}

/**
 * Get placement by ID
 */
async function getPlacementById(id) {
    const data = await getBannerData();
    return (data.placements || []).find(p => p.id === id);
}

/**
 * Create new placement
 */
async function createPlacement(placementData) {
    const data = await getBannerData();
    if (!data.placements) data.placements = [];

    const now = new Date().toISOString();
    const newPlacement = {
        id: placementData.id || generateId('plc'),
        name: placementData.name,
        description: placementData.description || '',

        // Location settings
        pageType: placementData.pageType || 'all',
        position: placementData.position || 'sidebar',
        cssSelector: placementData.cssSelector || '', // Custom DOM selector
        insertMethod: placementData.insertMethod || 'append', // append, prepend, before, after

        // Size constraints
        allowedSizes: placementData.allowedSizes || ['medium-rectangle'],
        minWidth: placementData.minWidth || null,
        maxWidth: placementData.maxWidth || null,

        // Rotation settings
        maxBanners: placementData.maxBanners || 1,
        rotation: placementData.rotation || 'weighted',
        rotationInterval: placementData.rotationInterval || null, // seconds for auto-rotate

        // Device targeting
        deviceTarget: placementData.deviceTarget || 'all', // all, desktop, mobile, tablet

        // Visibility settings
        enabled: placementData.enabled !== false,
        lazyLoad: placementData.lazyLoad !== false,
        refreshEnabled: placementData.refreshEnabled || false,
        refreshInterval: placementData.refreshInterval || 30, // seconds

        // Display settings
        showLabel: placementData.showLabel !== false,
        labelText: placementData.labelText || 'Advertisement',
        containerClass: placementData.containerClass || '',
        wrapperHtml: placementData.wrapperHtml || '',

        // Priority
        priority: placementData.priority || 5,

        // Metadata
        createdAt: now,
        updatedAt: now
    };

    data.placements.push(newPlacement);
    await saveBannerData(data);
    return newPlacement;
}

/**
 * Update placement
 */
async function updatePlacement(id, placementData) {
    const data = await getBannerData();
    const index = (data.placements || []).findIndex(p => p.id === id);

    if (index === -1) {
        throw new Error('Placement not found');
    }

    data.placements[index] = {
        ...data.placements[index],
        ...placementData,
        id: data.placements[index].id,
        createdAt: data.placements[index].createdAt,
        updatedAt: new Date().toISOString()
    };

    await saveBannerData(data);
    return data.placements[index];
}

/**
 * Delete placement
 */
async function deletePlacement(id) {
    const data = await getBannerData();
    const placement = (data.placements || []).find(p => p.id === id);

    if (!placement) {
        throw new Error('Placement not found');
    }

    // Check if placement has assigned banners
    const assignedBanners = (data.banners || []).filter(b =>
        b.placements && b.placements.includes(id)
    );

    if (assignedBanners.length > 0) {
        throw new Error(`Cannot delete placement with ${assignedBanners.length} assigned banner(s). Please reassign or remove banners first.`);
    }

    data.placements = data.placements.filter(p => p.id !== id);
    await saveBannerData(data);
}

/**
 * Toggle placement status
 */
async function togglePlacement(id) {
    const data = await getBannerData();
    const placement = (data.placements || []).find(p => p.id === id);

    if (!placement) {
        throw new Error('Placement not found');
    }

    return updatePlacement(id, { enabled: !placement.enabled });
}

/**
 * Get placements by page type
 */
async function getPlacementsByPageType(pageType) {
    const data = await getBannerData();
    return (data.placements || []).filter(p =>
        p.enabled && (p.pageType === pageType || p.pageType === 'all')
    );
}

/**
 * Get banners assigned to placement
 */
async function getPlacementBanners(placementId) {
    const data = await getBannerData();
    return (data.banners || []).filter(b =>
        b.placements && b.placements.includes(placementId)
    );
}

/**
 * Get placement statistics
 */
async function getPlacementStats(placementId) {
    const data = await getBannerData();
    const placement = (data.placements || []).find(p => p.id === placementId);
    const banners = (data.banners || []).filter(b =>
        b.placements && b.placements.includes(placementId)
    );

    let totalImpressions = 0;
    let totalClicks = 0;

    // Calculate from analytics
    const impressions = (data.analytics?.impressions || [])
        .filter(i => i.placementId === placementId);
    const clicks = (data.analytics?.clicks || [])
        .filter(c => c.placementId === placementId);

    totalImpressions = impressions.length;
    totalClicks = clicks.length;

    return {
        placement,
        totalBanners: banners.length,
        activeBanners: banners.filter(b => b.status === 'active').length,
        totalImpressions,
        totalClicks,
        ctr: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0,
        fillRate: placement?.maxBanners
            ? ((banners.filter(b => b.status === 'active').length / placement.maxBanners) * 100).toFixed(1)
            : 0
    };
}

/**
 * Get all placement stats summary
 */
async function getAllPlacementStats() {
    const data = await getBannerData();
    const placements = data.placements || [];

    const stats = [];
    for (const placement of placements) {
        const placementStats = await getPlacementStats(placement.id);
        stats.push({
            id: placement.id,
            name: placement.name,
            enabled: placement.enabled,
            ...placementStats
        });
    }

    return stats;
}

/**
 * Generate placement embed code
 */
function generatePlacementCode(placement) {
    const placementId = placement.id;

    return `<!-- FNPulse Ad Placement: ${placement.name} -->
<div class="fnp-ad-placement" 
     data-placement-id="${placementId}"
     data-lazy-load="${placement.lazyLoad}"
     data-refresh="${placement.refreshEnabled}"
     data-refresh-interval="${placement.refreshInterval}">
    <script>
        (function() {
            window.FNPulseAds = window.FNPulseAds || [];
            window.FNPulseAds.push({
                placementId: '${placementId}',
                container: document.currentScript.parentNode
            });
        })();
    </script>
    <noscript>
        <a href="/ads/fallback/${placementId}" target="_blank">
            <img src="/ads/fallback/${placementId}/image" alt="${placement.labelText || 'Advertisement'}">
        </a>
    </noscript>
</div>
<!-- End FNPulse Ad Placement -->`;
}

/**
 * Validate placement configuration
 */
function validatePlacement(placement) {
    const errors = [];

    if (!placement.name || placement.name.trim() === '') {
        errors.push('Placement name is required');
    }

    if (!placement.allowedSizes || placement.allowedSizes.length === 0) {
        errors.push('At least one allowed size is required');
    }

    if (placement.maxBanners < 1) {
        errors.push('Max banners must be at least 1');
    }

    if (placement.rotationInterval && placement.rotationInterval < 5) {
        errors.push('Rotation interval must be at least 5 seconds');
    }

    if (placement.refreshInterval && placement.refreshInterval < 10) {
        errors.push('Refresh interval must be at least 10 seconds');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

module.exports = {
    // Constants
    POSITIONS,
    PAGE_TYPES,

    // Placement operations
    getAllPlacements,
    getPlacementById,
    createPlacement,
    updatePlacement,
    deletePlacement,
    togglePlacement,

    // Queries
    getPlacementsByPageType,
    getPlacementBanners,
    getPlacementStats,
    getAllPlacementStats,

    // Utilities
    generatePlacementCode,
    validatePlacement
};
