const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');
const FormData = require('form-data');
const fetch = require('node-fetch');

const NEWS_DIR = path.join(__dirname, '../../News');
const DEPLOY_DIR = path.join(__dirname, '../deploy');

/**
 * Prepare site for deployment
 */
async function prepareSite() {
    console.log('📦 Preparing site for deployment...');

    // Create deploy directory if it doesn't exist
    try {
        await fs.mkdir(DEPLOY_DIR, { recursive: true });
    } catch (error) {
        // Directory might already exist
    }

    // Copy News folder contents to deploy directory
    console.log('📂 Copying files...');
    await copyDirectory(NEWS_DIR, DEPLOY_DIR);

    console.log('✓ Site prepared for deployment');
    return DEPLOY_DIR;
}

/**
 * Deploy to Cloudflare Pages using Wrangler
 */
async function deployToCloudflare(config) {
    if (!config.deployment || !config.deployment.cloudflare) {
        throw new Error('Cloudflare deployment configuration not found');
    }

    const { accountId, projectName, apiToken } = config.deployment.cloudflare;

    if (!accountId || !projectName || !apiToken) {
        throw new Error('Missing Cloudflare configuration. Please configure in Settings.');
    }

    console.log('🚀 Deploying to Cloudflare Pages...');
    console.log(`   Project: ${projectName}`);

    try {
        // Prepare the site first
        const deployDir = await prepareSite();

        // Create a zip file of the deploy directory
        const zipPath = path.join(__dirname, '../deploy.zip');
        await createZipFile(deployDir, zipPath);

        console.log('📤 Uploading to Cloudflare...');

        // Use Cloudflare Pages API
        const deploymentResult = await uploadToCloudflare({
            accountId,
            projectName,
            apiToken,
            zipPath
        });

        // Clean up
        await fs.unlink(zipPath);

        console.log('✅ Deployment successful!');
        console.log(`   URL: ${deploymentResult.url}`);

        return {
            success: true,
            url: deploymentResult.url,
            environment: deploymentResult.environment,
            deploymentId: deploymentResult.id
        };

    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        throw error;
    }
}

/**
 * Deploy using Wrangler CLI (alternative method)
 */
async function deployWithWrangler(config) {
    if (!config.deployment || !config.deployment.cloudflare) {
        throw new Error('Cloudflare deployment configuration not found');
    }

    const { projectName } = config.deployment.cloudflare;

    if (!projectName) {
        throw new Error('Project name not configured');
    }

    console.log('🚀 Deploying with Wrangler...');

    try {
        // Prepare the site
        const deployDir = await prepareSite();

        // Run wrangler pages deploy
        const output = execSync(
            `npx wrangler pages deploy "${deployDir}" --project-name="${projectName}"`,
            {
                encoding: 'utf-8',
                cwd: __dirname,
                stdio: 'pipe'
            }
        );

        console.log(output);

        // Extract URL from output
        const urlMatch = output.match(/https:\/\/[^\s]+/);
        const url = urlMatch ? urlMatch[0] : '';

        return {
            success: true,
            url,
            message: 'Deployed successfully with Wrangler'
        };

    } catch (error) {
        console.error('Wrangler deployment error:', error.message);
        throw new Error(`Wrangler deployment failed: ${error.message}`);
    }
}

/**
 * Upload to Cloudflare using Direct Upload API
 */
async function uploadToCloudflare({ accountId, projectName, apiToken, zipPath }) {
    // First, create a deployment
    const createUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/deployments`;

    const fileBuffer = await fs.readFile(zipPath);
    const form = new FormData();
    form.append('file', fileBuffer, { filename: 'deploy.zip' });

    const response = await fetch(createUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiToken}`,
            ...form.getHeaders()
        },
        body: form
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Cloudflare API error: ${response.status} - ${error}`);
    }

    const result = await response.json();

    if (!result.success) {
        throw new Error(`Deployment failed: ${JSON.stringify(result.errors)}`);
    }

    return {
        id: result.result.id,
        url: result.result.url,
        environment: result.result.environment
    };
}

/**
 * Copy directory recursively
 */
async function copyDirectory(src, dest) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            await copyDirectory(srcPath, destPath);
        } else {
            await fs.copyFile(srcPath, destPath);
        }
    }
}

/**
 * Create zip file from directory
 */
function createZipFile(sourceDir, outputPath) {
    return new Promise((resolve, reject) => {
        const output = require('fs').createWriteStream(outputPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => resolve());
        archive.on('error', (err) => reject(err));

        archive.pipe(output);
        archive.directory(sourceDir, false);
        archive.finalize();
    });
}

/**
 * Get deployment status
 */
async function getDeploymentStatus(config, deploymentId) {
    const { accountId, projectName, apiToken } = config.deployment.cloudflare;

    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/deployments/${deploymentId}`;

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${apiToken}`
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to get deployment status: ${response.status}`);
    }

    const result = await response.json();
    return result.result;
}

module.exports = {
    prepareSite,
    deployToCloudflare,
    deployWithWrangler,
    getDeploymentStatus
};
