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

/**
 * Get all press releases
 */
async function getAllPressReleases() {
    const data = await getContent();
    return data.pressReleases || [];
}

/**
 * Get press release by filename
 */
async function getPressRelease(filename) {
    const pressReleases = await getAllPressReleases();
    return pressReleases.find(pr => pr.filename === filename);
}

/**
 * Create new press release
 */
async function createPressRelease(prData) {
    const data = await getContent();
    if (!data.pressReleases) data.pressReleases = [];

    const filename = 'press-' + generateId(prData.headline) + '.html';

    const newPR = {
        filename,
        headline: prData.headline,
        subheadline: prData.subheadline || '',
        location: prData.location || 'NEW YORK',
        releaseDate: prData.releaseDate || new Date().toISOString().split('T')[0],
        type: prData.type || 'general',
        status: prData.status || 'draft',
        image: prData.image || '/img/news-1200x800-1.jpg',
        imageCaption: prData.imageCaption || '',
        lead: prData.lead,
        body: prData.body,
        about: prData.about || '',
        contactName: prData.contactName || '',
        contactTitle: prData.contactTitle || '',
        contactEmail: prData.contactEmail || '',
        contactPhone: prData.contactPhone || '',
        showOnHomepage: prData.showOnHomepage || false,
        featured: prData.featured || false,
        metaDescription: prData.metaDescription || '',
        keywords: prData.keywords || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    data.pressReleases.push(newPR);
    await saveContent(data);

    // Generate HTML file
    await generatePressReleaseHTML(newPR);

    return newPR;
}

/**
 * Update press release
 */
async function updatePressRelease(filename, prData) {
    const data = await getContent();
    const index = data.pressReleases.findIndex(pr => pr.filename === filename);

    if (index === -1) {
        throw new Error('Press release not found');
    }

    data.pressReleases[index] = {
        ...data.pressReleases[index],
        ...prData,
        filename: data.pressReleases[index].filename, // Preserve filename
        updatedAt: new Date().toISOString()
    };

    await saveContent(data);

    // Regenerate HTML file
    await generatePressReleaseHTML(data.pressReleases[index]);

    return data.pressReleases[index];
}

/**
 * Set press release homepage status
 */
async function setPressReleaseHomepageStatus(filename, showOnHomepage) {
    const data = await getContent();
    const pr = data.pressReleases.find(pr => pr.filename === filename);

    if (pr) {
        pr.showOnHomepage = showOnHomepage;
        await saveContent(data);
    }
}

/**
 * Delete press release
 */
async function deletePressRelease(filename) {
    const data = await getContent();
    data.pressReleases = data.pressReleases.filter(pr => pr.filename !== filename);
    await saveContent(data);

    // Delete HTML file
    const NEWS_DIR = path.join(__dirname, '../../News');
    const filePath = path.join(NEWS_DIR, filename);
    try {
        await fs.unlink(filePath);
    } catch (error) {
        console.error('Failed to delete press release file:', error);
    }
}

/**
 * Generate press release HTML file
 */
async function generatePressReleaseHTML(pr) {
    const NEWS_DIR = path.join(__dirname, '../../News');
    const templatePath = path.join(NEWS_DIR, 'press-release.html');
    const outputPath = path.join(NEWS_DIR, pr.filename);

    try {
        let template = await fs.readFile(templatePath, 'utf-8');

        // Replace template variables
        template = template
            .replace(/<title>.*?<\/title>/, `<title>${pr.headline} — FNPulse Press Release</title>`)
            .replace(/(<meta name="description" content=").*?(">)/, `$1${pr.metaDescription || pr.lead.substring(0, 155)}$2`)
            .replace(/(<meta property="og:title" content=").*?(">)/, `$1${pr.headline}$2`)
            .replace(/(<meta property="og:description" content=").*?(">)/, `$1${pr.metaDescription || pr.lead.substring(0, 155)}$2`)
            .replace(/(<meta property="twitter:title" content=").*?(">)/, `$1${pr.headline}$2`)
            .replace(/(<meta property="twitter:description" content=").*?(">)/, `$1${pr.metaDescription || pr.lead.substring(0, 155)}$2`)
            .replace(/"datePublished": ".*?"/, `"datePublished": "${pr.releaseDate}T09:00:00-05:00"`)
            .replace(/"dateModified": ".*?"/, `"dateModified": "${pr.updatedAt}"`)
            .replace(/"headline": ".*?"/, `"headline": "${pr.headline.replace(/"/g, '\\"')}"`)
            .replace(/"description": ".*?"/, `"description": "${(pr.metaDescription || pr.lead).replace(/"/g, '\\"').substring(0, 200)}"`)
            .replace(/<span class="pr-type">.*?<\/span>/, `<span class="pr-type">For Immediate Release</span>`)
            .replace(/(<strong>)[A-Z\s]+(<\/strong>) — [A-Z][a-z]+ \d+, \d{4}/, `$1${pr.location.toUpperCase()}$2 — ${new Date(pr.releaseDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`)
            .replace(/<h1 class="pr-headline">.*?<\/h1>/, `<h1 class="pr-headline">${pr.headline}</h1>`)
            .replace(/<h2 class="pr-subheadline">.*?<\/h2>/, `<h2 class="pr-subheadline">${pr.subheadline}</h2>`)
            .replace(/(<figure class="pr-featured-image">[\s\S]*?<img src=").*?(" alt=")/, `$1${pr.image}$2${pr.headline}`)
            .replace(/(<figcaption>).*?(<\/figcaption>)/, `$1${pr.imageCaption || `${pr.headline} (Image: FNPulse)`}$2`)
            .replace(/(<p class="pr-lead">)<strong>.*?<\/strong>.*?<\/p>/, `$1<strong>${pr.location.toUpperCase()}, ${new Date(pr.releaseDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong> — ${pr.lead}$1`)
            .replace(/(<div class="pr-body">[\s\S]*?<\/div>)/, `<div class="pr-body">${pr.body}</div>`)
            .replace(/(<div class="pr-about">[\s\S]*?<\/div>)/, `<div class="pr-about"><p>${pr.about}</p></div>`)
            .replace(/(<p class="pr-contact-name"><strong>).*?(<\/strong><br>).*?(<\/p>)/, `$1${pr.contactName}$2${pr.contactTitle}$3`)
            .replace(/(<a href="mailto:)[^"]*/, `$1${pr.contactEmail}`)
            .replace(/(<a href="tel:)[^"]*/, `$1${pr.contactPhone}`);

        await fs.writeFile(outputPath, template);
    } catch (error) {
        console.error('Failed to generate press release HTML:', error);
        throw error;
    }
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
    setFooterPostSelection,
    getAllPressReleases,
    getPressRelease,
    createPressRelease,
    updatePressRelease,
    setPressReleaseHomepageStatus,
    deletePressRelease
};
