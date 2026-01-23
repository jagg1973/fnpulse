const siteUpdater = require('./utils/siteUpdater');
const fileManager = require('./utils/fileManager');
const gitDeployer = require('./utils/gitDeployer');

async function run() {
    try {
        console.log('Updating site with all articles...\n');
        await siteUpdater.updateEntireSite();
        const config = await fileManager.getConfig();
        if (config?.deployment?.github?.repository) {
            const commitMessage = `Update site content (${new Date().toISOString()})`;
            await gitDeployer.pushToGitHub(config, commitMessage);
        }
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

run();
