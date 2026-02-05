/**
 * FNPulse Client Management
 * Manage advertisers and their accounts
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const BANNER_DATA_PATH = path.join(__dirname, '../data/banners.json');

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
function generateId(prefix = 'cli') {
    return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

// =====================
// CLIENT OPERATIONS
// =====================

/**
 * Get all clients
 */
async function getAllClients() {
    const data = await getBannerData();
    return data.clients || [];
}

/**
 * Get client by ID
 */
async function getClientById(id) {
    const data = await getBannerData();
    return (data.clients || []).find(c => c.id === id);
}

/**
 * Create new client/advertiser
 */
async function createClient(clientData) {
    const data = await getBannerData();
    if (!data.clients) data.clients = [];

    const now = new Date().toISOString();
    const newClient = {
        id: generateId('cli'),
        name: clientData.name,
        company: clientData.company || '',
        email: clientData.email || '',
        phone: clientData.phone || '',
        website: clientData.website || '',
        address: clientData.address || '',

        // Contact person
        contactName: clientData.contactName || '',
        contactEmail: clientData.contactEmail || '',
        contactPhone: clientData.contactPhone || '',

        // Account settings
        status: clientData.status || 'active', // active, inactive, pending
        tier: clientData.tier || 'standard', // standard, premium, enterprise

        // Billing (future feature)
        billingEmail: clientData.billingEmail || '',
        paymentTerms: clientData.paymentTerms || 'net30',

        // Portal access (optional)
        portalAccess: clientData.portalAccess || false,
        portalUsername: clientData.portalUsername || '',
        portalPasswordHash: '', // Would be hashed in production

        // Notes
        notes: clientData.notes || '',
        tags: clientData.tags || [],

        // Metadata
        createdAt: now,
        updatedAt: now
    };

    data.clients.push(newClient);
    await saveBannerData(data);
    return newClient;
}

/**
 * Update client
 */
async function updateClient(id, clientData) {
    const data = await getBannerData();
    const index = (data.clients || []).findIndex(c => c.id === id);

    if (index === -1) {
        throw new Error('Client not found');
    }

    data.clients[index] = {
        ...data.clients[index],
        ...clientData,
        id: data.clients[index].id,
        createdAt: data.clients[index].createdAt,
        updatedAt: new Date().toISOString()
    };

    await saveBannerData(data);
    return data.clients[index];
}

/**
 * Delete client
 */
async function deleteClient(id) {
    const data = await getBannerData();
    const client = (data.clients || []).find(c => c.id === id);

    if (!client) {
        throw new Error('Client not found');
    }

    // Check if client has active banners
    const activeBanners = (data.banners || []).filter(b => b.clientId === id && b.status === 'active');
    if (activeBanners.length > 0) {
        throw new Error(`Cannot delete client with ${activeBanners.length} active banner(s). Please deactivate or reassign banners first.`);
    }

    data.clients = data.clients.filter(c => c.id !== id);
    await saveBannerData(data);
}

/**
 * Get client's banners
 */
async function getClientBanners(clientId) {
    const data = await getBannerData();
    return (data.banners || []).filter(b => b.clientId === clientId);
}

/**
 * Get client's campaigns
 */
async function getClientCampaigns(clientId) {
    const data = await getBannerData();
    return (data.campaigns || []).filter(c => c.clientId === clientId);
}

/**
 * Get client statistics
 */
async function getClientStats(clientId) {
    const data = await getBannerData();
    const banners = (data.banners || []).filter(b => b.clientId === clientId);
    const campaigns = (data.campaigns || []).filter(c => c.clientId === clientId);

    // Calculate analytics
    let totalImpressions = 0;
    let totalClicks = 0;

    for (const banner of banners) {
        const bannerImpressions = (data.analytics?.impressions || [])
            .filter(i => i.bannerId === banner.id);
        const bannerClicks = (data.analytics?.clicks || [])
            .filter(c => c.bannerId === banner.id);

        totalImpressions += bannerImpressions.length;
        totalClicks += bannerClicks.length;
    }

    return {
        totalBanners: banners.length,
        activeBanners: banners.filter(b => b.status === 'active').length,
        pausedBanners: banners.filter(b => b.status === 'paused').length,
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter(c => c.status === 'active').length,
        totalImpressions,
        totalClicks,
        ctr: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0
    };
}

// =====================
// CAMPAIGN OPERATIONS
// =====================

