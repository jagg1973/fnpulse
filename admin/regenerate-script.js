const templateGenerator = require('./utils/templateGenerator');

async function run() {
    try {
        console.log('Starting regeneration of all pages...');
        await templateGenerator.regenerateAllPages();
        console.log('All pages regenerated successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error during regeneration:', error);
        process.exit(1);
    }
}

run();
