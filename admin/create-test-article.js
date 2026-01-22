const templateGenerator = require('./utils/templateGenerator');

const testArticle = {
    title: "Test Article for HTML Structure",
    metaDescription: "Testing if the HTML structure is now correct after cheerio fixes",
    category: "Markets",
    excerpt: "This is a test article to verify HTML generation works correctly.",
    body: "<p>This is the article body content. It should be properly formatted.</p>",
    author: "Test Author",
    authorBio: "Test author bio",
    featuredImage: "img/test.jpg",
    publishDate: new Date().toISOString()
};

async function createTestArticle() {
    try {
        const result = await templateGenerator.createArticle(testArticle);
        console.log('Article created:', result.filename);
        console.log('Path:', result.path);
    } catch (error) {
        console.error('Error creating article:', error);
    }
}

createTestArticle();
