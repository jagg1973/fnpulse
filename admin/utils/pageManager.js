const fs = require('fs').promises;
const path = require('path');
const fileManager = require('./fileManager');
const { normalizeHtmlDocument } = require('./schemaUtils');
const { updateAssetLinks } = require('./assetUtils');
const { minifyAssets } = require('./assetMinifier');
const { minifyHtml } = require('./htmlMinifier');

const NEWS_DIR = path.join(__dirname, '../../News');
const PAGE_TEMPLATE = path.join(__dirname, '../templates/page-template.html');

function isManagedPage(filename) {
    if (!filename.endsWith('.html')) return false;
    if (filename.startsWith('article-')) return false;
    if (filename.startsWith('author-')) return false;
    return true;
}

async function getAllPages() {
    const files = await fs.readdir(NEWS_DIR);
    const pageFiles = files.filter(isManagedPage).sort((a, b) => a.localeCompare(b));

    return pageFiles.map(file => ({
        filename: file
    }));
}

async function getPage(filename) {
    const filePath = path.join(NEWS_DIR, filename);
    const html = await fs.readFile(filePath, 'utf-8');
    return { filename, html };
}

async function getPageTemplate() {
    const templateHtml = await fs.readFile(PAGE_TEMPLATE, 'utf-8');
    return templateHtml;
}

async function createPage(filename, html) {
    if (!filename || !filename.endsWith('.html')) {
        throw new Error('Filename must end with .html');
    }
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        throw new Error('Invalid filename');
    }
    const filePath = path.join(NEWS_DIR, filename);
    const config = await fileManager.getConfig();
    const normalized = normalizeHtmlDocument(html || '', { filename, config });
    const $ = require('cheerio').load(normalized, { xmlMode: false, decodeEntities: false });
    updateAssetLinks($);
    await minifyAssets();
    await fs.writeFile(filePath, await minifyHtml($.html()));
    return { filename, path: filePath };
}

async function updatePage(filename, html) {
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        throw new Error('Invalid filename');
    }
    const filePath = path.join(NEWS_DIR, filename);
    const config = await fileManager.getConfig();
    const normalized = normalizeHtmlDocument(html || '', { filename, config });
    const $ = require('cheerio').load(normalized, { xmlMode: false, decodeEntities: false });
    updateAssetLinks($);
    await minifyAssets();
    await fs.writeFile(filePath, await minifyHtml($.html()));
    return { filename, path: filePath };
}

module.exports = {
    getAllPages,
    getPage,
    getPageTemplate,
    createPage,
    updatePage
};
