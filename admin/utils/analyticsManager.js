/**
 * FNPulse Analytics Tracking
 * Track impressions, clicks, and generate reports
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const BANNER_DATA_PATH = path.join(__dirname, '../data/banners.json');
const ANALYTICS_DATA_PATH = path.join(__dirname, '../data/analytics.json');

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
 * Get analytics data (separate file for performance)
 */
async function getAnalyticsData() {
    try {
        const data = await fs.readFile(ANALYTICS_DATA_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        const defaultData = {
            impressions: [],
            clicks: [],
            dailyStats: {},
            lastCleanup: new Date().toISOString()
        };
        await saveAnalyticsData(defaultData);
        return defaultData;
    }
}

/**
 * Save analytics data
 */
async function saveAnalyticsData(data) {
    await fs.writeFile(ANALYTICS_DATA_PATH, JSON.stringify(data, null, 2));
}

/**
 * Generate unique ID
 */
function generateId(prefix = 'evt') {
    return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Get today's date key
 */
function getDateKey(date = new Date()) {
    return date.toISOString().split('T')[0];
}

// =====================
// EVENT TRACKING
// =====================

/**
 * Record an impression
 */
async function recordImpression(data) {
    const analytics = await getAnalyticsData();
    const now = new Date();
    const dateKey = getDateKey(now);

    const impression = {
        id: generateId('imp'),
        bannerId: data.bannerId,
        placementId: data.placementId,
        clientId: data.clientId || null,
        campaignId: data.campaignId || null,
        timestamp: now.toISOString(),

        // Context
        pageUrl: data.pageUrl || '',
        pageType: data.pageType || '',
        referrer: data.referrer || '',

        // User info (anonymized for GDPR)
        sessionId: data.sessionId || '',
        userAgent: data.userAgent || '',
        device: data.device || 'unknown',
        viewport: data.viewport || '',

        // Geo (optional)
        country: data.country || '',
        region: data.region || ''
    };

    // Add to impressions array (keep last 10000 for detailed view)
    analytics.impressions.unshift(impression);
    if (analytics.impressions.length > 10000) {
        analytics.impressions = analytics.impressions.slice(0, 10000);
    }

    // Update daily stats
    if (!analytics.dailyStats[dateKey]) {
        analytics.dailyStats[dateKey] = {
            impressions: 0,
            clicks: 0,
            banners: {},
            placements: {},
            clients: {}
        };
    }
    analytics.dailyStats[dateKey].impressions++;

    // Update banner-specific stats
    if (!analytics.dailyStats[dateKey].banners[data.bannerId]) {
        analytics.dailyStats[dateKey].banners[data.bannerId] = { impressions: 0, clicks: 0 };
    }
    analytics.dailyStats[dateKey].banners[data.bannerId].impressions++;

    // Update placement-specific stats
    if (data.placementId) {
        if (!analytics.dailyStats[dateKey].placements[data.placementId]) {
            analytics.dailyStats[dateKey].placements[data.placementId] = { impressions: 0, clicks: 0 };
        }
        analytics.dailyStats[dateKey].placements[data.placementId].impressions++;
    }

    // Update client-specific stats
    if (data.clientId) {
        if (!analytics.dailyStats[dateKey].clients[data.clientId]) {
            analytics.dailyStats[dateKey].clients[data.clientId] = { impressions: 0, clicks: 0 };
        }
        analytics.dailyStats[dateKey].clients[data.clientId].impressions++;
    }

    await saveAnalyticsData(analytics);
    return impression;
}

/**
 * Record a click
 */
async function recordClick(data) {
    const analytics = await getAnalyticsData();
    const now = new Date();
    const dateKey = getDateKey(now);

    const click = {
        id: generateId('clk'),
        bannerId: data.bannerId,
        placementId: data.placementId,
        clientId: data.clientId || null,
        campaignId: data.campaignId || null,
        timestamp: now.toISOString(),

        // Context
        pageUrl: data.pageUrl || '',
        targetUrl: data.targetUrl || '',

        // User info (anonymized for GDPR)
        sessionId: data.sessionId || '',
        userAgent: data.userAgent || '',
        device: data.device || 'unknown'
    };

    // Add to clicks array
    analytics.clicks.unshift(click);
    if (analytics.clicks.length > 10000) {
        analytics.clicks = analytics.clicks.slice(0, 10000);
    }

    // Update daily stats
    if (!analytics.dailyStats[dateKey]) {
        analytics.dailyStats[dateKey] = {
            impressions: 0,
            clicks: 0,
            banners: {},
            placements: {},
            clients: {}
        };
    }
    analytics.dailyStats[dateKey].clicks++;

    // Update banner-specific stats
    if (!analytics.dailyStats[dateKey].banners[data.bannerId]) {
        analytics.dailyStats[dateKey].banners[data.bannerId] = { impressions: 0, clicks: 0 };
    }
    analytics.dailyStats[dateKey].banners[data.bannerId].clicks++;

    // Update placement-specific stats
    if (data.placementId) {
        if (!analytics.dailyStats[dateKey].placements[data.placementId]) {
            analytics.dailyStats[dateKey].placements[data.placementId] = { impressions: 0, clicks: 0 };
        }
        analytics.dailyStats[dateKey].placements[data.placementId].clicks++;
    }

    // Update client-specific stats
    if (data.clientId) {
        if (!analytics.dailyStats[dateKey].clients[data.clientId]) {
            analytics.dailyStats[dateKey].clients[data.clientId] = { impressions: 0, clicks: 0 };
        }
        analytics.dailyStats[dateKey].clients[data.clientId].clicks++;
    }

    await saveAnalyticsData(analytics);
    return click;
}

// =====================
// REPORTING
// =====================

/**
 * Get dashboard summary
 */
async function getDashboardSummary() {
    const analytics = await getAnalyticsData();
    const bannerData = await getBannerData();
    const now = new Date();
    const today = getDateKey(now);

    // Get stats for different periods
    const todayStats = analytics.dailyStats[today] || { impressions: 0, clicks: 0 };

    // Last 7 days
    const last7Days = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const key = getDateKey(date);
        last7Days.push({
            date: key,
            impressions: analytics.dailyStats[key]?.impressions || 0,
            clicks: analytics.dailyStats[key]?.clicks || 0
        });
    }

    const weekTotal = last7Days.reduce((acc, d) => ({
        impressions: acc.impressions + d.impressions,
        clicks: acc.clicks + d.clicks
    }), { impressions: 0, clicks: 0 });

    // Last 30 days
    const last30Days = [];
    for (let i = 0; i < 30; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const key = getDateKey(date);
        last30Days.push({
            date: key,
            impressions: analytics.dailyStats[key]?.impressions || 0,
            clicks: analytics.dailyStats[key]?.clicks || 0
        });
    }

    const monthTotal = last30Days.reduce((acc, d) => ({
        impressions: acc.impressions + d.impressions,
        clicks: acc.clicks + d.clicks
    }), { impressions: 0, clicks: 0 });

    // Find top performers
    const bannerPerformance = {};
    for (const [date, stats] of Object.entries(analytics.dailyStats)) {
        for (const [bannerId, bannerStats] of Object.entries(stats.banners || {})) {
            if (!bannerPerformance[bannerId]) {
                bannerPerformance[bannerId] = { impressions: 0, clicks: 0 };
            }
            bannerPerformance[bannerId].impressions += bannerStats.impressions || 0;
            bannerPerformance[bannerId].clicks += bannerStats.clicks || 0;
        }
    }

    const topBanners = Object.entries(bannerPerformance)
        .map(([id, stats]) => ({
            id,
            banner: (bannerData.banners || []).find(b => b.id === id),
            ...stats,
            ctr: stats.impressions > 0 ? ((stats.clicks / stats.impressions) * 100).toFixed(2) : 0
        }))
        .filter(b => b.banner)
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 5);

    // Find expiring banners
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const expiringBanners = (bannerData.banners || [])
        .filter(b => b.endDate && new Date(b.endDate) > now && new Date(b.endDate) <= weekFromNow)
        .sort((a, b) => new Date(a.endDate) - new Date(b.endDate));

    // Find underperforming banners (low CTR)
    const underperformingBanners = Object.entries(bannerPerformance)
        .map(([id, stats]) => ({
            id,
            banner: (bannerData.banners || []).find(b => b.id === id),
            ...stats,
            ctr: stats.impressions > 0 ? ((stats.clicks / stats.impressions) * 100) : 0
        }))
        .filter(b => b.banner && b.banner.status === 'active' && b.impressions > 100 && b.ctr < 0.5)
        .sort((a, b) => a.ctr - b.ctr)
        .slice(0, 5);

    return {
        today: {
            impressions: todayStats.impressions,
            clicks: todayStats.clicks,
            ctr: todayStats.impressions > 0
                ? ((todayStats.clicks / todayStats.impressions) * 100).toFixed(2)
                : 0
        },
        week: {
            impressions: weekTotal.impressions,
            clicks: weekTotal.clicks,
            ctr: weekTotal.impressions > 0
                ? ((weekTotal.clicks / weekTotal.impressions) * 100).toFixed(2)
                : 0,
            daily: last7Days.reverse()
        },
        month: {
            impressions: monthTotal.impressions,
            clicks: monthTotal.clicks,
            ctr: monthTotal.impressions > 0
                ? ((monthTotal.clicks / monthTotal.impressions) * 100).toFixed(2)
                : 0,
            daily: last30Days.reverse()
        },
        topBanners,
        expiringBanners,
        underperformingBanners,
        activeBanners: (bannerData.banners || []).filter(b => b.status === 'active').length,
        totalBanners: (bannerData.banners || []).length,
        totalClients: (bannerData.clients || []).length,
        totalPlacements: (bannerData.placements || []).length
    };
}