/**
 * Get all campaigns
 */
async function getAllCampaigns() {
    const data = await getBannerData();
    return data.campaigns || [];
}

/**
 * Get campaign by ID
 */
async function getCampaignById(id) {
    const data = await getBannerData();
    return (data.campaigns || []).find(c => c.id === id);
}

/**
 * Create new campaign
 */
async function createCampaign(campaignData) {
    const data = await getBannerData();
    if (!data.campaigns) data.campaigns = [];

    const now = new Date().toISOString();
    const newCampaign = {
        id: generateId('cam'),
        name: campaignData.name,
        clientId: campaignData.clientId,
        description: campaignData.description || '',
        status: campaignData.status || 'draft', // draft, active, paused, completed

        // Budget
        budget: campaignData.budget || null,
        budgetType: campaignData.budgetType || 'unlimited', // daily, monthly, total, unlimited
        spentAmount: 0,

        // Schedule
        startDate: campaignData.startDate || null,
        endDate: campaignData.endDate || null,

        // Goals
        impressionGoal: campaignData.impressionGoal || null,
        clickGoal: campaignData.clickGoal || null,

        // Targeting defaults
        defaultPageTargeting: campaignData.defaultPageTargeting || ['all'],
        defaultDeviceTargeting: campaignData.defaultDeviceTargeting || 'all',

        // Metadata
        createdAt: now,
        updatedAt: now
    };

    data.campaigns.push(newCampaign);
    await saveBannerData(data);
    return newCampaign;
}

/**
 * Update campaign
 */
async function updateCampaign(id, campaignData) {
    const data = await getBannerData();
    const index = (data.campaigns || []).findIndex(c => c.id === id);

    if (index === -1) {
        throw new Error('Campaign not found');
    }

    data.campaigns[index] = {
        ...data.campaigns[index],
        ...campaignData,
        id: data.campaigns[index].id,
        createdAt: data.campaigns[index].createdAt,
        updatedAt: new Date().toISOString()
    };

    await saveBannerData(data);
    return data.campaigns[index];
}

/**
 * Delete campaign
 */
async function deleteCampaign(id) {
    const data = await getBannerData();
    const campaign = (data.campaigns || []).find(c => c.id === id);

    if (!campaign) {
        throw new Error('Campaign not found');
    }

    // Check if campaign has active banners
    const activeBanners = (data.banners || []).filter(b => b.campaignId === id && b.status === 'active');
    if (activeBanners.length > 0) {
        throw new Error(`Cannot delete campaign with ${activeBanners.length} active banner(s).`);
    }

    data.campaigns = data.campaigns.filter(c => c.id !== id);
    await saveBannerData(data);
}

/**
 * Get campaign banners
 */
async function getCampaignBanners(campaignId) {
    const data = await getBannerData();
    return (data.banners || []).filter(b => b.campaignId === campaignId);
}

/**
 * Get campaign statistics
 */
async function getCampaignStats(campaignId) {
    const data = await getBannerData();
    const campaign = (data.campaigns || []).find(c => c.id === campaignId);
    const banners = (data.banners || []).filter(b => b.campaignId === campaignId);

    let totalImpressions = 0;
    let totalClicks = 0;

    for (const banner of banners) {
        const bannerImpressions = (data.analytics?.impressions || [])
            .filter(i => i.bannerId === banner.id);
        const bannerClicks = (data.analytics?.clicks || [])
            .filter(c => c.bannerId === banner.id);

        totalImpressions += bannerImpressions.length;
        totalClicks += bannerClicks.length;
    }

    return {
        campaign,
        totalBanners: banners.length,
        activeBanners: banners.filter(b => b.status === 'active').length,
        totalImpressions,
        totalClicks,
        ctr: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0,
        impressionProgress: campaign?.impressionGoal
            ? ((totalImpressions / campaign.impressionGoal) * 100).toFixed(1)
            : null,
        clickProgress: campaign?.clickGoal
            ? ((totalClicks / campaign.clickGoal) * 100).toFixed(1)
            : null
    };
}

module.exports = {
    // Client operations
    getAllClients,
    getClientById,
    createClient,
    updateClient,
    deleteClient,
    getClientBanners,
    getClientCampaigns,
    getClientStats,

    // Campaign operations
    getAllCampaigns,
    getCampaignById,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    getCampaignBanners,
    getCampaignStats
};
