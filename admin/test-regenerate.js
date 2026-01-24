const siteUpdater = require('./utils/siteUpdater');

(async () => {
    try {
        console.log('Starting regeneration...');
        await siteUpdater.regenerateAllArticles();
        console.log('Done!');
        process.exit(0);
    } catch (e) {
        console.error('Error:', e.message);
        console.error(e.stack);
        process.exit(1);
    }
})();