/**
 * Get banner report
 */
async function getBannerReport(bannerId, startDate, endDate) {
    const analytics = await getAnalyticsData();
    const bannerData = await getBannerData();
    const banner = (bannerData.banners || []).find(b => b.id === bannerId);

    if (!banner) {
        throw new Error('Banner not found');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const dailyData = [];
    let totalImpressions = 0;
    let totalClicks = 0;

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const key = getDateKey(date);
        const dayStats = analytics.dailyStats[key]?.banners?.[bannerId] || { impressions: 0, clicks: 0 };
        dailyData.push({
            date: key,
            impressions: dayStats.impressions,
            clicks: dayStats.clicks,
            ctr: dayStats.impressions > 0
                ? ((dayStats.clicks / dayStats.impressions) * 100).toFixed(2)
                : 0
        });
        totalImpressions += dayStats.impressions;
        totalClicks += dayStats.clicks;
    }

    return {
        banner,
        period: { start: startDate, end: endDate },
        totals: {
            impressions: totalImpressions,
            clicks: totalClicks,
            ctr: totalImpressions > 0
                ? ((totalClicks / totalImpressions) * 100).toFixed(2)
                : 0
        },
        daily: dailyData
    };
}

/**
 * Get placement report
 */
async function getPlacementReport(placementId, startDate, endDate) {
    const analytics = await getAnalyticsData();
    const bannerData = await getBannerData();
    const placement = (bannerData.placements || []).find(p => p.id === placementId);

    if (!placement) {
        throw new Error('Placement not found');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const dailyData = [];
    let totalImpressions = 0;
    let totalClicks = 0;

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const key = getDateKey(date);
        const dayStats = analytics.dailyStats[key]?.placements?.[placementId] || { impressions: 0, clicks: 0 };
        dailyData.push({
            date: key,
            impressions: dayStats.impressions,
            clicks: dayStats.clicks,
            ctr: dayStats.impressions > 0
                ? ((dayStats.clicks / dayStats.impressions) * 100).toFixed(2)
                : 0
        });
        totalImpressions += dayStats.impressions;
        totalClicks += dayStats.clicks;
    }

    return {
        placement,
        period: { start: startDate, end: endDate },
        totals: {
            impressions: totalImpressions,
            clicks: totalClicks,
            ctr: totalImpressions > 0
                ? ((totalClicks / totalImpressions) * 100).toFixed(2)
                : 0
        },
        daily: dailyData
    };
}

