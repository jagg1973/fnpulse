const fs = require('fs').promises;
const path = require('path');

const CONTENT_PATH = path.join(__dirname, '../data/content.json');

/**
 * Get all authors
 */
async function getAllAuthors() {
    const data = await getContent();
    return data.authors || [];
}

/**
 * Get author by ID
 */
async function getAuthorById(id) {
    const authors = await getAllAuthors();
    return authors.find(a => a.id === id);
}

/**
 * Create new author
 */
async function createAuthor(authorData) {
    const data = await getContent();
    if (!data.authors) data.authors = [];

    const newAuthor = {
        id: authorData.id || generateId(authorData.name),
        name: authorData.name,
        email: authorData.email || '',
        bio: authorData.bio || '',
        avatar: authorData.avatar || 'img/author-face.jpg',
        title: authorData.title || '',
        twitter: authorData.twitter || '',
        linkedin: authorData.linkedin || ''
    };

    data.authors.push(newAuthor);
    await saveContent(data);
    return newAuthor;
}

/**
 * Update author
 */
async function updateAuthor(id, authorData) {
    const data = await getContent();
    const index = data.authors.findIndex(a => a.id === id);

    if (index === -1) {
        throw new Error('Author not found');
    }

    data.authors[index] = {
        ...data.authors[index],
        ...authorData,
        id: data.authors[index].id // Preserve ID
    };

    await saveContent(data);
    return data.authors[index];
}

/**
 * Delete author
 */
async function deleteAuthor(id) {
    const data = await getContent();
    data.authors = data.authors.filter(a => a.id !== id);
    await saveContent(data);
}

/**
 * Get all ad banners
 */
async function getAllAds() {
    const data = await getContent();
    return data.adBanners || [];
}

/**
 * Get footer selected posts
 */
async function getFooterPosts() {
    const data = await getContent();
    return data.footerPosts || [];
}

/**
 * Get ad by ID
 */
async function getAdById(id) {
    const ads = await getAllAds();
    return ads.find(a => a.id === id);
}

/**
 * Create new ad banner
 */
async function createAd(adData) {
    const data = await getContent();
    if (!data.adBanners) data.adBanners = [];

    const newAd = {
        id: adData.id || generateId(adData.name),
        name: adData.name,
        location: adData.location,
        size: adData.size,
        type: adData.type || 'image', // image, code, adsense
        content: adData.content || '', // image URL or HTML code
        link: adData.link || '',
        altText: adData.altText || '',
        enabled: adData.enabled !== false,
        pages: adData.pages || ['all']
    };

    data.adBanners.push(newAd);
    await saveContent(data);
    return newAd;
}

/**
 * Update ad banner
 */
async function updateAd(id, adData) {
    const data = await getContent();
    const index = data.adBanners.findIndex(a => a.id === id);

    if (index === -1) {
        throw new Error('Ad banner not found');
    }

    data.adBanners[index] = {
        ...data.adBanners[index],
        ...adData,
        id: data.adBanners[index].id
    };

    await saveContent(data);
    return data.adBanners[index];
}

/**
 * Delete ad banner
 */
async function deleteAd(id) {
    const data = await getContent();
    data.adBanners = data.adBanners.filter(a => a.id !== id);
    await saveContent(data);
}

/**
 * Update footer post selection by filename
 */
async function setFooterPostSelection(filename, includeInFooter) {
    const data = await getContent();
    if (!data.footerPosts) data.footerPosts = [];

    const exists = data.footerPosts.includes(filename);
    if (includeInFooter && !exists) {
        data.footerPosts.push(filename);
    }
    if (!includeInFooter && exists) {
        data.footerPosts = data.footerPosts.filter(item => item !== filename);
    }

    await saveContent(data);
    return data.footerPosts;
}

/**
 * Get content data
 */
async function getContent() {
    try {
        const contentData = await fs.readFile(CONTENT_PATH, 'utf-8');
        return JSON.parse(contentData);
    } catch (error) {
        // If file doesn't exist, return default structure
        return { authors: [], adBanners: [], footerPosts: [] };
    }
}

/**
 * Save content data
 */
async function saveContent(data) {
    await fs.writeFile(CONTENT_PATH, JSON.stringify(data, null, 2));
}

/**
 * Generate ID from name
 */
function generateId(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

module.exports = {
    getAllAuthors,
    getAuthorById,
    createAuthor,
    updateAuthor,
    deleteAuthor,
    getAllAds,
    getAdById,
    createAd,
    updateAd,
    deleteAd,
    getFooterPosts,
    setFooterPostSelection
};
