const fs = require('fs').promises;
const path = require('path');
const htmlParser = require('./htmlParser');

const NEWS_DIR = path.join(__dirname, '../../News');
const CONFIG_PATH = path.join(__dirname, '../data/config.json');

/**
 * Get all articles with metadata
 */
async function getAllArticles() {
    return await htmlParser.parseAllArticles();
}

/**
 * Get all images from img directory
 */
async function getAllImages() {
    const imgDir = path.join(NEWS_DIR, 'img');
    const files = await fs.readdir(imgDir);

    const images = files
        .filter(f => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f))
        .map(filename => {
            const stats = fs.stat(path.join(imgDir, filename));
            return {
                filename,
                path: `img/${filename}`,
                url: `/site-assets/img/${filename}`
            };
        });

    return images;
}

/**
 * Delete an article file
 */
async function deleteArticle(filename) {
    const filePath = path.join(NEWS_DIR, filename);
    try {
        await fs.unlink(filePath);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
}

/**
 * Delete an image file
 */
async function deleteImage(filename) {
    const filePath = path.join(NEWS_DIR, 'img', filename);
    await fs.unlink(filePath);
}

/**
 * Get site configuration
 */
async function getConfig() {
    const configData = await fs.readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(configData);
}

/**
 * Save site configuration
 */
async function saveConfig(config) {
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
}

/**
 * Create backup of a file before modifying
 */
async function backupFile(filename) {
    const sourcePath = path.join(NEWS_DIR, filename);
    const backupDir = path.join(__dirname, '../data/backup');

    try {
        await fs.mkdir(backupDir, { recursive: true });
    } catch (e) {
        // Directory might already exist
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `${timestamp}-${filename}`);
    await fs.mkdir(path.dirname(backupPath), { recursive: true });
    await fs.copyFile(sourcePath, backupPath);
}

module.exports = {
    getAllArticles,
    getAllImages,
    deleteArticle,
    deleteImage,
    getConfig,
    saveConfig,
    backupFile
};