/**
 * Get client report
 */
async function getClientReport(clientId, startDate, endDate) {
    const analytics = await getAnalyticsData();
    const bannerData = await getBannerData();
    const client = (bannerData.clients || []).find(c => c.id === clientId);

    if (!client) {
        throw new Error('Client not found');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const dailyData = [];
    let totalImpressions = 0;
    let totalClicks = 0;

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const key = getDateKey(date);
        const dayStats = analytics.dailyStats[key]?.clients?.[clientId] || { impressions: 0, clicks: 0 };
        dailyData.push({
            date: key,
            impressions: dayStats.impressions,
            clicks: dayStats.clicks,
            ctr: dayStats.impressions > 0
                ? ((dayStats.clicks / dayStats.impressions) * 100).toFixed(2)
                : 0
        });
        totalImpressions += dayStats.impressions;
        totalClicks += dayStats.clicks;
    }

    // Get client's banners with their performance
    const clientBanners = (bannerData.banners || [])
        .filter(b => b.clientId === clientId)
        .map(banner => {
            let bannerImpressions = 0;
            let bannerClicks = 0;

            for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
                const key = getDateKey(new Date(date));
                const dayStats = analytics.dailyStats[key]?.banners?.[banner.id];
                if (dayStats) {
                    bannerImpressions += dayStats.impressions || 0;
                    bannerClicks += dayStats.clicks || 0;
                }
            }

            return {
                ...banner,
                periodImpressions: bannerImpressions,
                periodClicks: bannerClicks,
                periodCtr: bannerImpressions > 0
                    ? ((bannerClicks / bannerImpressions) * 100).toFixed(2)
                    : 0
            };
        });

    return {
        client,
        period: { start: startDate, end: endDate },
        totals: {
            impressions: totalImpressions,
            clicks: totalClicks,
            ctr: totalImpressions > 0
                ? ((totalClicks / totalImpressions) * 100).toFixed(2)
                : 0
        },
        daily: dailyData,
        banners: clientBanners
    };
}

