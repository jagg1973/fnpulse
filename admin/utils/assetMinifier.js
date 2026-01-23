const fs = require('fs').promises;
const path = require('path');
const CleanCSS = require('clean-css');
const terser = require('terser');

const NEWS_DIR = path.join(__dirname, '../../News');

async function minifyCss() {
    const sourcePath = path.join(NEWS_DIR, 'css', 'fnpulse.css');
    const targetPath = path.join(NEWS_DIR, 'css', 'fnpulse.min.css');
    const css = await fs.readFile(sourcePath, 'utf-8');
    const output = new CleanCSS({ level: 2 }).minify(css);
    if (output.errors && output.errors.length) {
        throw new Error(output.errors.join('\n'));
    }
    await fs.writeFile(targetPath, output.styles);
}

async function minifyJs() {
    const sourcePath = path.join(NEWS_DIR, 'js', 'main.js');
    const targetPath = path.join(NEWS_DIR, 'js', 'main.min.js');
    const js = await fs.readFile(sourcePath, 'utf-8');
    const result = await terser.minify(js, {
        compress: true,
        mangle: true
    });
    if (result.error) {
        throw result.error;
    }
    await fs.writeFile(targetPath, result.code);
}

async function minifyAssets() {
    await minifyCss();
    await minifyJs();
}

module.exports = {
    minifyAssets
};
