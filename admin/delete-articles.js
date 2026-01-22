const fs = require('fs/promises');
const path = require('path');

async function deleteArticles() {
    const newsDir = path.join(__dirname, '..', 'News');
    const files = await fs.readdir(newsDir);

    // Delete all article-*.html files
    for (const file of files) {
        if (file.startsWith('article-') && file.endsWith('.html')) {
            const filePath = path.join(newsDir, file);
            await fs.unlink(filePath);
            console.log(`Deleted: ${file}`);
        }
    }

    console.log('All article files deleted.');
}

deleteArticles().catch(console.error);
