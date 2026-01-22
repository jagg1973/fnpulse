const siteUpdater = require('./utils/siteUpdater');

async function run() {
    try {
        console.log('Updating site with all articles...\n');
        await siteUpdater.updateEntireSite();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

run();
