#!/usr/bin/env node

/**
 * FNPulse Admin - Comprehensive Test Suite
 * Tests all routes, views, and utilities
 */

const path = require('path');
const fs = require('fs').promises;

// Colors for output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testFileExists(filePath, description) {
    try {
        await fs.access(filePath);
        log(`✓ ${description}`, 'green');
        return true;
    } catch (error) {
        log(`✗ ${description} - File not found: ${filePath}`, 'red');
        return false;
    }
}

async function testImports() {
    log('\n📦 Testing Module Imports...', 'blue');

    const modules = [
        { name: 'express', path: 'express' },
        { name: 'ejs', path: 'ejs' },
        { name: 'cheerio', path: 'cheerio' },
        { name: 'body-parser', path: 'body-parser' },
        { name: 'multer', path: 'multer' },
        { name: 'slugify', path: 'slugify' },
        { name: 'dayjs', path: 'dayjs' }
    ];

    let allPassed = true;
    for (const mod of modules) {
        try {
            require(mod.path);
            log(`  ✓ ${mod.name} loaded successfully`, 'green');
        } catch (error) {
            log(`  ✗ ${mod.name} failed to load: ${error.message}`, 'red');
            allPassed = false;
        }
    }
    return allPassed;
}

async function testUtilities() {
    log('\n🔧 Testing Utility Modules...', 'blue');

    let allPassed = true;

    try {
        const htmlParser = require('./utils/htmlParser');
        if (typeof htmlParser.parseArticle === 'function' &&
            typeof htmlParser.parseAllArticles === 'function' &&
            typeof htmlParser.extractNavigation === 'function') {
            log('  ✓ htmlParser module loaded with all functions', 'green');
        } else {
            log('  ✗ htmlParser missing expected functions', 'red');
            allPassed = false;
        }
    } catch (error) {
        log(`  ✗ htmlParser failed: ${error.message}`, 'red');
        allPassed = false;
    }

    try {
        const fileManager = require('./utils/fileManager');
        if (typeof fileManager.getAllArticles === 'function' &&
            typeof fileManager.getAllImages === 'function' &&
            typeof fileManager.getConfig === 'function') {
            log('  ✓ fileManager module loaded with all functions', 'green');
        } else {
            log('  ✗ fileManager missing expected functions', 'red');
            allPassed = false;
        }
    } catch (error) {
        log(`  ✗ fileManager failed: ${error.message}`, 'red');
        allPassed = false;
    }

    try {
        const templateGenerator = require('./utils/templateGenerator');
        if (typeof templateGenerator.createArticle === 'function' &&
            typeof templateGenerator.updateArticle === 'function' &&
            typeof templateGenerator.regenerateAllPages === 'function') {
            log('  ✓ templateGenerator module loaded with all functions', 'green');
        } else {
            log('  ✗ templateGenerator missing expected functions', 'red');
            allPassed = false;
        }
    } catch (error) {
        log(`  ✗ templateGenerator failed: ${error.message}`, 'red');
        allPassed = false;
    }

    return allPassed;
}

async function testFiles() {
    log('\n📁 Testing File Structure...', 'blue');

    const files = [
        { path: './server.js', desc: 'Server file' },
        { path: './package.json', desc: 'Package.json' },
        { path: './views/dashboard.ejs', desc: 'Dashboard view' },
        { path: './views/articles.ejs', desc: 'Articles view' },
        { path: './views/article-editor.ejs', desc: 'Article editor view' },
        { path: './views/images.ejs', desc: 'Images view' },
        { path: './views/settings.ejs', desc: 'Settings view' },
        { path: './public/css/admin.css', desc: 'Admin CSS' },
        { path: './public/js/admin.js', desc: 'Admin JavaScript' },
        { path: './templates/article-template.html', desc: 'Article template' },
        { path: './data/config.json', desc: 'Configuration file' }
    ];

    let allPassed = true;
    for (const file of files) {
        const result = await testFileExists(path.join(__dirname, file.path), file.desc);
        if (!result) allPassed = false;
    }
    return allPassed;
}