/**
 * Export data to CSV
 */
async function exportToCSV(reportType, entityId, startDate, endDate) {
    let report;
    let headers;
    let rows;

    switch (reportType) {
        case 'banner':
            report = await getBannerReport(entityId, startDate, endDate);
            headers = ['Date', 'Impressions', 'Clicks', 'CTR (%)'];
            rows = report.daily.map(d => [d.date, d.impressions, d.clicks, d.ctr]);
            break;
        case 'placement':
            report = await getPlacementReport(entityId, startDate, endDate);
            headers = ['Date', 'Impressions', 'Clicks', 'CTR (%)'];
            rows = report.daily.map(d => [d.date, d.impressions, d.clicks, d.ctr]);
            break;
        case 'client':
            report = await getClientReport(entityId, startDate, endDate);
            headers = ['Date', 'Impressions', 'Clicks', 'CTR (%)'];
            rows = report.daily.map(d => [d.date, d.impressions, d.clicks, d.ctr]);
            break;
        default:
            throw new Error('Invalid report type');
    }

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
}

/**
 * Cleanup old analytics data
 */
async function cleanupOldData(daysToKeep = 90) {
    const analytics = await getAnalyticsData();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffKey = getDateKey(cutoffDate);

    // Remove old daily stats
    for (const key of Object.keys(analytics.dailyStats)) {
        if (key < cutoffKey) {
            delete analytics.dailyStats[key];
        }
    }

    // Remove old individual events
    analytics.impressions = analytics.impressions.filter(i =>
        new Date(i.timestamp) >= cutoffDate
    );
    analytics.clicks = analytics.clicks.filter(c =>
        new Date(c.timestamp) >= cutoffDate
    );

    analytics.lastCleanup = new Date().toISOString();
    await saveAnalyticsData(analytics);

    return {
        message: `Cleaned up data older than ${daysToKeep} days`,
        cutoffDate: cutoffKey
    };
}

/**
 * Check frequency cap for user
 */
async function checkFrequencyCap(bannerId, sessionId, maxPerDay = 5) {
    const analytics = await getAnalyticsData();
    const today = getDateKey();

    const todayImpressions = analytics.impressions.filter(i =>
        i.bannerId === bannerId &&
        i.sessionId === sessionId &&
        i.timestamp.startsWith(today)
    );

    return todayImpressions.length < maxPerDay;
}

module.exports = {
    // Event tracking
    recordImpression,
    recordClick,

    // Reporting
    getDashboardSummary,
    getBannerReport,
    getPlacementReport,
    getClientReport,

    // Export
    exportToCSV,

    // Utilities
    cleanupOldData,
    checkFrequencyCap,
    getAnalyticsData
};
