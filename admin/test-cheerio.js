const cheerio = require('cheerio');
const fs = require('fs/promises');

async function test() {
    const template = await fs.readFile('./templates/article-template.html', 'utf-8');
    console.log('Template first 500 chars:');
    console.log(template.substring(0, 500));
    console.log('\n---\n');

    const $ = cheerio.load(template, {
        xmlMode: false,
        decodeEntities: false
    });

    console.log('Cheerio $.html() first 500 chars:');
    console.log($.html().substring(0, 500));
    console.log('\n---\n');

    console.log('$("html").html() first 500 chars:');
    console.log($('html').html().substring(0, 500));
}

test();