async function testEJSTemplates() {
    log('\n📝 Testing EJS Templates...', 'blue');

    const ejs = require('ejs');
    const templates = [
        'views/dashboard.ejs',
        'views/articles.ejs',
        'views/article-editor.ejs',
        'views/images.ejs',
        'views/settings.ejs'
    ];

    let allPassed = true;
    for (const template of templates) {
        try {
            const templatePath = path.join(__dirname, template);
            const content = await fs.readFile(templatePath, 'utf-8');

            // Test data for each template
            const testData = {
                page: 'dashboard',
                articles: [],
                images: [],
                config: {
                    siteName: 'Test',
                    siteUrl: 'http://test.com',
                    siteDescription: 'Test',
                    siteTagline: 'Test',
                    tickerNews: 'Test',
                    socialLinks: { facebook: '#', linkedin: '#', twitter: '#' },
                    adPlacements: { headerLeaderboard: 'Ad', sidebarBanner: 'Ad', articleInline: 'Ad' },
                    pagination: { articlesPerPage: 12, excerptLength: 150 },
                    seo: { defaultImage: 'img/test.jpg', twitterHandle: '@test' },
                    navigation: [{ label: 'Home', url: 'index.html' }],
                    categories: []
                },
                mode: 'create',
                article: null
            };

            ejs.compile(content, { filename: templatePath })(testData);
            log(`  ✓ ${template} compiled successfully`, 'green');
        } catch (error) {
            log(`  ✗ ${template} failed: ${error.message}`, 'red');
            allPassed = false;
        }
    }
    return allPassed;
}

async function testConfig() {
    log('\n⚙️  Testing Configuration...', 'blue');

    try {
        const configPath = path.join(__dirname, 'data/config.json');
        const configData = await fs.readFile(configPath, 'utf-8');
        const config = JSON.parse(configData);

        const requiredFields = [
            'siteName', 'siteUrl', 'siteDescription', 'navigation',
            'categories', 'socialLinks', 'pagination', 'seo'
        ];

        let allPresent = true;
        for (const field of requiredFields) {
            if (config.hasOwnProperty(field)) {
                log(`  ✓ Config has ${field}`, 'green');
            } else {
                log(`  ✗ Config missing ${field}`, 'red');
                allPresent = false;
            }
        }
        return allPresent;
    } catch (error) {
        log(`  ✗ Config test failed: ${error.message}`, 'red');
        return false;
    }
}

async function testNewsDirectory() {
    log('\n📰 Testing News Directory Access...', 'blue');

    try {
        const newsDir = path.join(__dirname, '../News');
        await fs.access(newsDir);
        log('  ✓ News directory accessible', 'green');

        const imgDir = path.join(newsDir, 'img');
        await fs.access(imgDir);
        log('  ✓ Images directory accessible', 'green');

        return true;
    } catch (error) {
        log(`  ✗ News directory access failed: ${error.message}`, 'red');
        log('  ⚠ Make sure the admin folder is inside FNPulse project', 'yellow');
        return false;
    }
}

async function runAllTests() {
    log('═══════════════════════════════════════════════════', 'blue');
    log('   FNPulse Admin - Test Suite', 'blue');
    log('═══════════════════════════════════════════════════', 'blue');

    const results = {
        imports: await testImports(),
        files: await testFiles(),
        utilities: await testUtilities(),
        ejs: await testEJSTemplates(),
        config: await testConfig(),
        newsDir: await testNewsDirectory()
    };

    log('\n═══════════════════════════════════════════════════', 'blue');
    log('   Test Results Summary', 'blue');
    log('═══════════════════════════════════════════════════', 'blue');

    const testNames = {
        imports: 'Module Imports',
        files: 'File Structure',
        utilities: 'Utility Modules',
        ejs: 'EJS Templates',
        config: 'Configuration',
        newsDir: 'News Directory'
    };

    let allPassed = true;
    for (const [key, passed] of Object.entries(results)) {
        const status = passed ? '✓ PASS' : '✗ FAIL';
        const color = passed ? 'green' : 'red';
        log(`${status} - ${testNames[key]}`, color);
        if (!passed) allPassed = false;
    }

    log('\n═══════════════════════════════════════════════════', 'blue');
    if (allPassed) {
        log('🎉 All tests passed! Admin is ready to use.', 'green');
        log('\nStart the server with: npm start', 'blue');
        process.exit(0);
    } else {
        log('❌ Some tests failed. Please fix the issues above.', 'red');
        process.exit(1);
    }
}

// Run tests
runAllTests().catch(error => {
    log(`\n❌ Test suite error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
});
