const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.join(__dirname, '../..');

/**
 * Push changes to GitHub
 */
async function pushToGitHub(config, commitMessage = 'Update site content') {
    if (!config.deployment || !config.deployment.github) {
        throw new Error('GitHub deployment configuration not found');
    }

    const { repository, branch } = config.deployment.github;

    if (!repository) {
        throw new Error('GitHub repository not configured. Please configure in Settings.');
    }

    const targetBranch = branch || 'main';

    console.log('🔄 Pushing to GitHub...');
    console.log(`   Repository: ${repository}`);
    console.log(`   Branch: ${targetBranch}`);

    try {
        // Change to root directory
        process.chdir(ROOT_DIR);

        // Check if git is initialized
        if (!fs.existsSync(path.join(ROOT_DIR, '.git'))) {
            console.log('📦 Initializing Git repository...');
            execSync('git init', { stdio: 'inherit' });
            execSync(`git remote add origin ${repository}`, { stdio: 'inherit' });
        } else {
            // Check if remote exists, if not add it
            try {
                execSync('git remote get-url origin', { stdio: 'pipe' });
            } catch (error) {
                execSync(`git remote add origin ${repository}`, { stdio: 'inherit' });
            }
        }

        // Stage all changes
        console.log('📝 Staging changes...');
        execSync('git add .', { stdio: 'inherit' });

        // Check if there are changes to commit
        try {
            execSync('git diff-index --quiet HEAD --', { stdio: 'pipe' });
            console.log('ℹ️  No changes to commit');
            return {
                success: true,
                message: 'No changes to commit',
                skipped: true
            };
        } catch (error) {
            // There are changes to commit
        }

        // Commit changes
        console.log('💾 Committing changes...');
        const safeMessage = commitMessage.replace(/"/g, '\\"');
        execSync(`git commit -m "${safeMessage}"`, { stdio: 'inherit' });

        // Push to GitHub
        console.log('⬆️  Pushing to GitHub...');
        execSync(`git push -u origin ${targetBranch}`, { stdio: 'inherit' });

        console.log('✅ Successfully pushed to GitHub!');
        console.log('🌐 Cloudflare Pages will automatically deploy your changes.');

        return {
            success: true,
            message: 'Successfully pushed to GitHub',
            repository,
            branch: targetBranch,
            url: `https://github.com/${repository.replace('https://github.com/', '').replace('.git', '')}`
        };

    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        throw new Error(`GitHub push failed: ${error.message}`);
    }
}

/**
 * Get Git status
 */
function getGitStatus() {
    try {
        process.chdir(ROOT_DIR);

        if (!fs.existsSync(path.join(ROOT_DIR, '.git'))) {
            return {
                initialized: false,
                message: 'Git not initialized'
            };
        }

        // Get current branch
        const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();

        // Get remote URL
        let remote = 'Not configured';
        try {
            remote = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
        } catch (error) {
            // No remote configured
        }

        // Get status
        const status = execSync('git status --short', { encoding: 'utf-8' });
        const hasChanges = status.trim().length > 0;

        // Get last commit
        let lastCommit = 'No commits yet';
        try {
            lastCommit = execSync('git log -1 --pretty=format:"%h - %s (%ar)"', { encoding: 'utf-8' }).trim();
        } catch (error) {
            // No commits yet
        }

        return {
            initialized: true,
            branch,
            remote,
            hasChanges,
            changesCount: status.split('\n').filter(line => line.trim()).length,
            lastCommit
        };

    } catch (error) {
        return {
            initialized: false,
            error: error.message
        };
    }
}

/**
 * Initialize Git repository and configure it
 */
async function initializeGit(repository, branch = 'main') {
    try {
        process.chdir(ROOT_DIR);

        if (fs.existsSync(path.join(ROOT_DIR, '.git'))) {
            console.log('ℹ️  Git already initialized');

            // Update remote if different
            try {
                const currentRemote = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
                if (currentRemote !== repository) {
                    execSync(`git remote set-url origin ${repository}`, { stdio: 'inherit' });
                    console.log('✓ Updated remote URL');
                }
            } catch (error) {
                execSync(`git remote add origin ${repository}`, { stdio: 'inherit' });
                console.log('✓ Added remote');
            }

            return { success: true, message: 'Git repository updated' };
        }

        console.log('📦 Initializing Git repository...');
        execSync('git init', { stdio: 'inherit' });
        execSync(`git remote add origin ${repository}`, { stdio: 'inherit' });
        execSync(`git checkout -b ${branch}`, { stdio: 'inherit' });

        console.log('✅ Git initialized successfully!');
        return {
            success: true,
            message: 'Git repository initialized',
            branch
        };

    } catch (error) {
        console.error('❌ Git initialization failed:', error.message);
        throw new Error(`Git initialization failed: ${error.message}`);
    }
}

module.exports = {
    pushToGitHub,
    getGitStatus,
    initializeGit
};
